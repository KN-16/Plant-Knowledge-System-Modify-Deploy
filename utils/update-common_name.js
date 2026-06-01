import { sequelize, CommonName } from "../models/index.js";
import { Phylum, Class, Order, Family, Genus, Species } from "../models/index.js";
import { familyDataInput, genusDataInput, speciesDataInput } from "../data/index.js";

async function runTaxonomyMetadataTasks() {
    try {
        await sequelize.authenticate();
        console.log("✅ Kết nối CSDL thành công. Bắt đầu thực hiện 2 Task...");

        const t = await sequelize.transaction();

        try {
            // =================================================================
            // TASK 1: CẬP NHẬT PRIMARY CHO BỘ BA (id_entity, lang, rank)
            // =================================================================
            console.log("\n⏳ [TASK 1] Đang quét và thiết lập tên Primary...");

            // 1. Reset toàn bộ primary về false trước để đảm bảo tính nhất quán dữ liệu sạch
            await CommonName.update({ primary: false }, { where: {}, transaction: t });

            // 2. Lấy toàn bộ danh sách common_names lên RAM, sắp xếp theo ID tăng dần (để bốc cái đầu tiên)
            const allCommonNames = await CommonName.findAll({
                attributes: ['id', 'id_entity', 'lang', 'rank'],
                order: [['id', 'ASC']],
                transaction: t
            });

            // Sử dụng Set để ghi nhớ những bộ ba (id_entity + lang + rank) nào đã được xử lý
            const processedGroupSet = new Set();
            const idsToSetPrimary = [];

            allCommonNames.forEach(item => {
                // Tạo một chuỗi định danh duy nhất cho bộ 3
                const groupKey = `${item.id_entity}_${item.lang}_${item.rank}`;

                // Nếu bộ 3 này chưa từng xuất hiện -> Đây chính là bản ghi đầu tiên!
                if (!processedGroupSet.has(groupKey)) {
                    processedGroupSet.add(groupKey);
                    idsToSetPrimary.push(item.id); // Lưu lại ID để update
                }
            });

            // 3. Cập nhật Primary = true theo cụm (Chunking 1000 dòng) cho các bản ghi đầu tiên
            if (idsToSetPrimary.length > 0) {
                console.log(`🚀 Đang thiết lập primary=true cho ${idsToSetPrimary.length} bộ tên phổ biến đầu tiên...`);
                const chunkSize = 1000;
                for (let i = 0; i < idsToSetPrimary.length; i += chunkSize) {
                    const chunk = idsToSetPrimary.slice(i, i + chunkSize);
                    await CommonName.update(
                        { primary: true },
                        { where: { id: chunk }, transaction: t }
                    );
                }
            }
            console.log("✅ [TASK 1] Hoàn thành cập nhật Primary!");

            // =================================================================
            // TASK 2: BỔ SUNG VIETNAMESE NAME BỊ MẤT CHO HỌ, CHI, LOÀI CŨ
            // =================================================================
            console.log("\n⏳ [TASK 2] Bắt đầu rà soát bổ sung Vietnamese Name bị khuyết...");

            // Cấu hình các mục cần quét ứng với 3 biến mảng dữ liệu đầu vào của bạn
            const task2Configs = [
                { dataInput: familyDataInput, Model: Family, rank: 'family', idField: 'family_id' },
                { dataInput: genusDataInput, Model: Genus, rank: 'genus', idField: 'genus_id' },
                { dataInput: speciesDataInput, Model: Species, rank: 'species', idField: 'species_id' }
            ];

            const commonNamesToInsert = [];

            for (const config of task2Configs) {
                if (!config.dataInput || config.dataInput.length === 0) continue;

                console.log(`Processing bổ sung cho tầng: ${config.rank}...`);

                // 1. Tải toàn bộ bảng phân loại hiện tại lên RAM làm cổng đối chiếu ID (Giữ nguyên chữ tự nhiên gốc)
                const currentRecords = await config.Model.findAll({
                    attributes: [config.idField, 'scientific_name', 'canonical_name'],
                    transaction: t
                });

                // Tạo 2 Map tra cứu nhanh từ tên -> ID hệ thống
                const sciToIdMap = new Map();
                const canToIdMap = new Map();

                currentRecords.forEach(r => {
                    if (r.scientific_name) sciToIdMap.set(r.scientific_name, r[config.idField]);
                    if (r.canonical_name) canToIdMap.set(r.canonical_name, r[config.idField]);
                });

                // 2. Tải toàn bộ common_names hiện tại của rank này lên RAM để check xem đã có data tiếng Việt (vie) chưa
                const existingCommonNames = await CommonName.findAll({
                    where: { rank: config.rank, lang: 'vie' },
                    attributes: ['id_entity'],
                    transaction: t
                });
                // Set lưu các id_entity đã có sẵn tên tiếng Việt
                const existingVieEntities = new Set(existingCommonNames.map(cn => cn.id_entity));

                // 3. Quét qua danh sách mảng dữ liệu đầu vào của bạn
                config.dataInput.forEach(item => {
                    if (!item.scientificName || !item.vietnameseName) return;

                    const searchKey = item.scientificName;
                    // Dò tìm ID thực thể bằng cách so khớp với cả cột scientific_name lẫn canonical_name
                    const entityId = sciToIdMap.get(searchKey) || canToIdMap.get(searchKey) || null;

                    if (entityId) {
                        // Nếu ID này CHƯA từng có bản ghi nào trong bảng common_names mang lang='vie'
                        if (!existingVieEntities.has(entityId)) {
                            commonNamesToInsert.push({
                                id_entity: entityId,
                                name: item.vietnameseName,
                                rank: config.rank,
                                lang: 'vie',
                                primary: true // Bổ sung mới tinh nên đặt làm primary luôn
                            });

                            // Đánh dấu vào Set tạm thời để tránh lặp lại nếu dữ liệu đầu vào bị trùng dòng
                            existingVieEntities.add(entityId);
                        }
                    } else {
                        console.warn(`⚠️ Cảnh báo: Không tìm thấy thực thể trong DB ứng với tên mã gốc [${item.scientificName}]`);
                    }
                });
            }

            // 4. Thực thi bulkCreate nạp toàn bộ các tên tiếng Việt bị khuyết xuống DB một lần duy nhất
            if (commonNamesToInsert.length > 0) {
                console.log(`🚀 Tiến hành Bulk Insert ${commonNamesToInsert.length} bản ghi tên tiếng Việt bổ sung...`);
                await CommonName.bulkCreate(commonNamesToInsert, { transaction: t });
            } else {
                console.log("⏩ Không có dữ liệu khuyết thiếu nào cần bổ sung.");
            }

            console.log("✅ [TASK 2] Hoàn thành bổ sung Vietnamese Name!");

            // Đóng Transaction thành công
            await t.commit();
            console.log("\n🎉 [THÀNH CÔNG] Toàn bộ 2 task tối ưu đã được đồng bộ hoàn tất!");

        } catch (error) {
            await t.rollback();
            console.error("❌ Gặp lỗi nghiêm trọng, hệ thống tự động hoàn tác (Rollback):", error);
        }

    } catch (error) {
        console.error("❌ Không thể khởi động kết nối CSDL:", error);
    } finally {
        process.exit(0);
    }
}

// Kích hoạt tiến trình
runTaxonomyMetadataTasks();