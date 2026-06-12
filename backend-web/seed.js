// import { fileURLToPath } from "url";
// import {
//     sequelize,
//     Account,
//     Province,
//     Phylum,
//     Class,
//     Order,
//     Family,
//     Genus,
//     Species,
//     Variety,
//     MorphologyLeaf,
//     MorphologyStem,
//     MorphologyFlower,
//     Distribution,
//     HoSpeciesData,
//     CommonName,
//     TaxonomyHistory,
//     TaxonomyImage
// } from "./models/index.js";
// import { Op } from 'sequelize';
// import { phylumData, classData, orderData,
//     familyData, genusData} from "./data/index.js";
// // import { provincesData, plantData } from "./data/index.js";

// async function seedDatabaseNewData() {
//     try {
//         await sequelize.authenticate();
//         console.log("✅ Database connected for seeding");
//         await sequelize.sync({ alter: true });

//         const stats = {
//             phyla: { total: phylumData.length, created: 0, existed: 0, failed: 0, missing_parent: 0, not_existed_parent: 0 },
//             classes: { total: classData.length, created: 0, existed: 0, failed: 0, missing_parent: 0, not_existed_parent: 0 },
//             orders: { total: orderData.length, created: 0, existed: 0, failed: 0, missing_parent: 0, not_existed_parent: 0 },
//             families: { total: familyData.length, created: 0, existed: 0, failed: 0, missing_parent: 0 ,not_existed_parent: 0},
//             genera: { total: genusData.length, created: 0, existed: 0, failed: 0, missing_parent: 0, not_existed_parent: 0 },
//         };

//         const t = await sequelize.transaction();

//         try {
//             const processEntityOptimized = async (Model, dataList, parentModel, parentKey, statsObj, idField) => {
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
//             recordMap.set(r.scientific_name, r[idField]); // Không lowercase
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

//     // 2. Duyệt qua danh sách bản ghi mới để phân tích
//     for (const item of dataList) {
//         const { parent, images, names, common_names, parsed, ...attributes } = item;

//         if ((!attributes.scientific_name || attributes.scientific_name.trim() === '') && attributes.canonical_name && attributes.canonical_name.trim() !== '') {
//             attributes.scientific_name = attributes.canonical_name;
//         }

//         if (!attributes.scientific_name || attributes.scientific_name.trim() === '') {
//             statsObj.failed++;
//             continue;
//         }

//         const currentKey = attributes.scientific_name;
//         let existingId = recordMap.get(currentKey);

//         if (!existingId && attributes.canonical_name && attributes.canonical_name.trim() !== '') {
//             existingId = recordMap.get(attributes.canonical_name);
//         }

//         let parentId = null;
//             if (parentModel && parent) {
//                 const pSciName = parent.scientific_name;
//                 const pCanName = parent.canonical_name;
//                 parentId = (pSciName ? parentMap.get(pSciName) : null) || (pCanName ? parentMap.get(pCanName) : null) || null;

//                 if (!parentId && (parent.scientific_name || parent.canonical_name)) {
//                     if ((!parent.scientific_name || parent.scientific_name.trim() === '') && parent.canonical_name && parent.canonical_name.trim() !== '') {
//                         parent.scientific_name = parent.canonical_name;
//                     }
//                     const newParent = await parentModel.create(parent, { transaction: t });
//                     parentId = newParent[parentKey];

//                     if (parent.scientific_name) {
//                         parentMap.set(parent.scientific_name, parentId);
//                     }
//                     statsObj.missing_parent++;
//                 }
//             }

//             if (parentModel && !parent) {
//                 statsObj.not_existed_parent++;
//             }

//         if (existingId) {
//             // NẾU LÀ BẢN GHI ĐÃ CÓ TRONG DB: Đẩy vào mảng cập nhật thuộc tính
//             // Nếu tệp nguồn có nhiều dòng trùng ID này, dòng sau cùng sẽ push vào và ghi đè thuộc tính khi update
//             recordsToUpdate.push({ ...attributes, [idField]: existingId,
//                 ...(parentModel ? { [parentKey]: parentId } : {})
//              });
//             statsObj.existed++;
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
//             if (entityId) finalParsed.push({ ...item.data, species_id: entityId });
//         });
//         if (finalParsed.length > 0) await HoSpeciesData.bulkCreate(finalParsed, { transaction: t });
//     }
// };

//             // Thực thi tuần tự các tầng dữ liệu phân loại học
//             await processEntityOptimized(Phylum, phylumData, null, null, stats.phyla, 'phylum_id');
//             await processEntityOptimized(Class, classData, Phylum, 'phylum_id', stats.classes, 'class_id');
//             await processEntityOptimized(Order, orderData, Class, 'class_id', stats.orders, 'order_id');
//             await processEntityOptimized(Family, familyData, Order, 'order_id', stats.families, 'family_id');
//             await processEntityOptimized(Genus, genusData, Family, 'family_id', stats.genera, 'genus_id');

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
//     // seedDatabaseNewData().then(() => process.exit(0));
//     await sequelize.authenticate();
//     console.log("✅ Database connected for seeding");
//     await sequelize.sync({ alter: true });
//     console.log("✅ Database synced for seeding");

// }

// async function seedDatabase() {
//     try {
//         await sequelize.authenticate();
//         console.log("✅ Database connected for seeding");

//         await sequelize.sync({ "alter": true });
//         // await sequelize.sync();
//         console.log("✅ Database synced for seeding");

//         // =====================================
//         // 1. TẠO TÀI KHOẢN ADMIN
//         // =====================================
//         console.log("\n⏳ Đang kiểm tra tài khoản admin...");
//         const [adminRecord, adminCreated] = await Account.findOrCreate({
//             where: { username: 'admin' },
//             defaults: {
//                 username: 'admin',
//                 email: 'admin@system.com',
//                 password_hash: '123456',
//                 role: 'admin',
//                 full_name: 'Admin Full Name',
//                 status: 'active',
//             }
//         });
//         if (adminCreated) console.log("✅ Tạo tài khoản admin thành công");
//         else console.log("⏩ Tài khoản admin đã tồn tại");

//         // =====================================
//         // OBJECT THỐNG KÊ (STATS TRACKING)
//         // =====================================
//         const stats = {
//             provinces: { total: provincesData.length, created: 0, existed: 0, failed: 0 },
//             families: { total: plantData.length, created: 0, existed: 0, failed: 0 },
//             genera: { total: plantData.length, created: 0, existed: 0, failed: 0 },
//             species: { total: plantData.length, created: 0, existed: 0, failed: 0 },
//             varieties: { total: 0, created: 0, existed: 0, failed: 0 },
//             distributions: { total: 0, created: 0, existed: 0, skipped: 0 } // skipped: Tỉnh không khớp
//         };

//         // Tính toán trước tổng số varieties và distributions có trong JSON
//         plantData.forEach(item => {
//             if (item.varieties) {
//                 stats.varieties.total += item.varieties.length;
//                 item.varieties.forEach(v => {
//                     if (v.distributions) stats.distributions.total += v.distributions.length;
//                 });
//             }
//         });

//         console.log(`\n⏳ Bắt đầu nạp dữ liệu mẫu... (Tổng JSON: ${stats.families.total} Họ, ${stats.varieties.total} Thứ/Giống)`);

//         const t = process.env.ENABLE_TRANSACTION === 'true' ? await sequelize.transaction() : null;
//         let currentOperation = "Khởi tạo"; // Biến lưu vết thao tác đang chạy để báo lỗi

//         try {
//             // =====================================
//             // 2. NẠP DỮ LIỆU TỈNH THÀNH (PROVINCES)
//             // =====================================
//             for (const p of provincesData) {
//                 currentOperation = `Nạp tỉnh/thành: ${p.province_name}`;
//                 const [record, created] = await Province.findOrCreate({
//                     where: { province_name: p.province_name, country: p.country },
//                     defaults: p,
//                     transaction: t
//                 });
//                 if (created) stats.provinces.created++;
//                 else stats.provinces.existed++;
//             }

//             // =====================================
//             // 3. NẠP DỮ LIỆU THỰC VẬT THEO CẤP BẬC
//             // =====================================
//             for (const item of plantData) {
//                 // 3.1 Nạp Họ (Family)
//                 currentOperation = `Nạp Họ (Family): ${item.family.scientific_name}`;
//                 const [familyRecord, familyCreated] = await Family.findOrCreate({
//                     where: { scientific_name: item.family.scientific_name },
//                     defaults: item.family,
//                     transaction: t
//                 });
//                 if (familyCreated) stats.families.created++;
//                 else stats.families.existed++;

//                 // 3.2 Nạp Chi (Genus)
//                 currentOperation = `Nạp Chi (Genus): ${item.genus.scientific_name}`;
//                 const [genusRecord, genusCreated] = await Genus.findOrCreate({
//                     where: { scientific_name: item.genus.scientific_name },
//                     defaults: { ...item.genus, family_id: familyRecord.family_id },
//                     transaction: t
//                 });
//                 if (genusCreated) stats.genera.created++;
//                 else stats.genera.existed++;

//                 // 3.3 Nạp Loài (Species)
//                 currentOperation = `Nạp Loài (Species): ${item.species.scientific_name}`;
//                 const [speciesRecord, speciesCreated] = await Species.findOrCreate({
//                     where: { scientific_name: item.species.scientific_name },
//                     defaults: { ...item.species, genus_id: genusRecord.genus_id },
//                     transaction: t
//                 });
//                 if (speciesCreated) stats.species.created++;
//                 else stats.species.existed++;

//                 // 3.4 Nạp Thứ/Giống (Variety)
//                 if (item.varieties && item.varieties.length > 0) {
//                     for (const v of item.varieties) {
//                         currentOperation = `Nạp Giống (Variety): ${v.common_name}`;
//                         const { morphology_leaf, morphology_stem, morphology_flower, distributions, ...varietyFields } = v;

//                         const [varietyRecord, varietyCreated] = await Variety.findOrCreate({
//                             where: { common_name: varietyFields.common_name, species_id: speciesRecord.species_id },
//                             defaults: { ...varietyFields, species_id: speciesRecord.species_id },
//                             transaction: t
//                         });

//                         if (varietyCreated) stats.varieties.created++;
//                         else stats.varieties.existed++;

//                         const varietyId = varietyRecord.variety_id;

//                         // --- Hình thái Lá ---
//                         if (morphology_leaf) {
//                             currentOperation = `Nạp Hình thái Lá cho: ${v.common_name}`;
//                             await MorphologyLeaf.findOrCreate({
//                                 where: { variety_id: varietyId },
//                                 defaults: { ...morphology_leaf, variety_id: varietyId },
//                                 transaction: t
//                             });
//                         }

//                         // --- Hình thái Thân ---
//                         if (morphology_stem) {
//                             currentOperation = `Nạp Hình thái Thân cho: ${v.common_name}`;
//                             await MorphologyStem.findOrCreate({
//                                 where: { variety_id: varietyId },
//                                 defaults: { ...morphology_stem, variety_id: varietyId },
//                                 transaction: t
//                             });
//                         }

//                         // --- Hình thái Hoa ---
//                         if (morphology_flower) {
//                             currentOperation = `Nạp Hình thái Hoa cho: ${v.common_name}`;
//                             await MorphologyFlower.findOrCreate({
//                                 where: { variety_id: varietyId },
//                                 defaults: { ...morphology_flower, variety_id: varietyId },
//                                 transaction: t
//                             });
//                         }

//                         // --- Khu vực Phân bố ---
//                         if (distributions && distributions.length > 0) {
//                             for (const dist of distributions) {
//                                 currentOperation = `Tìm tỉnh ${dist.province_name} để thêm phân bố cho ${v.common_name}`;

//                                 const provinceRecord = await Province.findOne({
//                                     where: { province_name: dist.province_name },
//                                     transaction: t
//                                 });

//                                 if (provinceRecord) {
//                                     currentOperation = `Nạp Phân bố: ${dist.province_name} - ${v.common_name}`;
//                                     const [distRecord, distCreated] = await Distribution.findOrCreate({
//                                         where: {
//                                             variety_id: varietyId,
//                                             province_id: provinceRecord.province_id,
//                                             status: dist.status
//                                         },
//                                         defaults: { description: dist.description },
//                                         transaction: t
//                                     });
//                                     if (distCreated) stats.distributions.created++;
//                                     else stats.distributions.existed++;
//                                 } else {
//                                     console.warn(`⚠️ CẢNH BÁO: Bỏ qua phân bố. Không tìm thấy tỉnh "${dist.province_name}" trong DB (Loài: ${v.common_name}).`);
//                                     stats.distributions.skipped++;
//                                 }
//                             }
//                         }
//                     }
//                 }
//             }

//             if (t) await t.commit();
//             console.log("\n🎉 TOÀN BỘ DỮ LIỆU ĐÃ ĐƯỢC SEED THÀNH CÔNG!\n");

//             // In bảng thống kê đẹp mắt ra console
//             console.log("📊 BẢNG THỐNG KÊ KẾT QUẢ NẠP DỮ LIỆU:");
//             console.table(stats);

//         } catch (seedErr) {
//             if (t) await t.rollback();
//             console.error("\n❌ LỖI NGHIÊM TRỌNG TRONG QUÁ TRÌNH NẠP DỮ LIỆU!");
//             console.error(`📍 Vị trí lỗi (Đang xử lý): ${currentOperation}`);
//             console.error(`🔍 Chi tiết mã lỗi:`, seedErr.message || seedErr);
//             // Có thể in thêm seedErr.errors nếu lỗi liên quan đến Validation của Sequelize
//             if (seedErr.errors) {
//                 seedErr.errors.forEach(e => console.error(`   - ${e.message}`));
//             }
//             console.log("\n⚠️ Toàn bộ dữ liệu trong phiên này đã được Rollback (hoàn tác).\n");
//         }

//     } catch (error) {
//         console.error("❌ Lỗi kết nối CSDL hoặc khởi tạo cấu trúc bảng:", error);
//     }
// }

// // Chạy trực tiếp nếu file này được thực thi bằng lệnh 'node seed.js'
// if (process.argv[1] === fileURLToPath(import.meta.url)) {
//     seedDatabase().then(() => process.exit(0));
//     // await sequelize.sync({"alter":true});
// }

// export default seedDatabase;

import { fileURLToPath } from "url";
import {
  sequelize,
  Account,
  Phylum,
  Class,
  Order,
  Family,
  Genus,
  CommonName,
  TaxonomyHistory,
  TaxonomyImage,
} from "./models/index.js";
import { Op } from "sequelize";
import {
  phylumData,
  classData,
  orderData,
  familyData,
  genusData,
} from "./data/index.js";

async function seedDatabaseNewData() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected for seeding");
    await sequelize.sync({ alter: true });

    const stats = {
      phyla: {
        total: phylumData.length,
        created: 0,
        existed: 0,
        failed: 0,
        missing_parent: 0,
        not_existed_parent: 0,
      },
      classes: {
        total: classData.length,
        created: 0,
        existed: 0,
        failed: 0,
        missing_parent: 0,
        not_existed_parent: 0,
      },
      orders: {
        total: orderData.length,
        created: 0,
        existed: 0,
        failed: 0,
        missing_parent: 0,
        not_existed_parent: 0,
      },
      families: {
        total: familyData.length,
        created: 0,
        existed: 0,
        failed: 0,
        missing_parent: 0,
        not_existed_parent: 0,
      },
      genera: {
        total: genusData.length,
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

        // 1. Khởi tạo Cache tra cứu trên RAM
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

        // 2. Gom nhóm dữ liệu đầu vào (Deduplication & Merge)
        const groupedData = new Map();

        for (const item of dataList) {
          let { parent, images, names, common_names, ...attributes } = item;

          if (
            !attributes.scientific_name ||
            attributes.scientific_name.trim() === ""
          ) {
            statsObj.failed++;
            continue;
          }

          const currentKey = attributes.scientific_name;

          if (!groupedData.has(currentKey)) {
            groupedData.set(currentKey, {
              main: { ...attributes, parent },
              images: images ? [...images] : [],
              common_names: common_names
                ? mergeUniqueCommonNames([], common_names)
                : [],
              names: names ? [...names] : [],
            });
          } else {
            const existing = groupedData.get(currentKey);
            // Ghi đè thông tin chính theo bản ghi cuối cùng
            existing.main = { ...attributes, parent };
            // Gộp mảng images và common_names
            if (images) existing.images = existing.images.concat(images);
            if (common_names)
              existing.common_names = mergeUniqueCommonNames(
                existing.common_names,
                common_names,
              );
            // Ghi đè mảng names theo bản ghi cuối cùng
            if (names) existing.names = [...names];
          }
        }

        const uniqueCreateMap = new Map();
        const recordsToUpdate = [];
        const associatedData = { images: [], names: [], common_names: [] };
        const associatedDataToUpdate = {
          images: [],
          names: [],
          common_names: [],
        };

        // 3. Phân loại Update / Create từ danh sách đã gom nhóm
        for (const [scientificName, group] of groupedData.entries()) {
          const { main, images, common_names, names } = group;
          const { parent, ...attributes } = main;

          let existingId = recordMap.get(scientificName);

          let parentId = null;
          if (parentModel && parent && parent.scientific_name) {
            const pSciName = parent.scientific_name;
            parentId = pSciName ? parentMap.get(pSciName) : null;

            if (!parentId) {
              const newParent = await parentModel.create(parent, {
                transaction: t,
              });
              parentId = newParent[parentKey];

              if (parent.scientific_name)
                parentMap.set(parent.scientific_name, parentId);
              statsObj.missing_parent++;
            }
          }

          if (parentModel && !parent) statsObj.not_existed_parent++;

          if (existingId) {
            // BẢN GHI ĐÃ TỒN TẠI -> Chuẩn bị cập nhật
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
          } else {
            // BẢN GHI MỚI HOÀN TOÀN -> Chuẩn bị tạo mới
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
          }
        }

        const recordsToCreate = Array.from(uniqueCreateMap.values());

        // Hàm hỗ trợ lọc set cờ primary cho common_names
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

        // 4. Thực thi DB
        // 4.1 Update
        if (recordsToUpdate.length > 0) {
          await Promise.all(
            recordsToUpdate.map((item) =>
              Model.update(item, {
                where: { [idField]: item[idField] },
                transaction: t,
              }),
            ),
          );

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
            let cNamesToRecreate = [];
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
            // Xử lý cờ primary trước khi insert
            cNamesToRecreate = applyPrimaryFlag(cNamesToRecreate);
            if (cNamesToRecreate.length > 0)
              await CommonName.bulkCreate(cNamesToRecreate, { transaction: t });
          }
        }

        // 4.2 Create mới
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

          let finalCommonNames = [];
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
          // Xử lý cờ primary trước khi insert
          finalCommonNames = applyPrimaryFlag(finalCommonNames);
          if (finalCommonNames.length > 0)
            await CommonName.bulkCreate(finalCommonNames, { transaction: t });
        }
      };

      // Thực thi tuần tự các tầng dữ liệu phân loại học
      await processEntityOptimized(
        Phylum,
        phylumData,
        null,
        null,
        stats.phyla,
        "phylum_id",
      );
      await processEntityOptimized(
        Class,
        classData,
        Phylum,
        "phylum_id",
        stats.classes,
        "class_id",
      );
      await processEntityOptimized(
        Order,
        orderData,
        Class,
        "class_id",
        stats.orders,
        "order_id",
      );
      await processEntityOptimized(
        Family,
        familyData,
        Order,
        "order_id",
        stats.families,
        "family_id",
      );
      await processEntityOptimized(
        Genus,
        genusData,
        Family,
        "family_id",
        stats.genera,
        "genus_id",
      );

      await t.commit();
      console.log("✅ Toàn bộ dữ liệu đã seed thành công rực rỡ:", stats);
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
  seedDatabaseNewData().then(() => process.exit(0));
}
