import { fileURLToPath } from "url";
import { 
    sequelize, Phylum, Class, Order, Family, Genus, Species 
} from "../models/index.js";
import { 
    phylumData, classData, orderData, familyData, genusData, speciesData 
} from "../data/index.js";

async function updateIsRecordedInVietnam() {
    try {
        await sequelize.authenticate();
        console.log("✅ Database connected successfully.");
        
        // 1. Thực hiện alter true cấu trúc bảng để bổ sung cột mới cập nhật từ file Taxonomy.js
        console.log("⏳ Đang đồng bộ cấu trúc bảng (sequelize.sync alter: true)...");
        await sequelize.sync({ alter: true });
        console.log("✅ Đồng bộ cấu trúc mới hoàn tất.");

        // Khởi tạo bảng thống kê kết quả cho từng tầng
        const stats = {
            phyla: { total_data: phylumData.length, updated: 0, not_found: 0 },
            classes: { total_data: classData.length, updated: 0, not_found: 0 },
            orders: { total_data: orderData.length, updated: 0, not_found: 0 },
            families: { total_data: familyData.length, updated: 0, not_found: 0 },
            genera: { total_data: genusData.length, updated: 0, not_found: 0 },
            species: { total_data: speciesData.length, updated: 0, not_found: 0 }
        };

        const t = await sequelize.transaction();

        try {
            // Hàm helper xử lý cập nhật trạng thái bằng thuật toán RAM Cache tối ưu
            const processUpdateStatus = async (Model, dataList, statsObj, idField) => {
                if (!dataList || dataList.length === 0) return;

                console.log(`⏳ Đang rà soát dữ liệu tầng: ${Model.name}...`);

                // Tải danh mục hiện tại trong DB lên bộ nhớ đệm RAM (Giữ nguyên chuỗi gốc tự nhiên)
                const currentRecords = await Model.findAll({
                    attributes: [idField, 'scientific_name'],
                    transaction: t
                });

                // Xây dựng 2 cổng tra cứu nhanh theo chuỗi thô nguyên bản
                const sciToIdMap = new Map();

                currentRecords.forEach(r => {
                    if (r.scientific_name) sciToIdMap.set(r.scientific_name, r[idField]);
                });

                const updatesToExecute = [];

                // Duyệt tệp nguồn seed data
                for (const item of dataList) {
                    const sName = item.scientific_name;
                    const cName = item.canonical_name ;
                    
                    // Nếu bản ghi trong file seed không có bất kỳ định danh tên nào hợp lệ, tính là không tìm thấy
                    if (!sName && !cName) {
                        statsObj.not_found++;
                        continue;
                    }

                    // Thuật toán xác định: Tìm kiếm ID bằng scientific_name trước, nếu khuyết thử tìm bằng canonical_name
                    const existingId = (sName ? sciToIdMap.get(sName) : null) || (cName ? sciToIdMap.get(cName) : null) || null;

                    if (existingId) {
                        // Trích xuất giá trị trường, nếu dữ liệu thiếu mặc định lấy true theo thiết lập defaultValue
                        const isRecorded = item.is_recorded_in_vietnam !== undefined ? item.is_recorded_in_vietnam : true;
                        
                        updatesToExecute.push({
                            [idField]: existingId,
                            is_recorded_in_vietnam: isRecorded
                        });
                        statsObj.updated++;
                    } else {
                        statsObj.not_found++;
                    }
                }

                // Thực thi ghi dữ liệu cập nhật theo khối (Chunking 1000 dòng)
                if (updatesToExecute.length > 0) {
                const chunkSize = 1000; // Mỗi đợt xử lý song song 1000 dòng
                console.log(`🚀 Đang tiến hành cập nhật ${updatesToExecute.length} dòng cho tầng ${Model.name}...`);
                
                for (let i = 0; i < updatesToExecute.length; i += chunkSize) {
                    const chunk = updatesToExecute.slice(i, i + chunkSize);
                    
                    // Chạy song song 1000 lệnh UPDATE đơn giản nhắm thẳng vào khóa chính (Primary Key)
                    // Cách này Postgres xử lý cực nhanh vì tìm theo ID đã có sẵn chỉ mục vật lý mặc định
                    await Promise.all(chunk.map(item => 
                        Model.update(
                            { is_recorded_in_vietnam: item.is_recorded_in_vietnam },
                            { 
                                where: { [idField]: item[idField] }, 
                                transaction: t,
                                hooks: false, // 💡 TẮT HOOKS để tối ưu tốc độ tối đa, không gọi lại generateCustomId
                                logging: false // Tắt log câu lệnh lẻ để console sạch sẽ, chạy nhanh hơn
                            }
                        )
                    ));
                }
            }
            };

            // Thực thi tuần tự qua 6 tầng phân loại học thực vật
            await processUpdateStatus(Phylum, phylumData, stats.phyla, 'phylum_id');
            await processUpdateStatus(Class, classData, stats.classes, 'class_id');
            await processUpdateStatus(Order, orderData, stats.orders, 'order_id');
            await processUpdateStatus(Family, familyData, stats.families, 'family_id');
            await processUpdateStatus(Genus, genusData, stats.genera, 'genus_id');
            await processUpdateStatus(Species, speciesData, stats.species, 'species_id');

            await t.commit();
            console.log("\n🎉 [THÀNH CÔNG RỰC RỠ] Toàn bộ hệ thống dữ liệu đã được cập nhật!");
            console.log("📊 BẢNG THỐNG KÊ CHI TIẾT TIẾN TRÌNH ĐỒNG BỘ:");
            console.table(stats);

        } catch (error) {
            await t.rollback();
            console.error("❌ Tiến trình thất bại, hệ thống tự động Rollback hoàn tác:", error);
        }
    } catch (error) {
        console.error("❌ Lỗi kết nối CSDL hoặc thực thi cấu trúc lệnh:", error);
    } finally {
        process.exit(0);
    }
}

// Chạy trực tiếp script nếu được gọi bằng lệnh node
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    updateIsRecordedInVietnam();
}