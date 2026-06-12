import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Badge,
  Card,
  Spinner,
  Modal,
  Table,
  Button,
} from "react-bootstrap";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  FaLeaf,
  FaTree,
  FaPalette,
  FaGlobeAsia,
  FaDna,
  FaArrowLeft,
  FaInfoCircle,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaChevronDown,
  FaChevronUp,
  FaBook,
  FaHistory,
  FaImages,
  FaSearchPlus,
} from "react-icons/fa";
import PartImageCarousel from "../../components/common/PartImageCarousel";
import publicService from "../../services/publicService";
import { Helmet } from "react-helmet-async";

const TaxonomyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Đọc cấp bậc rank hiện tại từ query param (Ví dụ: ?rank=genus), mặc định là species
  const queryParams = new URLSearchParams(location.search);
  const currentRank = queryParams.get("rank") || "species";

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const [detailData, setDetailData] = useState(null);
  const [uiMapping, setUiMapping] = useState({});
  const [loading, setLoading] = useState(true);
  const [enlargedImg, setEnlargedImage] = useState(null);

  // State kiểm soát đóng mở Modal Hồ sơ khoa học nâng cao
  const [showTaxonomyModal, setShowTaxonomyModal] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    leaf: true,
    stem: true,
    flower: true,
    ho_special: true,
    images: true,
    history: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    const fetchTaxonomyDetail = async () => {
      setLoading(true);
      try {
        const sessionKey = `viewed_${currentRank}_${id}`;
        const hasViewed = sessionStorage.getItem(sessionKey);

        const shouldIncrement = !hasViewed;
        if (shouldIncrement) {
          sessionStorage.setItem(sessionKey, "true");
        }
        // Sử dụng hàm gọi API chi tiết đa bậc
        const [res, mappingRes] = await Promise.all([
          publicService.getTaxonomyDetail(id, currentRank, shouldIncrement),
          publicService.getUIEnumMapping(),
        ]);
        setDetailData(res.data || res); // Phòng vệ an toàn cho cả 2 kiểu bọc dữ liệu của Axios
        setUiMapping(mappingRes);
      } catch (error) {
        console.error("Lỗi trích xuất hồ sơ khoa học:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTaxonomyDetail();
  }, [id, currentRank]);

  if (loading)
    return (
      <div className="text-center py-5 mt-5">
        <Spinner animation="border" variant="success" />
      </div>
    );
  if (!detailData || !detailData.entity)
    return (
      <div className="text-center py-5">
        <h4>Không tìm thấy dữ liệu cấp bậc phân loại thực vật.</h4>
      </div>
    );

  const { entity, groupedCommonNames, taxonomyHistory, taxonomyImages } =
    detailData;

  // Xử lý kho tư liệu ảnh tổng
  const swiperImages = taxonomyImages.map((img) => ({
    plant_image_id: img.id,
    url: img.url,
    is_background: img.is_background,
    is_external: img.is_external,
  }));
  const isExternalImage = taxonomyImages[0]?.is_external || false;

  const coverRecord =
    taxonomyImages.find((img) => img.is_background) || taxonomyImages[0];
  const coverUrl = coverRecord
    ? coverRecord.is_external
      ? coverRecord.url
      : `${backendUrl}${coverRecord.url}`
    : "/default-plant.png";

  // Khai phá cây phả hệ lồng nhau ngược tuyến tính
  const getTaxonomyChain = () => {
    let phylum = null,
      cls = null,
      order = null,
      family = null,
      genus = null,
      species = null;
    if (currentRank === "variety") {
      species = entity.Species;
      genus = species?.Genus;
      family = genus?.Family;
      order = family?.Order;
      cls = order?.Class;
      phylum = cls?.Phylum;
    } else if (currentRank === "species") {
      genus = entity.Genus;
      family = genus?.Family;
      order = family?.Order;
      cls = order?.Class;
      phylum = cls?.Phylum;
    } else if (currentRank === "genus") {
      family = entity.Family;
      order = family?.Order;
      cls = order?.Class;
      phylum = cls?.Phylum;
    } else if (currentRank === "family") {
      order = entity.Order;
      cls = order?.Class;
      phylum = cls?.Phylum;
    } else if (currentRank === "order") {
      cls = entity.Class;
      phylum = cls?.Phylum;
    } else if (currentRank === "class") {
      phylum = entity.Phylum;
    }
    return { phylum, class: cls, order, family, genus, species };
  };

  const chain = getTaxonomyChain();

  // RENDER BỘ 3 TÊN CHO HỒ SƠ PHẢ HỆ TRONG MODAL
  const renderTaxonomyRow = (title, labelRank, nodeData, targetRankId) => {
    // Nguyên tắc: Cấp chi tiết hiện tại thì bỏ qua không hiển thị trong bảng phả hệ
    if (currentRank === labelRank) return null;

    return (
      <tr>
        <th className="bg-light p-3 w-25">
          {title} <br />
          <small className="text-muted fw-normal text-capitalize">
            ({labelRank})
          </small>
        </th>
        <td className="p-3">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <b className="text-success fs-5 fst-italic">
                {nodeData?.scientific_name || (
                  <span className="text-muted fw-normal fst-normal">
                    Chưa xác định
                  </span>
                )}
              </b>
              {nodeData?.authority && (
                <small className="ms-2 text-muted border border-secondary px-1 rounded">
                  {nodeData.authority}
                </small>
              )}
              <div className="text-dark fw-bold small mt-1">
                Tên gọi khác:{" "}
                {nodeData?.common_name || (
                  <span className="text-muted fst-italic fw-normal">
                    Chưa cập nhật
                  </span>
                )}
              </div>
              {nodeData?.canonical_name && (
                <div className="text-muted small fst-italic mt-0.5">
                  Danh pháp gốc:{" "}
                  {nodeData.canonical_name || (
                    <span className="text-muted fst-italic fw-normal">
                      Chưa cập nhật
                    </span>
                  )}
                </div>
              )}
            </div>
            <Button
              variant="outline-success"
              size="sm"
              className="rounded-pill px-3 fw-bold"
              onClick={() => {
                setShowTaxonomyModal(false);
                navigate(
                  `/taxonomy/detail/${nodeData[targetRankId]}?rank=${labelRank}`,
                );
              }}
              disabled={!nodeData}
            >
              Xem Chi Tiết
            </Button>
          </div>
          {nodeData?.description && (
            <div className="mt-2 text-muted small text-justify border-top pt-1 mt-2">
              {nodeData.description}
            </div>
          )}
          {labelRank === "species" && (
            <div className="mt-2 text-muted small text-justify border-top pt-1 mt-2">
              {nodeData.uses}
            </div>
          )}
        </td>
      </tr>
    );
  };

  // Xử lý tiền dựng URL hình ảnh bản scan trang sách thầy Hộ
  const hoDatum = entity.HoSpeciesDatum;
  const pageImageObj = hoDatum?.page_image;
  const bookScanUrl = pageImageObj
    ? pageImageObj.is_external
      ? pageImageObj.url
      : `${backendUrl}${pageImageObj.url}`
    : null;

  const leafModelname =
    currentRank === "species" ? "MorphologyLeafSpecies" : "MorphologyLeaf";
  const stemModelname =
    currentRank === "species" ? "MorphologyStemSpecies" : "MorphologyStem";
  const flowerModelname =
    currentRank === "species" ? "MorphologyFlowerSpecies" : "MorphologyFlower";

  return (
    <div className="bg-light min-vh-100 pb-5 font-sans">
      <div className="bg-white border-bottom py-3 shadow-sm mb-4">
        <Container>
          <Button
            variant="link"
            className="text-decoration-none text-muted p-0 d-flex align-items-center hover-text-success"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="me-2" /> Trở về thư viện tra cứu
          </Button>
        </Container>
      </div>

      <Helmet>
        <title>{`PlantDB | Chi tiết ${entity.scientific_name}`}</title>
      </Helmet>

      <Container>
        {/* CARD PROFILE HEADER */}
        <Card className="border-0 shadow-sm rounded-4 mb-4 overflow-hidden bg-white">
          <Card.Body className="p-0">
            <Row className="g-0 align-items-stretch">
              {/* KHỐI ẢNH NỀN CỐ ĐỊNH KÍCH THƯỚC TUYỆT ĐỐI CHỐNG VỠ GIAO DIỆN */}
              <Col
                md={5}
                lg={4}
                className="bg-dark overflow-hidden position-relative"
                style={{ height: "320px" }}
              >
                <img
                  src={coverUrl}
                  className="w-100 h-100 cursor-zoom-in transition-transform hover-zoom"
                  style={{ objectFit: "cover" }}
                  alt="Cover"
                  onClick={() => setEnlargedImage(coverUrl)}
                />
                <Badge
                  bg="dark"
                  className="position-absolute bottom-0 end-0 m-3 bg-opacity-75 px-3 py-2 d-flex align-items-center"
                >
                  <FaEye className="me-2 text-warning" />{" "}
                  {entity.view_count || 0} Lượt xem
                </Badge>
              </Col>

              {/* KHỐI NỘI DUNG CHỮ GỒM TÁC GIẢ VÀ DANH SÁCH TÊN THƯỜNG GỌI */}
              <Col
                md={7}
                lg={8}
                className="p-4 p-md-5 d-flex flex-column justify-content-center"
              >
                <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                  <Badge bg="success" className="px-3 py-2 fw-medium shadow-sm">
                    {entity.code}
                  </Badge>
                  <Badge
                    bg="info"
                    className="px-3 py-2 fw-medium shadow-sm text-capitalize"
                  >
                    Cấp bậc: {uiMapping.RANK_TYPE[currentRank] || currentRank}
                  </Badge>
                  {/* <Badge bg={entity.is_recorded_in_vietnam ? "success" : "secondary"} className="px-3 py-2 fw-medium shadow-sm">
                                        {entity.is_recorded_in_vietnam ? "Ghi nhận tại Việt Nam" : "Chưa ghi nhận tại Việt Nam"}
                                    </Badge> */}
                  {currentRank === "species" && entity.species_type && (
                    <Badge bg="dark" className="px-3 py-2 fw-medium shadow-sm">
                      Phân loại:{" "}
                      {uiMapping.SPECIES_TYPE?.[entity.species_type] ||
                        entity.species_type}
                    </Badge>
                  )}

                  {/* 🛠️ BỔ SUNG: Hiển thị phân hóa loại Thứ/Biến thể cho Variety */}
                  {currentRank === "variety" && entity.variant_type && (
                    <Badge bg="dark" className="px-3 py-2 fw-medium shadow-sm">
                      Kiểu thứ:{" "}
                      {uiMapping.VARIANT_TYPE?.[entity.variant_type] ||
                        entity.variant_type}
                    </Badge>
                  )}
                </div>

                <h1 className="fw-bolder text-success mb-1 lh-base fst-italic">
                  {entity.scientific_name}
                </h1>
                {entity.canonical_name && (
                  <h6 className="text-muted mb-3 font-monospace">
                    Gốc: {entity.canonical_name}
                  </h6>
                )}

                <Row className="g-3 border-top pt-3 mt-1">
                  <Col xs={12} sm={4} md={3}>
                    <div className="text-muted small fw-bold mb-1">
                      Tác giả công bố:
                    </div>
                    <span className="text-dark fw-bold px-2.5 py-1.5 rounded bg-light d-inline-block mt-1 small">
                      {entity.authority || "Chưa ghi nhận"}
                    </span>
                  </Col>

                  {["vie", "eng", "other"].map((lang) => {
                    const langLabels = {
                      vie: "Tiếng Việt",
                      eng: "Tiếng Anh",
                      other: "Khác/Đồng nghĩa",
                    };
                    const names = groupedCommonNames[lang] || [];
                    if (!names.length) return null;
                    return (
                      <Col xs={12} sm={4} md={3} key={lang}>
                        <div className="text-muted small fw-bold mb-1">
                          {langLabels[lang]}:
                        </div>
                        <div className="d-flex flex-wrap gap-2 mt-1">
                          {names.map((cn, idx) => (
                            <Badge
                              key={idx}
                              bg={cn.isPrimary ? "success" : "light"}
                              className={
                                cn.isPrimary
                                  ? "px-2 py-1 text-white shadow-sm border border-success"
                                  : "px-2 py-1 text-dark border"
                              }
                              style={{ fontSize: "0.78rem" }}
                            >
                              {cn.name} {cn.isPrimary && "⭐"}
                            </Badge>
                          ))}
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Row className="g-4">
          {/* CỘT PHẢI SIDEBAR */}
          <Col lg={4} className="order-lg-2">
            {/* HỆ THỐNG PHÂN LOẠI SIDEBAR RÚT GỌN */}
            <Card className="border-0 shadow-sm rounded-4 mb-4 bg-success bg-opacity-10 border border-success border-opacity-25">
              <Card.Body className="p-4">
                <h6 className="fw-bold text-success border-bottom border-success border-opacity-25 pb-3 mb-3">
                  <FaDna className="me-2" /> Hệ Thống Phân Loại
                </h6>

                {currentRank !== "phylum" && (
                  <div className="mb-2">
                    <span className="text-muted small">Ngành (Phylum): </span>
                    <br />
                    <b className="text-dark fs-6">
                      {chain.phylum?.scientific_name || "Chưa xác định"}
                    </b>
                    <br />
                    <i className="text-muted small">
                      {chain.phylum?.common_name
                        ? `(${chain.phylum.common_name})`
                        : ""}
                    </i>
                  </div>
                )}

                {!["class", "phylum"].includes(currentRank) && (
                  <>
                    <hr className="border-success border-opacity-25 my-2" />
                    <div className="mb-2">
                      <span className="text-muted small">Lớp (Class): </span>
                      <br />
                      <b className="text-dark fs-6">
                        {chain.class?.scientific_name || "Chưa xác định"}
                      </b>
                      <br />
                      <i className="text-muted small">
                        {chain.class?.common_name
                          ? `(${chain.class.common_name})`
                          : ""}
                      </i>
                    </div>
                  </>
                )}

                {!["order", "class", "phylum"].includes(currentRank) && (
                  <>
                    <hr className="border-success border-opacity-25 my-2" />
                    <div className="mb-2">
                      <span className="text-muted small">Bộ (Order): </span>
                      <br />
                      <b className="text-dark fs-6">
                        {chain.order?.scientific_name || "Chưa xác định"}
                      </b>
                      <br />
                      <i className="text-muted small">
                        {chain.order?.common_name
                          ? `(${chain.order.common_name})`
                          : ""}
                      </i>
                    </div>
                  </>
                )}

                {!["family", "order", "class", "phylum"].includes(
                  currentRank,
                ) && (
                  <>
                    <hr className="border-success border-opacity-25 my-2" />
                    <div className="mb-2">
                      <span className="text-muted small">Họ (Family): </span>
                      <br />
                      <b className="text-dark fs-6">
                        {chain.family?.scientific_name || "Chưa xác định"}
                      </b>
                      <br />
                      <i className="text-muted small">
                        {chain.family?.common_name
                          ? `(${chain.family.common_name})`
                          : ""}
                      </i>
                    </div>
                  </>
                )}

                {!["family", "order", "class", "phylum", "genus"].includes(
                  currentRank,
                ) && (
                  <>
                    <hr className="border-success border-opacity-25 my-2" />
                    <div className="mb-2">
                      <span className="text-muted small">Chi (Genus): </span>
                      <br />
                      <b className="text-dark fs-6">
                        {chain.genus?.scientific_name || "Chưa xác định"}
                      </b>
                      <br />
                      <i className="text-muted small">
                        {chain.genus?.common_name
                          ? `(${chain.genus.common_name})`
                          : ""}
                      </i>
                    </div>
                  </>
                )}
                {currentRank === "variety" && (
                  <>
                    <hr className="border-success border-opacity-25 my-2" />
                    <div className="mb-2">
                      <span className="text-muted small">
                        Loài Thực vật (Species):{" "}
                      </span>
                      <br />
                      <b className="text-dark fs-6">
                        {chain.species?.scientific_name || "Chưa xác định"}
                      </b>
                      <br />
                      <i className="text-muted small">
                        {chain.species?.common_name
                          ? `(${chain.species.common_name})`
                          : ""}
                      </i>
                    </div>
                  </>
                )}

                <Button
                  variant="outline-success"
                  size="sm"
                  className="w-100 rounded-pill fw-bold mt-2 shadow-sm bg-white"
                  onClick={() => setShowTaxonomyModal(true)}
                  disabled={currentRank === "phylum"}
                >
                  <FaInfoCircle className="me-2" /> Xem Hồ sơ Khoa học
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* CỘT TRÁI CHÍNH */}
          <Col lg={8} className="order-lg-1">
            {/* Khối Mô tả chung */}
            <Card className="border-0 shadow-sm rounded-4 mb-4 p-4 p-md-5 bg-white">
              <h5 className="fw-bold text-success border-bottom pb-3 mb-3">
                Đặc Điểm Mô Tả Chung
              </h5>
              <p className="lh-lg text-dark text-justify">
                {entity.description || (
                  <span className="text-muted fst-italic">
                    Chưa có thông tin văn bản mô tả khái quát.
                  </span>
                )}
              </p>
              {["species", "variety"].includes(currentRank) && (
                <>
                  <h5 className="fw-bold text-success border-bottom pb-3 mb-3 mt-4">
                    Công dụng trị liệu & Dược tính đặc hữu:
                  </h5>
                  <p className="lh-lg text-dark text-justify">
                    {entity.uses || (
                      <span className="text-muted fst-italic">
                        Chưa có thông tin về công dụng trị liệu và dược tính đặc
                        hữu.
                      </span>
                    )}
                  </p>
                </>
              )}
            </Card>

            {/* Bộ sưu tập ảnh Slider */}
            <Card className="border-0 shadow-sm rounded-4 mb-4 border-start border-success border-4 overflow-hidden bg-white">
              <div
                className="p-4 cursor-pointer d-flex justify-content-between align-items-center"
                onClick={() => toggleSection("images")}
              >
                <h5 className="fw-bold text-success mb-0 d-flex align-items-center">
                  <FaImages className="me-3" /> Bộ sưu tập ảnh
                </h5>
                {expandedSections.images ? (
                  <FaChevronUp className="text-muted" />
                ) : (
                  <FaChevronDown className="text-muted" />
                )}
              </div>

              <Card.Body
                className={`p-4 border-top bg-light bg-opacity-20 ${!expandedSections.images ? "d-none" : ""}`}
              >
                {taxonomyImages.length > 0 ? (
                  <PartImageCarousel
                    images={swiperImages}
                    backendUrl={backendUrl}
                    onImageClick={setEnlargedImage}
                    isModalOpen={!!enlargedImg}
                    is_external={isExternalImage}
                  />
                ) : (
                  <div className="text-muted small fst-italic py-3 bg-light rounded text-center border border-dashed">
                    Chưa có dữ liệu hình ảnh.
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* ĐẶC ĐIỂM HÌNH THÁI CHUYÊN BIỆT NÂNG CAO - CHỈ CÓ Ở BẬC LOÀI (SPECIES) */}
            {["species", "variety"].includes(currentRank) && (
              <>
                {/* Hình thái Lá */}
                <Card className="border-0 shadow-sm rounded-4 mb-4 border-start border-success border-4 overflow-hidden bg-white">
                  <div
                    className="p-4 cursor-pointer d-flex justify-content-between align-items-center"
                    onClick={() => toggleSection("leaf")}
                  >
                    <h5 className="fw-bold text-success mb-0 d-flex align-items-center">
                      <FaLeaf className="me-3" /> Đặc Điểm Nhận Dạng Lá
                    </h5>
                    {expandedSections.leaf ? (
                      <FaChevronUp className="text-muted" />
                    ) : (
                      <FaChevronDown className="text-muted" />
                    )}
                  </div>
                  <Card.Body
                    className={`p-4 border-top bg-light bg-opacity-20 ${!expandedSections.leaf ? "d-none" : ""}`}
                  >
                    {entity[leafModelname] ? (
                      <Row className="g-3">
                        <Col xs={6} md={3}>
                          <small className="text-muted d-block mb-1">
                            Kiểu cấu trúc lá
                          </small>
                          <b>
                            {uiMapping.LEAF_TYPE?.[
                              entity[leafModelname].leaf_type
                            ] ||
                              entity[leafModelname].leaf_type ||
                              "-"}
                          </b>
                        </Col>
                        <Col xs={6} md={3}>
                          <small className="text-muted d-block mb-1">
                            Hình dáng phiến
                          </small>
                          <b>
                            {uiMapping.LEAF_SHAPE?.[
                              entity[leafModelname].shape
                            ] ||
                              entity[leafModelname].shape ||
                              "-"}
                          </b>
                        </Col>
                        <Col xs={6} md={3}>
                          <small className="text-muted d-block mb-1">
                            Cách sắp xếp
                          </small>
                          <b>
                            {uiMapping.LEAF_ARRANGEMENT?.[
                              entity[leafModelname].arrangement
                            ] ||
                              entity[leafModelname].arrangement ||
                              "-"}
                          </b>
                        </Col>
                        <Col xs={6} md={3}>
                          <small className="text-muted d-block mb-1">
                            Mép lá
                          </small>
                          <b>
                            {uiMapping.LEAF_MARGIN?.[
                              entity[leafModelname].margin
                            ] ||
                              entity[leafModelname].margin ||
                              "-"}
                          </b>
                        </Col>
                        <Col xs={6} md={4}>
                          <small className="text-muted d-block mb-1">
                            Dài lá (Min - Max)
                          </small>
                          <b>
                            {entity[leafModelname].length_min || 0} -{" "}
                            {entity[leafModelname].length_max || 0} cm
                          </b>
                        </Col>
                        <Col xs={6} md={4}>
                          <small className="text-muted d-block mb-1">
                            Rộng lá (Min - Max)
                          </small>
                          <b>
                            {entity[leafModelname].width_min || 0} -{" "}
                            {entity[leafModelname].width_max || 0} cm
                          </b>
                        </Col>
                        <Col xs={12} md={4}>
                          <small className="text-muted d-block mb-1">
                            Chiều dài cuống
                          </small>
                          <b>
                            {entity[leafModelname].petiole_length || "-"} cm
                          </b>
                        </Col>
                        <Col xs={12} className="border-top pt-2">
                          <small className="text-muted d-block mb-1">
                            Mô tả chi tiết
                          </small>
                          <span className="small text-justify d-block">
                            {entity[leafModelname].description || "-"}
                          </span>
                        </Col>
                      </Row>
                    ) : (
                      <div className="text-muted small fst-italic py-3 bg-light rounded text-center border border-dashed">
                        Chưa có dữ liệu chi tiết hình thái Lá.
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* Hình thái Thân */}
                <Card className="border-0 shadow-sm rounded-4 mb-4 border-start border-success border-4 overflow-hidden bg-white">
                  <div
                    className="p-4 cursor-pointer d-flex justify-content-between align-items-center"
                    onClick={() => toggleSection("stem")}
                  >
                    <h5 className="fw-bold text-success mb-0 d-flex align-items-center">
                      <FaTree className="me-3" /> Đặc Điểm Nhận Dạng Thân
                    </h5>
                    {expandedSections.stem ? (
                      <FaChevronUp className="text-muted" />
                    ) : (
                      <FaChevronDown className="text-muted" />
                    )}
                  </div>
                  <Card.Body
                    className={`p-4 border-top bg-light bg-opacity-20 ${!expandedSections.stem ? "d-none" : ""}`}
                  >
                    {entity[stemModelname] ? (
                      <Row className="g-3">
                        <Col xs={6} md={4}>
                          <small className="text-muted d-block mb-1">
                            Kiểu phân nhánh thân
                          </small>
                          <b>
                            {uiMapping.STEM_TYPE?.[
                              entity[stemModelname].stem_type
                            ] ||
                              entity[stemModelname].stem_type ||
                              "-"}
                          </b>
                        </Col>
                        <Col xs={6} md={4}>
                          <small className="text-muted d-block mb-1">
                            Bề mặt vỏ
                          </small>
                          <b>
                            {uiMapping.STEM_SURFACE?.[
                              entity[stemModelname].surface
                            ] ||
                              entity[stemModelname].surface ||
                              "-"}
                          </b>
                        </Col>
                        <Col xs={6} md={4}>
                          <small className="text-muted d-block mb-1">
                            Màu sắc đặc trưng
                          </small>
                          <b>{entity[stemModelname].color || "-"}</b>
                        </Col>
                        <Col xs={12}>
                          <small className="text-muted d-block mb-1">
                            Chiều cao cây (Min - Max)
                          </small>
                          <b>
                            {entity[stemModelname].height_min || 0} -{" "}
                            {entity[stemModelname].height_max || 0} m
                          </b>
                        </Col>
                        <Col xs={12} className="border-top pt-2">
                          <small className="text-muted d-block mb-1">
                            Mô tả sinh học thân
                          </small>
                          <span className="small text-justify d-block">
                            {entity[stemModelname].description || "-"}
                          </span>
                        </Col>
                      </Row>
                    ) : (
                      <div className="text-muted small fst-italic py-3 bg-light rounded text-center border border-dashed">
                        Chưa có dữ liệu chi tiết hình thái Thân.
                      </div>
                    )}
                  </Card.Body>
                </Card>
                {/* Hình thái HOA */}
                <Card className="border-0 shadow-sm rounded-4 mb-4 border-start border-success border-4 overflow-hidden bg-white">
                  <div
                    className="p-4 cursor-pointer d-flex justify-content-between align-items-center"
                    onClick={() => toggleSection("flower")}
                  >
                    <h5 className="fw-bold text-success mb-0 d-flex align-items-center">
                      🌸 Đặc điểm nhận dạng Hoa
                    </h5>
                    {expandedSections.flower ? (
                      <FaChevronUp className="text-muted" />
                    ) : (
                      <FaChevronDown className="text-muted" />
                    )}
                  </div>
                  <Card.Body
                    className={`p-4 border-top bg-light bg-opacity-20 ${!expandedSections.flower ? "d-none" : ""}`}
                  >
                    {!entity[flowerModelname] ? (
                      <div className="text-muted small fst-italic py-3 bg-light rounded text-center border border-dashed">
                        Chưa có dữ liệu chi tiết hình thái Hoa.
                      </div>
                    ) : (
                      <>
                        <Row className="g-3">
                          <Col xs={6} md={4}>
                            <small className="text-muted d-block mb-1">
                              Cụm hoa
                            </small>
                            <b>
                              {uiMapping.INFLORESCENCE?.[
                                entity[flowerModelname].inflorescence
                              ] ||
                                entity[flowerModelname].inflorescence ||
                                "-"}
                            </b>
                          </Col>
                          <Col xs={6} md={4}>
                            <small className="text-muted d-block mb-1">
                              Màu hoa
                            </small>
                            <b>
                              {entity[flowerModelname].color ||
                                entity[flowerModelname].color ||
                                "-"}
                            </b>
                          </Col>
                          <Col xs={6} md={4}>
                            <small className="text-muted d-block mb-1">
                              Số cánh hoa
                            </small>
                            <b>{entity[flowerModelname].petal_count || "-"}</b>
                          </Col>
                          <Col xs={6} md={4}>
                            <small className="text-muted d-block mb-1">
                              Mùa hoa
                            </small>
                            <b>
                              {entity[flowerModelname].blooming_season || "-"}
                            </b>
                          </Col>
                          <Col xs={12} className="border-top pt-2">
                            <small className="text-muted d-block mb-1">
                              Mô tả chi tiết
                            </small>
                            <span className="small text-justify d-block">
                              {entity[flowerModelname].description || "-"}
                            </span>
                          </Col>
                        </Row>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </>
            )}
            {["genus", "species", "variety"].includes(currentRank) && (
              <>
                {/* DỮ LIỆU BÁCH KHOA TOÀN THƯ THẦY PHẠM HOÀNG HỘ (ĐÃ BỔ SUNG 3 TRƯỜNG THEO YÊU CẦU) */}
                <Card className="border-0 shadow-sm rounded-4 mb-4 border-start border-success border-4 overflow-hidden bg-white">
                  {/* Thanh Header phân khu kích hoạt Đóng/Mở */}
                  <div
                    className="p-4 cursor-pointer d-flex justify-content-between align-items-center bg-white transition-all hover-bg-light"
                    onClick={() => toggleSection("ho_special")}
                  >
                    <h5 className="fw-bold text-success mb-0 d-flex align-items-center">
                      <FaBook className="me-3" /> Dữ Liệu từ Sách Thầy Phạm
                      Hoàng Hộ
                    </h5>
                    {expandedSections.ho_special ? (
                      <FaChevronUp className="text-muted" />
                    ) : (
                      <FaChevronDown className="text-muted" />
                    )}
                  </div>

                  {/* Thân Card chứa lưới nội dung số hóa */}
                  <Card.Body
                    className={`p-4 border-top bg-light bg-opacity-20 ${!expandedSections.ho_special ? "d-none" : ""}`}
                  >
                    {hoDatum ? (
                      <div>
                        {/* 1. KHỐI INFOBOX: TỔNG QUAN NGUỒN TRÍCH DẪN & BẢN SCAN TRANG SÁCH */}
                        <div className="p-3 bg-white rounded-3 shadow-sm mb-4 border border-light border-opacity-50">
                          <Row className="align-items-center g-3">
                            {/* Chi tiết thư mục trích dẫn */}
                            <Col sm={bookScanUrl ? 8 : 12}>
                              <h6
                                className="fw-bold text-success mb-3 d-flex align-items-center"
                                style={{
                                  fontSize: "0.9rem",
                                  letterSpacing: "0.1px",
                                }}
                              >
                                <FaInfoCircle className="me-2 opacity-75" />{" "}
                                Nguồn tài liệu trích dẫn
                              </h6>
                              <Row className="g-3 text-dark small">
                                {/* 🛠️ BỔ SUNG: Trường tên sách cố định */}
                                <Col xs={12} md={4}>
                                  <div
                                    className="text-muted mb-0.5"
                                    style={{ fontSize: "0.78rem" }}
                                  >
                                    Tên tác phẩm (Book):
                                  </div>
                                  <b className="fs-6 text-dark">
                                    Cây cỏ Việt Nam
                                  </b>
                                </Col>

                                {/* Co lại md={3} thành md={2} để nhường chỗ cho tên sách */}
                                <Col xs={12} md={4}>
                                  <div
                                    className="text-muted mb-0.5"
                                    style={{ fontSize: "0.78rem" }}
                                  >
                                    Tập sách (Volume):
                                  </div>
                                  <b className="fs-6 text-success">
                                    {pageImageObj?.volume ? (
                                      `Tập ${pageImageObj.volume}`
                                    ) : (
                                      <span className="text-muted fw-normal fst-italic">
                                        Chưa rõ tập
                                      </span>
                                    )}
                                  </b>
                                </Col>

                                {/* Co lại md={3} thành md={2} để nhường chỗ cho tên sách
                                <Col xs={6} md={2}>
                                  <div
                                    className="text-muted mb-0.5"
                                    style={{ fontSize: "0.78rem" }}
                                  >
                                    Vị trí trang (Page):
                                  </div>
                                  <b className="fs-6 text-success">
                                    {pageImageObj?.page_number ? (
                                      `Trang ${pageImageObj.page_number}`
                                    ) : (
                                      <span className="text-muted fw-normal fst-italic">
                                        Chưa rõ trang
                                      </span>
                                    )}
                                  </b>
                                </Col> */}

                                {/* Điều chỉnh md={6} thành md={4} để hàng ngang vừa vặn đủ 12 cột (4 + 2 + 2 + 4 = 12) */}
                                <Col xs={12} md={4}>
                                  <div
                                    className="text-muted mb-0.5"
                                    style={{ fontSize: "0.78rem" }}
                                  >
                                    Địa danh phân bố nội địa:
                                  </div>
                                  <span className="fw-bold text-dark">
                                    {hoDatum.locations?.length > 0 ? (
                                      hoDatum.locations.join(", ")
                                    ) : (
                                      <span className="text-muted fw-normal fst-italic">
                                        Chưa rõ
                                      </span>
                                    )}
                                  </span>
                                </Col>
                              </Row>
                            </Col>

                            {/* Bản hiển thị thu nhỏ trang sách scan (Hỗ trợ gọi Lightbox phóng to giống ảnh bìa) */}
                            {bookScanUrl && (
                              <Col sm={4} className="text-sm-end text-center">
                                <div
                                  className="position-relative overflow-hidden rounded-3 border shadow-sm cursor-zoom-in group-hover d-inline-block bg-white"
                                  style={{
                                    width: "110px",
                                    height: "150px",
                                    border: "1px solid #e2e8f0",
                                  }}
                                  onClick={() => setEnlargedImage(bookScanUrl)}
                                  title="Nhấp để xem bản scan độ phân giải cao"
                                >
                                  <img
                                    src={bookScanUrl}
                                    className="w-100 h-100 object-fit-cover transition-transform"
                                    alt="Bản scan sách thầy Hộ"
                                  />
                                  <div className="position-absolute top-50 start-50 translate-middle text-white opacity-0 icon-zoom transition-opacity z-2">
                                    <FaSearchPlus size={20} />
                                  </div>
                                  <div className="position-absolute inset-0 bg-dark opacity-0 group-hover-bg transition-opacity z-0 w-100 h-100"></div>
                                </div>
                              </Col>
                            )}
                          </Row>
                        </div>

                        {/* 2. LƯỚI THÈ KHỐI HÌNH THÁI MÔ TẢ (GRID FEATURE CARDS) CHỮ CHẠY RÕ RÀNG */}
                        <Row className="g-3">
                          <Col md={6}>
                            <div className="p-3 bg-white rounded-3 border-start border-success border-3 shadow-sm h-100 hover-shadow transition-all">
                              <div
                                className="text-success small fw-bold mb-2 d-flex align-items-center"
                                style={{ fontSize: "0.82rem" }}
                              >
                                <FaTree className="me-2 opacity-75" /> DẠNG SỐNG
                                VÀ HÌNH THÁI THÂN, RỄ
                              </div>
                              <p
                                className="small text-dark mb-0 text-justify lh-lg"
                                style={{ color: "#2d3748" }}
                              >
                                {hoDatum.habit_stem_root || (
                                  <span className="text-muted fst-italic opacity-75">
                                    Chưa cập nhật dữ liệu sinh học thân rễ.
                                  </span>
                                )}
                              </p>
                            </div>
                          </Col>

                          <Col md={6}>
                            <div className="p-3 bg-white rounded-3 border-start border-success border-3 shadow-sm h-100 hover-shadow transition-all">
                              <div
                                className="text-success small fw-bold mb-2 d-flex align-items-center"
                                style={{ fontSize: "0.82rem" }}
                              >
                                <FaLeaf className="me-2 opacity-75" /> ĐẶC ĐIỂM
                                HÌNH THÁI LÁ
                              </div>
                              <p
                                className="small text-dark mb-0 text-justify lh-lg"
                                style={{ color: "#2d3748" }}
                              >
                                {hoDatum.leaves || (
                                  <span className="text-muted fst-italic opacity-75">
                                    Chưa cập nhật dữ liệu sinh học lá.
                                  </span>
                                )}
                              </p>
                            </div>
                          </Col>

                          <Col md={6}>
                            <div className="p-3 bg-white rounded-3 border-start border-success border-3 shadow-sm h-100 hover-shadow transition-all">
                              <div
                                className="text-success small fw-bold mb-2 d-flex align-items-center"
                                style={{ fontSize: "0.82rem" }}
                              >
                                <FaPalette className="me-2 opacity-75" /> ĐẶC
                                ĐIỂM SINH SẢN (BÀO TỬ/HOA/QUẢ)
                              </div>
                              <p
                                className="small text-dark mb-0 text-justify lh-lg"
                                style={{ color: "#2d3748" }}
                              >
                                {hoDatum.reproduction || (
                                  <span className="text-muted fst-italic opacity-75">
                                    Chưa cập nhật dữ liệu hình thái cơ quan sinh
                                    sản.
                                  </span>
                                )}
                              </p>
                            </div>
                          </Col>

                          <Col md={6}>
                            <div className="p-3 bg-white rounded-3 border-start border-success border-3 shadow-sm h-100 hover-shadow transition-all">
                              <div
                                className="text-success small fw-bold mb-2 d-flex align-items-center"
                                style={{ fontSize: "0.82rem" }}
                              >
                                <FaInfoCircle className="me-2 opacity-75" /> MÙA
                                HOA QUẢ / CHU KỲ SINH TRƯỞNG
                              </div>
                              <p
                                className="small text-dark mb-0 text-justify lh-lg"
                                style={{ color: "#2d3748" }}
                              >
                                {hoDatum.phenology || (
                                  <span className="text-muted fst-italic opacity-75">
                                    Chưa cập nhật thông tin chu kỳ sinh trưởng
                                    học.
                                  </span>
                                )}
                              </p>
                            </div>
                          </Col>

                          <Col xs={12}>
                            <div className="p-3 bg-white rounded-3 border-start border-success border-3 shadow-sm h-100 hover-shadow transition-all">
                              <div
                                className="text-success small fw-bold mb-2 d-flex align-items-center"
                                style={{ fontSize: "0.82rem" }}
                              >
                                <FaGlobeAsia className="me-2 opacity-75" /> MÔI
                                TRƯỜNG SỐNG & SINH THÁI HỌC
                              </div>
                              <p
                                className="small text-dark mb-0 text-justify lh-lg"
                                style={{ color: "#2d3748" }}
                              >
                                {hoDatum.habitat_ecology || (
                                  <span className="text-muted fst-italic opacity-75">
                                    Chưa có thông tin văn bản đặc tính sinh
                                    thái.
                                  </span>
                                )}
                              </p>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    ) : (
                      <div className="text-muted small fst-italic py-3 bg-light rounded text-center border border-dashed">
                        Chưa có dữ liệu trích xuất từ sách Thầy Phạm Hoàng Hộ.
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </>
            )}

            {/* LỊCH SỬ DANH PHÁP / ĐỒNG DANH (TAXONOMY HISTORY) */}
            <Card className="border-0 shadow-sm rounded-4 mb-4 p-4 bg-white">
              <div
                className="p-4 cursor-pointer d-flex justify-content-between align-items-center"
                onClick={() => toggleSection("history")}
              >
                <h5 className="fw-bold text-success mb-0 d-flex align-items-center">
                  <FaHistory className="me-3" /> Lịch Sử Danh Pháp & Đồng Danh
                </h5>
                {expandedSections.history ? (
                  <FaChevronUp className="text-muted" />
                ) : (
                  <FaChevronDown className="text-muted" />
                )}
              </div>
              <Card.Body
                className={`p-4 border-top bg-light bg-opacity-20 ${!expandedSections.history ? "d-none" : ""}`}
              >
                {taxonomyHistory.length === 0 ? (
                  <div className="text-muted small fst-italic py-2">
                    Hồ sơ danh pháp hiện tại chưa ghi nhận sự biến động hoặc
                    đồng danh lịch sử.
                  </div>
                ) : (
                  <div className="timeline-wrapper ps-2 py-2">
                    {taxonomyHistory.map((hist, idx) => (
                      <div
                        key={hist.id || idx}
                        className="position-relative ps-4 border-start pb-3 timeline-node"
                      >
                        <div
                          className="position-absolute bg-success rounded-circle"
                          style={{
                            width: "10px",
                            height: "10px",
                            left: "-6px",
                            top: "6px",
                          }}
                        ></div>
                        <span className="badge bg-secondary text-capitalize mb-1">
                          {uiMapping.STATUS_TAXONOMY?.[hist.status] ||
                            hist.status}
                        </span>
                        <div className="fw-bold text-dark fst-italic">
                          {hist.scientific_name}{" "}
                          {hist.authority && (
                            <span className="text-muted fw-normal fst-normal ms-2 border">
                              {" "}
                              {hist.authority}
                            </span>
                          )}
                        </div>
                        {hist.canonical_name && (
                          <small className="text-muted d-block font-monospace">
                            Tên gốc: {hist.canonical_name}
                          </small>
                        )}
                        {hist.externalIds && hist.externalIds.length > 0 && (
                          <div className="mt-2">
                            {hist.externalIds.map((id, i) => (
                              <span
                                key={i}
                                className="badge bg-info text-white me-2"
                              >
                                {id}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* MODAL HỒ SƠ CÂY PHẢ HỆ HỌC */}
      <Modal
        show={showTaxonomyModal}
        onHide={() => setShowTaxonomyModal(false)}
        centered
        size="lg"
        className="taxonomy-profile-modal"
      >
        <Modal.Header
          closeButton
          className="bg-success text-white border-0 py-3"
        >
          <Modal.Title className="fw-bold d-flex align-items-center fs-5">
            <FaDna className="me-2 text-warning" /> Hồ Sơ Hệ Thống Phân Loại Học
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 max-vh-75 overflow-y-auto custom-scrollbar">
          <Table
            responsive
            bordered
            hover
            className="mb-0 align-middle text-start"
          >
            <tbody>
              {renderTaxonomyRow(
                "Ngành Thực vật",
                "phylum",
                chain.phylum,
                "phylum_id",
              )}
              {!["class", "phylum"].includes(currentRank) &&
                renderTaxonomyRow(
                  "Lớp Thực vật",
                  "class",
                  chain.class,
                  "class_id",
                )}
              {!["order", "class", "phylum"].includes(currentRank) &&
                renderTaxonomyRow(
                  "Bộ Thực vật",
                  "order",
                  chain.order,
                  "order_id",
                )}
              {!["family", "order", "class", "phylum"].includes(currentRank) &&
                renderTaxonomyRow(
                  "Họ Thực vật",
                  "family",
                  chain.family,
                  "family_id",
                )}
              {!["family", "order", "class", "phylum", "genus"].includes(
                currentRank,
              ) &&
                renderTaxonomyRow(
                  "Chi Thực vật",
                  "genus",
                  chain.genus,
                  "genus_id",
                )}
              {currentRank === "variety" &&
                renderTaxonomyRow(
                  "Loài Thực vật",
                  "species",
                  chain.species,
                  "species_id",
                )}
            </tbody>
          </Table>
        </Modal.Body>
      </Modal>

      {/* LIGHTBOX HỖ TRỢ PHÓNG TO ẢNH CHỦ VÀ BẢN SCAN TRANG SÁCH */}
      <Modal
        show={!!enlargedImg}
        onHide={() => setEnlargedImage(null)}
        centered
        size="xl"
      >
        <Modal.Header
          closeButton
          className="border-0 pb-0 bg-dark"
          variant="dark"
        ></Modal.Header>
        <Modal.Body className="text-center p-0 bg-dark rounded-bottom">
          <img
            src={enlargedImg}
            alt="Enlarged"
            className="img-fluid rounded-bottom"
            style={{ maxHeight: "85vh", objectFit: "contain", width: "100%" }}
          />
        </Modal.Body>
      </Modal>

      <style>{`
                .text-justify { text-align: justify; }
                .hover-text-success:hover { color: #198754 !important; }
                .hover-bg-light:hover { background-color: #f8f9fa; }
                .cursor-pointer { cursor: pointer; }
                .border-dashed { border-style: dashed; border-width: 2px; border-color: #dee2e6; }
                .cursor-zoom-in { cursor: zoom-in; }
                .group-hover:hover img { transform: scale(1.05); }
                .group-hover:hover .icon-zoom { opacity: 1 !important; }
                .group-hover:hover .group-hover-bg { opacity: 0.3 !important; }
                .transition-transform { transition: transform 0.3s ease; }
                .transition-opacity { transition: opacity 0.3s ease; }
                .transition-all { transition: all 0.2s ease-in-out; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1d5c9; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #198754; }
            `}</style>
    </div>
  );
};

export default TaxonomyDetailPage;
