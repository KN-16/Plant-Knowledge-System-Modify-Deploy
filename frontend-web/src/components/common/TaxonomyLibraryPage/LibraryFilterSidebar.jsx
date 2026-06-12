import React, { useState, useRef } from "react";
import {
  Card,
  Form,
  Button,
  InputGroup,
  Accordion,
  Badge,
  Row,
  Col,
} from "react-bootstrap";
import {
  FaFilter,
  FaRedo,
  FaSearch,
  FaSeedling,
  FaLeaf,
  FaTree,
  FaMapMarkerAlt,
  FaDna,
  FaExpandAlt,
  FaQuestionCircle,
  FaCompressAlt,
  FaLightbulb,
  FaCheckCircle,
  FaBook,
} from "react-icons/fa";
import { Modal } from "react-bootstrap";
import SmartSelect from "../SmartSelect";

const LibraryFilterSidebar = ({
  filters,
  onFilterChange,
  onApply,
  onReset,
  isExpanded,
  onToggleExpand,
  activeSections,
  setActiveSections,
  SmartSelectOptions,
  localClassOptions,
  localOrderOptions,
  localFamilyOptions,
  localGenusOptions,
  localSpeciesOptions,
  uiMapping,
}) => {
  const toggleSection = (section) => {
    setActiveSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Hàm chặn nhập sai định dạng cho ô số (Chỉ cho phép số và dấu chấm thập phân)
  const handleNumberInput = (e) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  };
  const [pageError, setPageError] = useState(""); // Lưu trữ chuỗi thông báo lỗi
  const pageToRef = useRef(null);
  const handleSubmit = (e) => {
    e.preventDefault();

    const fromVal = parseInt(filters.book_page_from);
    const toVal = parseInt(filters.book_page_to);

    // Kiểm tra: Nếu cả 2 ô đều có dữ liệu và trang đến nhỏ hơn trang từ
    if (fromVal && toVal && toVal < fromVal) {
      setPageError(
        `Số trang đến không được nhỏ hơn trang bắt đầu (trang ${fromVal}).`,
      );

      // Tự động nhảy con trỏ chuột tập trung vào ô nhập sai
      if (pageToRef.current) {
        pageToRef.current.focus();
      }
      return; // Ngăn chặn hoàn toàn, không cho thực thi onApply()
    }

    setPageError(""); // Xóa sạch thông báo lỗi nếu dữ liệu hợp lệ
    onApply(); // Thực thi kích hoạt truy vấn dữ liệu từ bộ lọc URL công khai
  };
  const currentRank = filters.display_rank || "species";

  return (
    <>
      <Card
        className="border-0 shadow-sm rounded-4 sticky-top"
        style={{
          top: "80px",
          zIndex: 10,
          maxHeight: "calc(100vh - 100px)",
          overflowY: "auto",
        }}
      >
        <Card.Body className="p-3 p-md-4 custom-scrollbar">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0 text-success">
              <FaFilter className="me-2" />{" "}
              {isExpanded ? "Bộ Lọc Nâng Cao" : "Bộ Lọc"}
            </h6>
            <div className="d-flex align-items-center">
              {/* Nút phóng to/thu nhỏ như Admin */}
              <Button
                variant="link"
                className="text-muted p-0 text-decoration-none me-3 d-none d-lg-block hover-text-success transition-all"
                onClick={onToggleExpand}
                title={isExpanded ? "Thu gọn bộ lọc" : "Mở rộng bộ lọc"}
              >
                {isExpanded ? (
                  <FaCompressAlt size={16} />
                ) : (
                  <FaExpandAlt size={16} />
                )}
              </Button>

              <Button
                variant="light"
                size="sm"
                className="text-danger fw-bold rounded-pill px-3"
                onClick={onReset}
              >
                <FaRedo size={12} className="me-1" /> Làm mới
              </Button>
            </div>
          </div>

          <Form onSubmit={handleSubmit}>
            <Accordion
              defaultActiveKey={["tax", "bio"]}
              alwaysOpen
              className="custom-accordion"
            >
              {/* 2. PHÂN LOẠI HỌC (Luôn mở) */}
              {currentRank !== "phylum" && (
                <Accordion.Item eventKey="tax">
                  <Accordion.Header>
                    <FaDna className="me-2 text-muted" /> Phân loại học
                  </Accordion.Header>
                  <Accordion.Body className="px-0 pt-1 pb-3">
                    {/* GỌI COMPONENT SMART SELECT TẠI ĐÂY */}
                    {/* Luôn hiện Ngành nếu đang xem từ Lớp trở xuống */}
                    {[
                      "class",
                      "order",
                      "family",
                      "genus",
                      "species",
                      "variety",
                    ].includes(currentRank) && (
                      <Form.Group className="mb-2">
                        <Form.Label className="small fw-bold text-muted mb-1">
                          Ngành Thực vật
                        </Form.Label>
                        <SmartSelect
                          label="Ngành"
                          placeholder="Chọn Ngành..."
                          onChange={(option) => {
                            onFilterChange({
                              target: {
                                name: "phylum_option",
                                value: option?.value ? option : null,
                              },
                            });
                            onFilterChange({
                              target: { name: "class_option", value: null },
                            });
                            onFilterChange({
                              target: { name: "order_option", value: null },
                            });
                            onFilterChange({
                              target: { name: "family_option", value: null },
                            });
                            onFilterChange({
                              target: { name: "genus_option", value: null },
                            });
                            onFilterChange({
                              target: { name: "species_option", value: null },
                            });
                          }}
                          options={SmartSelectOptions?.phylum || []}
                          value={filters.phylum_option}
                          isNewable={false}
                          isNullable={true}
                        />
                      </Form.Group>
                    )}
                    {/* Hiện Lớp nếu đang xem từ Bộ trở xuống */}
                    {[
                      "order",
                      "family",
                      "genus",
                      "species",
                      "variety",
                    ].includes(currentRank) && (
                      <Form.Group className="mb-2">
                        <Form.Label className="small fw-bold text-muted mb-1">
                          Lớp Thực vật
                        </Form.Label>
                        <SmartSelect
                          label="Lớp"
                          placeholder="Chọn Lớp..."
                          onChange={(option) => {
                            onFilterChange({
                              target: {
                                name: "phylum_option",
                                value: option?.value
                                  ? SmartSelectOptions?.phylum?.find(
                                      (p) => p.value === option.phylum_id,
                                    ) || null
                                  : filters.phylum_option,
                              },
                            });
                            onFilterChange({
                              target: {
                                name: "class_option",
                                value: option?.value ? option : null,
                              },
                            });
                            onFilterChange({
                              target: { name: "order_option", value: null },
                            });
                            onFilterChange({
                              target: { name: "family_option", value: null },
                            });
                            onFilterChange({
                              target: { name: "genus_option", value: null },
                            });
                            onFilterChange({
                              target: { name: "species_option", value: null },
                            });
                          }}
                          options={localClassOptions || []}
                          value={filters.class_option}
                          isNewable={false}
                          isNullable={true}
                        />
                      </Form.Group>
                    )}
                    {/* Hiện Bộ nếu đang xem từ Họ trở xuống */}
                    {["family", "genus", "species", "variety"].includes(
                      currentRank,
                    ) && (
                      <Form.Group className="mb-2">
                        <Form.Label className="small fw-bold text-muted mb-1">
                          Bộ Thực vật
                        </Form.Label>
                        <SmartSelect
                          label="Bộ"
                          placeholder="Chọn Bộ..."
                          onChange={(option) => {
                            onFilterChange({
                              target: {
                                name: "phylum_option",
                                value: option?.value
                                  ? SmartSelectOptions?.phylum?.find(
                                      (p) => p.value === option.phylum_id,
                                    ) || null
                                  : filters.phylum_option,
                              },
                            });
                            onFilterChange({
                              target: {
                                name: "class_option",
                                value: option?.value
                                  ? SmartSelectOptions?.class?.find(
                                      (c) => c.value === option.class_id,
                                    ) || null
                                  : filters.class_option,
                              },
                            });
                            onFilterChange({
                              target: {
                                name: "order_option",
                                value: option?.value ? option : null,
                              },
                            });
                            onFilterChange({
                              target: { name: "family_option", value: null },
                            });
                            onFilterChange({
                              target: { name: "genus_option", value: null },
                            });
                            onFilterChange({
                              target: { name: "species_option", value: null },
                            });
                          }}
                          options={localOrderOptions || []}
                          value={filters.order_option}
                          isNewable={false}
                          isNullable={true}
                        />
                      </Form.Group>
                    )}
                    {/* Hiện Họ nếu đang xem từ Chi trở xuống */}
                    {["genus", "species", "variety"].includes(currentRank) && (
                      <Form.Group className="mb-2">
                        <Form.Label className="small fw-bold text-muted mb-1">
                          Họ Thực vật
                        </Form.Label>
                        <SmartSelect
                          label="Họ"
                          placeholder="Chọn Họ..."
                          onChange={(option) => {
                            onFilterChange({
                              target: {
                                name: "phylum_option",
                                value: option?.value
                                  ? SmartSelectOptions?.phylum?.find(
                                      (p) => p.value === option?.phylum_id,
                                    ) || null
                                  : filters.phylum_option,
                              },
                            });
                            onFilterChange({
                              target: {
                                name: "class_option",
                                value: option?.value
                                  ? SmartSelectOptions?.class?.find(
                                      (c) => c.value === option?.class_id,
                                    ) || null
                                  : filters.class_option,
                              },
                            });
                            onFilterChange({
                              target: {
                                name: "order_option",
                                value: option?.value
                                  ? SmartSelectOptions?.order?.find(
                                      (o) => o.value === option?.order_id,
                                    ) || null
                                  : filters.order_option,
                              },
                            });
                            onFilterChange({
                              target: {
                                name: "family_option",
                                value: option?.value ? option : null,
                              },
                            });
                            onFilterChange({
                              target: { name: "genus_option", value: null },
                            });
                            onFilterChange({
                              target: { name: "species_option", value: null },
                            });
                          }}
                          options={localFamilyOptions || []}
                          value={filters.family_option}
                          isNewable={false}
                          isNullable={true}
                        />
                      </Form.Group>
                    )}
                    {/* Hiện Chi nếu đang xem từ Loài trở xuống */}
                    {["species", "variety"].includes(currentRank) && (
                      <Form.Group className="mb-2">
                        <Form.Label className="small fw-bold text-muted mb-1">
                          Chi Thực vật
                        </Form.Label>
                        <SmartSelect
                          label="Chi"
                          placeholder="Chọn Chi..."
                          onChange={(option) => {
                            onFilterChange({
                              target: {
                                name: "phylum_option",
                                value: option?.value
                                  ? SmartSelectOptions?.phylum?.find(
                                      (p) => p.value === option?.phylum_id,
                                    ) || null
                                  : filters.phylum_option,
                              },
                            });
                            onFilterChange({
                              target: {
                                name: "class_option",
                                value: option?.value
                                  ? SmartSelectOptions?.class?.find(
                                      (c) => c.value === option?.class_id,
                                    ) || null
                                  : filters.class_option,
                              },
                            });
                            onFilterChange({
                              target: {
                                name: "order_option",
                                value: option?.value
                                  ? SmartSelectOptions?.order?.find(
                                      (o) => o.value === option?.order_id,
                                    ) || null
                                  : filters.order_option,
                              },
                            });
                            onFilterChange({
                              target: {
                                name: "family_option",
                                value: option?.value
                                  ? SmartSelectOptions?.family?.find(
                                      (f) => f.value === option?.family_id,
                                    ) || null
                                  : filters.family_option,
                              },
                            });
                            onFilterChange({
                              target: {
                                name: "genus_option",
                                value: option?.value ? option : null,
                              },
                            });
                            onFilterChange({
                              target: { name: "species_option", value: null },
                            });
                          }}
                          options={localGenusOptions || []}
                          value={filters.genus_option}
                          isNewable={false}
                          isNullable={true}
                        />
                      </Form.Group>
                    )}
                    {currentRank === "variety" && (
                      <Form.Group className="mb-2">
                        <Form.Label className="small fw-bold text-muted mb-1">
                          Loài Thực Vật
                        </Form.Label>
                        <SmartSelect
                          label="Loài"
                          placeholder="Chọn Loài..."
                          onChange={(option) => {
                            onFilterChange({
                              target: {
                                name: "phylum_option",
                                value: option?.value
                                  ? SmartSelectOptions?.phylum?.find(
                                      (p) => p.value === option?.phylum_id,
                                    ) || null
                                  : filters.phylum_option,
                              },
                            });
                            onFilterChange({
                              target: {
                                name: "class_option",
                                value: option?.value
                                  ? SmartSelectOptions?.class?.find(
                                      (c) => c.value === option?.class_id,
                                    ) || null
                                  : filters.class_option,
                              },
                            });
                            onFilterChange({
                              target: {
                                name: "order_option",
                                value: option?.value
                                  ? SmartSelectOptions?.order?.find(
                                      (o) => o.value === option?.order_id,
                                    ) || null
                                  : filters.order_option,
                              },
                            });
                            onFilterChange({
                              target: {
                                name: "family_option",
                                value: option?.value
                                  ? SmartSelectOptions?.family?.find(
                                      (f) => f.value === option?.family_id,
                                    ) || null
                                  : filters.family_option,
                              },
                            });
                            onFilterChange({
                              target: {
                                name: "genus_option",
                                value: option?.value ? option : null,
                              },
                            });
                            onFilterChange({
                              target: {
                                name: "species_option",
                                value: option?.value ? option : null,
                              },
                            });
                          }}
                          options={localSpeciesOptions || []}
                          value={filters.species_option}
                          isNewable={false}
                          isNullable={true}
                        />
                      </Form.Group>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              )}
              {/* 3. SINH HỌC CƠ BẢN */}
              <Accordion.Item eventKey="bio">
                <Accordion.Header>
                  <FaSeedling className="me-2 text-muted" /> Thông tin sinh học
                  cơ bản
                </Accordion.Header>
                <Accordion.Body className="px-0 pt-2 pb-3">
                  <Row className="g-3">
                    {/* <Col xs={12}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-muted mb-1">
                          Ghi nhận tại Việt Nam
                        </Form.Label>
                        <Form.Select
                          size="sm"
                          name="is_recorded_in_vietnam"
                          value={filters.is_recorded_in_vietnam || ""}
                          onChange={onFilterChange}
                          className="rounded-3"
                        >
                          <option value="">Tất cả (Không quan tâm)</option>
                          <option value="true">Có ghi nhận</option>
                          <option value="false">Không có ghi nhận</option>
                        </Form.Select>
                      </Form.Group>
                    </Col> */}

                    {["species", "variety"].includes(currentRank) && (
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label className="small fw-bold text-muted mb-1">
                            Công dụng đặc trưng
                          </Form.Label>
                          <Form.Control
                            size="sm"
                            type="text"
                            name="uses"
                            value={filters.uses || ""}
                            onChange={onFilterChange}
                            placeholder="Tìm công dụng (Ví dụ: dược liệu, cảnh quan...)"
                            className="rounded-3"
                          />
                        </Form.Group>
                      </Col>
                    )}

                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-muted mb-1">
                          Mô tả đặc điểm chung
                        </Form.Label>
                        <Form.Control
                          size="sm"
                          type="text"
                          name="description"
                          value={filters.description || ""}
                          onChange={onFilterChange}
                          placeholder="Nhập từ khóa mô tả..."
                          className="rounded-3"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Accordion.Body>
              </Accordion.Item>
              {["genus", "species", "variety"].includes(currentRank) && (
                <>
                  {/* 4. Thông tin được mô tả trong sách Thầy Phạm Hoàng Hộ (Có nút bật tắt) */}
                  <div className="d-flex justify-content-between align-items-center mt-4 mb-2 px-1">
                    <span className="fw-bold text-dark small d-flex align-items-center">
                      <FaBook className="me-2 text-success" /> Dữ liệu từ sách
                      Thầy Phạm Hoàng Hộ
                    </span>
                    <Form.Check
                      type="switch"
                      id="switch-ho"
                      checked={activeSections.ho_species_option}
                      onChange={() => toggleSection("ho_species_option")}
                    />
                  </div>
                  {activeSections.ho_species_option && (
                    <div className="p-3 bg-light rounded-4 mb-3 border border-dashed animation-fade-in">
                      <Row className="g-3">
                        <div className="p-3 bg-white rounded-3 border border-success border-opacity-10 shadow-sm mb-1">
                          <small className="fw-bold text-success d-block mb-2">
                            Tra cứu theo Thư mục Sách
                          </small>
                          <Row className="g-2">
                            {/* Tập sách tự động chiếm trọn hàng riêng để Dropdown có không gian hiển thị rộng rãi */}
                            <Col xs={12}>
                              <Form.Group>
                                <Form.Label
                                  className="small text-muted mb-1"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  Tập sách (Volume)
                                </Form.Label>
                                <Form.Select
                                  size="sm"
                                  name="book_volume"
                                  value={filters.book_volume || ""}
                                  onChange={onFilterChange}
                                  className="rounded-3"
                                >
                                  <option value="">Tất cả tập</option>
                                  <option value="1">Tập 1</option>
                                  <option value="2">Tập 2</option>
                                  <option value="3">Tập 3</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>

                            {/* Ô Từ trang - Chiếm một nửa hàng bên dưới */}
                            <Col xs={6}>
                              <Form.Group>
                                <Form.Label
                                  className="small text-muted mb-1"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  Từ trang
                                </Form.Label>
                                <Form.Control
                                  size="sm"
                                  type="number"
                                  min="1"
                                  name="book_page_from"
                                  value={filters.book_page_from || ""}
                                  onChange={(e) => {
                                    const valStr = e.target.value;
                                    if (valStr === "") {
                                      onFilterChange(e);
                                      return;
                                    }
                                    const val = parseInt(valStr);
                                    if (isNaN(val) || val < 1) return; // Khóa chặt chặn số âm hoặc không hợp lệ
                                    onFilterChange(e);
                                  }}
                                  onKeyDown={handleNumberInput}
                                  placeholder="Ví dụ: 10"
                                  className="rounded-3"
                                />
                              </Form.Group>
                            </Col>

                            {/* Ô Đến trang */}
                            <Col xs={6}>
                              <Form.Group>
                                <Form.Label
                                  className="small text-muted mb-1"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  Đến trang
                                </Form.Label>
                                <Form.Control
                                  size="sm"
                                  type="number"
                                  // min={filters.book_page_from || "1"}
                                  name="book_page_to"
                                  value={filters.book_page_to || ""}
                                  onChange={(e) => {
                                    setPageError(""); // Xóa thông báo lỗi khi người dùng gõ phím sửa lại dữ liệu
                                    onFilterChange(e);
                                  }}
                                  onKeyDown={handleNumberInput}
                                  placeholder="Ví dụ: 50"
                                  className="rounded-3"
                                />
                              </Form.Group>
                            </Col>
                            {pageError && (
                              <Col xs={12} className="mt-1">
                                <div
                                  className="text-danger small fw-medium animate-fade-in"
                                  style={{ fontSize: "0.78rem" }}
                                >
                                  ⚠️ {pageError}
                                </div>
                              </Col>
                            )}
                          </Row>
                        </div>
                        <Col xs={12}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-muted mb-1">
                              Dạng sống & Hình thái thân, rễ
                            </Form.Label>
                            <Form.Control
                              size="sm"
                              type="text"
                              name="habit_stem_root"
                              value={filters.habit_stem_root || ""}
                              onChange={onFilterChange}
                              placeholder="Dạng sống & Hình thái thân, rễ..."
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={12}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-muted mb-1">
                              Đặc điểm hình thái Lá
                            </Form.Label>
                            <Form.Control
                              size="sm"
                              type="text"
                              name="leaves"
                              value={filters.leaves || ""}
                              onChange={onFilterChange}
                              placeholder="Đặc điểm hình thái Lá..."
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={12}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-muted mb-1">
                              Đặc điểm sinh sản (Bào tử/Hoa/Quả)
                            </Form.Label>
                            <Form.Control
                              size="sm"
                              type="text"
                              name="reproduction"
                              value={filters.reproduction || ""}
                              onChange={onFilterChange}
                              placeholder="Đặc điểm sinh sản (Bào tử/Hoa/Quả)..."
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={12}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-muted mb-1">
                              Mùa hoa quả / Chu kỳ sinh trưởng
                            </Form.Label>
                            <Form.Control
                              size="sm"
                              type="text"
                              name="phenology"
                              value={filters.phenology || ""}
                              onChange={onFilterChange}
                              placeholder="Ví dụ: Tháng 3-5..."
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={12}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-muted mb-1">
                              Môi trường sống & Sinh thái học
                            </Form.Label>
                            <Form.Control
                              size="sm"
                              type="text"
                              name="habitat_ecology"
                              value={filters.habitat_ecology || ""}
                              onChange={onFilterChange}
                              placeholder="Môi trường, độ cao, khí hậu..."
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={12}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-muted mb-1">
                              Công dụng trị liệu & Dược tính
                            </Form.Label>
                            <Form.Control
                              size="sm"
                              type="text"
                              name="usages"
                              value={filters.usages || ""}
                              onChange={onFilterChange}
                              placeholder="Các bài thuốc hoặc công dụng dược lý..."
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={12}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-muted mb-1">
                              Thông tin bổ sung thêm
                            </Form.Label>
                            <Form.Control
                              size="sm"
                              type="text"
                              name="notes"
                              value={filters.notes || ""}
                              onChange={onFilterChange}
                              placeholder="Ghi chú hệ thống khác..."
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>
                  )}
                </>
              )}
              {/* Bộ lọc đặc trưng - Chỉ hiện khi đang xem từ Loài trở xuống */}
              {["species", "variety"].includes(currentRank) && (
                <>
                  {/* 4. HÌNH THÁI LÁ (Có nút bật tắt) */}
                  <div className="d-flex justify-content-between align-items-center mt-3 mb-2 px-1">
                    <span className="fw-bold text-dark d-flex align-items-center">
                      <FaLeaf className="me-2 text-success" /> Hình thái Lá
                    </span>
                    <Form.Check
                      type="switch"
                      checked={activeSections.leaf}
                      onChange={() => toggleSection("leaf")}
                    />
                  </div>
                  {activeSections.leaf && (
                    <div className="p-3 bg-light rounded-3 mb-3 border">
                      <Row className="g-2">
                        <Col xs={6}>
                          <Form.Select
                            size="sm"
                            name="leaf_type"
                            value={filters.leaf_type || ""}
                            onChange={onFilterChange}
                          >
                            <option value="">Kiểu lá...</option>
                            {Object.entries(uiMapping?.LEAF_TYPE || {}).map(
                              ([key, value]) => (
                                <option key={key} value={key}>
                                  {value}
                                </option>
                              ),
                            )}
                          </Form.Select>
                        </Col>
                        <Col xs={6}>
                          <Form.Select
                            size="sm"
                            name="leaf_shape"
                            value={filters.leaf_shape || ""}
                            onChange={onFilterChange}
                          >
                            <option value="">Hình dạng...</option>
                            {Object.entries(uiMapping?.LEAF_SHAPE || {}).map(
                              ([key, value]) => (
                                <option key={key} value={key}>
                                  {value}
                                </option>
                              ),
                            )}
                          </Form.Select>
                        </Col>
                        <Col xs={6}>
                          <Form.Select
                            size="sm"
                            name="leaf_arrangement"
                            value={filters.leaf_arrangement || ""}
                            onChange={onFilterChange}
                          >
                            <option value="">Cách mọc...</option>
                            {Object.entries(
                              uiMapping?.LEAF_ARRANGEMENT || {},
                            ).map(([key, value]) => (
                              <option key={key} value={key}>
                                {value}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col xs={6}>
                          <Form.Select
                            size="sm"
                            name="leaf_margin"
                            value={filters.leaf_margin || ""}
                            onChange={onFilterChange}
                          >
                            <option value="">Mép lá...</option>
                            {Object.entries(uiMapping?.LEAF_MARGIN || {}).map(
                              ([key, value]) => (
                                <option key={key} value={key}>
                                  {value}
                                </option>
                              ),
                            )}
                          </Form.Select>
                        </Col>

                        {/* ĐÃ ĐỔI TỪ xs={4} SANG xs={6} ĐỂ TỰ ĐỘNG XUỐNG DÒNG MƯỢT MÀ */}
                        <Col xs={12}>
                          <hr className="my-1" />
                        </Col>

                        <Col xs={6}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-muted mb-1 text-truncate w-100">
                              Dài tối thiểu
                            </Form.Label>
                            <Form.Control
                              size="sm"
                              type="number"
                              min="0"
                              step="0.1"
                              name="leaf_length_min"
                              value={filters.leaf_length_min || ""}
                              onChange={onFilterChange}
                              onKeyDown={handleNumberInput}
                              placeholder="cm"
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={6}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-muted mb-1 text-truncate w-100">
                              Rộng tối thiểu
                            </Form.Label>
                            <Form.Control
                              size="sm"
                              type="number"
                              min="0"
                              step="0.1"
                              name="leaf_width_min"
                              value={filters.leaf_width_min || ""}
                              onChange={onFilterChange}
                              onKeyDown={handleNumberInput}
                              placeholder="cm"
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={6}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-muted mb-1 text-truncate ">
                              Dài cuống tối thiểu{" "}
                            </Form.Label>
                            <Form.Control
                              size="sm"
                              type="number"
                              min="0"
                              step="0.1"
                              name="petiole_length_min"
                              value={filters.petiole_length_min || ""}
                              onChange={onFilterChange}
                              onKeyDown={handleNumberInput}
                              placeholder="cm"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>
                  )}

                  {/* 5. HÌNH THÁI THÂN */}
                  <div className="d-flex justify-content-between align-items-center mt-3 mb-2 px-1">
                    <span className="fw-bold text-dark d-flex align-items-center">
                      <FaTree className="me-2 text-warning" /> Thân
                    </span>
                    <Form.Check
                      type="switch"
                      checked={activeSections.stem}
                      onChange={() => toggleSection("stem")}
                    />
                  </div>
                  {activeSections.stem && (
                    <div className="p-3 bg-light rounded-3 mb-3 border">
                      <div className="small fw-bold text-muted mb-2">
                        Đặc điểm Thân
                      </div>
                      <Row className="g-2 mb-3">
                        <Col xs={6}>
                          <Form.Select
                            size="sm"
                            name="stem_type"
                            value={filters.stem_type || ""}
                            onChange={onFilterChange}
                          >
                            <option value="">Loại thân...</option>
                            {Object.entries(uiMapping?.STEM_TYPE || {}).map(
                              ([key, value]) => (
                                <option key={key} value={key}>
                                  {value}
                                </option>
                              ),
                            )}
                          </Form.Select>
                        </Col>
                        <Col xs={6}>
                          <Form.Select
                            size="sm"
                            name="stem_surface"
                            value={filters.stem_surface || ""}
                            onChange={onFilterChange}
                          >
                            <option value="">Bề mặt thân...</option>
                            {Object.entries(uiMapping?.STEM_SURFACE || {}).map(
                              ([key, value]) => (
                                <option key={key} value={key}>
                                  {value}
                                </option>
                              ),
                            )}
                          </Form.Select>
                        </Col>
                        <Col xs={6}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-muted mb-1 text-truncate w-100">
                              Màu thân
                            </Form.Label>
                            <Form.Control
                              size="sm"
                              type="text"
                              name="stem_color"
                              value={filters.stem_color || ""}
                              onChange={onFilterChange}
                              placeholder="Nhập màu..."
                            />
                          </Form.Group>
                        </Col>

                        <Col xs={6}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-muted mb-1 text-truncate w-100">
                              Cao tối thiểu
                            </Form.Label>
                            <Form.Control
                              size="sm"
                              type="number"
                              min="0"
                              step="0.1"
                              name="stem_height_min"
                              value={filters.stem_height_min || ""}
                              onChange={onFilterChange}
                              onKeyDown={handleNumberInput}
                              placeholder="Mét (m)"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>
                  )}

                  {/* 6. HÌNH THÁI HOA */}
                  <div className="d-flex justify-content-between align-items-center mt-3 mb-2 px-1">
                    <span className="fw-bold text-dark d-flex align-items-center">
                      🌸 Hoa
                    </span>
                    <Form.Check
                      type="switch"
                      checked={activeSections.flower}
                      onChange={() => toggleSection("flower")}
                    />
                  </div>
                  {activeSections.flower && (
                    <div className="p-3 bg-light rounded-3 mb-3 border">
                      <div className="small fw-bold text-muted mb-2">
                        Đặc điểm Hoa
                      </div>
                      <Row className="g-2">
                        <Col xs={12}>
                          <Form.Select
                            size="sm"
                            name="inflorescence"
                            value={filters.inflorescence || ""}
                            onChange={onFilterChange}
                          >
                            <option value="">
                              Cụm hoa (Inflorescence) (Tất cả)
                            </option>
                            {Object.entries(uiMapping?.INFLORESCENCE || {}).map(
                              ([key, value]) => (
                                <option key={key} value={key}>
                                  {value}
                                </option>
                              ),
                            )}
                          </Form.Select>
                        </Col>
                        <Col xs={6}>
                          <Form.Group className="h-100 d-flex flex-column justify-content-end">
                            <Form.Control
                              size="sm"
                              type="text"
                              name="flower_color"
                              value={filters.flower_color || ""}
                              onChange={onFilterChange}
                              placeholder="Màu hoa..."
                            />
                          </Form.Group>
                        </Col>

                        <Col xs={6}>
                          <Form.Group>
                            <Form.Control
                              size="sm"
                              type="number"
                              min="0"
                              name="flower_petal_count"
                              value={filters.flower_petal_count || ""}
                              onChange={onFilterChange}
                              onKeyDown={handleNumberInput}
                              placeholder="Số cánh hoa"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>
                  )}
                </>
              )}
            </Accordion>

            {/* NÚT LỌC CỐ ĐỊNH Ở DƯỚI CÙNG */}
            <div
              className="position-sticky bottom-0 bg-white pt-3 pb-1 mt-3"
              style={{ zIndex: 5 }}
            >
              <Button
                variant="success"
                type="submit"
                className="w-100 rounded-pill fw-bolder shadow-sm py-2"
                style={{ letterSpacing: "1px" }}
              >
                ÁP DỤNG LỌC DỮ LIỆU
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
};

export default LibraryFilterSidebar;
