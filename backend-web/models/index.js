// models/index.js

import sequelize from "../config/database.js";
import Counter from "./Counter.js";
import Account from "./Account.js";
import { CommonName, TaxonomyHistory } from "./Name.js";
import { PlantImage, TaxonomyImage, BookImage } from "./AI.js";
import { Distribution, Province } from "./geoDistributions.js";
import HoSpeciesData from "./hoSpeciesData.js";
import {
  Phylum,
  Class,
  Order,
  Family,
  Genus,
  Species,
  Variety,
} from "./Taxonomy.js";
import {
  MorphologyLeaf,
  MorphologyFlower,
  MorphologyStem,
  MorphologyFruit,
  MorphologyLeafSpecies,
  MorphologyFlowerSpecies,
  MorphologyStemSpecies,
  MorphologyFruitSpecies,
} from "./Morphology.js";
import { RANK_TYPE_MAPPED } from "./enums.js";

// --- THIẾT LẬP QUAN HỆ (ASSOCIATIONS) ---

Phylum.hasMany(Class, { foreignKey: "phylum_id" });
Class.belongsTo(Phylum, { foreignKey: "phylum_id" });

Class.hasMany(Order, { foreignKey: "class_id" });
Order.belongsTo(Class, { foreignKey: "class_id" });

Order.hasMany(Family, { foreignKey: "order_id" });
Family.belongsTo(Order, { foreignKey: "order_id" });

Family.hasMany(Genus, { foreignKey: "family_id" });
Genus.belongsTo(Family, { foreignKey: "family_id" });

Genus.hasMany(Species, { foreignKey: "genus_id" });
Species.belongsTo(Genus, { foreignKey: "genus_id" });

Species.hasMany(Variety, { foreignKey: "species_id" });
Variety.belongsTo(Species, { foreignKey: "species_id" });

Genus.hasOne(HoSpeciesData, { foreignKey: "genus_id" });
HoSpeciesData.belongsTo(Genus, { foreignKey: "genus_id" });
Species.hasOne(HoSpeciesData, { foreignKey: "species_id" });
HoSpeciesData.belongsTo(Species, { foreignKey: "species_id" });
Variety.hasOne(HoSpeciesData, { foreignKey: "variety_id" });
HoSpeciesData.belongsTo(Variety, { foreignKey: "variety_id" });
HoSpeciesData.belongsTo(BookImage, {
  foreignKey: "image_filename",
  targetKey: "file_name",
  as: "page_image",
});

Species.hasOne(MorphologyLeafSpecies, { foreignKey: "species_id" });
MorphologyLeafSpecies.belongsTo(Species, { foreignKey: "species_id" });
Species.hasOne(MorphologyStemSpecies, { foreignKey: "species_id" });
MorphologyStemSpecies.belongsTo(Species, { foreignKey: "species_id" });
Species.hasOne(MorphologyFlowerSpecies, { foreignKey: "species_id" });
MorphologyFlowerSpecies.belongsTo(Species, { foreignKey: "species_id" });
Species.hasOne(MorphologyFruitSpecies, { foreignKey: "species_id" });
MorphologyFruitSpecies.belongsTo(Species, { foreignKey: "species_id" });

Variety.hasOne(MorphologyLeaf, { foreignKey: "variety_id" });
MorphologyLeaf.belongsTo(Variety, { foreignKey: "variety_id" });
Variety.hasOne(MorphologyStem, { foreignKey: "variety_id" });
MorphologyStem.belongsTo(Variety, { foreignKey: "variety_id" });
Variety.hasOne(MorphologyFlower, { foreignKey: "variety_id" });
MorphologyFlower.belongsTo(Variety, { foreignKey: "variety_id" });
Variety.hasOne(MorphologyFruit, { foreignKey: "variety_id" });
MorphologyFruit.belongsTo(Variety, { foreignKey: "variety_id" });

Variety.hasMany(Distribution, { foreignKey: "variety_id" });
Distribution.belongsTo(Variety, { foreignKey: "variety_id" });

Province.hasMany(Distribution, { foreignKey: "province_id" });
Distribution.belongsTo(Province, { foreignKey: "province_id" });

Variety.hasMany(PlantImage, { foreignKey: "variety_id" });
PlantImage.belongsTo(Variety, { foreignKey: "variety_id" });

/* ==========================================================================
   ĐÁNH CHẶN TOÀN CỤC BẰNG HOOK SEQUELIZE V6 - PHIÊN BẢN CHUẨN HOÁ ALIAS PATH
   ========================================================================== */

const injectLiteralForModel = (options, resolvedAlias, rank, idField) => {
  if (!options) return;

  // Tạo câu lệnh Subquery bám sát theo tên định danh thực tế dưới SQL
  const literalQuery = [
    sequelize.literal(`(
            SELECT name FROM common_names AS cn
            WHERE cn.id_entity = "${resolvedAlias}"."${idField}" 
            AND cn.rank = '${rank}' 
            AND cn.lang = 'vie'
            ORDER BY cn.primary DESC, cn.id ASC
            LIMIT 1
        )`),
    "vietnamese_name",
  ];

  if (!options.attributes) {
    options.attributes = { include: [] };
  }

  if (Array.isArray(options.attributes)) {
    const stringIndex = options.attributes.indexOf("vietnamese_name");
    if (stringIndex !== -1) {
      options.attributes[stringIndex] = literalQuery;
    } else {
      const hasLiteral = options.attributes.some(
        (attr) => Array.isArray(attr) && attr[1] === "vietnamese_name",
      );
      if (!hasLiteral) options.attributes.push(literalQuery);
    }
  } else if (typeof options.attributes === "object") {
    if (!options.attributes.include) {
      options.attributes.include = [];
    }
    const hasField = options.attributes.include.some((attr) =>
      Array.isArray(attr)
        ? attr[1] === "vietnamese_name"
        : attr === "vietnamese_name",
    );
    if (!hasField) {
      options.attributes.include.push(literalQuery);
    }
  }
};

// Hàm đệ quy thông minh: Tuân thủ tuyệt đối quy tắc đặt tên phả hệ của Sequelize v6
const traverseAndFixIncludes = (includeOpt, parentPath = "") => {
  if (!includeOpt || !includeOpt.model) return;

  const modelName = includeOpt.model.name;
  const currentAlias = includeOpt.as || modelName;

  // Quy tắc vàng của v6: Nếu có đường dẫn cha, nối chuỗi bằng "->", ngược lại dùng chính nó
  const resolvedAlias = parentPath
    ? `${parentPath}->${currentAlias}`
    : currentAlias;

  // Inject câu lệnh SQL thô cho đúng Model đích danh
  if (modelName === "Species")
    injectLiteralForModel(includeOpt, resolvedAlias, "species", "species_id");
  if (modelName === "Genus")
    injectLiteralForModel(includeOpt, resolvedAlias, "genus", "genus_id");
  if (modelName === "Family")
    injectLiteralForModel(includeOpt, resolvedAlias, "family", "family_id");

  // Tiếp tục duyệt sâu xuống các bảng con liên kết lồng phía trong
  if (includeOpt.include && Array.isArray(includeOpt.include)) {
    includeOpt.include.forEach((subInclude) =>
      traverseAndFixIncludes(subInclude, resolvedAlias),
    );
  }
};

sequelize.addHook("beforeFindAfterOptions", (options) => {
  // 1. Xử lý trường hợp Model đích danh nằm ở gốc câu truy vấn (Root Model)
  if (options.model) {
    const rootName = options.model.name;
    const rootAlias = options.as || rootName;

    if (rootName === "Species")
      injectLiteralForModel(options, rootAlias, "species", "species_id");
    if (rootName === "Genus")
      injectLiteralForModel(options, rootAlias, "genus", "genus_id");
    if (rootName === "Family")
      injectLiteralForModel(options, rootAlias, "family", "family_id");
  }

  // 2. Xử lý các include cấp đầu tiên liên kết với bảng gốc
  if (options.include && Array.isArray(options.include)) {
    options.include.forEach((subInclude) =>
      traverseAndFixIncludes(subInclude, ""),
    );
  }
});

export {
  sequelize,
  Counter,
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
  MorphologyFlowerSpecies,
  MorphologyStemSpecies,
  MorphologyFruitSpecies,
  HoSpeciesData,
  CommonName,
  TaxonomyHistory,
  Distribution,
  Province,
  PlantImage,
  TaxonomyImage,
  BookImage,
  Account,
};
