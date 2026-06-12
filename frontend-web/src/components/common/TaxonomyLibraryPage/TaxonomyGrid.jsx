// export default SpeciesGrid;
import React from "react";
import { Row, Col, Card, Badge, Button, Spinner } from "react-bootstrap";
import { FaCheck, FaEye, FaImages, FaFingerprint } from "react-icons/fa";

const TaxonomyGrid = ({
  data,
  loading,
  compareList,
  onToggleCompare,
  onNavigate,
  backendUrl,
  isExpanded,
  display_rank = "species",
  species_type,
  variant_type,
}) => {
  if (loading)
    return (
      <div className="d-flex justify-content-center py-5 mt-5">
        <Spinner animation="border" variant="success" />
      </div>
    );

  if (!data || data.length === 0)
    return (
      <div className="text-center py-5 bg-white rounded-4 shadow-sm text-muted mt-3 border border-light">
        <h5 className="fw-bold mb-2">Không tìm thấy dữ liệu</h5>
        <p className="mb-0">
          Hãy thử thay đổi từ khóa hoặc điều chỉnh lại bộ lọc phân tầng.
        </p>
      </div>
    );

  const rowClasses = isExpanded
    ? "row-cols-1 row-cols-sm-2 row-cols-lg-2 row-cols-xl-3"
    : "row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xl-4";

  // Bản dịch nhãn cho Huy hiệu góc trái trên ảnh
  const rankLabels = {
    phylum: "Ngành",
    class: "Lớp",
    order: "Bộ",
    family: "Họ",
    genus: "Chi",
    species: ["all", "Species"].includes(species_type) ? "Loài" : "Phân loài",
    variety: ["all", "Variety"].includes(variant_type)
      ? "Thứ"
      : variant_type === "Forma"
        ? "Dạng"
        : variant_type === "Phenotype"
          ? "Kiểu hình"
          : "Giống trồng",
  };
  return (
    <Row className={`g-3 g-md-4 ${rowClasses}`}>
      {data.map((plant) => {
        // 🛠️ SỬA LẠI ĐOẠN NÀY: Lấy trực tiếp bậc phân loại từ trang cha truyền xuống
        const currentRank = display_rank;
        const idKey = `${currentRank}_id`;
        const plantId = plant[idKey]; // Đảm bảo bóc đúng: genus_id, family_id, species_id...

        // Kiểm tra trạng thái đã chọn dựa trên ID động chuẩn xác
        const isSelected = compareList.some((i) => i[idKey] === plantId);
        // Logic xử lý ảnh đại diện cover
        const imgUrl = plant.thumbnail
          ? plant.is_external_image
            ? plant.thumbnail
            : `${backendUrl}${plant.thumbnail}`
          : "/default-plant.png";

        const imageCount = plant.image_count || 0;
        const digitizedCount = plant.digitized_image_count || 0;

        return (
          <Col key={plantId}>
            <Card
              className={`h-100 border-0 rounded-4 overflow-hidden shadow-sm hover-card transition-all ${isSelected ? "ring-success" : ""}`}
              onClick={() => onNavigate(plantId, currentRank)}
            >
              {/* KHU VỰC HÌNH ẢNH CHỨA TEXT OVERLAY CHUẨN GIAO DIỆN GỐC */}
              <div
                className="position-relative cursor-pointer overflow-hidden"
                style={{ height: "240px" }}
              >
                <Card.Img
                  src={imgUrl}
                  className="h-100 w-100 transition-all hover-zoom"
                  style={{ objectFit: "cover" }}
                  alt={plant.scientific_name}
                />

                {/* HUY HIỆU CẤP BẬC PHÂN LOẠI (GÓC TRÁI TRÊN CÙNG) */}
                <Badge
                  bg="success"
                  className="position-absolute top-0 start-0 m-2 px-2.5 py-1.5 shadow-sm border border-light border-opacity-25 rounded-3 fw-bold"
                >
                  {rankLabels[currentRank] || "Mẫu vật"}
                </Badge>

                {/* CỤM HUY HIỆU ĐẾM SỐ LƯỢNG ẢNH (GÓC PHẢI TRÊN CÙNG) */}
                <div className="position-absolute top-0 end-0 m-2 d-flex flex-column gap-1 align-items-end">
                  {/* Tổng ảnh sưu tập */}
                  <Badge
                    bg="dark"
                    className="bg-opacity-75 d-flex align-items-center py-1.5 px-2 shadow-sm border border-light border-opacity-25"
                  >
                    <FaImages className="me-1 text-warning" /> {imageCount}
                  </Badge>

                  {/* Số lượng ảnh số hóa nội bộ thực tế (is_external = false)*/}
                  {
                    <Badge
                      bg="warning"
                      className="text-dark d-flex align-items-center py-1 px-1.5 shadow-sm border border-white border-opacity-50 fw-bolder"
                      style={{ fontSize: "0.7rem" }}
                    >
                      <FaFingerprint className="me-1 text-danger" /> Số hóa ảnh:{" "}
                      {digitizedCount}
                    </Badge>
                  }
                </div>

                {/* LỚP PHỦ GRADIENT TỐI ĐÈ LÊN ẢNH & BA LOẠI TÊN HỆ THỐNG KÍCH THƯỚC CHUẨN */}
                <div
                  className="position-absolute bottom-0 start-0 w-100 p-3 bg-gradient-dark text-white d-flex flex-column justify-content-end"
                  style={{ height: "80%" }}
                >
                  {/* Mã định danh phân loại */}
                  <div className="mb-1" style={{ fontSize: "0.7rem" }}>
                    <Badge
                      bg="secondary"
                      className="bg-opacity-75 fw-mono font-monospace px-1.5"
                    >
                      {plant.code}
                    </Badge>
                  </div>

                  {/* TÊN 1 (CHÍNH): Tên khoa học - Latin viết nghiêng, chữ lớn nổi bật chuẩn gốc (1.25rem) */}
                  <h6
                    className="mb-0 fw-bold text-truncate text-white text-shadow-sm lh-base fst-italic"
                    style={{ fontSize: "1.25rem", letterSpacing: "0.3px" }}
                  >
                    {plant.scientific_name}
                  </h6>

                  {/* TÊN 2: Tên tiếng Việt thường gọi (Đã qua xử lý RAM fallback từ BE, không prefix "VN:") */}
                  <div
                    className="text-truncate fw-medium mt-0.5 text-white-50"
                    style={{ fontSize: "0.95rem" }}
                  >
                    {plant.common_name || "Chưa cập nhật tên phổ thông"}
                  </div>

                  {/* TÊN 3: Danh pháp gốc chuẩn hóa Canonical Name (Không prefix "Gốc:") */}
                  <div
                    className="text-truncate small opacity-50 fst-italic"
                    style={{ fontSize: "0.8rem", color: "#c1d5c9" }}
                  >
                    {plant.canonical_name}
                  </div>
                </div>
              </div>

              {/* THANH THÔNG TIN LƯỢT XEM & ACTION SO SÁNH PHÍA DƯỚI CARD */}
              <Card.Body className="bg-white d-flex justify-content-between align-items-center py-2 px-3 border-top border-light">
                <div className="text-muted small d-flex align-items-center gap-3">
                  <span
                    title="Lượt xem"
                    className="d-flex align-items-center fw-medium"
                  >
                    <FaEye className="me-1 text-secondary opacity-75" />{" "}
                    {plant.view_count || 0}
                  </span>
                </div>

                <Button
                  variant={isSelected ? "success" : "outline-success"}
                  size="sm"
                  className="rounded-pill px-3 fw-bold d-flex align-items-center transition-all"
                  style={{ fontSize: "0.75rem" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCompare(plant);
                  }}
                >
                  {isSelected ? <FaCheck className="me-1" /> : "+"}
                  <span className="ms-1">
                    {isSelected ? "Đã chọn" : "So sánh"}
                  </span>
                </Button>
              </Card.Body>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

export default TaxonomyGrid;
