import { sequelize } from "../models/index.js";
import {
  Phylum,
  Class,
  Order,
  Family,
  Genus,
  Species,
  Counter,
  Variety,
} from "../models/index.js";

async function fixAllTaxonomyCodes() {
  try {
    await sequelize.authenticate();
    console.log("✅ Kết nối Database thành công để vá mã Code.");

    // Cấu hình danh sách các Model cần vá theo đúng thứ tự, kèm theo Prefix và khóa chính tương ứng
    const tasks = [
      { Model: Phylum, prefix: "PHYL", idField: "phylum_id", name: "Phylum" },
      { Model: Class, prefix: "CLASS", idField: "class_id", name: "Class" },
      { Model: Order, prefix: "ORD", idField: "order_id", name: "Order" },
      { Model: Family, prefix: "FAM", idField: "family_id", name: "Family" },
      { Model: Genus, prefix: "GEN", idField: "genus_id", name: "Genus" },
      { Model: Species, prefix: "SPC", idField: "species_id", name: "Species" },
      { Model: Variety, prefix: "VAR", idField: "variety_id", name: "Variety" },
    ];

    // Mở một Transaction lớn để đảm bảo an toàn dữ liệu
    const t = await sequelize.transaction();

    try {
      for (const task of tasks) {
        console.log(`\n⏳ Đang xử lý sinh mã cho tầng: ${task.name}...`);

        // 1. Lấy danh sách tất cả bản ghi hiện có, sắp xếp tăng dần theo ID khóa chính
        const records = await task.Model.findAll({
          attributes: [task.idField],
          order: [[task.idField, "ASC"]],
          transaction: t,
        });

        const totalRecords = records.length;
        console.log(
          `🔍 Tìm thấy ${totalRecords} bản ghi trong bảng ${task.Model.tableName}`,
        );

        if (totalRecords === 0) {
          console.log(`⏩ Bảng ${task.name} trống, bỏ qua.`);
          continue;
        }

        // 2. Tạo danh sách các câu lệnh cập nhật trên RAM
        const updateStatements = records.map((record, index) => {
          const currentSeq = index + 1; // Bắt đầu tăng dần từ 1
          const targetCode = `${task.prefix}-${String(currentSeq).padStart(6, "0")}`;

          return {
            idValue: record[task.idField],
            tempCode: `${targetCode}-TEMP`, // Mã tạm để xóa bỏ hoàn toàn ràng buộc trùng dữ liệu cũ
            finalCode: targetCode, // Mã chuẩn cuối cùng
          };
        });

        const chunkSize = 1000;

        // 🚀 BƯỚC 3.1: CHUYỂN TOÀN BỘ SANG MÃ TẠM (Chạy song song theo cụm)
        console.log(
          `⚡ [LƯỢT 1] Đang giải phóng bộ mã cũ sang dạng -TEMP cho tầng ${task.name}...`,
        );
        for (let i = 0; i < updateStatements.length; i += chunkSize) {
          const chunk = updateStatements.slice(i, i + chunkSize);

          await Promise.all(
            chunk.map((item) =>
              task.Model.update(
                { code: item.tempCode },
                {
                  where: { [task.idField]: item.idValue },
                  transaction: t,
                },
              ),
            ),
          );
        }

        // 🚀 BƯỚC 3.2: CẬP NHẬT ĐÈ MÃ CHUẨN MỚI (Chạy song song theo cụm)
        console.log(
          `✨ [LƯỢT 2] Đang áp dải mã 6 số sạch sẽ cho tầng ${task.name}...`,
        );
        for (let i = 0; i < updateStatements.length; i += chunkSize) {
          const chunk = updateStatements.slice(i, i + chunkSize);

          await Promise.all(
            chunk.map((item) =>
              task.Model.update(
                { code: item.finalCode },
                {
                  where: { [task.idField]: item.idValue },
                  transaction: t,
                },
              ),
            ),
          );
        }

        // 4. Đồng bộ lại giá trị trong bảng Counter khớp với tổng số lượng bản ghi hiện tại
        console.log(
          `🔄 Cập nhật bộ đếm Counter cho model [${task.name}] thành: ${totalRecords}`,
        );
        await Counter.upsert(
          {
            model_name: task.name,
            seq: totalRecords,
          },
          { transaction: t },
        );

        console.log(`✅ Hoàn thành đồng bộ mã Code tầng: ${task.name}`);
      }

      // Commit nếu toàn bộ các tầng chạy mượt mà không lỗi
      await t.commit();
      console.log(
        "\n🎉 [THÀNH CÔNG RỰC RỠ] Đã định cấu trúc lại toàn bộ hệ thống mã Code 6 chữ số song song!",
      );
    } catch (error) {
      // Rollback toàn bộ nếu có bất kỳ lỗi nào xảy ra ở bất kỳ tầng nào
      await t.rollback();
      console.error(
        "❌ Tiến trình thất bại, đã rollback toàn bộ cấu trúc:",
        error,
      );
    }
  } catch (error) {
    console.error("❌ Không thể kết nối cơ sở dữ liệu:", error);
  } finally {
    process.exit(0);
  }
}

// Thực thi script
fixAllTaxonomyCodes();
