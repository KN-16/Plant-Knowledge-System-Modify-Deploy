import React, { useState, useRef } from "react";
import {
  Navbar,
  Container,
  Form,
  InputGroup,
  Button,
  Nav,
  OverlayTrigger,
  Popover,
  NavDropdown,
} from "react-bootstrap";
import {
  FaLeaf,
  FaSearch,
  FaCamera,
  FaUserShield,
  FaBookOpen,
  FaProjectDiagram,
  FaHome,
  FaInfoCircle,
  FaAngleDown,
} from "react-icons/fa";
import {
  Link,
  NavLink,
  useNavigate,
  useLocation,
  createSearchParams,
} from "react-router-dom";
import ImageSearchModal from "../modal/ImageSearchModal";
import Swal from "sweetalert2";

const GuestNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const [searchValue, setSearchValue] = useState("");
  const formRef = useRef(null);
  const [showImageSearchModal, setShowImageSearchModal] = useState(false);
  const [searchRank, setSearchRank] = useState("species"); // Mặc định tìm kiếm theo cấp bậc Loài

  // State kiểm soát trạng thái hiển thị đóng/mở của Dropdown Thư viện
  const [showDropdown, setShowDropdown] = useState(false);

  // useRef quản lý ID của bộ định thời giúp xử lý độ trễ chống mất menu khi hover nhanh
  const timeoutRef = useRef(null);

  // Xử lý sự kiện khi chuột rê vào vùng Dropdown
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowDropdown(true);
  };

  // Xử lý sự kiện khi chuột rời khỏi vùng Dropdown (Tạo độ trễ đệm 300ms mượt mà)
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowDropdown(false);
    }, 300);
  };

  // Xử lý gửi từ khóa tìm kiếm tự do từ thanh điều hướng chính
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim() !== "") {
      navigate({
        pathname: "/taxonomy",
        search: createSearchParams({
          search: searchValue.trim(),
          display_rank: searchRank,
        }).toString(),
      });
    }
  };

  // 🛠️ ĐIỀU CHỈNH LOGIC ĐIỀU HƯỚNG PHÂN LUỒNG QUERIES ĐA BẬC THEO YÊU CẦU MỚI
  const handleDropdownNavigate = (rankType) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowDropdown(false);

    // Tuyến đường chung sử dụng display_rank query cho toàn bộ hệ thống phân loại học nâng cao
    navigate({
      pathname: "/taxonomy", // Bạn có thể sửa thành '/library' tùy theo cấu hình Route của SpeciesLibraryPage
      search: createSearchParams({
        display_rank: rankType,
        sort: "image_count_desc",
        limit: 12,
        page: 1,
      }).toString(),
    });
  };

  const searchHelpPopover = (
    <Popover
      id="popover-search-help"
      className="shadow border-success border-opacity-25 rounded-4"
      style={{ maxWidth: "380px" }}
    >
      <Popover.Header
        as="h3"
        className="bg-success bg-opacity-10 text-success fw-bold border-bottom-0 rounded-top-4 py-2.5"
        style={{ fontSize: "0.92rem" }}
      >
        💡 Hướng dẫn tra cứu & tìm kiếm nhanh
      </Popover.Header>
      <Popover.Body className="text-muted small lh-base p-3">
        <div className="mb-2.5">
          <b
            className="text-success d-block mb-1"
            style={{ fontSize: "0.85rem" }}
          >
            1. Phạm vi ô tìm kiếm tự do:
          </b>
          Thanh tìm kiếm tập trung nhận diện nhanh các chuỗi dữ liệu định danh
          tĩnh bao gồm: <b>Mã hệ thống nội bộ</b> (VD: <code>SPC-0012</code>,{" "}
          <code>VAR-0001</code>), <b>Danh pháp khoa học Latin</b>,{" "}
          <b>Danh pháp gốc (Canonical name)</b> không chứa tên tác giả, hoặc{" "}
          <b>Tên thường gọi</b> đa ngôn ngữ.
        </div>

        <div className="mb-2.5">
          <b
            className="text-success d-block mb-1"
            style={{ fontSize: "0.85rem" }}
          >
            2. Luồng tra cứu cấp bậc phân loại:
          </b>
          Hệ thống hỗ trợ quét dữ liệu tự động theo cấu trúc phân cấp từ Ngành
          đến Biến thể. Bạn có thể truy cập nhanh vào từng cây thư mục này bằng
          cách cấu hình thanh tìm kiếm hoặc thông qua danh mục thả xuống từ menu{" "}
          <b>"Thư viện Thực vật"</b> ở ngay bên cạnh.
        </div>

        <div className="mb-2.5">
          <b
            className="text-success d-block mb-1"
            style={{ fontSize: "0.85rem" }}
          >
            3. Gợi ý tra cứu phổ thông:
          </b>
          Người dùng phổ thông tìm kiếm loài cây dân dã, cây trồng nông nghiệp
          hoặc thảo dược nên ưu tiên định hướng quét trong danh mục{" "}
          <b>Loài (Species)</b> hoặc <b>Biến thể (Variety)</b> để đạt kết quả
          hiển thị tối ưu nhất.
        </div>

        <div className="mb-0">
          <b
            className="text-warning d-block mb-1"
            style={{ fontSize: "0.85rem" }}
          >
            4. Tìm kiếm nâng cao bằng mô tả hình thái:
          </b>
          Trường hợp bạn không biết tên cây và muốn tìm kiếm tự do dựa trên mô
          tả cơ quan sinh học (mép lá, vỏ thân, màu sắc hoa, công dụng dược lý),
          vui lòng di chuyển vào trang thư viện và sử dụng <b>Sidebar Bộ lọc</b>{" "}
          chuyên biệt.
        </div>
      </Popover.Body>
    </Popover>
  );

  // Kiểm tra active trạng thái sáng đèn cho Dropdown Thư viện thực vật
  const isLibraryActive =
    location.pathname === "/varieties" || location.pathname === "/species";

  return (
    <>
      <Navbar bg="white" expand="lg" className="shadow-sm py-2 sticky-top">
        <Container fluid className="px-3 px-xl-5">
          {/* 1. LOGO TRANG CHỦ */}
          <Navbar.Brand
            as={Link}
            to="/"
            className="d-flex align-items-center text-success fw-bolder fs-4 me-4"
          >
            <FaLeaf className="me-2" /> PlantDB
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />

          <Navbar.Collapse id="basic-navbar-nav">
            {/* 2. CÁC LIÊN KẾT ĐIỀU HƯỚNG CHÍNH */}
            <Nav className="gap-1 gap-lg-2 my-3 my-lg-0 align-items-lg-center">
              <Nav.Link
                as={NavLink}
                to="/"
                className="fw-medium d-flex align-items-center rounded px-3 py-2 transition-all nav-item-custom"
                title="Trang chủ"
              >
                <FaHome className="me-2 opacity-75" /> Trang chủ
              </Nav.Link>

              {/* DROPDOWN MENU KÈM BỘ LỌC ĐỘ TRỄ HOVER & PHÂN TÁCH LINK RIÊNG BIỆT */}
              <NavDropdown
                title={
                  <span className="d-flex align-items-center">
                    <FaBookOpen className="me-2 opacity-75" /> Thư viện Thực vật{" "}
                    <FaAngleDown className="ms-1 dropdown-chevron" size={12} />
                  </span>
                }
                id="library-botanical-dropdown"
                className={`fw-medium rounded nav-dropdown-custom ${isLibraryActive ? "active-dropdown" : ""}`}
                show={showDropdown}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {/* Phân nhóm Đơn vị dưới loài & Loài */}
                <div
                  className="dropdown-menu-header small text-muted px-3 py-1 fw-bold text-uppercase border-bottom bg-light bg-opacity-50"
                  style={{ fontSize: "0.65rem", letterSpacing: "0.5px" }}
                >
                  Đơn vị mẫu vật & Cấp loài
                </div>
                <NavDropdown.Item
                  onClick={() => handleDropdownNavigate("variety")}
                >
                  🌱 Danh mục Biến thể / Giống cây (Variety)
                  <span className="badge bg-success ms-2">⭐</span>
                </NavDropdown.Item>

                <NavDropdown.Item
                  onClick={() => handleDropdownNavigate("species")}
                >
                  🌿 Danh mục Loài thực vật (Species)
                  <span className="badge bg-success ms-2">⭐</span>
                </NavDropdown.Item>

                {/* Phân nhóm Hệ thống phân loại học học nâng cao */}
                <div
                  className="dropdown-menu-header small text-muted px-3 py-1 fw-bold text-uppercase border-top border-bottom bg-light bg-opacity-50"
                  style={{ fontSize: "0.65rem", letterSpacing: "0.5px" }}
                >
                  Hệ thống phân loại học học nâng cao
                </div>
                <NavDropdown.Item
                  onClick={() => handleDropdownNavigate("genus")}
                >
                  🍀 Danh mục Chi thực vật{" "}
                  <small className="text-muted fst-italic ms-1">(Genus)</small>
                </NavDropdown.Item>
                <NavDropdown.Item
                  onClick={() => handleDropdownNavigate("family")}
                >
                  🌴 Danh mục Họ thực vật{" "}
                  <small className="text-muted fst-italic ms-1">(Family)</small>
                </NavDropdown.Item>
                <NavDropdown.Item
                  onClick={() => handleDropdownNavigate("order")}
                >
                  🍁 Danh mục Bộ thực vật{" "}
                  <small className="text-muted fst-italic ms-1">(Order)</small>
                </NavDropdown.Item>
                <NavDropdown.Item
                  onClick={() => handleDropdownNavigate("class")}
                >
                  🌾 Danh mục Lớp thực vật{" "}
                  <small className="text-muted fst-italic ms-1">(Class)</small>
                </NavDropdown.Item>
                <NavDropdown.Item
                  onClick={() => handleDropdownNavigate("phylum")}
                >
                  🍂 Danh mục Ngành thực vật{" "}
                  <small className="text-muted fst-italic ms-1">(Phylum)</small>
                </NavDropdown.Item>
              </NavDropdown>

              {/* <Nav.Link 
                            as={NavLink} 
                            to="/taxonomy-explorer" 
                            className="fw-medium d-flex align-items-center rounded px-3 py-2 transition-all nav-item-custom"
                        >
                            <FaProjectDiagram className="me-2 opacity-75" /> Sơ đồ Phân loại
                        </Nav.Link> */}
            </Nav>

            {/* 3. THANH TÌM KIẾM TRA CỨU NHANH NHỎ GỌN */}
            {!isHomePage && (
              <Form
                className="d-flex flex-grow-1 mx-lg-4 my-2 my-lg-0 align-items-center position-relative"
                style={{ maxWidth: "520px" }}
                onSubmit={handleSearchSubmit}
                ref={formRef}
              >
                {/* 🌟 ĐƯA BẢO VỆ OVERFLOW VÀO INPUTGROUP ĐỂ ĐỒNG BỘ NỀN PILL CHUẨN */}
                <InputGroup className="flex-grow-1 shadow-sm rounded-pill bg-light border border-success border-opacity-25 overflow-hidden">
                  {/* 🌟 BƯỚC 1: Di chuyển Form.Select VÀO TRONG này, thu gọn chiều rộng vừa vặn */}
                  <Form.Select
                    value={searchRank}
                    onChange={(e) => setSearchRank(e.target.value)}
                    className="border-0 shadow-none fw-bold text-success bg-transparent pe-0 cursor-pointer font-sans"
                    style={{
                      width: "130px",
                      flex: "0 0 auto",
                      fontSize: "0.85rem",
                      paddingLeft: "12px",
                    }}
                  >
                    <option value="phylum">Ngành (Phylum)</option>
                    <option value="class">Lớp (Class)</option>
                    <option value="order">Bộ (Order)</option>
                    <option value="family">Họ (Family)</option>
                    <option value="genus">Chi (Genus)</option>
                    <option value="species">Loài (Species)</option>
                    <option value="variety">Biến thể (Variety)</option>
                  </Form.Select>

                  {/* 🌟 BƯỚC 2: Thêm thanh chia dọc tối giản (Gặp trong ảnh 1) tạo khoảng cách nhẹ với ô nhập */}
                  {/* <div className="vr my-2 bg-secondary bg-opacity-25" style={{ width: '1px' }}></div> */}

                  {/* Ô nhập văn bản kế thừa khoảng cách đệm hoàn hảo */}
                  <Form.Control
                    placeholder="Nhập danh pháp, tên cây..."
                    className="border-0 bg-transparent py-2 focus-ring-0 small font-sans"
                    style={{ fontSize: "0.88rem", paddingLeft: "0px" }} // Khoảng cách cách vạch ngăn 12px
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />

                  <Button
                    variant="light"
                    className=" border-success border-opacity-g-transparent text-muted px-2.5 transition-all"
                    onClick={() => {
                      Swal.fire({
                        toast: true,
                        position: "top-end",
                        icon: "info",
                        title:
                          "Tính năng nhận diện bằng hình ảnh đang phát triển",
                        showConfirmButton: false,
                        timer: 3500,
                        timerProgressBar: true,
                      });
                    }}
                  >
                    <FaCamera size={14} />
                  </Button>
                  <Button
                    type="submit"
                    variant="success"
                    className="rounded-end-pill px-3.5 border-0 d-flex align-items-center justify-content-center"
                  >
                    <FaSearch size={13} />
                  </Button>
                </InputGroup>

                <OverlayTrigger
                  trigger={["hover", "focus"]}
                  placement="bottom"
                  overlay={searchHelpPopover}
                >
                  <div className="ms-2 cursor-pointer text-muted hover-text-success transition-all d-none d-sm-block">
                    <FaInfoCircle size={17} />
                  </div>
                </OverlayTrigger>
              </Form>
            )}

            {/* 4. KHU VỰC ĐIỀU HƯỚNG QUẢN TRỊ (ADMIN) */}
            {/* <Nav className="ms-lg-auto mt-3 mt-lg-0 align-items-center">
                        <Nav.Link 
                            onClick={() => navigate('/login')}
                            className="text-muted d-flex align-items-center px-3 py-2 rounded admin-btn-custom"
                            title="Đăng nhập quản trị"
                        >
                            <FaUserShield size={18} />
                            <span className="ms-2 d-lg-none fw-medium">Đăng nhập Admin</span>
                        </Nav.Link>
                    </Nav>  */}
          </Navbar.Collapse>
        </Container>

        <style>{`
                .focus-ring-0:focus {
                    box-shadow: none !important;
                    border-color: rgba(25, 135, 84, 0.25) !important;
                    background-color: #fff !important;
                }
                
                .nav-item-custom { color: #495057 !important; }
                .nav-item-custom:hover, .nav-dropdown-custom:hover > a { background-color: #f8f9fa; color: #198754 !important; }
                .nav-item-custom.active { background-color: rgba(25, 135, 84, 0.1); color: #198754 !important; font-weight: 600 !important; }
                
                /* Định hình cấu trúc CSS mở rộng cho Dropdown Menu */
                .nav-dropdown-custom > a {
                    padding: 8px 16px !important;
                    color: #495057 !important;
                    display: flex;
                    align-items: center;
                    transition: all 0.2s;
                }
                .active-dropdown > a, .nav-dropdown-custom.show > a {
                    background-color: rgba(25, 135, 84, 0.1) !important;
                    color: #198754 !important;
                    font-weight: 600 !important;
                }
                .nav-dropdown-custom .dropdown-menu {
                    border: 0 !important;
                    box-shadow: 0 10px 35px rgba(0,0,0,0.08) !important;
                    border-radius: 14px !important;
                    padding: 6px 0 !important;
                    margin-top: 2px !important;
                    border-top: 6px solid transparent !important; /* Vùng đệm vô hình giữ chuột liên tục */
                    overflow: hidden;
                    animation: navDropdownFadeIn 0.2s ease-in-out;
                }
                .nav-dropdown-custom .dropdown-item {
                    padding: 9.5px 22px !important;
                    font-size: 0.88rem !important;
                    color: #4a5568 !important;
                    font-weight: 500;
                    transition: all 0.15s ease-in-out;
                }
                .nav-dropdown-custom .dropdown-item:hover {
                    background-color: rgba(25, 135, 84, 0.08) !important;
                    color: #198754 !important;
                    padding-left: 26px !important; /* Dịch chuyển nhẹ sang phải tạo cảm giác phản hồi mượt */
                }
                .dropdown-toggle::after { display: none !important; } 
                .nav-dropdown-custom:hover .dropdown-chevron, .nav-dropdown-custom.show .dropdown-chevron { transform: rotate(180deg); color: #198754; }
                .dropdown-chevron { transition: transform 0.2s ease; }

                .admin-btn-custom:hover { color: #198754 !important; background-color: #f8f9fa; }
                .hover-text-success:hover { color: #198754 !important; }
                .cursor-pointer { cursor: pointer; }
                .transition-all { transition: all 0.2s ease-in-out; }

                @keyframes navDropdownFadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
      </Navbar>

      <ImageSearchModal
        show={showImageSearchModal}
        onHide={() => setShowImageSearchModal(false)}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        formRef={formRef}
      />
    </>
  );
};

export default GuestNavbar;
