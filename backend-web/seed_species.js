// import { fileURLToPath } from "url";
// import {
//     sequelize,
//     Family,
//     Genus,
//     Species,
//     Variety,
//     HoSpeciesData,
//     CommonName,
//     TaxonomyHistory,
//     TaxonomyImage
// } from "./models/index.js";
// import { Op } from 'sequelize';
// import { speciesData } from "./data/index.js";
// import fs from 'fs';

// async function seedDatabaseNewData() {
//     try {
//         await sequelize.authenticate();
//         console.log("✅ Database connected for seeding");
//         await sequelize.sync({ alter: true });
//         //Process Data speciesData
//         const genusDatas= [];
//         const speciesDatas = [];
//         const varietyDatas = [];
//         const item_invalid = [];
//         const parsedPages = (item) => {
//             //parsed page_number and page_image
//             const match= item.page_number ? item.page_number.match(/vol(\d+)_p(\d+)/i) : null;
//             return {
//                 volume: parseInt(match[1], 10),
//                 page_number: parseInt(match[2], 10),
//                 image_filename: item.page_image ? item.page_image.trim() : null
//             }
//         };
//         for (const item of speciesData) {
//             if (item.scientific_name && item.scientific_name.trim() !== '' && item.rank && item.rank.trim() !== '') {

//                 if (item.rank === 'species' || item.rank === 'subspecies')
//                 {
//                     if (item.parsed)
//                         item.parsed={...item.parsed, ...parsedPages(item)}
//                     speciesDatas.push({
//                         ...item,
//                         species_type:item.rank === 'species' ? 'Species' : 'Subspecies',
//                     });
//                 }
//                 else if (item.rank === 'genus')
//                     {
//                         if (item.parsed)
//                         item.parsed={...item.parsed, ...parsedPages(item)}
//                         genusDatas.push(item);
//                     }
//                 else if (item.rank === 'variety' || item.rank === 'form')
//                     {
//                         if (item.parsed)
//                             item.parsed={...item.parsed, ...parsedPages(item)}
//                         varietyDatas.push(
//                             {
//                                 ...item,
//                                 rank: item.rank === 'variety' ? 'Variety' : 'Forma'
//                             }
//                         );
//                     }
//                 else
//                     item_invalid.push(item);
//             } else
//                 item_invalid.push(item);
//         }
//         // Lưu dữ liệu invalid vào file để kiểm tra sau
//         //open file
//         const invalidFilePath = 'data/invalid_species_data.json';
//         fs.writeFileSync(invalidFilePath, JSON.stringify(item_invalid, null, 2));
//         console.log(`✅ Đã lưu ${item_invalid.length} bản ghi không hợp lệ vào ${invalidFilePath}`);

//         const stats = {
//             genera: { total: genusDatas.length, created: 0, existed: 0, failed: 0, missing_parent: 0, not_existed_parent: 0 },
//             species: { total: speciesDatas.length, created: 0, existed: 0, failed: 0, missing_parent: 0, not_existed_parent: 0 },
//             varieties: { total: varietyDatas.length, created: 0, existed: 0, failed: 0, missing_parent: 0, not_existed_parent: 0 }
//         };

//         const t = await sequelize.transaction();

//         try {
//     const processEntityOptimized = async (Model, dataList, parentModel, parentKey, statsObj, idField) => {
//     if (!dataList || dataList.length === 0) return;

//     console.log(`⏳ Đang xử lý tầng: ${Model.name} (${dataList.length} bản ghi)...`);

//     // 1. Khởi tạo Cache tra cứu trên RAM (Giữ nguyên chữ tự nhiên)
//     const existingRecords = await Model.findAll({
//         attributes: [idField, 'scientific_name'],
//         transaction: t
//     });

//     const recordMap = new Map();
//     existingRecords.forEach(r => {
//         if (r.scientific_name) {
//             recordMap.set(r.scientific_name, r[idField]);
//         }
//     });

//     const parentMap = new Map();
//     if (parentModel) {
//         const parents = await parentModel.findAll({
//             attributes: [parentKey, 'scientific_name'],
//             transaction: t
//         });
//         parents.forEach(p => {
//             if (p.scientific_name) {
//                 parentMap.set(p.scientific_name, p[parentKey]);
//             }
//         });
//     }

//     // Sử dụng Map tạm để gom nhóm dữ liệu đầu vào trên RAM, xử lý việc trùng lặp của tệp nguồn
//     const uniqueCreateMap = new Map();
//     const recordsToUpdate = [];
//     const associatedData = { images: [], names: [], common_names: [], parsed: [] };
//     const associatedDataToUpdate = { images: [], names: [], common_names: [], parsed: [] };

//     // 2. Duyệt qua danh sách bản ghi mới để phân tích
//     for (const item of dataList) {
//         const { parent, images, names, common_names, parsed, ...attributes } = item;

//         if (!attributes.scientific_name || attributes.scientific_name.trim() === '') {
//             statsObj.failed++;
//             continue;
//         }

//         const currentKey = attributes.scientific_name;
//         let existingId = recordMap.get(currentKey);

//         let parentId = null;
//             if (parentModel && parent && parent.scientific_name) {
//                 const pSciName = parent.scientific_name;
//                 parentId = pSciName ? parentMap.get(pSciName) : null

//                 if (!parentId && parent.scientific_name) {
//                     const newParent = await parentModel.create(parent, { transaction: t });
//                     parentId = newParent[parentKey];

//                     if (parent.scientific_name) {
//                         parentMap.set(parent.scientific_name, parentId);
//                     }
//                     statsObj.missing_parent++;
//                 }
//             }
//             else
//                 statsObj.not_existed_parent++;

//         if (existingId) {
//             // NẾU LÀ BẢN GHI ĐÃ CÓ TRONG DB: Đẩy vào mảng cập nhật thuộc tính
//             // Nếu tệp nguồn có nhiều dòng trùng ID này, dòng sau cùng sẽ push vào và ghi đè thuộc tính khi update
//             recordsToUpdate.push({ ...attributes, [idField]: existingId,
//                 ...(parentModel ? { [parentKey]: parentId } : {})
//              });
//             statsObj.existed++;
//             associatedDataToUpdate.images.push({ data: images, id_entity: existingId, rank: Model.name.toLowerCase() });
//             associatedDataToUpdate.names.push({ data: names, id_entity: existingId, rank: Model.name.toLowerCase() });
//             associatedDataToUpdate.common_names.push({ data: common_names, id_entity: existingId, rank: Model.name.toLowerCase() });
//             associatedDataToUpdate.parsed.push({ data: parsed, [idField]: existingId });
//         } else {
//             // NẾU LÀ BẢN GHI MỚI HOÀN TOÀN:
//             // 🎯 ĐIỂM CẢI TIẾN CỐT LÕI: Gom vào Map tạm thay vì mảng phẳng
//             // Nếu phía sau xuất hiện một phần tử trùng currentKey, nó sẽ đè bẹp (overwrite) phần tử trước.
//             // Điều này đảm bảo danh sách gửi xuống bulkCreate luôn duy nhất và là dữ liệu của bản ghi sau cùng.
//             uniqueCreateMap.set(currentKey, { ...attributes, [parentKey]: parentId });
//             statsObj.created++;

//             // Lưu trữ tạm phụ lục gắn liền với Key
//             if (images) associatedData.images.push({ data: images, key: currentKey });
//             if (names) associatedData.names.push({ data: names, key: currentKey });
//             if (common_names) associatedData.common_names.push({ data: common_names, key: currentKey });
//             if (parsed) associatedData.parsed.push({ data: parsed, key: currentKey });
//         }
//     }

//     // Chuyển đổi Map tạm thành mảng để thực hiện Bulk Insert
//     const recordsToCreate = Array.from(uniqueCreateMap.values());

//     // 3. Thực thi ghi dữ liệu lớn (Bulk Write)
//     // 3.1 Xử lý Cập nhật (Update) theo cụm 1000 dòng
//     if (recordsToUpdate.length > 0) {
//         const chunkSize = 1000;
//         for (let i = 0; i < recordsToUpdate.length; i += chunkSize) {
//             const chunk = recordsToUpdate.slice(i, i + chunkSize);
//             await Promise.all(chunk.map(item =>
//                 Model.update(item, { where: { [idField]: item[idField] }, transaction: t })
//             ));
//         }
//     if (associatedDataToUpdate.images.length > 0) {
//         await Promise.all(associatedDataToUpdate.images.map(item =>
//             TaxonomyImage.update(
//                 { data: item.data },
//                 { where: { id_entity: item.id_entity, rank: item.rank }, transaction: t }
//             )
//         ));
//     }
//     if (associatedDataToUpdate.names.length > 0) {
//         await Promise.all(associatedDataToUpdate.names.map(item =>
//             TaxonomyHistory.update(
//                 { data: item.data },
//                 { where: { id_entity: item.id_entity, rank: item.rank }, transaction: t }
//             )
//         ));
//     }
//     if (associatedDataToUpdate.common_names.length > 0) {
//         await Promise.all(associatedDataToUpdate.common_names.map(item =>
//             CommonName.update(
//                 { data: item.data },
//                 { where: { id_entity: item.id_entity, rank: item.rank }, transaction: t }
//             )
//         ));
//     }
//     if (associatedDataToUpdate.parsed.length > 0) {
//         await Promise.all(associatedDataToUpdate.parsed.map(item =>
//             HoSpeciesData.update(
//                 { data: item.data },
//                 { where: { [idField]: item[idField] }, transaction: t }
//             )
//         ));
//     }
//     }

//     // 3.2 Xử lý Thêm mới (Bulk Insert) bản ghi mới và map phụ lục
//     if (recordsToCreate.length > 0) {
//         const createdRecords = await Model.bulkCreate(recordsToCreate, { transaction: t, returning: true, individualHooks: true });

//         // Tạo map ánh xạ nhanh từ scientific_name -> ID vừa sinh ra
//         const newIdsMap = new Map(createdRecords.map(r => [r.scientific_name, r[idField]]));

//         // Đẩy phụ lục xuống
//         const finalImages = [];
//         associatedData.images.forEach(item => {
//             const entityId = newIdsMap.get(item.key);
//             if (entityId) item.data.forEach(img => finalImages.push({ ...img, id_entity: entityId, rank: Model.name.toLowerCase() }));
//         });
//         if (finalImages.length > 0) await TaxonomyImage.bulkCreate(finalImages, { transaction: t });

//         const finalNames = [];
//         associatedData.names.forEach(item => {
//             const entityId = newIdsMap.get(item.key);
//             if (entityId) item.data.forEach(n => finalNames.push({ ...n, id_entity: entityId, rank: Model.name.toLowerCase() }));
//         });
//         if (finalNames.length > 0) await TaxonomyHistory.bulkCreate(finalNames, { transaction: t });

//         const finalCommonNames = [];
//         associatedData.common_names.forEach(item => {
//             const entityId = newIdsMap.get(item.key);
//             if (entityId) item.data.forEach(cn => finalCommonNames.push({ ...cn, id_entity: entityId, rank: Model.name.toLowerCase() }));
//         });
//         if (finalCommonNames.length > 0) await CommonName.bulkCreate(finalCommonNames, { transaction: t });

//         const finalParsed = [];
//         associatedData.parsed.forEach(item => {
//             const entityId = newIdsMap.get(item.key);
//             if (entityId) finalParsed.push({ ...item.data, [idField]: entityId });
//         });
//         if (finalParsed.length > 0) await HoSpeciesData.bulkCreate(finalParsed, { transaction: t });
//     }
// };

//             // Thực thi tuần tự các tầng dữ liệu phân loại học
//             await processEntityOptimized(Genus, genusDatas, Family, 'family_id', stats.genera, 'genus_id');
//             await processEntityOptimized(Species, speciesDatas, Genus, 'genus_id', stats.species, 'species_id');
//             await processEntityOptimized(Variety, varietyDatas, Species, 'species_id', stats.varieties, 'variety_id');
//             await t.commit();
//             console.log("✅ Toàn bộ dữ liệu (bao gồm cả 11K Loài) đã seed thành công rực rỡ:", stats);
//         } catch (error) {
//             await t.rollback();
//             console.error("❌ Transaction failed, rolled back:", error);
//         }
//     } catch (error) {
//         console.error("❌ Lỗi kết nối CSDL hoặc khởi tạo cấu trúc bảng:", error);
//     }
// }

// if (process.argv[1] === fileURLToPath(import.meta.url)) {
//     await sequelize.authenticate();
//     console.log("✅ Database connected for seeding");
//     await sequelize.sync({ alter: true });
//     console.log("✅ Database synced for seeding");
//     await sequelize.query(`
//         ALTER TABLE "ho_species_data"
//         DROP CONSTRAINT IF EXISTS check_only_one_id_exists;

//         ALTER TABLE "ho_species_data"
//         ADD CONSTRAINT check_only_one_id_exists
//         CHECK (
//             ( (species_id IS NOT NULL)::integer +
//               (genus_id IS NOT NULL)::integer +
//               (variety_id IS NOT NULL)::integer ) = 1
//         );
//     `);
//     console.log("✅ Constraint check_only_one_id_exists đã được thêm vào ho_species_data");
//     seedDatabaseNewData().then(() => process.exit(0));

// }

import { fileURLToPath } from "url";
import {
  sequelize,
  Family,
  Genus,
  Species,
  Variety,
  HoSpeciesData,
  CommonName,
  TaxonomyHistory,
  TaxonomyImage,
} from "./models/index.js";
import { Op } from "sequelize";
import { speciesData } from "./data/index.js";
import fs from "fs";

async function seedDatabaseNewData() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected for seeding");
    await sequelize.sync({ alter: true });

    // Phân loại Data ban đầu
    const genusDatas = [];
    const speciesDatas = [];
    const varietyDatas = [];
    const item_invalid = [];

    const parsedPages = (item) => {
      const match = item.page_number
        ? item.page_number.match(/vol(\d+)_p(\d+)/i)
        : null;
      if (!match) return {};
      return {
        volume: parseInt(match[1], 10),
        page_number: parseInt(match[2], 10),
        image_filename: item.page_image ? item.page_image.trim() : null,
      };
    };

    for (const item of speciesData) {
      if (
        item.scientific_name &&
        item.scientific_name.trim() !== "" &&
        item.rank &&
        item.rank.trim() !== ""
      ) {
        let parsedMod = null;
        if (item.parsed) {
          parsedMod = { ...item.parsed, ...parsedPages(item) };
        }

        if (item.rank === "species" || item.rank === "subspecies") {
          speciesDatas.push({
            ...item,
            parsed: parsedMod,
            species_type: item.rank === "species" ? "Species" : "Subspecies",
          });
        } else if (item.rank === "genus") {
          genusDatas.push({ ...item, parsed: parsedMod });
        } else if (item.rank === "variety" || item.rank === "form") {
          varietyDatas.push({
            ...item,
            parsed: parsedMod,
            rank: item.rank === "variety" ? "Variety" : "Forma",
          });
        } else {
          item_invalid.push(item);
        }
      } else {
        item_invalid.push(item);
      }
    }

    // Lưu dữ liệu invalid
    const invalidFilePath = "data/invalid_species_data.json";
    fs.writeFileSync(invalidFilePath, JSON.stringify(item_invalid, null, 2));
    console.log(
      `✅ Đã lưu ${item_invalid.length} bản ghi không hợp lệ vào ${invalidFilePath}`,
    );

    const stats = {
      genera: {
        total: genusDatas.length,
        created: 0,
        existed: 0,
        failed: 0,
        missing_parent: 0,
        not_existed_parent: 0,
      },
      species: {
        total: speciesDatas.length,
        created: 0,
        existed: 0,
        failed: 0,
        missing_parent: 0,
        not_existed_parent: 0,
      },
      varieties: {
        total: varietyDatas.length,
        created: 0,
        existed: 0,
        failed: 0,
        missing_parent: 0,
        not_existed_parent: 0,
      },
    };

    const t = await sequelize.transaction();

    try {
      const processEntityOptimized = async (
        Model,
        dataList,
        parentModel,
        parentKey,
        statsObj,
        idField,
      ) => {
        if (!dataList || dataList.length === 0) return;

        const mergeUniqueCommonNames = (existingArray, newArray) => {
          if (!newArray || newArray.length === 0) return existingArray;
          const result = [...existingArray];
          const seenNames = new Set(
            result.map((cn) => (cn.name ? cn.name.trim().toLowerCase() : "")),
          );

          for (const cn of newArray) {
            if (cn.name) {
              const cleanName = cn.name.trim();
              const key = cleanName.toLowerCase();
              if (!seenNames.has(key) && cleanName !== "") {
                seenNames.add(key);
                result.push({ ...cn, name: cleanName });
              }
            }
          }
          return result;
        };

        console.log(
          `⏳ Đang xử lý tầng: ${Model.name} (${dataList.length} bản ghi nguyên thủy)...`,
        );

        // 1. Lấy Cache hiện tại trên Database
        const existingRecords = await Model.findAll({
          attributes: [idField, "scientific_name"],
          transaction: t,
        });
        const recordMap = new Map();
        existingRecords.forEach((r) => {
          if (r.scientific_name) recordMap.set(r.scientific_name, r[idField]);
        });

        const parentMap = new Map();
        if (parentModel) {
          const parents = await parentModel.findAll({
            attributes: [parentKey, "scientific_name"],
            transaction: t,
          });
          parents.forEach((p) => {
            if (p.scientific_name)
              parentMap.set(p.scientific_name, p[parentKey]);
          });
        }

        // 2. Gom nhóm & Lọc trùng (Deduplication & Merge Strategy)
        const groupedData = new Map();

        for (const item of dataList) {
          const currentKey = item.scientific_name;

          if (!groupedData.has(currentKey)) {
            groupedData.set(currentKey, {
              main: item,
              images: item.images ? [...item.images] : [],
              common_names: item.common_names
                ? mergeUniqueCommonNames([], item.common_names)
                : [],
              names: item.names ? [...item.names] : [],
              parsedItems: item.parsed ? [item.parsed] : [],
            });
          } else {
            const existing = groupedData.get(currentKey);

            // Yêu cầu 2: Model chính ghi đè lấy bản ghi cuối
            existing.main = item;

            // Yêu cầu 2.1: Gộp tất cả mảng của images và common_names
            if (item.images)
              existing.images = existing.images.concat(item.images);
            if (item.common_names)
              existing.common_names = mergeUniqueCommonNames(
                existing.common_names,
                item.common_names,
              );

            // Yêu cầu 2.1: names lấy cái của bản ghi cuối
            if (item.names) existing.names = [...item.names];

            // Yêu cầu 2.1: Push vào kho parsed để chọn lọc sau
            if (item.parsed) existing.parsedItems.push(item.parsed);
          }
        }

        // Hàm đánh giá và lấy parsed tốt nhất
        const getBestParsed = (parsedArray) => {
          if (!parsedArray || parsedArray.length === 0) return null;

          return parsedArray.reduce((best, current) => {
            const evaluate = (p) => {
              // 1. Check đủ 3 trường volume, page_number, image_filename
              const hasAllThree =
                p.volume != null &&
                p.page_number != null &&
                p.image_filename != null &&
                String(p.image_filename).trim() !== ""
                  ? 1
                  : 0;

              // 2. Đếm số lượng field không null / chuỗi rỗng và tính tổng độ dài chuỗi
              let fieldCount = 0;
              let totalLength = 0;
              for (const key in p) {
                const val = p[key];
                if (val !== null && val !== undefined && val !== "") {
                  if (Array.isArray(val) && val.length === 0) continue; // Bỏ qua mảng rỗng
                  fieldCount++;
                  totalLength +=
                    typeof val === "object"
                      ? JSON.stringify(val).length
                      : String(val).length;
                }
              }
              return { hasAllThree, fieldCount, totalLength };
            };

            const bestScore = evaluate(best);
            const currScore = evaluate(current);

            if (currScore.hasAllThree !== bestScore.hasAllThree) {
              return currScore.hasAllThree > bestScore.hasAllThree
                ? current
                : best;
            }
            if (currScore.fieldCount !== bestScore.fieldCount) {
              return currScore.fieldCount > bestScore.fieldCount
                ? current
                : best;
            }
            if (currScore.totalLength !== bestScore.totalLength) {
              return currScore.totalLength > bestScore.totalLength
                ? current
                : best;
            }
            return best; // Giữ cái đầu tiên nếu hòa nhau hoàn toàn
          });
        };

        const uniqueCreateMap = new Map();
        const recordsToUpdate = [];
        const associatedData = {
          images: [],
          names: [],
          common_names: [],
          parsed: [],
        };
        const associatedDataToUpdate = {
          images: [],
          names: [],
          common_names: [],
          parsed: [],
        };

        // 3. Chuẩn bị hàng đợi Update và Create
        for (const [scientificName, group] of groupedData.entries()) {
          const { main, images, common_names, names, parsedItems } = group;
          const {
            parent,
            images: _i,
            names: _n,
            common_names: _cn,
            parsed: _p,
            ...attributes
          } = main;

          let existingId = recordMap.get(scientificName);
          let parentId = null;

          if (parentModel && parent && parent.scientific_name) {
            const pSciName = parent.scientific_name;
            parentId = parentMap.get(pSciName);

            if (!parentId) {
              const newParent = await parentModel.create(parent, {
                transaction: t,
              });
              parentId = newParent[parentKey];
              parentMap.set(pSciName, parentId);
              statsObj.missing_parent++;
            }
          } else if (parentModel) {
            statsObj.not_existed_parent++;
          }

          const bestParsed = getBestParsed(parsedItems);

          if (existingId) {
            // NẾU LÀ BẢN GHI ĐÃ CÓ TRONG DB (Update)
            recordsToUpdate.push({
              ...attributes,
              [idField]: existingId,
              ...(parentModel ? { [parentKey]: parentId } : {}),
            });
            statsObj.existed++;
            if (images.length > 0)
              associatedDataToUpdate.images.push({
                data: images,
                id_entity: existingId,
                rank: Model.name.toLowerCase(),
              });
            if (names.length > 0)
              associatedDataToUpdate.names.push({
                data: names,
                id_entity: existingId,
                rank: Model.name.toLowerCase(),
              });
            if (common_names.length > 0)
              associatedDataToUpdate.common_names.push({
                data: common_names,
                id_entity: existingId,
                rank: Model.name.toLowerCase(),
              });
            if (bestParsed)
              associatedDataToUpdate.parsed.push({
                data: bestParsed,
                [idField]: existingId,
              });
          } else {
            // NẾU LÀ BẢN GHI MỚI HOÀN TOÀN (Create)
            uniqueCreateMap.set(scientificName, {
              ...attributes,
              [parentKey]: parentId,
            });
            statsObj.created++;
            if (images.length > 0)
              associatedData.images.push({ data: images, key: scientificName });
            if (names.length > 0)
              associatedData.names.push({ data: names, key: scientificName });
            if (common_names.length > 0)
              associatedData.common_names.push({
                data: common_names,
                key: scientificName,
              });
            if (bestParsed)
              associatedData.parsed.push({
                data: bestParsed,
                key: scientificName,
              });
          }
        }

        const recordsToCreate = Array.from(uniqueCreateMap.values());

        const applyPrimaryFlag = (cnArray) => {
          const seenLangs = new Set();
          return cnArray.map((cn) => {
            const lang = cn.lang || "unknown";
            const uniqueKey = `${cn.id_entity}_${cn.rank}_${lang}`;
            if (!seenLangs.has(uniqueKey)) {
              seenLangs.add(uniqueKey);
              return { ...cn, primary: true };
            }
            return { ...cn, primary: false };
          });
        };

        // 4. Thực thi ghi dữ liệu
        // 4.1 Xử lý Cập nhật (Update) - Tối ưu lại logic mảng 1-N tránh ghi sai cấu trúc
        if (recordsToUpdate.length > 0) {
          await Promise.all(
            recordsToUpdate.map((item) =>
              Model.update(item, {
                where: { [idField]: item[idField] },
                transaction: t,
              }),
            ),
          );

          // Với bảng 1-N, cách an toàn nhất khi Update là Xóa cũ và BulkCreate mới
          if (associatedDataToUpdate.images.length > 0) {
            const imagesToRecreate = [];
            for (const item of associatedDataToUpdate.images) {
              await TaxonomyImage.destroy({
                where: { id_entity: item.id_entity, rank: item.rank },
                transaction: t,
              });
              item.data.forEach((img) =>
                imagesToRecreate.push({
                  ...img,
                  id_entity: item.id_entity,
                  rank: item.rank,
                }),
              );
            }
            if (imagesToRecreate.length > 0)
              await TaxonomyImage.bulkCreate(imagesToRecreate, {
                transaction: t,
              });
          }

          if (associatedDataToUpdate.names.length > 0) {
            const namesToRecreate = [];
            for (const item of associatedDataToUpdate.names) {
              await TaxonomyHistory.destroy({
                where: { id_entity: item.id_entity, rank: item.rank },
                transaction: t,
              });
              item.data.forEach((n) =>
                namesToRecreate.push({
                  ...n,
                  id_entity: item.id_entity,
                  rank: item.rank,
                }),
              );
            }
            if (namesToRecreate.length > 0)
              await TaxonomyHistory.bulkCreate(namesToRecreate, {
                transaction: t,
              });
          }

          if (associatedDataToUpdate.common_names.length > 0) {
            const cNamesToRecreate = [];
            associatedDataToUpdate.common_names = applyPrimaryFlag(
              associatedDataToUpdate.common_names,
            );
            for (const item of associatedDataToUpdate.common_names) {
              await CommonName.destroy({
                where: { id_entity: item.id_entity, rank: item.rank },
                transaction: t,
              });
              item.data.forEach((cn) =>
                cNamesToRecreate.push({
                  ...cn,
                  id_entity: item.id_entity,
                  rank: item.rank,
                }),
              );
            }
            if (cNamesToRecreate.length > 0)
              await CommonName.bulkCreate(cNamesToRecreate, { transaction: t });
          }

          if (associatedDataToUpdate.parsed.length > 0) {
            await Promise.all(
              associatedDataToUpdate.parsed.map(async (item) => {
                // Cập nhật bằng cách rải item.data (chứa các fields) thay vì object { data: ... }
                const existing = await HoSpeciesData.findOne({
                  where: { [idField]: item[idField] },
                  transaction: t,
                });
                if (existing) {
                  return HoSpeciesData.update(item.data, {
                    where: { [idField]: item[idField] },
                    transaction: t,
                  });
                } else {
                  return HoSpeciesData.create(
                    { ...item.data, [idField]: item[idField] },
                    { transaction: t },
                  );
                }
              }),
            );
          }
        }

        // 4.2 Xử lý Thêm mới (Bulk Insert)
        if (recordsToCreate.length > 0) {
          const createdRecords = await Model.bulkCreate(recordsToCreate, {
            transaction: t,
            returning: true,
            individualHooks: true,
          });
          const newIdsMap = new Map(
            createdRecords.map((r) => [r.scientific_name, r[idField]]),
          );

          const finalImages = [];
          associatedData.images.forEach((item) => {
            const entityId = newIdsMap.get(item.key);
            if (entityId)
              item.data.forEach((img) =>
                finalImages.push({
                  ...img,
                  id_entity: entityId,
                  rank: Model.name.toLowerCase(),
                }),
              );
          });
          if (finalImages.length > 0)
            await TaxonomyImage.bulkCreate(finalImages, { transaction: t });

          const finalNames = [];
          associatedData.names.forEach((item) => {
            const entityId = newIdsMap.get(item.key);
            if (entityId)
              item.data.forEach((n) =>
                finalNames.push({
                  ...n,
                  id_entity: entityId,
                  rank: Model.name.toLowerCase(),
                }),
              );
          });
          if (finalNames.length > 0)
            await TaxonomyHistory.bulkCreate(finalNames, { transaction: t });

          const finalCommonNames = [];
          associatedData.common_names = applyPrimaryFlag(
            associatedData.common_names,
          );
          associatedData.common_names.forEach((item) => {
            const entityId = newIdsMap.get(item.key);
            if (entityId)
              item.data.forEach((cn) =>
                finalCommonNames.push({
                  ...cn,
                  id_entity: entityId,
                  rank: Model.name.toLowerCase(),
                }),
              );
          });
          if (finalCommonNames.length > 0)
            await CommonName.bulkCreate(finalCommonNames, { transaction: t });

          const finalParsed = [];
          associatedData.parsed.forEach((item) => {
            const entityId = newIdsMap.get(item.key);
            if (entityId)
              finalParsed.push({ ...item.data, [idField]: entityId });
          });
          if (finalParsed.length > 0)
            await HoSpeciesData.bulkCreate(finalParsed, { transaction: t });
        }
      };

      // Thực thi tuần tự các tầng dữ liệu
      await processEntityOptimized(
        Genus,
        genusDatas,
        Family,
        "family_id",
        stats.genera,
        "genus_id",
      );
      await processEntityOptimized(
        Species,
        speciesDatas,
        Genus,
        "genus_id",
        stats.species,
        "species_id",
      );
      await processEntityOptimized(
        Variety,
        varietyDatas,
        Species,
        "species_id",
        stats.varieties,
        "variety_id",
      );

      await t.commit();
      console.log(
        "✅ Toàn bộ dữ liệu (bao gồm cả các Loài đã gộp trùng) đã seed thành công rực rỡ:",
        stats,
      );
    } catch (error) {
      await t.rollback();
      console.error("❌ Transaction failed, rolled back:", error);
    }
  } catch (error) {
    console.error("❌ Lỗi kết nối CSDL hoặc khởi tạo cấu trúc bảng:", error);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await sequelize.authenticate();
  console.log("✅ Database connected for seeding");
  await sequelize.sync({ alter: true });
  console.log("✅ Database synced for seeding");

  await sequelize.query(`
        ALTER TABLE "ho_species_data" 
        DROP CONSTRAINT IF EXISTS check_only_one_id_exists;
        
        ALTER TABLE "ho_species_data" 
        ADD CONSTRAINT check_only_one_id_exists 
        CHECK (
            ( (species_id IS NOT NULL)::integer + 
              (genus_id IS NOT NULL)::integer + 
              (variety_id IS NOT NULL)::integer ) = 1
        );
    `);
  console.log(
    "✅ Constraint check_only_one_id_exists đã được thêm vào ho_species_data",
  );

  // seedDatabaseNewData().then(() => process.exit(0));
}
