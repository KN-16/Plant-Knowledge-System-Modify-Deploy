import fs from "fs";
import readline from "readline";
import { Species, HoSpeciesData, sequelize } from "../models/index.js"; // Đường dẫn của bạn

// Định nghĩa hàm parse chuỗi page (Ví dụ: vol1_p0022)
function parsePageField(pageStr) {
  if (!pageStr || pageStr.trim() === "") return null;
  const match = pageStr.match(/vol(\d+)_p(\d+)/i);
  if (match) {
    return {
      volume: parseInt(match[1], 10),
      page_number: parseInt(match[2], 10),
      image_filename: pageStr.trim(),
    };
  }
  return null;
}

async function runMigration(jsonlFilePath) {
  console.time("⏱️ Tổng thời gian thực hiện");
  console.log(
    "=== KHỞI CHẠY MIGRATION DỮ LIỆU TẬP / TRANG (ALGORITHM: FIND -> UPDATE/CREATE) ===",
  );
  await sequelize.authenticate();
  console.log("Database kết nối thành công!");

  const stats = {
    totalJsonlRecords: 0,
    hasPageValue: 0,
    noPageValue: 0,
    matchedInDb: 0,
    failedToMatch: 0,
    successfullyUpdated: 0,
  };

  // Khởi tạo Transaction từ sequelize
  const transaction = await sequelize.transaction();
  if (!transaction) {
    console.log("Khởi tạo transaction không thành công!");
    return;
  }

  try {
    // 1. Kéo toàn bộ Species về để tạo map tra cứu nhanh O(1)
    console.log("📥 Đang tải danh sách loài từ cơ sở dữ liệu...");
    const allSpecies = await Species.findAll({
      attributes: ["species_id", "scientific_name"],
      raw: true,
      transaction,
    });

    const scientificMap = new Map();
    allSpecies.forEach((sp) => {
      if (sp.scientific_name) {
        scientificMap.set(sp.scientific_name, sp.species_id);
      }
    });
    console.log(
      `✅ Đã tải ${allSpecies.length} loài vào bộ nhớ bộ đệm tra cứu.`,
    );

    // 2. Thiết lập Stream đọc file JSONL
    const fileStream = fs.createReadStream(jsonlFilePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    // LƯU Ý: Vì chạy từng lệnh đơn song song, khuyến nghị đặt CHUNK_SIZE từ 100 - 200
    // để tránh gây nghẽn hàng đợi kết nối (Connection Pool) của SQL.
    const CHUNK_SIZE = 200;
    let bulkUpsertQueue = [];

    for await (const line of rl) {
      if (!line.trim()) continue;
      stats.totalJsonlRecords++;

      const record = JSON.parse(line);

      const pageData = parsePageField(record.page);
      if (!pageData) {
        stats.noPageValue++;
        continue;
      }
      stats.hasPageValue++;

      let matchedSpeciesId = null;
      const sciName = record.scientificName ? record.scientificName : "";
      const canName = record.canonicalName ? record.canonicalName : "";

      if (scientificMap.has(sciName)) {
        matchedSpeciesId = scientificMap.get(sciName);
      } else if (scientificMap.has(canName)) {
        matchedSpeciesId = scientificMap.get(canName);
      }

      if (!matchedSpeciesId) {
        stats.failedToMatch++;
        continue;
      }
      stats.matchedInDb++;

      bulkUpsertQueue.push({
        species_id: matchedSpeciesId,
        volume: pageData.volume,
        page_number: pageData.page_number,
        image_filename: pageData.image_filename,
      });

      // Nếu hàng đợi tích đủ đợt chunk thì thực hiện xử lý song song
      if (bulkUpsertQueue.length === CHUNK_SIZE) {
        await executeParallelUpsert(bulkUpsertQueue, transaction);
        stats.successfullyUpdated += bulkUpsertQueue.length;
        bulkUpsertQueue = [];
        console.log(
          `⚡ Đã xử lý thành công đợt và ghi tạm ${stats.successfullyUpdated} bản ghi...`,
        );
      }
    }

    // Xử lý nốt các bản ghi còn dư lại trong queue sau khi kết thúc file
    if (bulkUpsertQueue.length > 0) {
      await executeParallelUpsert(bulkUpsertQueue, transaction);
      stats.successfullyUpdated += bulkUpsertQueue.length;
    }

    // 3. NẾU TẤT CẢ THÀNH CÔNG -> COMMIT LƯU VĨNH VIỄN KHÔNG LỖI
    await transaction.commit();
    console.log(
      "🚀 [COMMIT] Toàn bộ dữ liệu đã được ghi nhận thành công vào CSDL!",
    );

    // 4. Kết xuất báo cáo thống kê chi tiết
    console.log("\n==================================================");
    console.log("📊 BÁO CÁO THỐNG KÊ MIGRATION CHUYÊN SÂU:");
    console.log(
      `  🔹 Tổng số dòng đọc được từ JSONL     : ${stats.totalJsonlRecords}`,
    );
    console.log(
      `  🔹 Bản ghi có chứa giá trị 'page'       : ${stats.hasPageValue}`,
    );
    console.log(
      `  🔹 Bản ghi KHÔNG có giá trị 'page'     : ${stats.noPageValue}`,
    );
    console.log(
      `  🔹 Khớp thành công dữ liệu CSDL        : ${stats.matchedInDb}`,
    );
    console.log(
      `  🔹 Thất bại (Không tìm thấy loài ở DB) : ${stats.failedToMatch}`,
    );
    console.log(
      `  🚀 Hoàn tất xử lý (Update/Create)      : ${stats.successfullyUpdated}`,
    );
    console.log("==================================================");
    console.timeEnd("⏱️ Tổng thời gian thực hiện");
  } catch (criticalError) {
    // CHỈ CẦN 1 BẢN GHI LỖI Ở BẤT KỲ ĐỢT NÀO -> HỦY SẠCH SẼ TOÀN BỘ TIẾN TRÌNH
    await transaction.rollback();
    console.error(
      "\n🔴 [ROLLBACK] Phát hiện lỗi nghiêm trọng. Toàn bộ tiến trình Giao dịch đã bị hủy bỏ để bảo toàn dữ liệu.",
    );
    console.error("❌ Chi tiết lỗi:", criticalError.message);
    console.timeEnd("⏱️ Tổng thời gian thực hiện");
  }
}

/**
 * Thuật toán xử lý song song: Tìm kiếm -> Cập nhật hoặc Thêm mới
 */
async function executeParallelUpsert(dataChunk, transaction) {
  // Tối ưu hóa: Loại bỏ trùng lặp species_id ngay trong cùng 1 chunk để tránh lỗi xung đột Race Condition
  const uniqueMap = new Map();
  dataChunk.forEach((item) => uniqueMap.set(item.species_id, item));
  const cleanChunk = Array.from(uniqueMap.values());

  // Tạo mảng các Promise xử lý độc lập
  const updatePromises = cleanChunk.map(async (item) => {
    // Bước 1: Tìm bản ghi theo species_id hiện tại
    const existingRecord = await HoSpeciesData.findOne({
      where: { species_id: item.species_id },
      transaction,
    });

    if (existingRecord) {
      // Bước 2a: Nếu tìm thấy bản ghi -> Chỉ update đúng 3 trường này
      return existingRecord.update(
        {
          volume: item.volume,
          page_number: item.page_number,
          image_filename: item.image_filename,
        },
        { transaction },
      );
    } else {
      // Bước 2b: Nếu không tìm thấy bản ghi -> Tiến hành tạo mới hoàn toàn với 3 trường này
      return HoSpeciesData.create(item, { transaction });
    }
  });

  // Ép JavaScript đợi toàn bộ các tác vụ trong đợt phản hồi. Một tác vụ lỗi sẽ kích hoạt huỷ bỏ tất cả.
  await Promise.all(updatePromises);
}

// Đã sửa lại đường dẫn Windows bằng kí tự dấu xuyệt xuôi `/` để tránh lỗi thoát chuỗi
runMigration("./data/speciesPage.jsonl").catch((err) =>
  console.error("🔴 Hệ thống Migration sập:", err),
);
