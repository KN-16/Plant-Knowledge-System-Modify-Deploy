import { Op, Sequelize } from "sequelize";
import {
  sequelize,
  Phylum,
  Class,
  Order,
  Family,
  Genus,
  Species,
  Variety,
  MorphologyLeaf,
  MorphologyStem,
  MorphologyFlower,
  MorphologyFruit,
  MorphologyLeafSpecies,
  MorphologyStemSpecies,
  MorphologyFlowerSpecies,
  MorphologyFruitSpecies,
  HoSpeciesData,
  CommonName,
  TaxonomyImage,
  PlantImage,
  TaxonomyHistory,
  Distribution,
  Province,
  BookImage,
} from "../models/index.js";
import { UI_MAPPINGS } from "../models/enums.js";

export const getHomeData = async (req, res, next) => {
  try {
    // =========================================================================
    // 1. THỐNG KÊ 8 DANH MỤC ĐẢM BẢO TÍNH TOÀN VẸN PHẢ HỆ (INNER JOIN CHAIN)
    // =========================================================================
    const totalPhyla = await Phylum.count(); // Ngành là gốc, đếm toàn bộ

    const totalClasses = await Class.count({
      include: [{ model: Phylum, required: true }],
    });

    const totalOrders = await Order.count({
      include: [
        {
          model: Class,
          required: true,
          include: [{ model: Phylum, required: true }],
        },
      ],
    });

    const totalFamilies = await Family.count({
      include: [
        {
          model: Order,
          required: true,
          include: [
            {
              model: Class,
              required: true,
              include: [{ model: Phylum, required: true }],
            },
          ],
        },
      ],
    });

    const totalGenera = await Genus.count({
      include: [
        {
          model: Family,
          required: true,
          include: [
            {
              model: Order,
              required: true,
              include: [
                {
                  model: Class,
                  required: true,
                  include: [{ model: Phylum, required: true }],
                },
              ],
            },
          ],
        },
      ],
    });

    const totalSpecies = await Species.count({
      include: [
        {
          model: Genus,
          required: true,
          include: [
            {
              model: Family,
              required: true,
              include: [
                {
                  model: Order,
                  required: true,
                  include: [
                    {
                      model: Class,
                      required: true,
                      include: [{ model: Phylum, required: true }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const totalVarieties = await Variety.count({
      include: [
        {
          model: Species,
          required: true,
          include: [
            {
              model: Genus,
              required: true,
              include: [
                {
                  model: Family,
                  required: true,
                  include: [
                    {
                      model: Order,
                      required: true,
                      include: [
                        {
                          model: Class,
                          required: true,
                          include: [{ model: Phylum, required: true }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    // Tính toán kho ảnh số hóa nội bộ (Chỉ lấy bản ghi có is_external = false)
    const taxDigitalCount = await TaxonomyImage.count({
      where: { is_external: false },
    });
    const plantDigitalCount = await PlantImage.count();
    const totalDigitalImages = taxDigitalCount + plantDigitalCount;

    // =========================================================================
    // 2. TRUY VẤN 10 LOÀI VÀ 10 BIẾN THỂ MỚI CẬP NHẬT NHẤT (LATEST CAROUSELS)
    // =========================================================================
    const latestSpeciesRows = await Species.findAll({
      attributes: [
        "species_id",
        "scientific_name",
        "canonical_name",
        "view_count",
        "createdAt",
      ],
      order: [
        ["createdAt", "DESC"],
        ["species_id", "DESC"],
      ],
      limit: 10,
    });

    const latestVarietiesRows = await Variety.findAll({
      attributes: [
        "variety_id",
        "scientific_name",
        "canonical_name",
        "view_count",
        "createdAt",
      ],
      order: [
        ["createdAt", "DESC"],
        ["variety_id", "DESC"],
      ],
      limit: 10,
    });

    // =========================================================================
    // 3. THUẬT TOÁN FALLBACK MULTI-LANGUAGE TRÊN RAM (BATCH TRA CỨU TỐI ƯU O(1))
    // =========================================================================
    const speciesIds = latestSpeciesRows.map((s) => s.species_id);
    const varietyIds = latestVarietiesRows.map((v) => v.variety_id);

    const [commonNames, images] = await Promise.all([
      CommonName.findAll({
        where: {
          [Op.or]: [
            { id_entity: { [Op.in]: speciesIds }, rank: "species" },
            { id_entity: { [Op.in]: varietyIds }, rank: "variety" },
          ],
          lang: { [Op.in]: ["vie", "eng", "other"] },
        },
        order: [
          ["primary", "DESC"],
          ["id", "ASC"],
        ],
        raw: true,
      }),
      TaxonomyImage.findAll({
        where: {
          id_entity: { [Op.in]: [...speciesIds, ...varietyIds] },
          rank: {
            [Op.in]: ["species", "variety"],
          },
        },
        raw: true,
        order: [
          ["is_background", "DESC"],
          ["createdAt", "DESC"],
        ],
      }),
    ]);

    const extractCommonName = (id, rank) => {
      const itemNames = commonNames.filter(
        (cn) => cn.id_entity == id && cn.rank === rank,
      );
      const priorityLangs = ["vie", "eng", "other"];

      for (const lang of priorityLangs) {
        const matchedNames = itemNames.filter((cn) => cn.lang === lang);
        if (matchedNames.length > 0) {
          const primaryRecord = matchedNames.find(
            (n) => n.primary === true || n.primary === "true",
          );
          return primaryRecord ? primaryRecord.name : matchedNames[0].name;
        }
      }
      return "";
    };

    const extractImage = (id, rank) => {
      const image = images.filter(
        (img) => img.id_entity == id && img.rank === rank,
      );
      if (image?.length === 0)
        return {
          thumbnail: null,
          image_count: 0,
        };

      return { thumbnail: image[0], image_count: image.length };
    };
    // Định dạng dữ liệu đầu ra cam kết đồng bộ chuẩn cấu trúc Carousel
    const formatSpecies = (rows) =>
      rows.map((s) => {
        const json = s.toJSON();
        const item_image = extractImage(json.species_id, "species");
        return {
          id: json.species_id,
          rank: "species",
          scientific_name: json.scientific_name,
          view_count: json.view_count,
          canonical_name: json.canonical_name || "",
          common_name: extractCommonName(json.species_id, "species"),
          thumbnail: item_image.thumbnail || null,
          image_count: item_image.image_count || 0,
        };
      });

    const formatVarieties = (rows) =>
      rows.map((v) => {
        const json = v.toJSON();
        const item_image = extractImage(json.variety_id, "variety");
        return {
          id: json.variety_id,
          rank: "variety",
          scientific_name: json.scientific_name,
          canonical_name: json.canonical_name || "",
          common_name: extractCommonName(json.variety_id, "variety"),
          thumbnail: item_image.thumbnail || null,
          image_count: item_image.image_count || 0,
        };
      });

    return res.status(200).json({
      stats: {
        totalPhyla,
        totalClasses,
        totalOrders,
        totalFamilies,
        totalGenera,
        totalSpecies,
        totalVarieties,
        totalImages: totalDigitalImages,
      },
      latestSpecies: formatSpecies(latestSpeciesRows),
      latestVarieties: formatVarieties(latestVarietiesRows),
    });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu trang chủ tổng hợp:", error);
    next(error);
  }
};

export const getPublicVarietiesList = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = "",
      sort = "image_count_desc",

      // Các nhóm filter
      has_leaf_filter,
      has_stem_filter,
      has_flower_filter,
      has_distribution_filter,

      // Phân loại học
      family_id,
      genus_id,
      species_id,

      // Đặc điểm sinh học
      life_form,
      is_flowering,
      is_fruiting,

      // Hình thái Lá
      leaf_type,
      leaf_shape,
      leaf_arrangement,
      leaf_margin,
      leaf_length_min,
      leaf_width_min,
      petiole_length_min,

      // Hình thái Thân
      stem_type,
      stem_surface,
      stem_color,
      stem_height_min,

      // Hình thái Hoa
      inflorescence,
      flower_color,
      flower_petal_count,

      // Phân bố
      dist_province_id,
      dist_status,
      dist_description,
    } = req.query;

    const offset = (page - 1) * limit;

    // -------------------------------------------------------------
    // 1. ĐIỀU KIỆN TÌM KIẾM TEXT TỰ DO (SEARCH) KẾT HỢP LOGIC LOẠI TRỪ
    // -------------------------------------------------------------
    const whereCondition = {};

    // Thêm điều kiện sinh học trực tiếp vào Variety
    if (life_form) whereCondition.life_form = life_form;
    if (is_flowering)
      whereCondition.is_flowering = is_flowering === "true" ? true : false;
    if (is_fruiting)
      whereCondition.is_fruiting = is_fruiting === "true" ? true : false;

    if (search && search.trim() !== "") {
      const searchTerm = `%${search.trim()}%`;

      // Mặc định luôn tìm ở bảng Variety
      let searchConditions = [
        { variety_name: { [Op.iLike]: searchTerm } },
        { common_name: { [Op.iLike]: searchTerm } },
        { code: { [Op.iLike]: searchTerm } },
        { distinctive_feature: { [Op.iLike]: searchTerm } },
      ];

      // // Loại trừ thông minh: Chỉ tìm ở cấp bậc chưa được chọn bởi Filter
      // if (!species_id) {
      //     searchConditions.push(
      //         { '$Species.scientific_name$': { [Op.iLike]: searchTerm } },
      //         { '$Species.vietnamese_name$': { [Op.iLike]: searchTerm } },
      //         { '$Species.synonyms$': { [Op.iLike]: searchTerm } },
      //         { '$Species.other_names$': { [Op.iLike]: searchTerm } },
      //         { '$Species.uses$': { [Op.iLike]: searchTerm } }
      //     );
      // }

      // if (!genus_id && !species_id) {
      //     searchConditions.push(
      //         { '$Species.Genus.scientific_name$': { [Op.iLike]: searchTerm } },
      //         { '$Species.Genus.vietnamese_name$': { [Op.iLike]: searchTerm } }
      //     );
      // }

      // if (!family_id && !genus_id && !species_id) {
      //     searchConditions.push(
      //         { '$Species.Genus.Family.scientific_name$': { [Op.iLike]: searchTerm } },
      //         { '$Species.Genus.Family.vietnamese_name$': { [Op.iLike]: searchTerm } }
      //     );
      // }

      whereCondition[Op.or] = searchConditions;
    }

    // -------------------------------------------------------------
    // 2. CẤU HÌNH INCLUDES & BỘ LỌC SÂU (DEEP FILTERS)
    // -------------------------------------------------------------
    const includeConfig = [
      {
        model: PlantImage,
        where: { is_background: true },
        required: false,
        limit: 1,
      },
    ];

    // A. Lọc Taxonomy (Họ, Chi, Loài) - Luôn include để lấy dữ liệu hiển thị
    const speciesInclude = {
      model: Species,
      attributes: ["species_id", "scientific_name", "vietnamese_name"],
      where: {},
      include: [
        {
          model: Genus,
          attributes: ["genus_id", "scientific_name"],
          where: {},
          include: [
            {
              model: Family,
              attributes: ["family_id", "scientific_name", "vietnamese_name"],
              where: {},
            },
          ],
        },
      ],
    };
    if (species_id) speciesInclude.where.species_id = species_id;
    if (genus_id) speciesInclude.include[0].where.genus_id = genus_id;
    if (family_id)
      speciesInclude.include[0].include[0].where.family_id = family_id;
    includeConfig.push(speciesInclude);

    // B. Lọc Hình thái Lá
    if (has_leaf_filter === "true") {
      const leafInclude = { model: MorphologyLeaf, where: {}, required: true };
      if (leaf_type) leafInclude.where.leaf_type = leaf_type;
      if (leaf_shape) leafInclude.where.shape = leaf_shape;
      if (leaf_arrangement) leafInclude.where.arrangement = leaf_arrangement;
      if (leaf_margin) leafInclude.where.margin = leaf_margin;
      const andConditions = [];
      if (leaf_length_min) {
        const value = parseFloat(leaf_length_min);

        andConditions.push({
          [Op.or]: [
            { length_max: { [Op.gte]: value } },
            { length_min: { [Op.gte]: value } },
          ],
        });
      }

      if (leaf_width_min) {
        const value = parseFloat(leaf_width_min);

        andConditions.push({
          [Op.or]: [
            { width_max: { [Op.gte]: value } },
            { width_min: { [Op.gte]: value } },
          ],
        });
      }

      // Gán vào where
      if (andConditions.length > 0) {
        leafInclude.where[Op.and] = andConditions;
      }
      if (petiole_length_min)
        leafInclude.where.petiole_length = {
          [Op.gte]: parseFloat(petiole_length_min),
        };

      includeConfig.push(leafInclude);
    }

    // C. Lọc Hình thái Thân
    if (has_stem_filter === "true") {
      const stemInclude = { model: MorphologyStem, where: {}, required: true };
      if (stem_type) stemInclude.where.stem_type = stem_type;
      if (stem_surface) stemInclude.where.surface = stem_surface;
      if (stem_color)
        stemInclude.where.color = { [Op.iLike]: `%${stem_color.trim()}%` };
      if (stem_height_min) {
        const value = parseFloat(stem_height_min);
        stemInclude.where[Op.or] = [
          { height_max: { [Op.gte]: value } },
          { height_min: { [Op.gte]: value } },
        ];
      }

      includeConfig.push(stemInclude);
    }

    // D. Lọc Hình thái Hoa
    if (has_flower_filter === "true") {
      const flowerInclude = {
        model: MorphologyFlower,
        where: {},
        required: true,
      };
      if (inflorescence) flowerInclude.where.inflorescence = inflorescence;
      if (flower_color)
        flowerInclude.where.color = { [Op.iLike]: `%${flower_color.trim()}%` };
      if (flower_petal_count)
        flowerInclude.where.petal_count = {
          [Op.gte]: parseInt(flower_petal_count),
        };

      includeConfig.push(flowerInclude);
    }

    // E. Lọc Phân bố Tỉnh thành
    if (has_distribution_filter === "true") {
      const distInclude = { model: Distribution, where: {}, required: true };
      if (dist_province_id) distInclude.where.province_id = dist_province_id;
      if (dist_status) distInclude.where.status = dist_status;
      if (dist_description)
        distInclude.where.description = {
          [Op.iLike]: `%${dist_description.trim()}%`,
        };

      includeConfig.push(distInclude);
    }

    const attributesConfig = {
      include: [
        [
          sequelize.literal(`(
                        SELECT COUNT(*)
                        FROM "plant_images" AS pi 
                        WHERE pi.variety_id = "Variety".variety_id
                    )`),
          "image_count",
        ],
      ],
    };
    // -------------------------------------------------------------
    // 3. XỬ LÝ LOGIC SẮP XẾP (SORTING)
    // -------------------------------------------------------------
    let orderCondition = [["createdAt", "DESC"]]; // Mặc định

    switch (sort) {
      case "name_asc":
        // nulls last để đẩy các cây không có common_name (null) xuống dưới cùng
        orderCondition = [["common_name", "ASC NULLS LAST"]];
        break;
      case "name_desc":
        orderCondition = [["common_name", "DESC NULLS LAST"]];
        break;
      case "view_count_desc":
        orderCondition = [["view_count", "DESC"]];
        break;
      case "view_count_asc":
        orderCondition = [["view_count", "ASC"]];
        break;
      case "image_count_desc":
        // Sắp xếp bằng SubQuery: Đếm số lượng PlantImage liên kết với Variety
        // LƯU Ý BẢO MẬT/LỖI: Tên bảng phải đúng với database PostgreSQL của bạn (thường là chữ thường và snake_case)
        orderCondition = [
          [
            sequelize.literal(`(
                        SELECT COUNT(*)
                        FROM "plant_images" AS pi 
                        WHERE pi.variety_id = "Variety".variety_id
                    )`),
            "DESC",
          ],
        ];
        break;
      case "image_count_asc":
        orderCondition = [
          [
            sequelize.literal(`(
                        SELECT COUNT(*)
                        FROM "plant_images" AS pi 
                        WHERE pi.variety_id = "Variety".variety_id
                    )`),
            "ASC",
          ],
        ];
        break;
      case "createdAt_desc":
      default:
        orderCondition = [["createdAt", "DESC"]];
        break;
    }

    // -------------------------------------------------------------
    // 4. THỰC THI QUERY VÀ PHÂN TRANG
    // -------------------------------------------------------------
    const { count, rows } = await Variety.findAndCountAll({
      where: whereCondition,
      include: includeConfig,
      attributes: attributesConfig,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: orderCondition,
      distinct: true, // Rất quan trọng: Bắt buộc dùng khi có include 1-N (Leaf, Flower, Distribution) để count() không bị sai
    });

    // 5. Format dữ liệu trả về cho Frontend
    const formattedRows = rows.map((v) => {
      const data = v.toJSON();
      data.thumbnail =
        data.PlantImages?.length > 0 ? data.PlantImages[0].url : null;
      data.image_count = parseInt(data.image_count, 10) || 0;
      delete data.PlantImages;
      return data;
    });

    res.json({
      data: formattedRows,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Lỗi khi fetch public varieties:", error);
    next(error);
  }
};

// --- LẤY DỮ LIỆU SO SÁNH ---
export const getCompareVarieties = async (req, res, next) => {
  try {
    const { ids } = req.body; // Expect mảng [1, 2, 3]
    if (!ids || ids.length === 0) return res.json([]);

    const varieties = await Variety.findAll({
      where: { variety_id: { [Op.in]: ids } },
      include: [
        { model: Species, include: [{ model: Genus, include: [Family] }] },
        MorphologyLeaf,
        MorphologyStem,
        MorphologyFlower,
        {
          model: PlantImage,
          where: { is_background: true },
          required: false,
          limit: 1,
        },
      ],
    });

    res.json(varieties);
  } catch (error) {
    next(error);
  }
};

// API Lấy chi tiết Biến thể
export const getVarietyDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const variety = await Variety.findByPk(id, {
      include: [
        {
          model: Species,
          include: [
            {
              model: Genus,
              include: [{ model: Family }],
            },
          ],
        },
        { model: MorphologyLeaf },
        { model: MorphologyStem },
        { model: MorphologyFlower },
        {
          model: Distribution,
          include: [
            { model: Province, attributes: ["province_name", "country"] },
          ],
        },
        { model: PlantImage }, // Lấy toàn bộ ảnh để Frontend tự chia theo part_type
      ],
    });

    if (!variety) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy dữ liệu" });
    }

    res.status(200).json({ success: true, data: variety });
  } catch (error) {
    console.error("Lỗi lấy chi tiết:", error);
    next(error);
  }
};

// API Tăng View Count (Chỉ gọi khi Session chưa có)
export const incrementViewCount = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Variety.increment("view_count", { by: 1, where: { variety_id: id } });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Lỗi khi fetch public varieties:", error);
    next(error);
  }
};

export const checkHealth = (req, res) => {
  return res
    .status(200)
    .json({ success: true, message: "Server is running smoothly." });
};

// Species Page - API Lấy options cho Smart Select (Phylum, Class, Order, Family, Genus)

export const getTaxonomyPageSmartSelectOptions = async (req, res) => {
  try {
    const model_get = req.query.model_get || "default";
    const langPriority = req.query.lang_priority
      ? req.query.lang_priority.split(",")
      : ["vie"];

    const get_vietnamese_name = async (
      targets,
      langPriority = ["vie", "eng", "other"],
    ) => {
      // 1. Chuẩn hóa dữ liệu đầu vào luôn luôn thành dạng Mảng để xử lý đồng nhất
      const targetList = Array.isArray(targets) ? targets : [targets];

      // Lọc bỏ các mục rỗng không có ID để tránh phát sinh lỗi cú pháp SQL
      const validTargets = targetList.filter((t) => t.ids && t.ids.length > 0);

      // Tạo sẵn cấu trúc Map rỗng trả về để tránh lỗi crash undefined ở các bước map sau
      const resultMap = {};
      targetList.forEach((t) => {
        resultMap[t.rank] = {};
      });

      if (validTargets.length === 0) return resultMap;

      // 2. Xây dựng ma trận điều kiện Op.or kết hợp chặt chẽ cặp [rank + id_entity]
      const orConditions = validTargets.map((t) => ({
        rank: t.rank,
        id_entity: { [Op.in]: t.ids },
      }));

      // 3. Thực thi đúng 1 truy vấn duy nhất.
      // Tận dụng ORDER BY tầng DB (primary DESC) giúp bản ghi ưu tiên luôn nằm đầu tiên trên RAM
      const commonNames = await CommonName.findAll({
        where: {
          [Op.or]: orConditions,
          lang: { [Op.in]: langPriority },
        },
        order: [
          ["primary", "DESC"],
          ["id", "ASC"],
        ],
        raw: true,
      });

      // 4. Triển khai giải thuật Fallback đa ngôn ngữ hiệu năng cao trực tiếp trên RAM
      validTargets.forEach((target) => {
        const { rank, ids } = target;

        ids.forEach((id) => {
          // Lọc nhanh khoên vùng các tên gọi thuộc về thực thể hiện tại
          const entityNames = commonNames.filter(
            (cn) => cn.rank === rank && cn.id_entity === id,
          );
          let resolvedName = "";

          // Duyệt tuyến tính qua mảng ngôn ngữ theo mức độ ưu tiên chỉ định
          for (const lang of langPriority) {
            const matchedRecord = entityNames.find((cn) => cn.lang === lang);
            if (matchedRecord) {
              // Nhờ câu lệnh ORDER BY của DB, bản ghi tìm thấy đầu tiên luôn là primary chuẩn xác nhất
              resolvedName = matchedRecord.name;
              break; // Thoát vòng lặp ngôn ngữ ngay khi tìm thấy mức ưu tiên cao nhất
            }
          }
          resultMap[rank][id] = resolvedName;
        });
      });

      return resultMap;
    };

    // CASE 1: ĐIỀU HƯỚNG TẢI DỮ LIỆU CỐT LÕI MẶC ĐỊNH (Ngành, Lớp, Bộ) -> Gọi 1 Request CommonName
    if (model_get === "default") {
      const [phyla, classes, orders] = await Promise.all([
        Phylum.findAll({
          attributes: ["phylum_id", "scientific_name", "canonical_name"],
          raw: true,
        }),
        Class.findAll({
          attributes: [
            "class_id",
            "scientific_name",
            "canonical_name",
            "phylum_id",
          ],
          where: { phylum_id: { [Op.ne]: null } },
          raw: true,
        }),
        Order.findAll({
          attributes: [
            "order_id",
            "scientific_name",
            "canonical_name",
            "class_id",
          ],
          include: [
            {
              model: Class,
              attributes: ["class_id", "phylum_id"],
              where: { phylum_id: { [Op.ne]: null } },
              required: true,
            },
          ],
          raw: true,
          nest: true,
        }),
      ]);

      // Gộp mảng chỉ định nhiều rank truy vấn DB duy nhất một lượt
      const nameMaps = await get_vietnamese_name(
        [
          { rank: "phylum", ids: phyla.map((p) => p.phylum_id) },
          { rank: "class", ids: classes.map((c) => c.class_id) },
          { rank: "order", ids: orders.map((o) => o.order_id) },
        ],
        langPriority,
      );

      const formattedPhyla = phyla.map((p) => ({
        ...p,
        vietnamese_name: nameMaps.phylum[p.phylum_id] || "",
      }));
      const formattedClasses = classes.map((c) => ({
        ...c,
        vietnamese_name: nameMaps.class[c.class_id] || "",
      }));
      const formattedOrders = orders.map((o) => ({
        ...o,
        vietnamese_name: nameMaps.order[o.order_id] || "",
      }));

      return res.json([formattedPhyla, formattedClasses, formattedOrders]);
    }

    // CASE 2: TẢI ĐỘNG DANH MỤC HỌ (Family) -> Gọi 1 Request CommonName
    if (model_get === "family") {
      const families = await Family.findAll({
        attributes: ["family_id", "scientific_name", "canonical_name"],
        include: [
          {
            model: Order,
            attributes: ["order_id"],
            include: [
              {
                model: Class,
                attributes: ["class_id", "phylum_id"],
                where: { phylum_id: { [Op.ne]: null } },
                required: true,
              },
            ],
          },
        ],
        raw: true,
        nest: true,
      });
      const nameMaps = await get_vietnamese_name(
        { rank: "family", ids: families.map((f) => f.family_id) },
        langPriority,
      );
      const formattedFamilies = families.map((f) => ({
        ...f,
        vietnamese_name: nameMaps.family[f.family_id] || "",
      }));
      return res.json(formattedFamilies);
    }

    // CASE 3: TẢI ĐỘNG DANH MỤC CHI (Genus) -> Gọi 1 Request CommonName
    if (model_get === "genus") {
      const genera = await Genus.findAll({
        attributes: [
          "genus_id",
          "scientific_name",
          "canonical_name",
          "family_id",
        ],
        include: [
          {
            model: Family,
            attributes: ["family_id"],
            include: [
              {
                model: Order,
                attributes: ["order_id"],
                include: [
                  {
                    model: Class,
                    attributes: ["class_id", "phylum_id"],
                    where: { phylum_id: { [Op.ne]: null } },
                    required: true,
                  },
                ],
                required: true,
              },
            ],
          },
        ],
        raw: true,
        nest: true,
      });
      const nameMaps = await get_vietnamese_name(
        { rank: "genus", ids: genera.map((g) => g.genus_id) },
        langPriority,
      );
      const formattedGenera = genera.map((g) => ({
        ...g,
        vietnamese_name: nameMaps.genus[g.genus_id] || "",
      }));
      return res.json(formattedGenera);
    }

    // CASE 4: TẢI ĐỘNG DANH MỤC LOÀI (Species) -> Gọi 1 Request CommonName
    if (model_get === "species") {
      const species = await Species.findAll({
        attributes: [
          "species_id",
          "scientific_name",
          "canonical_name",
          "genus_id",
        ],
        include: [
          {
            model: Genus,
            attributes: ["genus_id"],
            include: [
              {
                model: Family,
                attributes: ["family_id"],
                include: [
                  {
                    model: Order,
                    attributes: ["order_id"],
                    include: [
                      {
                        model: Class,
                        attributes: ["class_id", "phylum_id"],
                        where: { phylum_id: { [Op.ne]: null } },
                        required: true,
                      },
                    ],
                    required: true,
                  },
                ],
                required: true,
              },
            ],
            required: true,
          },
        ],
        raw: true,
        nest: true,
      });
      const nameMaps = await get_vietnamese_name(
        { rank: "species", ids: species.map((s) => s.species_id) },
        langPriority,
      );
      const formattedSpecies = species.map((s) => ({
        ...s,
        vietnamese_name: nameMaps.species[s.species_id] || "",
      }));
      return res.json(formattedSpecies);
    }

    // CASE 5: TẢI TOÀN BỘ CÂY PHẢ HỆ (Tối ưu hóa gộp 6 rank thành 1 Request CommonName duy nhất)
    if (model_get === "all") {
      const [phyla, classes, orders, families, genera, species] =
        await Promise.all([
          Phylum.findAll({
            attributes: ["phylum_id", "scientific_name", "canonical_name"],
            raw: true,
          }),
          Class.findAll({
            attributes: [
              "class_id",
              "scientific_name",
              "canonical_name",
              "phylum_id",
            ],
            raw: true,
            where: { phylum_id: { [Op.ne]: null } },
          }),
          Order.findAll({
            attributes: ["order_id", "scientific_name", "canonical_name"],
            include: [
              {
                model: Class,
                attributes: ["class_id", "phylum_id"],
                where: { phylum_id: { [Op.ne]: null } },
                required: true,
              },
            ],
            raw: true,
            nest: true,
          }),
          Family.findAll({
            attributes: ["family_id", "scientific_name", "canonical_name"],
            include: [
              {
                model: Order,
                attributes: ["order_id"],
                include: [
                  {
                    model: Class,
                    attributes: ["class_id", "phylum_id"],
                    where: { phylum_id: { [Op.ne]: null } },
                    required: true,
                  },
                ],
              },
            ],
            raw: true,
            nest: true,
          }),
          Genus.findAll({
            attributes: [
              "genus_id",
              "scientific_name",
              "canonical_name",
              "family_id",
            ],
            include: [
              {
                model: Family,
                attributes: ["family_id"],
                include: [
                  {
                    model: Order,
                    attributes: ["order_id"],
                    include: [
                      {
                        model: Class,
                        attributes: ["class_id", "phylum_id"],
                        where: { phylum_id: { [Op.ne]: null } },
                        required: true,
                      },
                    ],
                    required: true,
                  },
                ],
              },
            ],
            raw: true,
            nest: true,
          }),
          Species.findAll({
            attributes: [
              "species_id",
              "scientific_name",
              "canonical_name",
              "genus_id",
            ],
            include: [
              {
                model: Genus,
                attributes: ["genus_id"],
                include: [
                  {
                    model: Family,
                    attributes: ["family_id"],
                    include: [
                      {
                        model: Order,
                        attributes: ["order_id"],
                        include: [
                          {
                            model: Class,
                            attributes: ["class_id", "phylum_id"],
                            where: { phylum_id: { [Op.ne]: null } },
                            required: true,
                          },
                        ],
                        required: true,
                      },
                    ],
                    required: true,
                  },
                ],
                required: true,
              },
            ],
            raw: true,
            nest: true,
          }),
        ]);

      // Gộp tất cả 6 tầng phả hệ thành 1 câu query Op.or duy nhất
      const nameMaps = await get_vietnamese_name(
        [
          { rank: "phylum", ids: phyla.map((p) => p.phylum_id) },
          { rank: "class", ids: classes.map((c) => c.class_id) },
          { rank: "order", ids: orders.map((o) => o.order_id) },
          { rank: "family", ids: families.map((f) => f.family_id) },
          { rank: "genus", ids: genera.map((g) => g.genus_id) },
          { rank: "species", ids: species.map((s) => s.species_id) },
        ],
        langPriority,
      );

      return res.json([
        phyla.map((p) => ({
          ...p,
          vietnamese_name: nameMaps.phylum[p.phylum_id] || "",
        })),
        classes.map((c) => ({
          ...c,
          vietnamese_name: nameMaps.class[c.class_id] || "",
        })),
        orders.map((o) => ({
          ...o,
          vietnamese_name: nameMaps.order[o.order_id] || "",
        })),
        families.map((f) => ({
          ...f,
          vietnamese_name: nameMaps.family[f.family_id] || "",
        })),
        genera.map((g) => ({
          ...g,
          vietnamese_name: nameMaps.genus[g.genus_id] || "",
        })),
        species.map((s) => ({
          ...s,
          vietnamese_name: nameMaps.species[s.species_id] || "",
        })),
      ]);
    }

    return res
      .status(400)
      .json({ error: "Tham số yêu cầu model_get không hợp lệ." });
  } catch (error) {
    // console.error('Error in getSpeciesPageSmartSelectOptions Unified Engine:', error);
    return res
      .status(500)
      .json({ error: "Lỗi hệ thống xử lý đồng bộ danh mục." });
  }
};

/**
 * API CHÍNH: Lọc, Tìm kiếm tự do, phân trang dữ liệu Đa cấp bậc (Từ Ngành đến Loài)
 */
export const getTaxonomyList = async (req, res) => {
  try {
    const {
      display_rank = "species",
      search,
      sort,
      page = 1,
      limit = 12,
      phylum_id,
      class_id,
      order_id,
      family_id,
      genus_id,
      species_id,
      species_type,
      variant_type, // Tiếp nhận 2 biến phân hóa phân cấp mới
      is_recorded_in_vietnam,
      uses,
      description,
      has_leaf_filter,
      leaf_type,
      leaf_shape,
      leaf_arrangement,
      leaf_margin,
      leaf_length_min,
      leaf_width_min,
      petiole_length_min,
      has_stem_filter,
      stem_type,
      stem_surface,
      stem_color,
      stem_height_min,
      has_flower_filter,
      inflorescence,
      flower_color,
      flower_petal_count,
      habit_stem_root,
      leaves,
      reproduction,
      phenology,
      habitat_ecology,
      notes,
      book_volume,
      book_page_from,
      book_page_to,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 1. Ánh xạ Cấu hình Model đích theo Bậc Phân loại hiển thị (Bao gồm hệ thống Variety mới)
    let targetModel;
    let idField;
    let codePrefix = "TAX";

    switch (display_rank) {
      case "phylum":
        targetModel = Phylum;
        idField = "phylum_id";
        codePrefix = "PHYL";
        break;
      case "class":
        targetModel = Class;
        idField = "class_id";
        codePrefix = "CLASS";
        break;
      case "order":
        targetModel = Order;
        idField = "order_id";
        codePrefix = "ORD";
        break;
      case "family":
        targetModel = Family;
        idField = "family_id";
        codePrefix = "FAM";
        break;
      case "genus":
        targetModel = Genus;
        idField = "genus_id";
        codePrefix = "GEN";
        break;
      case "variety":
        targetModel = Variety;
        idField = "variety_id";
        codePrefix = "VAR";
        break;
      case "species":
      default:
        targetModel = Species;
        idField = "species_id";
        codePrefix = "SPC";
        break;
    }

    const rootWhere = {};
    const rootIncludes = [];

    // Xử lý Tìm kiếm Tự do
    if (search) {
      const matchedCommonNames = await CommonName.findAll({
        where: { name: { [Op.iLike]: `%${search}%` }, rank: display_rank },
        attributes: ["id_entity"],
        raw: true,
      });
      const commonNameEntityIds = matchedCommonNames.map((cn) => cn.id_entity);

      rootWhere[Op.or] = [
        { scientific_name: { [Op.iLike]: `%${search}%` } },
        { canonical_name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
      ];

      // Nếu có tên thường gọi khớp, đẩy thẳng ID vào mảng Op.or của câu truy vấn gốc ban đầu
      if (commonNameEntityIds.length > 0) {
        rootWhere[Op.or].push({
          [idField]: { [Op.in]: commonNameEntityIds },
        });
      }
    }

    if (is_recorded_in_vietnam !== undefined && is_recorded_in_vietnam !== "") {
      rootWhere.is_recorded_in_vietnam = is_recorded_in_vietnam === "true";
    }

    if (description && targetModel.rawAttributes.description) {
      rootWhere.description = { [Op.iLike]: `%${description}%` };
    }

    // Kiểm soát Phân hóa Sub-type bậc con kế bên thanh sắp xếp (Yêu cầu 1.5)
    if (display_rank === "species" && species_type && species_type !== "all") {
      console.log("Áp dụng bộ lọc species_type:", species_type);
      rootWhere.species_type = species_type;
    }
    if (display_rank === "variety" && variant_type && variant_type !== "all") {
      rootWhere.variant_type = variant_type;
    }

    // 2. Xây dựng Chuỗi Kết hợp JOIN Phả hệ Cấp trên Động (Yêu cầu 1.4: Ràng buộc required: true tối ưu hóa dữ liệu sạch)
    const phylumFilter = phylum_id ? { phylum_id } : undefined;
    const classFilter = class_id ? { class_id } : undefined;
    const orderFilter = order_id ? { order_id } : undefined;
    const familyFilter = family_id ? { family_id } : undefined;
    const genusFilter = genus_id ? { genus_id } : undefined;
    const speciesFilter = species_id ? { species_id } : undefined;

    if (display_rank === "class") {
      if (phylum_id) rootWhere.phylum_id = phylum_id;
      rootIncludes.push({
        model: Phylum,
        required: true,
        attributes: [],
        where: phylumFilter,
      });
    } else if (display_rank === "order") {
      if (class_id) rootWhere.class_id = class_id;
      rootIncludes.push({
        model: Class,
        required: true,
        attributes: [],
        where: classFilter,
        include: [
          {
            model: Phylum,
            required: true,
            attributes: [],
            where: phylumFilter,
          },
        ],
      });
    } else if (display_rank === "family") {
      if (order_id) rootWhere.order_id = order_id;
      rootIncludes.push({
        model: Order,
        required: true,
        attributes: [],
        where: orderFilter,
        include: [
          {
            model: Class,
            required: true,
            attributes: [],
            where: classFilter,
            include: [
              {
                model: Phylum,
                required: true,
                attributes: [],
                where: phylumFilter,
              },
            ],
          },
        ],
      });
    } else if (display_rank === "genus") {
      if (family_id) rootWhere.family_id = family_id;
      rootIncludes.push({
        model: Family,
        required: true,
        attributes: [],
        where: familyFilter,
        include: [
          {
            model: Order,
            required: true,
            attributes: [],
            where: orderFilter,
            include: [
              {
                model: Class,
                required: true,
                attributes: [],
                where: classFilter,
                include: [
                  {
                    model: Phylum,
                    required: true,
                    attributes: [],
                    where: phylumFilter,
                  },
                ],
              },
            ],
          },
        ],
      });
    } else if (display_rank === "species") {
      if (genus_id) rootWhere.genus_id = genus_id;
      rootIncludes.push({
        model: Genus,
        required: true,
        attributes: [],
        where: genusFilter,
        include: [
          {
            model: Family,
            required: true,
            attributes: [],
            where: familyFilter,
            include: [
              {
                model: Order,
                required: true,
                attributes: [],
                where: orderFilter,
                include: [
                  {
                    model: Class,
                    required: true,
                    attributes: [],
                    where: classFilter,
                    include: [
                      {
                        model: Phylum,
                        required: true,
                        attributes: [],
                        where: phylumFilter,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
    } else if (display_rank === "variety") {
      if (species_id) rootWhere.species_id = species_id;
      rootIncludes.push({
        model: Species,
        required: true,
        attributes: [],
        where: speciesFilter,
        include: [
          {
            model: Genus,
            required: true,
            attributes: [],
            where: genusFilter,
            include: [
              {
                model: Family,
                required: true,
                attributes: [],
                where: familyFilter,
                include: [
                  {
                    model: Order,
                    required: true,
                    attributes: [],
                    where: orderFilter,
                    include: [
                      {
                        model: Class,
                        required: true,
                        attributes: [],
                        where: classFilter,
                        include: [
                          {
                            model: Phylum,
                            required: true,
                            attributes: [],
                            where: phylumFilter,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
    }

    // 3. Tích hợp HoSpeciesData cho cả Species, Genus và Variety (Yêu cầu 1.2)
    if (["species", "variety", "genus"].includes(display_rank)) {
      const hoWhere = {};
      if (habit_stem_root)
        hoWhere.habit_stem_root = { [Op.iLike]: `%${habit_stem_root}%` };
      if (leaves) hoWhere.leaves = { [Op.iLike]: `%${leaves}%` };
      if (reproduction)
        hoWhere.reproduction = { [Op.iLike]: `%${reproduction}%` };
      if (phenology) hoWhere.phenology = { [Op.iLike]: `%${phenology}%` };
      if (habitat_ecology)
        hoWhere.habitat_ecology = { [Op.iLike]: `%${habitat_ecology}%` };
      if (notes) hoWhere.notes = { [Op.iLike]: `%${notes}%` };

      const bookWhere = {};
      if (book_volume) bookWhere.volume = parseInt(book_volume);
      if (book_page_from || book_page_to) {
        bookWhere.page_number = {};
        if (book_page_from)
          bookWhere.page_number[Op.gte] = parseInt(book_page_from);
        if (book_page_to)
          bookWhere.page_number[Op.lte] = parseInt(book_page_to);
      }

      const isHoFilterActive =
        Object.keys(hoWhere).length > 0 || Object.keys(bookWhere).length > 0;
      if (isHoFilterActive) {
        const hoIncludeStructure = {
          model: HoSpeciesData,
          where: Object.keys(hoWhere).length > 0 ? hoWhere : {},
          required: true,
          attributes: [],
        };

        if (Object.keys(bookWhere).length > 0)
          hoIncludeStructure.where = {
            ...hoIncludeStructure.where,
            ...bookWhere,
          };

        rootIncludes.push(hoIncludeStructure);
      }
    }

    // Các bộ lọc Hình thái học nâng cao (Chỉ áp dụng với loài)
    if (["species", "variety"].includes(display_rank)) {
      if (uses) rootWhere.uses = { [Op.iLike]: `%${uses}%` };

      //Get morphology Model tương ứng với bậc hiển thị hiện tại
      const MorphologyLeafModel =
        display_rank === "species" ? MorphologyLeafSpecies : MorphologyLeaf;
      const MorphologyStemModel =
        display_rank === "species" ? MorphologyStemSpecies : MorphologyStem;
      const MorphologyFlowerModel =
        display_rank === "species" ? MorphologyFlowerSpecies : MorphologyFlower;

      if (has_leaf_filter === "true") {
        const leafWhere = {};
        if (leaf_type) leafWhere.leaf_type = leaf_type;
        if (leaf_shape) leafWhere.shape = leaf_shape;
        if (leaf_arrangement) leafWhere.arrangement = leaf_arrangement;
        if (leaf_margin) leafWhere.margin = leaf_margin;
        if (leaf_length_min)
          leafWhere.length_min = { [Op.gte]: parseFloat(leaf_length_min) };
        if (leaf_width_min)
          leafWhere.width_min = { [Op.gte]: parseFloat(leaf_width_min) };
        if (petiole_length_min)
          leafWhere.petiole_length = {
            [Op.gte]: parseFloat(petiole_length_min),
          };
        if (Object.keys(leafWhere).length > 0)
          rootIncludes.push({
            model: MorphologyLeafModel,
            where: leafWhere,
            required: true,
            attributes: [],
          });
      }

      if (has_stem_filter === "true") {
        const stemWhere = {};
        if (stem_type) stemWhere.stem_type = stem_type;
        if (stem_surface) stemWhere.surface = stem_surface;
        if (stem_color) stemWhere.color = { [Op.iLike]: `%${stem_color}%` };
        if (stem_height_min)
          stemWhere.height_min = { [Op.gte]: parseFloat(stem_height_min) };
        if (Object.keys(stemWhere).length > 0)
          rootIncludes.push({
            model: MorphologyStemModel,
            where: stemWhere,
            required: true,
            attributes: [],
          });
      }

      if (has_flower_filter === "true") {
        const flowerWhere = {};
        if (inflorescence) flowerWhere.inflorescence = inflorescence;
        if (flower_color)
          flowerWhere.color = { [Op.iLike]: `%${flower_color}%` };
        if (flower_petal_count)
          flowerWhere.petal_count = parseInt(flower_petal_count);
        if (Object.keys(flowerWhere).length > 0)
          rootIncludes.push({
            model: MorphologyFlowerModel,
            where: flowerWhere,
            required: true,
            attributes: [],
          });
      }
    }

    // 4. Xử lý Cấu trúc Sắp xếp Trực tiếp dưới Database tầng SQL (Yêu cầu 1.3 - Triệt tiêu lỗi phân trang)
    let orderClause = [
      ["createdAt", "DESC"],
      [idField, "ASC"],
    ];
    if (sort === "name_asc")
      orderClause = [
        ["scientific_name", "ASC"],
        [idField, "ASC"],
      ];
    else if (sort === "name_desc")
      orderClause = [
        ["scientific_name", "DESC"],
        [idField, "ASC"],
      ];
    else if (sort === "view_count_desc")
      orderClause = [
        ["view_count", "DESC"],
        [idField, "ASC"],
      ];
    else if (sort === "view_count_asc")
      orderClause = [
        ["view_count", "ASC"],
        [idField, "ASC"],
      ];
    else if (sort === "image_count_desc" || sort === "image_count_asc") {
      const direction = sort === "image_count_desc" ? "DESC" : "ASC";
      orderClause = [
        [
          Sequelize.literal(`(
            SELECT COUNT(*) FROM "taxonomy_images" AS "img" 
            WHERE "img"."id_entity" = "${targetModel.name}"."${idField}" 
            AND "img"."rank" = '${display_rank}'
          )`),
          direction,
        ],
        [idField, "ASC"],
      ];
    }
    // console.log("Root Where Clause:", rootWhere);
    // 5. Thực thi Query tập dữ liệu gốc từ Database (Kết hợp Filter, Sort, Pagination chuẩn quy trình)
    let { count, rows } = await targetModel.findAndCountAll({
      where: rootWhere,
      include: rootIncludes,
      limit: parseInt(limit),
      offset: offset,
      distinct: true,
      order: orderClause,
      // logging: console.log,
    });

    const entityIds = rows.map((r) => r[idField]);

    // 6. Trích xuất RAM xử lý chuyển đổi hình ảnh và Đa Ngôn ngữ Fallback bậc thang
    const [commonNames, taxonomyImages] = await Promise.all([
      CommonName.findAll({
        where: {
          id_entity: { [Op.in]: entityIds },
          rank: display_rank,
          lang: { [Op.in]: ["vie", "eng", "other"] },
        },
        order: [
          ["primary", "DESC"],
          ["id", "ASC"],
        ],
        raw: true,
      }),
      TaxonomyImage.findAll({
        where: { id_entity: { [Op.in]: entityIds }, rank: display_rank },
        order: [
          ["is_background", "DESC"],
          ["createdAt", "DESC"],
        ],
        raw: true,
      }),
    ]);

    const formattedData = rows.map((item) => {
      const itemId = item[idField];
      const itemCommonNames = commonNames.filter(
        (cn) => cn.id_entity === itemId,
      );

      const vieNames = itemCommonNames.filter((cn) => cn.lang === "vie");
      const engNames = itemCommonNames.filter((cn) => cn.lang === "eng");
      const otherNames = itemCommonNames.filter((cn) => cn.lang === "other");

      const extractTopName = (namesArray) => {
        if (namesArray.length === 0) return "";
        const primary = namesArray.find((n) => n.primary === true);
        return primary ? primary.name : namesArray[0].name;
      };

      const finalCommonName =
        extractTopName(vieNames) ||
        extractTopName(engNames) ||
        extractTopName(otherNames) ||
        "";

      const itemImages = taxonomyImages.filter(
        (img) => img.id_entity === itemId,
      );
      const backgroundRecord =
        itemImages.find((img) => img.is_background === true) || itemImages[0];

      let thumbnail = "/default-plant.png";
      let isExternalImage = true;

      if (backgroundRecord) {
        thumbnail = backgroundRecord.url;
        isExternalImage = backgroundRecord.is_external;
      }

      return {
        [idField]: itemId,
        code: item.code || `${codePrefix}-${String(itemId).padStart(4, "0")}`,
        scientific_name: item.scientific_name || "N/A",
        canonical_name: item.canonical_name || item.scientific_name || "N/A",
        common_name: finalCommonName,
        thumbnail: thumbnail,
        is_external_image: isExternalImage,
        current_rank: display_rank,
        image_count: itemImages.length,
        digitized_image_count: itemImages.filter(
          (img) => img.is_external === false,
        ).length,
        view_count: item.view_count || 0,
      };
    });
    // console.log("Formatted Data Sample:", formattedData[0] || "No data");
    return res.json({
      data: formattedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error in getSpeciesList Engine:", error);
    return res
      .status(500)
      .json({ error: "Lỗi hệ thống trong quá trình kết xuất dữ liệu." });
  }
};

export const getCompareDataTaxonomy = async (req, res) => {
  try {
    const { ids, rank } = req.body;
    if (!ids)
      return res.status(400).json({ message: "Danh sách ID đối chiếu trống." });

    const idArray = ids.split(",").map(Number);
    const currentRank = rank || "species";

    let targetModel;
    let includeStructures = [];

    // Hỗ trợ bổ sung toàn bộ phân hệ đệ quy ngược cho Variety (Yêu cầu 1.1)
    switch (currentRank) {
      case "phylum":
        targetModel = Phylum;
        break;
      case "class":
        targetModel = Class;
        includeStructures = [{ model: Phylum }];
        break;
      case "order":
        targetModel = Order;
        includeStructures = [{ model: Class, include: [Phylum] }];
        break;
      case "family":
        targetModel = Family;
        includeStructures = [
          { model: Order, include: [{ model: Class, include: [Phylum] }] },
        ];
        break;
      case "genus":
        targetModel = Genus;
        includeStructures = [
          {
            model: Family,
            include: [
              { model: Order, include: [{ model: Class, include: [Phylum] }] },
            ],
          },
          { model: HoSpeciesData },
        ];
        break;
      case "variety":
        targetModel = Variety;
        includeStructures = [
          {
            model: Species,
            include: [
              {
                model: Genus,
                include: [
                  {
                    model: Family,
                    include: [
                      {
                        model: Order,
                        include: [{ model: Class, include: [Phylum] }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          { model: HoSpeciesData },
          { model: MorphologyLeaf },
          { model: MorphologyStem },
          { model: MorphologyFlower },
          { model: MorphologyFruit },
        ];
        break;
      case "species":
      default:
        targetModel = Species;
        includeStructures = [
          {
            model: Genus,
            include: [
              {
                model: Family,
                include: [
                  {
                    model: Order,
                    include: [{ model: Class, include: [Phylum] }],
                  },
                ],
              },
            ],
          },
          { model: HoSpeciesData },
          { model: MorphologyLeafSpecies },
          { model: MorphologyStemSpecies },
          { model: MorphologyFlowerSpecies },
          { model: MorphologyFruitSpecies },
        ];
        break;
    }

    const results = await targetModel.findAll({
      where: { [`${currentRank}_id`]: idArray },
      include: includeStructures,
    });

    const entitiesToQuery = [];
    const ranksChain = [
      "phylum",
      "class",
      "order",
      "family",
      "genus",
      "species",
      "variety",
    ];

    results.forEach((item) => {
      let currentObj = item;
      let rankIndex = ranksChain.indexOf(currentRank);
      entitiesToQuery.push({
        id: currentObj[`${currentRank}_id`],
        rank: currentRank,
        obj: currentObj,
      });

      while (rankIndex > 0) {
        const nextRank = ranksChain[rankIndex - 1];
        const associationKey =
          nextRank.charAt(0).toUpperCase() + nextRank.slice(1);
        if (currentObj[associationKey]) {
          currentObj = currentObj[associationKey];
          entitiesToQuery.push({
            id: currentObj[`${nextRank}_id`],
            rank: nextRank,
            obj: currentObj,
          });
          rankIndex--;
        } else {
          break;
        }
      }
    });

    if (entitiesToQuery.length > 0) {
      const conditions = entitiesToQuery.map((e) => ({
        id_entity: e.id,
        rank: e.rank,
      }));
      const [commonNames, taxonomyImages] = await Promise.all([
        CommonName.findAll({
          where: {
            [Op.or]: conditions,
            lang: { [Op.in]: ["vie", "eng", "other"] },
          },
          order: [
            ["primary", "DESC"],
            ["id", "ASC"],
          ],
          raw: true,
        }),
        TaxonomyImage.findAll({
          where: { [Op.or]: conditions },
          order: [
            ["is_background", "DESC"],
            ["createdAt", "DESC"],
          ],
          raw: true,
        }),
      ]);

      results.forEach((item) => {
        const itemId = item[`${currentRank}_id`];
        const itemImages = taxonomyImages.filter(
          (img) => img.id_entity === itemId && img.rank === currentRank,
        );
        const bg =
          itemImages.find((img) => img.is_background === true) || itemImages[0];
        if (bg) {
          if (item.setDataValue) {
            item.setDataValue("thumbnail", bg.url);
            item.setDataValue("is_external_image", bg.is_external || false);
          } else {
            item.thumbnail = bg.url;
            item.is_external_image = bg.is_external || false;
          }
        }
      });

      entitiesToQuery.forEach((e) => {
        const itemCommonNames = commonNames.filter(
          (cn) => cn.id_entity === e.id && cn.rank === e.rank,
        );
        const extractTopName = (arr) =>
          arr.length === 0
            ? ""
            : arr.find((n) => n.primary === true)?.name || arr[0].name;
        const finalCommonName =
          extractTopName(itemCommonNames.filter((cn) => cn.lang === "vie")) ||
          extractTopName(itemCommonNames.filter((cn) => cn.lang === "eng")) ||
          extractTopName(itemCommonNames.filter((cn) => cn.lang === "other")) ||
          "";

        if (e.obj.setDataValue)
          e.obj.setDataValue("common_name", finalCommonName);
        else e.obj.common_name = finalCommonName;
      });
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("Lỗi xảy ra tại API getCompareTaxonomyData:", error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ." });
  }
};

export const getTaxonomyDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const currentRank = req.query.rank || "species";

    let targetModel;
    let includeStructures = [];
    const idField = `${currentRank}_id`;

    // 1. Cấu hình Eager Loading liên kết ngược phả hệ và hình thái cơ quan
    switch (currentRank) {
      case "phylum":
        targetModel = Phylum;
        break;
      case "class":
        targetModel = Class;
        includeStructures = [{ model: Phylum }];
        break;
      case "order":
        targetModel = Order;
        includeStructures = [{ model: Class, include: [Phylum] }];
        break;
      case "family":
        targetModel = Family;
        includeStructures = [
          { model: Order, include: [{ model: Class, include: [Phylum] }] },
        ];
        break;
      case "genus":
        targetModel = Genus;
        includeStructures = [
          {
            model: Family,
            include: [
              { model: Order, include: [{ model: Class, include: [Phylum] }] },
            ],
          },
          {
            model: HoSpeciesData,
            include: [{ model: BookImage, as: "page_image" }],
          }, // Bổ sung HoSpeciesData cho cấp Genus
        ];
        break;
      case "variety":
        targetModel = Variety;
        includeStructures = [
          {
            model: Species,
            include: [
              {
                model: Genus,
                include: [
                  {
                    model: Family,
                    include: [
                      {
                        model: Order,
                        include: [{ model: Class, include: [Phylum] }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            model: HoSpeciesData,
            include: [{ model: BookImage, as: "page_image" }],
          },
          { model: MorphologyLeaf },
          { model: MorphologyStem },
          { model: MorphologyFlower },
          { model: MorphologyFruit },
        ];
        break;
      case "species":
      default:
        targetModel = Species;
        includeStructures = [
          {
            model: Genus,
            include: [
              {
                model: Family,
                include: [
                  {
                    model: Order,
                    include: [{ model: Class, include: [Phylum] }],
                  },
                ],
              },
            ],
          },
          {
            model: HoSpeciesData,
            include: [{ model: BookImage, as: "page_image" }],
          },
          { model: MorphologyLeafSpecies },
          { model: MorphologyStemSpecies },
          { model: MorphologyFlowerSpecies },
          { model: MorphologyFruitSpecies },
        ];
        break;
    }

    // 2. Thực thi truy vấn Node dữ liệu hiện tại
    const entity = await targetModel.findOne({
      where: { [idField]: id },
      include: includeStructures,
    });

    if (!entity) {
      return res.status(404).json({
        message: "Không tìm thấy hồ sơ dữ liệu thực thể phân loại học.",
      });
    }

    // 🌟 TOÁN TỬ TĂNG VIEW_COUNT THEO PHIÊN (EXPRESS-SESSION TRACKING)
    const dynamicIncrement = req.query.increment === "true";

    if (dynamicIncrement) {
      // Chỉ tăng view khi Frontend báo cáo đây là phiên truy cập mới trong Tab
      await entity.increment("view_count", { by: 1 });
    }

    // 3. Quy quét ID phả hệ mở rộng bao gồm cả nhánh Thứ/Biến thể (Variety)
    const entitiesInChain = [];
    const ranksChain = [
      "phylum",
      "class",
      "order",
      "family",
      "genus",
      "species",
      "variety",
    ];

    let pointer = entity;
    let rankIdx = ranksChain.indexOf(currentRank);
    entitiesInChain.push({
      id: pointer[idField],
      rank: currentRank,
      nodeRef: pointer,
    });

    while (rankIdx > 0) {
      const parentRank = ranksChain[rankIdx - 1];
      const associationAlias =
        parentRank.charAt(0).toUpperCase() + parentRank.slice(1);
      if (pointer[associationAlias]) {
        pointer = pointer[associationAlias];
        entitiesInChain.push({
          id: pointer[`${parentRank}_id`],
          rank: parentRank,
          nodeRef: pointer,
        });
        rankIdx--;
      } else {
        break;
      }
    }

    const queryConditions = entitiesInChain.map((e) => ({
      id_entity: e.id,
      rank: e.rank,
    }));

    // 4. Đồng bộ tải thông tin phụ trợ từ Database
    const [allCommonNames, taxonomyHistory, taxonomyImages] = await Promise.all(
      [
        CommonName.findAll({
          where: { [Op.or]: queryConditions },
          order: [
            ["primary", "DESC"],
            ["id", "ASC"],
          ],
          raw: true,
        }),
        TaxonomyHistory.findAll({
          where: { id_entity: id, rank: currentRank },
          order: [["createdAt", "DESC"]],
          raw: true,
        }),
        TaxonomyImage.findAll({
          where: { id_entity: id, rank: currentRank },
          order: [["is_background", "DESC"]],
          raw: true,
        }),
      ],
    );

    // 5. Gom nhóm CommonNames chuẩn giao diện
    const currentNodeNames = allCommonNames.filter(
      (cn) => cn.id_entity == id && cn.rank === currentRank,
    );
    const groupedCommonNames = {
      vie: currentNodeNames
        .filter((cn) => cn.lang === "vie")
        .map((cn) => ({ name: cn.name, isPrimary: cn.primary })),
      eng: currentNodeNames
        .filter((cn) => cn.lang === "eng")
        .map((cn) => ({ name: cn.name, isPrimary: cn.primary })),
      other: currentNodeNames
        .filter((cn) => cn.lang === "other")
        .map((cn) => ({ name: cn.name, isPrimary: cn.primary })),
    };

    entitiesInChain.forEach((e) => {
      const nodeNames = allCommonNames.filter(
        (cn) => cn.id_entity == e.id && cn.rank === e.rank,
      );
      const fallback =
        nodeNames.find((cn) => cn.lang === "vie")?.name ||
        nodeNames.find((cn) => cn.lang === "eng")?.name ||
        nodeNames.find((cn) => cn.lang === "other")?.name ||
        "";
      if (e.nodeRef.setDataValue)
        e.nodeRef.setDataValue("common_name", fallback);
      else e.nodeRef.common_name = fallback;
    });

    return res.status(200).json({
      entity,
      current_rank: currentRank,
      groupedCommonNames,
      taxonomyHistory,
      taxonomyImages,
    });
  } catch (error) {
    console.error("Error in getTaxonomyDetail Engine:", error);
    return res.status(500).json({
      error: "Lỗi hệ thống trong quá trình bóc tách chi tiết phân loại học.",
    });
  }
};

export const getTaxonomyTreeSmartSelectOptions = async (req, res) => {
  try {
    const [phyla, classes, orders, families, genera, species] =
      await Promise.all([
        Phylum.findAll({
          attributes: ["phylum_id", "scientific_name", "canonical_name"],
          raw: true,
        }),
        Class.findAll({
          attributes: [
            "class_id",
            "scientific_name",
            "canonical_name",
            "phylum_id",
          ],
          raw: true,
        }),
        Order.findAll({
          attributes: ["order_id", "scientific_name", "canonical_name"],
          include: [{ model: Class, attributes: ["class_id", "phylum_id"] }],
          raw: true,
          nest: true,
        }),
        Family.findAll({
          attributes: ["family_id", "scientific_name", "canonical_name"],
          include: [
            {
              model: Order,
              attributes: ["order_id"],
              include: [
                { model: Class, attributes: ["class_id", "phylum_id"] },
              ],
            },
          ],
          raw: true,
          nest: true,
        }),
        Genus.findAll({
          attributes: [
            "genus_id",
            "scientific_name",
            "canonical_name",
            "family_id",
          ],
          include: [
            {
              model: Family,
              attributes: ["family_id"],
              include: [
                {
                  model: Order,
                  attributes: ["order_id"],
                  include: [
                    { model: Class, attributes: ["class_id", "phylum_id"] },
                  ],
                },
              ],
            },
          ],
          raw: true,
          nest: true,
        }),
        Species.findAll({
          attributes: [
            "species_id",
            "scientific_name",
            "canonical_name",
            "genus_id",
          ],
          include: [{ model: Genus, attributes: ["genus_id", "family_id"] }],
          raw: true,
          nest: true,
        }),
      ]);

    // Trích xuất toàn bộ ID để nạp Tên phổ thông đồng bộ
    const entitiesConfig = [
      { array: phyla, idField: "phylum_id", rank: "phylum" },
      { array: classes, idField: "class_id", rank: "class" },
      { array: orders, idField: "order_id", rank: "order" },
      { array: families, idField: "family_id", rank: "family" },
      { array: genera, idField: "genus_id", rank: "genus" },
      { array: species, idField: "species_id", rank: "species" },
    ];

    const conditions = [];
    entitiesConfig.forEach((cfg) => {
      cfg.array.forEach((item) => {
        conditions.push({ id_entity: item[cfg.idField], rank: cfg.rank });
      });
    });

    let commonNames = [];
    if (conditions.length > 0) {
      commonNames = await CommonName.findAll({
        where: {
          [Op.or]: conditions,
          lang: { [Op.in]: ["vie", "eng", "other"] },
        },
        order: [
          ["primary", "DESC"],
          ["id", "ASC"],
        ],
        raw: true,
      });
    }

    const applyCommonNameFallback = (itemId, rank) => {
      const matches = commonNames.filter(
        (cn) => cn.id_entity === itemId && cn.rank === rank,
      );
      const topName = (list) => {
        if (list.length === 0) return "";
        const primary = list.find((n) => n.primary === true);
        return primary ? primary.name : list[0].name;
      };
      return (
        topName(matches.filter((c) => c.lang === "vie")) ||
        topName(matches.filter((c) => c.lang === "eng")) ||
        topName(matches.filter((c) => c.lang === "other")) ||
        ""
      );
    };

    // Format mảng map trả ra cấu trúc chuẩn cho Front-end SmartSelect
    const formatOptions = (list, idField, rank) =>
      list.map((item) => {
        const vName = applyCommonNameFallback(item[idField], rank);
        return {
          value: item[idField],
          label: `${item.scientific_name} ${vName ? "- " + vName : ""}`,
          scientific_name: item.scientific_name,
          vietnamese_name: vName,
          // Giữ lại các trường quan hệ phả hệ phục vụ bộ lọc cascading tương tác ngược ở FE
          phylum_id:
            item.phylum_id ||
            item.Class?.phylum_id ||
            item.Order?.Class?.phylum_id ||
            item.Family?.Order?.Class?.phylum_id ||
            item.Genus?.Family?.Order?.Class?.phylum_id,
          class_id:
            item.class_id ||
            item.Order?.class_id ||
            item.Family?.Order?.class_id ||
            item.Genus?.Family?.Order?.class_id,
          order_id:
            item.order_id ||
            item.Family?.order_id ||
            item.Genus?.Family?.order_id,
          family_id:
            item.family_id ||
            item.Genus?.family_id ||
            item.Genus?.Family?.family_id,
          genus_id: item.genus_id,
        };
      });

    return res.json({
      phylum: formatOptions(phyla, "phylum_id", "phylum"),
      class: formatOptions(classes, "class_id", "class"),
      order: formatOptions(orders, "order_id", "order"),
      family: formatOptions(families, "family_id", "family"),
      genus: formatOptions(genera, "genus_id", "genus"),
      species: formatOptions(species, "species_id", "species"),
    });
  } catch (error) {
    console.error("Lỗi tại getTaxonomyTreeSmartSelectOptions:", error);
    return res
      .status(500)
      .json({ error: "Lỗi đồng bộ danh mục cấu trúc phả hệ." });
  }
};

export const getTaxonomyTree = async (req, res) => {
  try {
    const { phylum_id, class_id, order_id, family_id, genus_id, species_id } =
      req.query;

    // 1. Lọc điều kiện động cho từng cấp
    const wherePhylum = phylum_id ? { phylum_id } : {};
    const whereClass = class_id ? { class_id } : {};
    const whereOrder = order_id ? { order_id } : {};
    const whereFamily = family_id ? { family_id } : {};
    const whereGenus = genus_id ? { genus_id } : {};
    const whereSpecies = species_id ? { species_id } : {};

    // 2. Quét phẳng toàn bộ Database song song nhằm tránh nghẽn luồng dữ liệu liên kết
    const [phyla, classes, orders, families, genera, species, varieties] =
      await Promise.all([
        Phylum.findAll({ where: wherePhylum, raw: true }),
        Class.findAll({ where: whereClass, raw: true }),
        Order.findAll({ where: whereOrder, raw: true }),
        Family.findAll({ where: whereFamily, raw: true }),
        Genus.findAll({ where: whereGenus, raw: true }),
        Species.findAll({ where: whereSpecies, raw: true }),
        Variety.findAll({
          attributes: [
            "variety_id",
            "common_name",
            "variety_name",
            "variant_type",
            "code",
            "species_id",
          ],
          include: [
            {
              model: PlantImage,
              where: { is_background: true },
              required: false,
              limit: 1,
              attributes: ["url"],
            },
          ],
        }),
      ]);

    // 3. Gom tụm toàn bộ ID để xử lý đa ngôn ngữ và kho tư liệu hình ảnh một lần duy nhất
    const entitiesToQuery = [];
    const collector = (array, idField, rank) => {
      array.forEach((item) =>
        entitiesToQuery.push({ id: item[idField], rank }),
      );
    };
    collector(phyla, "phylum_id", "phylum");
    collector(classes, "class_id", "class");
    collector(orders, "order_id", "order");
    collector(families, "family_id", "family");
    collector(genera, "genus_id", "genus");
    collector(species, "species_id", "species");

    let commonNames = [];
    let taxonomyImages = [];
    if (entitiesToQuery.length > 0) {
      const conditions = entitiesToQuery.map((e) => ({
        id_entity: e.id,
        rank: e.rank,
      }));
      [commonNames, taxonomyImages] = await Promise.all([
        CommonName.findAll({
          where: {
            [Op.or]: conditions,
            lang: { [Op.in]: ["vie", "eng", "other"] },
          },
          order: [["primary", "DESC"]],
          raw: true,
        }),
        TaxonomyImage.findAll({
          where: { [Op.or]: conditions },
          order: [["is_background", "DESC"]],
          raw: true,
        }),
      ]);
    }

    // Hàm helper xử lý Fallback tên gọi và ảnh Cover trên RAM
    const enrichNodeData = (item, idField, rank) => {
      const itemId = item[idField];
      const matches = commonNames.filter(
        (cn) => cn.id_entity === itemId && cn.rank === rank,
      );
      const extractTopName = (list) => {
        if (list.length === 0) return "";
        const p = list.find((n) => n.primary === true);
        return p ? p.name : list[0].name;
      };
      const finalCommonName =
        extractTopName(matches.filter((c) => c.lang === "vie")) ||
        extractTopName(matches.filter((c) => c.lang === "eng")) ||
        extractTopName(matches.filter((c) => c.lang === "other")) ||
        "";

      const imgRecord = taxonomyImages.find(
        (img) => img.id_entity === itemId && img.rank === rank,
      );

      return {
        ...item,
        common_name: finalCommonName,
        thumbnail: imgRecord ? imgRecord.url : "/default-plant.png",
        is_external_image: imgRecord ? imgRecord.is_external : true,
      };
    };

    // Làm sạch và gán dữ liệu đa ngôn ngữ / ảnh cho từng node phẳng
    const enrichedPhyla = phyla.map((i) =>
      enrichNodeData(i, "phylum_id", "phylum"),
    );
    const enrichedClasses = classes.map((i) =>
      enrichNodeData(i, "class_id", "class"),
    );
    const enrichedOrders = orders.map((i) =>
      enrichNodeData(i, "order_id", "order"),
    );
    const enrichedFamilies = families.map((i) =>
      enrichNodeData(i, "family_id", "family"),
    );
    const enrichedGenera = genera.map((i) =>
      enrichNodeData(i, "genus_id", "genus"),
    );
    const enrichedSpecies = species.map((i) =>
      enrichNodeData(i, "species_id", "species"),
    );

    const formattedVarieties = varieties.map((v) => ({
      variety_id: v.variety_id,
      common_name: v.common_name,
      variety_name: v.variety_name,
      variant_type: v.variant_type,
      code: v.code,
      species_id: v.species_id,
      thumbnail: v.PlantImages?.[0]?.url || "/default-plant.png",
    }));

    // 4. THUẬT TOÁN ĐÓNG GÓI CÂY PHẢ HỆ VÀ PHÂN LOẠI NODE MỒ CÔI (ORPHAN NODES)
    // Chuẩn bị mảng chứa các thực thể khuyết liên kết cha ở tầng Root
    const orphanClasses = [];
    const orphanOrders = [];
    const orphanFamilies = [];
    const orphanGenera = [];
    const orphanSpecies = [];

    // Lắp ráp từ Loài -> Biến thể
    enrichedSpecies.forEach((sp) => {
      sp.Varieties = formattedVarieties.filter(
        (v) => v.species_id === sp.species_id,
      );
    });

    // Lắp ráp từ Chi -> Loài
    enrichedGenera.forEach((gn) => {
      gn.Species = enrichedSpecies.filter((sp) => sp.genus_id === gn.genus_id);
      // Nếu loài có genus_id không hợp lệ/không khớp, nó sẽ bị sót, ta gom vào danh sách kiểm soát
    });
    const matchedSpeciesIds = enrichedGenera.flatMap((gn) =>
      gn.Species.map((s) => s.species_id),
    );
    enrichedSpecies.forEach((sp) => {
      if (!matchedSpeciesIds.includes(sp.species_id)) {
        sp.isOrphan = true;
        orphanSpecies.push(sp);
      }
    });

    // Lắp ráp từ Họ -> Chi
    enrichedFamilies.forEach((fa) => {
      fa.Genera = enrichedGenera.filter((gn) => gn.family_id === fa.family_id);
    });
    const matchedGenusIds = enrichedFamilies.flatMap((fa) =>
      fa.Genera.map((g) => g.genus_id),
    );
    enrichedGenera.forEach((gn) => {
      if (!matchedGenusIds.includes(gn.genus_id)) {
        gn.isOrphan = true;
        orphanGenera.push(gn);
      }
    });

    // Lắp ráp từ Bộ -> Họ
    enrichedOrders.forEach((ord) => {
      ord.Families = enrichedFamilies.filter(
        (fa) => fa.order_id === ord.order_id,
      );
    });
    const matchedFamilyIds = enrichedOrders.flatMap((ord) =>
      ord.Families.map((f) => f.family_id),
    );
    enrichedFamilies.forEach((fa) => {
      if (!matchedFamilyIds.includes(fa.family_id)) {
        fa.isOrphan = true;
        orphanFamilies.push(fa);
      }
    });

    // Lắp ráp từ Lớp -> Bộ
    enrichedClasses.forEach((cl) => {
      cl.Orders = enrichedOrders.filter((ord) => ord.class_id === cl.class_id);
    });
    const matchedOrderIds = enrichedClasses.flatMap((cl) =>
      cl.Orders.map((o) => o.order_id),
    );
    enrichedOrders.forEach((ord) => {
      if (!matchedOrderIds.includes(ord.order_id)) {
        ord.isOrphan = true;
        orphanOrders.push(ord);
      }
    });

    // Lắp ráp từ Ngành -> Lớp
    enrichedPhyla.forEach((phy) => {
      phy.Classes = enrichedClasses.filter(
        (cl) => cl.phylum_id === phy.phylum_id,
      );
    });
    const matchedClassIds = enrichedPhyla.flatMap((phy) =>
      phy.Classes.map((c) => c.class_id),
    );
    enrichedClasses.forEach((cl) => {
      if (!matchedClassIds.includes(cl.class_id)) {
        cl.isOrphan = true;
        orphanClasses.push(cl);
      }
    });

    return res.status(200).json({
      success: true,
      tree: enrichedPhyla, // Nhánh cây chuẩn mực bắt đầu từ Ngành gốc xuống
      orphans: {
        // Toàn bộ tập dữ liệu khuyết nhánh cha gom riêng để hiển thị nổi bật
        classes: orphanClasses,
        orders: orphanOrders,
        families: orphanFamilies,
        genera: orphanGenera,
        species: orphanSpecies,
      },
    });
  } catch (error) {
    console.error("Lỗi xử lý sinh cấu trúc phả hệ tại getTaxonomyTree:", error);
    return res
      .status(500)
      .json({ message: "Mô tơ máy chủ lỗi xây dựng bản đồ phả hệ." });
  }
};
