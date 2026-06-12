import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Badge,
  Spinner,
} from "react-bootstrap";
import {
  FaSearch,
  FaCamera,
  FaTree,
  FaLeaf,
  FaDna,
  FaGlobeAsia,
  FaImages,
  FaSeedling,
  FaInfoCircle,
  FaCheck,
  FaFilter,
  FaProjectDiagram,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import publicService from "../../../services/publicService";
import "./HomePage.css";
import TaxonomyCarousel from "../../../components/common/TaxonomyCarousel";
import ImageSearchModal from "../../../components/modal/ImageSearchModal";
import Swal from "sweetalert2";

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchRank, setSearchRank] = useState("species"); // Mặc định tìm kiếm theo cấp bậc Loài
  const [loading, setLoading] = useState(true);

  const [homeData, setHomeData] = useState({
    stats: {
      totalPhyla: 0,
      totalClasses: 0,
      totalOrders: 0,
      totalFamilies: 0,
      totalGenera: 0,
      totalSpecies: 0,
      totalVarieties: 0,
      totalImages: 0,
    },
    latestSpecies: [],
    latestVarieties: [],
  });

  const [showImageSearchModal, setShowImageSearchModal] = useState(false);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const data = await publicService.getHomeData();
        setHomeData(data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu trang chủ:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const element = document.getElementById(location.hash.replace("#", ""));
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm?.trim() && searchTerm.trim() !== "") {
      // Điều hướng sang trang gốc đính kèm cờ phân tầng display_rank tương ứng cấu trúc tra cứu công khai
      navigate(
        `/taxonomy?search=${encodeURIComponent(searchTerm.trim())}&display_rank=${searchRank}`,
      );
    }
  };

  const handleImageSearch = () => {
    // Tính năng đang phát triển
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "info",
      title: "Tính năng nhận diện bằng hình ảnh đang phát triển",
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true,
    });
    // setShowImageSearchModal(true);
  };

  const handleTagClick = (tag) => {
    navigate(`/species?search=${encodeURIComponent(tag)}&display_rank=species`);
  };

  return (
    <div className="homepage-wrapper bg-light font-sans">
      <Helmet>
        <title>PlantDB | Nền Tảng Số Hóa Hình Thái Thực Vật</title>
        <meta
          name="description"
          content="Khám phá đa dạng sinh học với PlantDB - hệ thống cơ sở dữ liệu hình thái thực vật, hỗ trợ tra cứu, định danh chuẩn khoa học."
        />
      </Helmet>

      {/* 1. HERO SECTION */}
      <section
        className="hero-section position-relative d-flex flex-column align-items-center justify-content-center text-center"
        style={{
          background:
            'linear-gradient(rgba(30, 70, 50, 0.85), rgba(20, 50, 35, 0.9)), url("/images/hero-bg.jpg") center/cover no-repeat',
          padding: "100px 0 180px 0",
        }}
      >
        <Container className="z-2">
          <Badge
            bg="warning"
            text="dark"
            className="mb-4 px-4 py-2 text-uppercase rounded-pill fw-bold shadow-sm"
            style={{ letterSpacing: "1px" }}
          >
            <FaGlobeAsia className="me-2" /> Nền Tảng Dữ Liệu Thực Vật Học
          </Badge>

          <h1 className="display-4 fw-bolder mb-3 text-white text-shadow-sm">
            Khám Phá <span className="text-warning">Đa Dạng Sinh Học</span>
          </h1>

          <p
            className="lead mb-4 mx-auto text-white-50"
            style={{ maxWidth: "700px", fontSize: "1.1rem" }}
          >
            Hệ sinh thái lưu trữ, tra cứu và nhận diện tự động hình thái các
            loài thực vật đặc hữu và quý hiếm tại Việt Nam.
          </p>

          {/* THANH SEARCH TÍCH HỢP HỘP CHỌN PHÂN TẦNG */}
          <div
            className="mx-auto bg-white p-2 rounded-pill shadow-lg d-flex align-items-center search-bar-container"
            style={{ maxWidth: "850px" }}
          >
            <Form
              onSubmit={handleSearch}
              className="w-100 d-flex align-items-center m-0"
            >
              {/* <FaSearch className="text-muted ms-4 me-2 fs-5 d-none d-sm-block" /> */}

              <Form.Select
                value={searchRank}
                onChange={(e) => setSearchRank(e.target.value)}
                className="border-0 shadow-none fw-bold text-success bg-transparent pe-0 cursor-pointer"
                style={{ width: "160px", fontSize: "0.9rem" }}
              >
                <option value="phylum">Ngành (Phylum)</option>
                <option value="class">Lớp (Class)</option>
                <option value="order">Bộ (Order)</option>
                <option value="family">Họ (Family)</option>
                <option value="genus">Chi (Genus)</option>
                <option value="species">Loài (Species)</option>
                <option value="variety">Biến thể (Variety)</option>
              </Form.Select>

              {/* <div className="vr mx-2 bg-secondary bg-opacity-25 d-none d-sm-block" style={{ height: '24px' }}></div> */}

              <Form.Control
                placeholder="Nhập tên khoa học, danh pháp gốc, tên thường gọi hoặc mã hệ thống..."
                className="border-0 shadow-none py-2 px-1 fs-6 bg-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button
                variant="light"
                className="rounded-circle text-success me-2 hover-bg-success-light flex-shrink-0"
                onClick={handleImageSearch}
                title="Tìm kiếm bằng Camera AI"
              >
                <FaCamera size={19} />
              </Button>
              <Button
                variant="success"
                type="submit"
                className="rounded-pill px-4 px-md-5 fw-bold flex-shrink-0"
                style={{ backgroundColor: "#198754", height: "46px" }}
              >
                TÌM KIẾM
              </Button>
            </Form>
          </div>
          {/* 
                    <div className="mt-4 d-flex justify-content-center align-items-center flex-wrap gap-2">
                        <span className="text-white-50 small me-2">Gợi ý từ khóa:</span>
                        {['Polyscias', 'Cảnh quan', 'Dược liệu', 'Thực phẩm'].map((tag, idx) => (
                            <Badge
                                key={idx}
                                bg="transparent"
                                className="border border-light border-opacity-50 text-white px-3 py-2 rounded-pill cursor-pointer hover-bg-white hover-text-success transition-all fw-normal"
                                onClick={() => handleTagClick(tag)}
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div> */}

          <div
            id="huong-dan"
            className="mx-auto mt-4 text-start rounded-4 p-4 border border-success border-opacity-50 shadow-lg text-white"
            style={{
              maxWidth: "850px",
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(16px)",
            }}
          >
            <h6 className="text-warning fw-bolder mb-4 fs-6 d-flex align-items-center justify-content-center justify-content-sm-start text-uppercase tracking-wider">
              <FaInfoCircle className="me-2 fs-5 text-warning" /> Cẩm Nang Hướng
              Dẫn Tra Cứu & Khai Thác Hệ Thống
            </h6>

            <Row className="g-4">
              {/* Ý 1: ĐỊNH HƯỚNG CẤP BẬC & ĐIỀU HƯỚNG NHANH */}
              <Col md={6} className="d-flex align-items-start">
                <div className="bg-success bg-opacity-20 p-2.5 rounded-3 me-3 flex-shrink-0 text-success border border-success border-opacity-25">
                  <FaProjectDiagram style={{ fontSize: "1.2rem" }} />
                </div>
                <div>
                  <strong
                    className="d-block text-warning small mb-1"
                    style={{ fontSize: "0.9rem" }}
                  >
                    1. Định Hướng Cấp Bậc & Điều Hướng
                  </strong>
                  <span
                    className="text-light opacity-90 lh-base d-block"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Tùy chỉnh hộp chọn Phân tầng ngay bên cạnh ô tìm kiếm (từ{" "}
                    <b>Ngành</b> xuống tới <b>Biến thể</b>) để ép hệ thống
                    chuyển luồng tra cứu chính xác. Bạn cũng có thể truy cập
                    nhanh các danh mục đa bậc này bất kỳ lúc nào thông qua thanh
                    menu thả xuống <b>"Thư viện Thực vật"</b> trên thanh điều
                    hướng chính.
                  </span>
                </div>
              </Col>

              {/* Ý 2: TRA CỨU PHỔ THÔNG VÀ LỌC HÌNH THÁI THEO MÔ TẢ */}
              <Col md={6} className="d-flex align-items-start">
                <div className="bg-success bg-opacity-20 p-2.5 rounded-3 me-3 flex-shrink-0 text-success border border-success border-opacity-25">
                  <FaFilter style={{ fontSize: "1.2rem" }} />
                </div>
                <div>
                  <strong
                    className="d-block text-warning small mb-1"
                    style={{ fontSize: "0.9rem" }}
                  >
                    2. Tra Cứu Phổ Thông & Lọc Mô Tả
                  </strong>
                  <span
                    className="text-light opacity-90 lh-base d-block"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Người dùng phổ thông tìm kiếm loài cây, cây trồng nông
                    nghiệp nên ưu tiên chọn danh mục <b>Loài (Species)</b> hoặc{" "}
                    <b>Biến thể (Variety)</b>. Trường hợp không rõ tên gọi, hãy
                    vào trang thư viện, kích hoạt các phân khu tại{" "}
                    <b>Sidebar Bộ lọc</b> để nhập mô tả hình thái đặc trưng (mép
                    lá, kiểu thân, màu hoa) nhằm thu hẹp phạm vi.
                  </span>
                </div>
              </Col>

              {/* Ý 3: PHẠM VI Ô TÌM KIẾM TỰ DO */}
              <Col md={6} className="d-flex align-items-start">
                <div className="bg-success bg-opacity-20 p-2.5 rounded-3 me-3 flex-shrink-0 text-success border border-success border-opacity-25">
                  <FaSearch style={{ fontSize: "1.2rem" }} />
                </div>
                <div>
                  <strong
                    className="d-block text-warning small mb-1"
                    style={{ fontSize: "0.9rem" }}
                  >
                    3. Phạm Vi Thanh Tìm Kiếm Tự Do
                  </strong>
                  <span
                    className="text-light opacity-90 lh-base d-block"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Thanh tìm kiếm tự do ở trang chủ chỉ tập trung nhận diện
                    nhanh các chuỗi thông tin định danh tĩnh, bao gồm:{" "}
                    <b>Mã định danh nội bộ</b> (VD: <code>SPC-000012</code>,{" "}
                    <code>VAR-000001</code>), <b>Danh pháp khoa học Latin</b>,{" "}
                    <b>Danh pháp gốc (Canonical name)</b> đã lược bỏ tên tác
                    giả, hoặc <b>Tên thường gọi</b> đa ngôn ngữ.
                  </span>
                </div>
              </Col>

              {/* Ý 4: CÔNG CỤ SO SÁNH & NHẬN DIỆN HÌNH ẢNH AI */}
              <Col md={6} className="d-flex align-items-start">
                <div className="bg-success bg-opacity-20 p-2.5 rounded-3 me-3 flex-shrink-0 text-success border border-success border-opacity-25">
                  <FaCamera style={{ fontSize: "1.2rem" }} />
                </div>
                <div>
                  <strong
                    className="d-block text-warning small mb-1"
                    style={{ fontSize: "0.9rem" }}
                  >
                    4. Nhận Diện Ảnh AI & So Sánh thực vật
                  </strong>
                  <span
                    className="text-light opacity-90 lh-base d-block"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Nhấn vào biểu tượng <b>Camera</b> trên thanh tìm kiếm để
                    kích hoạt trí tuệ nhân tạo quét và tự động đối chiếu đặc
                    trưng hình thái qua ảnh chụp thực tế. Đừng quên tận dụng
                    tính năng <b>"So sánh"</b> dưới mỗi thẻ mẫu vật tại trang
                    thư viện để thiết lập ma trận đối chiếu song song các đặc
                    điểm sinh học nâng cao giữa nhiều đối tượng.
                  </span>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      {/* 2. STATS SECTION - LƯỚI THỐNG KÊ 8 CHỈ SỐ TOÀN DIỆN */}
      <section
        className="position-relative"
        style={{ marginTop: "-50px", zIndex: 10 }}
      >
        <Container>
          <Row className="g-3 row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-4 justify-content-center">
            {[
              {
                title: "Ngành (Phylum)",
                count: homeData.stats.totalPhyla,
                color: "#198754",
                icon: <FaProjectDiagram />,
              },
              {
                title: "Lớp (Class)",
                count: homeData.stats.totalClasses,
                color: "#0d6efd",
                icon: <FaDna />,
              },
              {
                title: "Bộ (Order)",
                count: homeData.stats.totalOrders,
                color: "#712cf9",
                icon: <FaTree />,
              },
              {
                title: "Họ (Family)",
                count: homeData.stats.totalFamilies,
                color: "#6f42c1",
                icon: <FaFilter />,
              },
              {
                title: "Chi (Genus)",
                count: homeData.stats.totalGenera,
                color: "#e83e8c",
                icon: <FaSeedling />,
              },
              {
                title: "Loài (Species)",
                count: homeData.stats.totalSpecies,
                color: "#fd7e14",
                icon: <FaLeaf />,
              },
              {
                title: "Biến thể (Variety)",
                count: homeData.stats.totalVarieties,
                color: "#dc3545",
                icon: <FaCheck />,
              },
              {
                title: "Ảnh Số Hóa Nội Bộ",
                count: homeData.stats.totalImages,
                color: "#20c997",
                icon: <FaImages />,
              },
            ].map((stat, idx) => (
              <Col key={idx}>
                <Card className="border-0 shadow-sm h-100 rounded-4 stat-card bg-white p-2">
                  <Card.Body className="p-3 d-flex align-items-center text-start">
                    {/* Khối chứa Icon cấu trúc màu nền trong suốt 10% phủ bọc ngoài */}
                    <div
                      className="stat-icon-wrapper rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                      style={{
                        backgroundColor: `${stat.color}15`, // Thêm đuôi '15' để kích hoạt sắc độ trong suốt Hex Alpha 10%
                        color: stat.color,
                        width: "46px",
                        height: "46px",
                      }}
                    >
                      {stat.icon}
                    </div>

                    {/* Khối hiển thị số lượng */}
                    <div className="overflow-hidden w-100">
                      <h3
                        className="fw-bolder mb-0 text-dark d-flex align-items-baseline font-sans lh-1"
                        style={{ fontSize: "1.5rem" }}
                      >
                        {loading ? (
                          <Spinner
                            size="sm"
                            animation="border"
                            style={{ color: stat.color }}
                          />
                        ) : (
                          stat.count
                        )}
                        <span
                          className="ms-0.5 fs-6 fw-bold"
                          style={{ color: stat.color }}
                        >
                          +
                        </span>
                      </h3>
                      <p
                        className="text-muted small fw-bold mb-0 text-truncate mt-1"
                        style={{ fontSize: "0.72rem", letterSpacing: "0.2px" }}
                      >
                        {stat.title}
                      </p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* 3. VỀ DỰ ÁN PLANTDB */}
      <section id="gioi-thieu" className="py-5 mt-4 bg-white overflow-hidden">
        <Container className="py-4">
          <Row className="align-items-center g-5">
            <Col lg={6} className="pe-lg-5 z-2">
              <div
                className="d-inline-flex align-items-center bg-success bg-opacity-10 text-success px-3 py-2 text-uppercase rounded-pill fw-bold mb-3"
                style={{ fontSize: "0.8rem", letterSpacing: "1px" }}
              >
                <FaTree className="me-2 fs-6" /> Về Dự Án PlantDB
              </div>
              <h2 className="display-5 fw-bolder mb-4 text-dark lh-sm">
                Nền Tảng Số Hóa <br />
                <span className="text-success position-relative">
                  Sinh Thái Học
                  <svg
                    className="position-absolute start-0 w-100"
                    style={{ bottom: "-8px", height: "12px" }}
                    viewBox="0 0 200 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 10C60 -2 140 -2 198 10"
                      stroke="#198754"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeOpacity="0.3"
                    />
                  </svg>
                </span>
              </h2>
              <p
                className="text-secondary mb-5"
                style={{ fontSize: "1.1rem", lineHeight: "1.8" }}
              >
                PlantDB cung cấp hệ thống quản trị và tra cứu hình thái cây
                trồng chuyên sâu. Kiến trúc dữ liệu được thiết kế chuẩn khoa
                học, hỗ trợ đắc lực cho sinh viên, nhà nghiên cứu và người đam
                mê thực vật học.
              </p>
              <Row className="g-3 mt-2">
                <Col sm={4} xs={12}>
                  <Card className="border border-light bg-white rounded-4 h-100 transition-all hover-lift shadow-sm">
                    <Card.Body className="p-4">
                      <div className="bg-success bg-opacity-10 d-inline-block p-3 rounded-circle mb-3">
                        <FaGlobeAsia className="text-success fs-4" />
                      </div>
                      <h6 className="fw-bold text-dark mb-2">
                        Hệ sinh thái VN
                      </h6>
                      <p
                        className="text-muted mb-0"
                        style={{ fontSize: "0.85rem" }}
                      >
                        Thực vật đặc hữu & đa dạng sinh học.
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm={4} xs={12}>
                  <Card className="border border-light bg-white rounded-4 h-100 transition-all hover-lift shadow-sm">
                    <Card.Body className="p-4">
                      <div className="bg-primary bg-opacity-10 d-inline-block p-3 rounded-circle mb-3">
                        <FaDna className="text-primary fs-4" />
                      </div>
                      <h6 className="fw-bold text-dark mb-2">
                        Phân loại chuẩn
                      </h6>
                      <p
                        className="text-muted mb-0"
                        style={{ fontSize: "0.85rem" }}
                      >
                        Cấu trúc phân cấp chuẩn khoa học.
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm={4} xs={12}>
                  <Card className="border border-light bg-white rounded-4 h-100 transition-all hover-lift shadow-sm">
                    <Card.Body className="p-4">
                      <div className="bg-warning bg-opacity-10 d-inline-block p-3 rounded-circle mb-3">
                        <FaCamera className="text-warning fs-4" />
                      </div>
                      <h6 className="fw-bold text-dark mb-2">Tích hợp AI</h6>
                      <p
                        className="text-muted mb-0"
                        style={{ fontSize: "0.85rem" }}
                      >
                        Trích xuất tư liệu thông minh qua ảnh chụp.
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>

            <Col
              lg={6}
              className="text-center position-relative mt-5 mt-lg-0 px-md-4 overflow-hidden rounded-5"
            >
              <div
                className="position-absolute bg-success rounded-circle z-0"
                style={{
                  width: "350px",
                  height: "350px",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  opacity: "0.15",
                  filter: "blur(60px)",
                }}
              ></div>
              <div
                className="position-relative z-1 d-inline-block w-100"
                style={{ maxWidth: "500px" }}
              >
                <img
                  src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1000&auto=format&fit=crop"
                  alt="About PlantDB"
                  className="img-fluid rounded-5 shadow-lg position-relative z-1 img-about-main"
                  style={{
                    width: "100%",
                    objectFit: "cover",
                    height: "550px",
                    border: "6px solid white",
                  }}
                />
                <div
                  className="position-absolute bottom-0 start-0 ms-n3 mb-4 bg-white p-3 rounded-4 shadow-lg d-flex align-items-center z-3 border border-light mobile-floating"
                  style={{
                    animation: "float-up-down 3.5s ease-in-out infinite",
                  }}
                >
                  <div className="bg-success bg-opacity-10 p-3 rounded-circle me-3">
                    <FaSearch className="text-success fs-4" />
                  </div>
                  <div className="text-start pe-3">
                    <h6
                      className="fw-bolder mb-1 text-dark"
                      style={{ fontSize: "0.95rem" }}
                    >
                      AI Plant Scanner
                    </h6>
                    <span
                      className="text-muted fw-medium"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Nhận diện từ hình ảnh
                    </span>
                  </div>
                </div>
                <div
                  className="position-absolute top-0 end-0 mt-5 me-n3 bg-white p-2 px-3 rounded-pill shadow-lg d-flex align-items-center z-3 border border-light mobile-floating"
                  style={{
                    animation: "float-up-down 4s ease-in-out infinite reverse",
                  }}
                >
                  <div className="bg-dark p-1 rounded-circle me-2 d-flex">
                    <FaCheck
                      className="text-white fs-6"
                      style={{ padding: "2px" }}
                    />
                  </div>
                  <span
                    className="fw-bold text-dark"
                    style={{ fontSize: "0.8rem" }}
                  >
                    Cơ sở dữ liệu mở
                  </span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 4. CAROUSEL 1: LOÀI THỰC VẬT MỚI NHẤT */}
      <section className="pt-4 pb-2 bg-light border-top">
        <Container>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
            </div>
          ) : (
            <TaxonomyCarousel
              title="Loài Thực Vật Mới Cập Nhật"
              subtitle="KHÁM PHÁ LOÀI"
              data={homeData.latestSpecies}
              type="species"
            />
          )}
        </Container>
      </section>

      {/* 5. CAROUSEL 2: BIẾN THỂ VÀ GIỐNG MỚI NHẤT */}
      <section className="py-4 pb-2 bg-white border-top">
        <Container>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
            </div>
          ) : (
            <TaxonomyCarousel
              title="Biến Thể Mới Cập Nhật"
              subtitle="KHÁM PHÁ BIẾN THỂ"
              data={homeData.latestVarieties}
              type="variety"
            />
          )}
        </Container>
      </section>

      <ImageSearchModal
        show={showImageSearchModal}
        onHide={() => setShowImageSearchModal(false)}
      />

      {/* CSS NHÚNG PHÒNG VỆ CHỐNG TRÀN VÀ TỐI ƯU HOÀN HẢO CHO MOBILE */}
      <style>{`
                .hover-lift { cursor: default; }
                .hover-lift:hover { transform: translateY(-8px); box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important; border-color: #198754 !important; }
                @keyframes float-up-down {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                    100% { transform: translateY(0); }
                }
                @media (max-width: 991.98px) {
                    .img-about-main { height: 360px !important; }
                    .mobile-floating { display: none !important; } /* Gỡ bỏ thành phần trôi nổi khuất tầm nhìn trên Mobile */
                }
                @media (max-width: 576px) {
                    .search-bar-container { border-radius: 24px !important; padding: 10px !important; flex-wrap: wrap; }
                    .search-bar-container select { width: 100% !important; margin-bottom: 8px; border-bottom: 1px solid #eee !important; }
                }
            `}</style>
    </div>
  );
};

export default HomePage;
