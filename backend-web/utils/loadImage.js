import fs from 'fs';
import path from 'path';
import { BookImage, sequelize } from '../models/index.js'; // Thay đổi đường dẫn thực tế của bạn

/**
 * Hàm sinh tên file ngẫu nhiên bảo mật tương tự uploadToDisk Middleware
 */
function generateUniqueFilename(originalName) {
    const ext = path.extname(originalName); // Lấy đuôi .png, .jpeg...
    const timestamp = Date.now();
    const randomNumber = Math.round(Math.random() * 1e9);
    return `${timestamp}-${randomNumber}${ext}`;
}

/**
 * Hàm thực thi di trú kho ảnh tĩnh vào hệ thống Backend
 * @param {string} srcDir Đường dẫn thư mục chứa ảnh gốc (Vd: './raw_images')
 * @param {string} destDir Đường dẫn thư mục upload của Backend (Vd: './uploads/images')
 */
async function runImageMigration(srcDir, destDir) {
    console.time('⏱️ Tổng thời gian di trú kho ảnh');
    console.log('=== KHỞI CHẠY TIẾN TRÌNH DI TRÚ & MÃ HÓA HÌNH ẢNH SÁCH ===');

    // Đảm bảo thư mục đích tồn tại, nếu chưa có thì tự khởi tạo
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    // Mảng theo dõi toàn bộ đường dẫn file đã copy thành công tại thư mục đích
    // Mục đích: Nếu có bất kỳ lỗi nào xảy ra, vòng lặp catch sẽ dùng mảng này để xóa sạch file vật lý
    const copiedFilePathsTracker = [];
    
    // Khởi tạo một Unmanaged Transaction tổng
    const transaction = await sequelize.transaction();
    
    const stats = {
        totalFilesDiscovered: 0,
        validPlantImages: 0,
        successfullyProcessed: 0
    };

    try {
        // Đọc toàn bộ danh sách file trong thư mục ảnh gốc
        const files = await fs.promises.readdir(srcDir);
        stats.totalFilesDiscovered = files.length;

        const CHUNK_SIZE = 1000;
        let bulkInsertQueue = [];

        for (const file of files) {
            // Regex bóc tách chuỗi: vol([số])_p([số]).[đuôi ảnh]
            const match = file.match(/^(vol(\d+)_p(\d+))\.(png|jpg|jpeg|webp)$/i);
            if (!match) continue; // Bỏ qua nếu file không tuân thủ luật đặt tên sách Hộ
            
            stats.validPlantImages++;

            const cleanFileName = match[1];            // Ví dụ: vol2_p0040 (Đã cắt đuôi ảnh)
            const volume = parseInt(match[2], 10);     // Tập số (int)
            const pageNumber = parseInt(match[3], 10); // Trang số (int)

            // Tiến hành sinh tên file mã hóa độc bản
            const uniqueFilename = generateUniqueFilename(file);
            
            const srcFilePath = path.join(srcDir, file);
            const destFilePath = path.join(destDir, uniqueFilename);

            // 1. Thực thi sao chép file vật lý sang thư mục đích
            // LƯU Ý: Không bọc try-catch riêng ở đây, để nếu lỗi copy (đầy ổ cứng, mất quyền ghi...) sẽ văng ra ngoài ngay lập tức
            await fs.promises.copyFile(srcFilePath, destFilePath);
            copiedFilePathsTracker.push(destFilePath); // Ghi nhận vào tracker phòng hờ rollback

            // 2. Nạp cấu trúc bản ghi vào hàng đợi chuẩn dữ liệu
            bulkInsertQueue.push({
                url: `/uploads/books/${uniqueFilename}`,
                is_external: false,
                file_name: cleanFileName,
                volume: volume,
                page_number: pageNumber
            });

            // 3. Nếu hàng đợi tích đủ 1000 bản ghi, thực hiện ghi một lần xuống SQL
            if (bulkInsertQueue.length === CHUNK_SIZE) {
                await BookImage.bulkCreate(bulkInsertQueue, { transaction });
                stats.successfullyProcessed += bulkInsertQueue.length;
                console.log(`⚡ Đã di trú cơ sở dữ liệu thành công đợt ${stats.successfullyProcessed} ảnh...`);
                bulkInsertQueue = []; // Làm trống hàng đợi cho đợt tiếp theo
            }
        }

        // Xử lý nốt các bản ghi còn dư ở đợt cuối cùng sau khi thoát vòng lặp
        if (bulkInsertQueue.length > 0) {
            await BookImage.bulkCreate(bulkInsertQueue, { transaction });
            stats.successfullyProcessed += bulkInsertQueue.length;
        }

        // 4. KHI TẤT CẢ FILE VÀ SQL KHÔNG CÓ LỖI -> COMMIT ĐỂ LƯU VĨNH VIỄN
        await transaction.commit();
        
        console.log('\n==================================================');
        console.log('📊 BÁO CÁO KẾT QUẢ DI TRÚ KHO ẢNH SÁCH:');
        console.log(`  🔹 Tổng số tệp phát hiện trong thư mục gốc: ${stats.totalFilesDiscovered}`);
        console.log(`  🔹 Số lượng ảnh sách hợp lệ (Đúng luật) : ${stats.validPlantImages}`);
        console.log(`  🚀 Di trú & mã hóa thành công lên hệ thống: ${stats.successfullyProcessed}`);
        console.log('==================================================');
        console.timeEnd('⏱️ Tổng thời gian di trú kho ảnh');

    } catch (criticalError) {
        // CƠ CHẾ BẢO VỆ CHỐNG RÁC DỮ LIỆU: KÍCH HOẠT KHI PHÁT HIỆN BẤT KỲ LỖI NÀO
        console.error('\n🔴 [CẢNH BÁO HỆ THỐNG] Phát hiện lỗi nghiêm trọng trong tiến trình di trú!');
        console.error(`❌ Chi tiết lỗi: ${criticalError.message}`);
        
        // Step 1: Hủy bỏ toàn bộ các phiên ghi dữ liệu tạm thời dưới SQL
        await transaction.rollback();
        console.log('⚙️ [ROLLBACK SQL] Đã hủy bỏ toàn bộ các bản ghi tạm thời trong phiên giao dịch.');

        // Step 2: Quét sạch toàn bộ các file ảnh đã lỡ copy vào thư mục upload của Backend
        console.log(`⚙️ [DỌN DẸP Ổ CỨNG] Đang tiến hành xóa bỏ ${copiedFilePathsTracker.length} tệp đã sao chép lỗi...`);
        for (const filePath of copiedFilePathsTracker) {
            try {
                await fs.promises.unlink(filePath);
            } catch (unlinkErr) {
                // Bỏ qua nếu tệp tin không tồn tại hoặc đã bị xóa trước đó
            }
        }
        console.log('🗑️ Thư mục đích đã được dọn sạch rác hoàn toàn. Trạng thái hệ thống an toàn!');
        console.timeEnd('⏱️ Tổng thời gian di trú kho ảnh');
    }
}

// === HƯỚNG DẪN THỰC THI CHẠY SCRIPT ===
// Đổi lại đường dẫn xuyệt xuôi chuẩn xác theo thư mục dự án trên máy của bạn
const SOURCE_DIRECTORY = 'C:/Users/lnakh/Downloads/images';
const BACKEND_UPLOAD_DIRECTORY = 'D:/LVTN/LuanVanTotNghiepCode/backend-web/uploads/books';

runImageMigration(SOURCE_DIRECTORY, BACKEND_UPLOAD_DIRECTORY).catch(err => {
    console.error('🔴 Tiến trình sập hoàn toàn ở tầng Core:', err);
});