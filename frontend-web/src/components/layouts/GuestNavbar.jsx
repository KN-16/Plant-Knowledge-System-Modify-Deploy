import React, { useState, useRef } from 'react';
import { Navbar, Container, Form, InputGroup, Button, Nav, OverlayTrigger, Popover, NavDropdown } from 'react-bootstrap';
import { FaLeaf, FaSearch, FaCamera, FaUserShield, FaBookOpen, FaProjectDiagram, FaHome, FaInfoCircle, FaAngleDown } from 'react-icons/fa';
import { Link, NavLink, useNavigate, useLocation, createSearchParams } from 'react-router-dom';
import ImageSearchModal from '../modal/ImageSearchModal';

const GuestNavbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    
    const [searchValue, setSearchValue] = useState('');
    const formRef = useRef(null);
    const [showImageSearchModal, setShowImageSearchModal] = useState(false);

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
        if (searchValue.trim() !== '') {
            navigate({
                pathname: '/varieties', 
                search: createSearchParams({ search: searchValue.trim() }).toString()
            });
        }
    };

    // 🛠️ ĐIỀU CHỈNH LOGIC ĐIỀU HƯỚNG PHÂN LUỒNG QUERIES ĐA BẬC THEO YÊU CẦU MỚI
    const handleDropdownNavigate = (rankType) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setShowDropdown(false); 

        if (rankType === 'variety') {
            // Tuyến đường (Link) dành riêng cho cấp bậc Biến thể / Giống cây trồng
            navigate({
                pathname: '/varieties',
                search: createSearchParams({ page: 1 }).toString()
            });
        } else {
            // Tuyến đường chung sử dụng display_rank query cho toàn bộ hệ thống phân loại học nâng cao
            navigate({
                pathname: '/species', // Bạn có thể sửa thành '/library' tùy theo cấu hình Route của SpeciesLibraryPage
                search: createSearchParams({ display_rank: rankType , sort: 'image_count_desc', limit: 12, page: 1}).toString()
            });
        }
    };

    const searchHelpPopover = (
        <Popover id="popover-search-help" className="shadow border-success border-opacity-25 rounded-4">
            <Popover.Header as="h3" className="bg-success bg-opacity-10 text-success fw-bold border-bottom-0 rounded-top-4">
                💡 Mẹo tìm kiếm thông minh
            </Popover.Header>
            <Popover.Body className="text-muted small">
                <p className="mb-2">Bạn có thể nhập bất kỳ từ khóa nào để tìm kiếm, hệ thống sẽ đối chiếu trên toàn bộ thông tin về cây:</p>
                <ul className="mb-0 ps-3">
                    <li className="mb-1"><b>Tên cây:</b> Tên tiếng Việt hoặc tên khoa học (VD: <i>Đinh lăng, Polyscias</i>)</li>
                    <li className="mb-1"><b>Tên gọi khác:</b> Tên địa phương, tên đồng nghĩa</li>
                    <li className="mb-1"><b>Đặc điểm nổi bật:</b> Hình thái như lá, thân, màu sắc... (VD: lá nhỏ, viền trắng)</li>
                    <li className="mb-1"><b>Công dụng:</b> Làm thuốc, làm cảnh, hoặc mục đích sử dụng khác</li>
                    <li className="mb-1"><b>Phân loại:</b> Tên loài, chi hoặc họ thực vật</li>
                    <li><b>Mã nội bộ:</b> Mã quản lý trong hệ thống (VD: <i>VAR-0001</i>)</li>
                </ul>
            </Popover.Body>
        </Popover>
    );

    // Kiểm tra active trạng thái sáng đèn cho Dropdown Thư viện thực vật
    const isLibraryActive = location.pathname === '/varieties' || location.pathname === '/species';

    return (
        <>
        <Navbar bg="white" expand="lg" className="shadow-sm py-2 sticky-top">
            <Container fluid className="px-3 px-xl-5">
                {/* 1. LOGO TRANG CHỦ */}
                <Navbar.Brand as={Link} to="/" className="d-flex align-items-center text-success fw-bolder fs-4 me-4">
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
                                    <FaBookOpen className="me-2 opacity-75" /> Thư viện Thực vật <FaAngleDown className="ms-1 dropdown-chevron" size={12}/>
                                </span>
                            }
                            id="library-botanical-dropdown"
                            className={`fw-medium rounded nav-dropdown-custom ${isLibraryActive ? 'active-dropdown' : ''}`}
                            show={showDropdown}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            {/* Phân nhóm Đơn vị dưới loài & Loài */}
                            <div className="dropdown-menu-header small text-muted px-3 py-1 fw-bold text-uppercase border-bottom bg-light bg-opacity-50" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                                Đơn vị mẫu vật & Cấp loài
                            </div>
                            <NavDropdown.Item onClick={() => handleDropdownNavigate('variety')}>
                                 🌱 Danh mục Biến thể / Giống cây (Variety)
                                 <span className="badge bg-success ms-2">⭐</span>
                            </NavDropdown.Item>

                            <NavDropdown.Item onClick={() => handleDropdownNavigate('species')}>
                                🌿 Danh mục Loài thực vật (Species)
                                <span className="badge bg-success ms-2">⭐</span>
                            </NavDropdown.Item>

                            {/* Phân nhóm Hệ thống phân loại học học nâng cao */}
                            <div className="dropdown-menu-header small text-muted px-3 py-1 fw-bold text-uppercase border-top border-bottom bg-light bg-opacity-50" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                                Hệ thống phân loại học học nâng cao
                            </div>
                            <NavDropdown.Item onClick={() => handleDropdownNavigate('genus')}>
                                🍀 Danh mục Chi thực vật <small className="text-muted fst-italic ms-1">(Genus)</small>
                            </NavDropdown.Item>
                            <NavDropdown.Item onClick={() => handleDropdownNavigate('family')}>
                                🌴 Danh mục Họ thực vật <small className="text-muted fst-italic ms-1">(Family)</small>
                            </NavDropdown.Item>
                            <NavDropdown.Item onClick={() => handleDropdownNavigate('order')}>
                                🍁 Danh mục Bộ thực vật <small className="text-muted fst-italic ms-1">(Order)</small>
                            </NavDropdown.Item>
                            <NavDropdown.Item onClick={() => handleDropdownNavigate('class')}>
                                🌾 Danh mục Lớp thực vật <small className="text-muted fst-italic ms-1">(Class)</small>
                            </NavDropdown.Item>
                            <NavDropdown.Item onClick={() => handleDropdownNavigate('phylum')}>
                                🍂 Danh mục Ngành thực vật <small className="text-muted fst-italic ms-1">(Phylum)</small>
                            </NavDropdown.Item>
                        </NavDropdown>
                        
                        <Nav.Link 
                            as={NavLink} 
                            to="/taxonomy-explorer" 
                            className="fw-medium d-flex align-items-center rounded px-3 py-2 transition-all nav-item-custom"
                        >
                            <FaProjectDiagram className="me-2 opacity-75" /> Sơ đồ Phân loại
                        </Nav.Link>
                    </Nav>

                    {/* 3. THANH TÌM KIẾM TRA CỨU NHANH NHỎ GỌN */}
                    {!isHomePage && (
                        <Form 
                            className="d-flex flex-grow-1 mx-lg-4 my-2 my-lg-0 align-items-center position-relative" 
                            style={{ maxWidth: '450px' }}
                            onSubmit={handleSearchSubmit}
                            ref={formRef}
                        >
                            <InputGroup className="flex-grow-1 shadow-sm rounded-pill bg-light">
                                <Form.Control 
                                    placeholder="Xem hướng dẫn tìm kiếm..." 
                                    className="rounded-start-pill border-success border-opacity-25 bg-transparent px-4 py-2 border-end-0 focus-ring-0" 
                                    style={{ fontSize: '0.95rem' }}
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                />
                                <Button variant="light" className="border-top border-bottom border-success border-opacity-25 bg-transparent text-muted px-3"
                                    onClick={() => setShowImageSearchModal(true)}>
                                    <FaCamera />
                                </Button>
                                <Button type="submit" variant="success" className="rounded-end-pill px-4">
                                    <FaSearch />
                                </Button>
                            </InputGroup>

                            <OverlayTrigger trigger={['hover', 'focus']} placement="bottom" overlay={searchHelpPopover}>
                                <div className="ms-2 cursor-pointer text-muted hover-text-success transition-all d-none d-sm-block">
                                    <FaInfoCircle size={18} />
                                </div>
                            </OverlayTrigger>
                        </Form>
                    )}

                    {/* 4. KHU VỰC ĐIỀU HƯỚNG QUẢN TRỊ (ADMIN) */}
                    <Nav className="ms-lg-auto mt-3 mt-lg-0 align-items-center">
                        <Nav.Link 
                            onClick={() => navigate('/login')}
                            className="text-muted d-flex align-items-center px-3 py-2 rounded admin-btn-custom"
                            title="Đăng nhập quản trị"
                        >
                            <FaUserShield size={18} />
                            <span className="ms-2 d-lg-none fw-medium">Đăng nhập Admin</span>
                        </Nav.Link>
                    </Nav> 
                    
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