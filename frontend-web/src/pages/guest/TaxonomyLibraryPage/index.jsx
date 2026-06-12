// TaxonomyLibraryPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Pagination,
  Form,
  Spinner,
  Card,
  InputGroup,
  Modal,
} from "react-bootstrap";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  FaExchangeAlt,
  FaSortAmountDown,
  FaSearch,
  FaTree,
  FaFilter,
  FaLightbulb,
  FaCheckCircle,
  FaBook,
} from "react-icons/fa";
import { Helmet } from "react-helmet-async";
import publicService from "../../../services/publicService";
import "./TaxonomyLibraryPage.css";

import LibraryFilterSidebar from "../../../components/common/TaxonomyLibraryPage/LibraryFilterSidebar";
import TaxonomyGrid from "../../../components/common/TaxonomyLibraryPage/TaxonomyGrid";
import TaxonomyCompareModal from "../../../components/modal/ModalForm/TaxonomyCompareModal";

const TaxonomyLibraryPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const [initialLoading, setInitialLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isFetchFilterOptions, setIsFetchFilterOptions] = useState(false);

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [uiMapping, setUiMapping] = useState({});
  const [showSearchGuide, setShowSearchGuide] = useState(false);

  const [SmartSelectOptions, setSmartSelectOptions] = useState({
    phylum: [],
    class: [],
    order: [],
    family: null,
    genus: null,
    species: null,
  });

  const [activeSections, setActiveSections] = useState({
    ho_species_option: false,
    leaf: false,
    stem: false,
    flower: false,
  });

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    sort: searchParams.get("sort") || "image_count_desc",
    limit: searchParams.get("limit") || "12",
    display_rank: searchParams.get("display_rank") || "species",
    species_type: searchParams.get("species_type") || "all",
    variant_type: searchParams.get("variant_type") || "all",
  });

  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareData, setCompareData] = useState([]);

  //Usememo
  const pId = filters.phylum_option?.value;
  const cId = filters.class_option?.value;
  const oId = filters.order_option?.value;
  const fId = filters.family_option?.value;
  const gId = filters.genus_option?.value;

  const localClassOptions = useMemo(() => {
    const list = SmartSelectOptions.class || [];
    return pId ? list.filter((c) => c.phylum_id === pId) : list;
  }, [pId, SmartSelectOptions.class]);

  const localOrderOptions = useMemo(() => {
    const list = SmartSelectOptions.order || [];
    if (cId) return list.filter((o) => o.class_id === cId);
    if (pId) return list.filter((o) => o.phylum_id === pId);
    return list;
  }, [cId, pId, SmartSelectOptions.order]);

  const localFamilyOptions = useMemo(() => {
    const list = SmartSelectOptions.family || []; // Fallback mảng rỗng nếu chưa được lazy load (null)
    if (oId) return list.filter((f) => f.order_id === oId);
    if (cId) return list.filter((f) => f.class_id === cId);
    if (pId) return list.filter((f) => f.phylum_id === pId);
    return list;
  }, [oId, cId, pId, SmartSelectOptions.family]);

  const localGenusOptions = useMemo(() => {
    const list = SmartSelectOptions.genus || []; // Fallback mảng rỗng nếu chưa được lazy load (null)
    if (fId) return list.filter((g) => g.family_id === fId);
    if (oId) return list.filter((g) => g.order_id === oId);
    if (cId) return list.filter((g) => g.class_id === cId);
    if (pId) return list.filter((g) => g.phylum_id === pId);
    return list;
  }, [fId, oId, cId, pId, SmartSelectOptions.genus]);

  const localSpeciesOptions = useMemo(() => {
    const list = SmartSelectOptions.species || []; // Fallback mảng rỗng nếu chưa được lazy load (null)
    if (gId) return list.filter((s) => s.genus_id === gId);
    if (fId) return list.filter((s) => s.family_id === fId);
    if (oId) return list.filter((s) => s.order_id === oId);
    if (cId) return list.filter((s) => s.class_id === cId);
    if (pId) return list.filter((s) => s.phylum_id === pId);
    return list;
  }, [gId, fId, oId, cId, pId, SmartSelectOptions.species]);

  // EFFECT 1: Nạp danh mục dữ liệu cấu hình ban đầu hệ thống (Chỉ chạy khi Mount)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsFetchFilterOptions(true);
        const mapping = await publicService.getUIEnumMapping();
        setUiMapping(mapping);

        const [phylumData, classData, orderData] =
          await publicService.getTaxonomyPageSmartSelectOptions({
            model_get: "default",
            lang_priority: ["vie"],
          });
        const phylumOptions = phylumData.map((item) => ({
          value: item.phylum_id,
          label: `${item.scientific_name} ${item.vietnamese_name ? "- " + item.vietnamese_name : ""}`,
        }));
        const classOptions = classData.map((item) => ({
          value: item.class_id,
          label: `${item.scientific_name} ${item.vietnamese_name ? "- " + item.vietnamese_name : ""}`,
          phylum_id: item.phylum_id,
        }));
        const orderOptions = orderData.map((item) => ({
          value: item.order_id,
          label: `${item.scientific_name} ${item.vietnamese_name ? "- " + item.vietnamese_name : ""}`,
          class_id: item.Class?.class_id,
          phylum_id: item.Class?.phylum_id,
        }));

        setSmartSelectOptions((prev) => ({
          ...prev,
          phylum: phylumOptions,
          class: classOptions,
          order: orderOptions,
        }));
      } catch (error) {
        console.error("Error fetching initial system metadata:", error);
      } finally {
        setIsFetchFilterOptions(false);
      }
    };
    fetchInitialData();
  }, []);

  // EFFECT LAZY LOADING ĐỘNG: ĐÚNG THEO YÊU CẦU ĐIỀU KIỆN RANK ĐỂ GỌI BỔ SUNG DỮ LIỆU TRÊN RAM
  useEffect(() => {
    const lazyLoadFilterOptions = async () => {
      try {
        const rank = filters.display_rank;
        setIsFetchFilterOptions(true);
        const promises = [
          ["genus", "species", "variety"].includes(rank) &&
          SmartSelectOptions.family === null
            ? publicService.getTaxonomyPageSmartSelectOptions({
                model_get: "family",
                lang_priority: ["vie"],
              })
            : Promise.resolve(null),
          ["species", "variety"].includes(rank) &&
          SmartSelectOptions.genus === null
            ? publicService.getTaxonomyPageSmartSelectOptions({
                model_get: "genus",
                lang_priority: ["vie"],
              })
            : Promise.resolve(null),
          rank === "variety" && SmartSelectOptions.species === null
            ? publicService.getTaxonomyPageSmartSelectOptions({
                model_get: "species",
                lang_priority: ["vie"],
              })
            : Promise.resolve(null),
        ];

        const [familyData, genusData, speciesData] =
          await Promise.all(promises);
        setSmartSelectOptions((prev) => ({
          ...prev,
          family: familyData
            ? familyData.map((item) => ({
                value: item.family_id,
                label: `${item.scientific_name} ${item.vietnamese_name ? "- " + item.vietnamese_name : ""}`,
                order_id: item.Order?.order_id,
                class_id: item.Order?.Class?.class_id,
                phylum_id: item.Order?.Class?.phylum_id,
              }))
            : prev.family, // Giữ lại bộ nhớ đệm cũ nếu không fetch mới
          genus: genusData
            ? genusData.map((item) => ({
                value: item.genus_id,
                label: `${item.scientific_name} ${item.vietnamese_name ? "- " + item.vietnamese_name : ""}`,
                family_id: item.Family?.family_id,
                order_id: item.Family?.Order?.order_id,
                class_id: item.Family?.Order?.Class?.class_id,
                phylum_id: item.Family?.Order?.Class?.phylum_id,
              }))
            : prev.genus, // Giữ lại bộ nhớ đệm cũ nếu không fetch mới
          species: speciesData
            ? speciesData.map((item) => ({
                value: item.species_id,
                label: `${item.scientific_name} ${item.vietnamese_name ? "- " + item.vietnamese_name : ""}`,
                genus_id: item.Genus?.genus_id,
                family_id: item.Genus?.Family?.family_id,
                order_id: item.Genus?.Family?.Order?.order_id,
                class_id: item.Genus?.Family?.Order?.Class?.class_id,
                phylum_id: item.Genus?.Family?.Order?.Class?.phylum_id,
              }))
            : prev.species, // Giữ lại bộ nhớ đệm cũ nếu không fetch mới
        }));
      } catch (error) {
        console.error("Error in lazy loading filter options:", error);
      } finally {
        setIsFetchFilterOptions(false);
      }
    };
    lazyLoadFilterOptions();
  }, [
    filters.display_rank,
    SmartSelectOptions.family,
    SmartSelectOptions.genus,
    SmartSelectOptions.species,
  ]);

  // EFFECT 2: ĐỒNG BỘ NGƯỢC (URL Parameter -> Component State) - Giải quyết dứt điểm lỗi điều hướng từ Navbar
  useEffect(() => {
    const params = Object.fromEntries([...searchParams]);

    setFilters((prev) => {
      const nextFilters = { ...prev };
      nextFilters.search = params.search || "";
      nextFilters.sort = params.sort || "image_count_desc";
      nextFilters.limit = params.limit || "12";
      nextFilters.display_rank = params.display_rank || "species";
      nextFilters.is_recorded_in_vietnam = params.is_recorded_in_vietnam || "";
      nextFilters.uses = params.uses || "";
      nextFilters.description = params.description || "";
      nextFilters.species_type = params.species_type || "all";
      nextFilters.variant_type = params.variant_type || "all";

      // Khôi phục đồng bộ các trường hình thái học nâng cao từ URL
      const advancedMorphoKeys = [
        "leaf_type",
        "leaf_shape",
        "leaf_arrangement",
        "leaf_margin",
        "leaf_length_min",
        "leaf_width_min",
        "petiole_length_min",
        "stem_type",
        "stem_surface",
        "stem_color",
        "stem_height_min",
        "inflorescence",
        "flower_color",
        "flower_petal_count",
        "habit_stem_root",
        "leaves",
        "reproduction",
        "phenology",
        "habitat_ecology",
        "usages",
        "notes",
        "book_volume",
        "book_page_from",
        "book_page_to",
      ];
      advancedMorphoKeys.forEach((key) => {
        nextFilters[key] = params[key] || "";
      });

      // Đồng bộ thực thể Object được chọn cho cấu trúc SmartSelect
      if (SmartSelectOptions.phylum)
        nextFilters.phylum_option =
          SmartSelectOptions.phylum.find(
            (o) => String(o.value) === String(params.phylum_id),
          ) || null;
      if (SmartSelectOptions.class)
        nextFilters.class_option =
          SmartSelectOptions.class.find(
            (o) => String(o.value) === String(params.class_id),
          ) || null;
      if (SmartSelectOptions.order)
        nextFilters.order_option =
          SmartSelectOptions.order.find(
            (o) => String(o.value) === String(params.order_id),
          ) || null;
      if (SmartSelectOptions.family)
        nextFilters.family_option =
          SmartSelectOptions.family.find(
            (o) => String(o.value) === String(params.family_id),
          ) || null;
      if (SmartSelectOptions.genus)
        nextFilters.genus_option =
          SmartSelectOptions.genus.find(
            (o) => String(o.value) === String(params.genus_id),
          ) || null;
      if (SmartSelectOptions.species)
        nextFilters.species_option =
          SmartSelectOptions.species.find(
            (o) => String(o.value) === String(params.species_id),
          ) || null;
      return nextFilters;
    });

    // Tự động mở phân khu chức năng Sidebar nếu URL đang chứa biến lọc thuộc phân khu đó
    setActiveSections({
      ho_species_option: !!(
        params.habit_stem_root ||
        params.leaves ||
        params.reproduction ||
        params.phenology ||
        params.habitat_ecology ||
        params.usages ||
        params.notes ||
        params.book_volume ||
        params.book_page_from ||
        params.book_page_to
      ),
      leaf:
        params.has_leaf_filter === "true" ||
        !!(
          params.leaf_type ||
          params.leaf_shape ||
          params.leaf_arrangement ||
          params.leaf_margin
        ),
      stem:
        params.has_stem_filter === "true" ||
        !!(
          params.stem_type ||
          params.stem_surface ||
          params.stem_color ||
          params.stem_height_min
        ),
      flower:
        params.has_flower_filter === "true" ||
        !!(
          params.inflorescence ||
          params.flower_color ||
          params.flower_petal_count
        ),
    });
  }, [searchParams, SmartSelectOptions]);

  // EFFECT 3: Xử lý độ trễ bàn phím (Debounce Search Input) hạn chế quá tải Request API
  useEffect(() => {
    const currentUrlSearch = searchParams.get("search") || "";
    if (filters.search === currentUrlSearch) return;

    const delayDebounceFn = setTimeout(() => {
      applyFilters();
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [filters.search]);

  // EFFECT 4: Gọi API truy vấn và lấy dữ liệu chính xác từ Database dựa trên URL Parameter thực tế
  useEffect(() => {
    const fetchData = async () => {
      setIsFiltering(true);
      try {
        const params = Object.fromEntries([...searchParams]);
        const response = await publicService.getTaxonomyList(params);
        setData(response.data);
        setPagination(response.pagination);
      } catch (error) {
        console.error("Error in fetching plant matrix database data:", error);
      } finally {
        setInitialLoading(false);
        setIsFiltering(false);
      }
    };

    fetchData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [searchParams]);

  // HÀM TỔNG HỢP & ÁP DỤNG BỘ LỌC CHUẨN (Hàm duy nhất đẩy dữ liệu lên URL)
  const applyFilters = (customChanges = {}) => {
    // Tạo bản sao shallow-copy, kết hợp thay đổi tức thì (nếu có) để triệt tiêu lỗi đột biến state trực tiếp
    const workingFilters = { ...filters, ...customChanges };

    const activeFilters = {
      page: 1,
      sort: workingFilters.sort,
      limit: workingFilters.limit,
      display_rank: workingFilters.display_rank || "species",
    };

    // Loại bỏ các thuộc tính chuyên biệt nếu bậc phân loại hiển thị khác Loài
    if (!["species", "variety"].includes(workingFilters.display_rank)) {
      let speciesSpecificKeys = [
        "uses",
        "leaf_margin",
        "leaf_type",
        "leaf_shape",
        "leaf_arrangement",
        "leaf_length_min",
        "leaf_width_min",
        "petiole_length_min",
        "stem_type",
        "stem_surface",
        "stem_height_min",
        "stem_color",
        "inflorescence",
        "flower_color",
        "flower_petal_count",
      ];
      if (workingFilters.display_rank !== "genus")
        speciesSpecificKeys = speciesSpecificKeys.concat([
          "habit_stem_root",
          "leaves",
          "reproduction",
          "phenology",
          "habitat_ecology",
          "usages",
          "notes",
          "book_volume",
          "book_page_from",
          "book_page_to",
        ]);
      speciesSpecificKeys.forEach((k) => delete workingFilters[k]);
    } else {
      // Kiểm tra trạng thái đóng/mở của các phân khu tiêu chí hình thái học ở bậc Loài
      if (!activeSections.ho_species_option) {
        [
          "habit_stem_root",
          "leaves",
          "reproduction",
          "phenology",
          "habitat_ecology",
          "usages",
          "notes",
          "book_volume",
          "book_page_from",
          "book_page_to",
        ].forEach((k) => delete workingFilters[k]);
      }
      if (!activeSections.leaf) {
        [
          "leaf_margin",
          "leaf_type",
          "leaf_shape",
          "leaf_arrangement",
          "leaf_length_min",
          "leaf_width_min",
          "petiole_length_min",
        ].forEach((k) => delete workingFilters[k]);
      }
      if (!activeSections.stem) {
        ["stem_type", "stem_surface", "stem_height_min", "stem_color"].forEach(
          (k) => delete workingFilters[k],
        );
      }
      if (!activeSections.flower) {
        ["inflorescence", "flower_color", "flower_petal_count"].forEach(
          (k) => delete workingFilters[k],
        );
      }
    }

    // Đóng gói cờ boolean kiểm soát trạng thái liên kết bảng lồng nhau ở phía Backend
    activeFilters.has_leaf_filter =
      activeSections.leaf &&
      ["species", "variety"].includes(workingFilters.display_rank);
    activeFilters.has_stem_filter =
      activeSections.stem &&
      ["species", "variety"].includes(workingFilters.display_rank);
    activeFilters.has_flower_filter =
      activeSections.flower &&
      ["species", "variety"].includes(workingFilters.display_rank);

    // Trích xuất ID từ SmartSelect Object để gán vào tham số phẳng, tránh truyền nhầm Object thô gây lỗi URL
    if (workingFilters.phylum_option)
      activeFilters.phylum_id = workingFilters.phylum_option.value;
    if (workingFilters.class_option)
      activeFilters.class_id = workingFilters.class_option.value;
    if (workingFilters.order_option)
      activeFilters.order_id = workingFilters.order_option.value;
    if (workingFilters.family_option)
      activeFilters.family_id = workingFilters.family_option.value;
    if (workingFilters.genus_option)
      activeFilters.genus_id = workingFilters.genus_option.value;

    // Tiến hành lọc sạch chuỗi rỗng trước khi đẩy tham số lên URL Parameter công khai
    const optionObjectKeys = [
      "phylum_option",
      "class_option",
      "order_option",
      "family_option",
      "genus_option",
    ];
    Object.keys(workingFilters).forEach((key) => {
      if (optionObjectKeys.includes(key)) return; // Bỏ qua object cấu hình gốc của dropdown

      const value = workingFilters[key];
      if (value !== undefined && value !== null) {
        if (typeof value === "string" && value.trim() === "") return;
        activeFilters[key] = value;
      }
    });

    setSearchParams(activeFilters);
  };

  const resetFilters = () => {
    setCompareList([]);
    setCompareData([]);
    setActiveSections({
      ho_species_option: false,
      leaf: false,
      stem: false,
      flower: false,
    });
    setSearchParams({
      sort: "image_count_desc",
      page: 1,
      limit: 12,
      display_rank: filters.display_rank || "species",
      species_type: "all",
      variant_type: "all",
    });
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setFilters((prev) => ({ ...prev, sort: newSort }));
    applyFilters({ sort: newSort });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSortLimitChange = (e) => {
    const { name, value } = e.target;
    const variations = { [name]: value };

    if (name === "display_rank") {
      //Clear filters
      setCompareList([]);
      setCompareData([]);
      setActiveSections({
        ho_species_option: false,
        leaf: false,
        stem: false,
        flower: false,
      });
      setSearchParams({
        sort: "image_count_desc",
        page: 1,
        limit: 12,
        display_rank: value || "species",
        species_type: "all",
        variant_type: "all",
      });
      return;
    }

    setFilters((prev) => ({ ...prev, ...variations }));
    applyFilters(variations);
  };

  const toggleCompare = (plant) => {
    const idKey = `${filters.display_rank || "species"}_id`;
    const plantId = plant[idKey];
    setCompareList((prev) => {
      const isExist = prev.find((item) => item[idKey] === plantId);
      if (isExist) return prev.filter((item) => item[idKey] !== plantId);
      return [...prev, plant];
    });
  };

  const openCompareModal = async () => {
    const idKey = `${filters.display_rank || "species"}_id`;
    const ids = compareList.map((item) => item[idKey]);
    const detailData = await publicService.getCompareDataTaxonomy(
      ids,
      filters.display_rank || "species",
    );
    setCompareData(detailData);
    setShowCompareModal(true);
  };

  const handlePageChange = (newPage) => {
    const currentParams = new URLSearchParams(searchParams);
    currentParams.set("page", newPage);
    setSearchParams(currentParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div className="library-wrapper bg-light min-vh-100 font-sans">
      <Helmet>
        <title>PlantDB | Thư viện thực vật</title>
        <meta
          name="description"
          content="Khám phá thư viện loài thực vật của hệ thống, cung cấp thông tin chi tiết và hình ảnh về các loài thực vật khác nhau."
        />
      </Helmet>
      <Container fluid className="px-3 px-xl-5">
        <Row className="g-4 mt-1 flex-lg-nowrap">
          <Col lg={isSidebarExpanded ? 4 : 3}>
            {isFetchFilterOptions ? (
              <div
                className="bg-white rounded-4 shadow-sm d-flex justify-content-center align-items-center"
                style={{ minHeight: "600px" }}
              >
                <div className="text-center">
                  <Spinner animation="border" variant="success" />
                  <div className="mt-3 text-muted">Đang tải bộ lọc...</div>
                </div>
              </div>
            ) : (
              <LibraryFilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                onApply={applyFilters}
                onReset={resetFilters}
                onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
                isExpanded={isSidebarExpanded}
                uiMapping={uiMapping}
                loading={initialLoading}
                activeSections={activeSections}
                setActiveSections={setActiveSections}
                SmartSelectOptions={SmartSelectOptions}
                localClassOptions={localClassOptions}
                localOrderOptions={localOrderOptions}
                localFamilyOptions={localFamilyOptions}
                localGenusOptions={localGenusOptions}
                localSpeciesOptions={localSpeciesOptions}
              />
            )}
          </Col>

          <Col lg={isSidebarExpanded ? 8 : 9} className="transition-all">
            <Card className="border-0 shadow-sm rounded-4 p-3 mb-3 bg-white">
              <Row className="g-3 align-items-center">
                <Col xs={12} md={7} lg={8}>
                  <div className="d-flex justify-content-between align-items-center mb-1.5">
                    <Form.Label className="small fw-bolder text-dark mb-0">
                      Từ khóa tra cứu
                    </Form.Label>
                    <Button
                      variant="link"
                      className="p-0 text-success text-decoration-none small d-flex align-items-center fw-medium m-0"
                      onClick={() => setShowSearchGuide(true)}
                      style={{ fontSize: "0.8rem" }}
                    >
                      <span className="me-1">💡</span> Hướng dẫn tra cứu
                    </Button>
                  </div>
                  <InputGroup className="shadow-sm rounded-pill overflow-hidden border border-success border-opacity-25 bg-light">
                    <InputGroup.Text className="bg-transparent border-0 text-success pe-2">
                      <FaSearch size={14} />
                    </InputGroup.Text>
                    <Form.Control
                      name="search"
                      placeholder="Nhập tên khoa học, tên tiếng việt hoặc mã số..."
                      value={filters.search || ""}
                      onChange={handleFilterChange}
                      className="border-0 ps-1 shadow-none bg-transparent small font-sans"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") applyFilters();
                      }}
                    />
                  </InputGroup>
                </Col>

                <Col xs={12} md={5} lg={4}>
                  <Form.Label className="small fw-bolder text-dark mb-1.5 d-flex align-items-center">
                    <FaTree className="me-1 text-success" size={12} /> Bậc phân
                    loại hiển thị
                  </Form.Label>
                  <Form.Select
                    size="sm"
                    name="display_rank"
                    className="border-success border-opacity-25 rounded-pill shadow-none px-3 py-1.5 bg-light fw-bold text-success font-sans"
                    value={filters.display_rank || "species"}
                    onChange={handleSortLimitChange}
                    style={{ cursor: "pointer" }}
                  >
                    <option value="phylum">Ngành Thực vật (Phylum)</option>
                    <option value="class">Lớp Thực vật (Class)</option>
                    <option value="order">Bộ Thực vật (Order)</option>
                    <option value="family">Họ Thực vật (Family)</option>
                    <option value="genus">Chi Thực vật (Genus)</option>
                    <option value="species">Loài Thực vật (Species)</option>
                    <option value="variety">
                      Biến thể / Thứ Thực vật (Variety)
                    </option>
                  </Form.Select>
                </Col>
              </Row>
            </Card>

            <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-4 shadow-sm mb-4">
              <span className="text-muted fw-medium d-none d-md-block">
                Tìm thấy{" "}
                <strong className="text-success">
                  {pagination.total || data.length}
                </strong>{" "}
                kết quả phù hợp
              </span>

              <div className="d-flex align-items-center w-auto">
                {/* PHÂN HOÁ OPTIONS ĐỘNG KẾ BÊN SORT CHUẨN MAPPING THEO FILE ENUM */}
                {filters.display_rank === "species" && (
                  <>
                    <span className="text-muted small fw-bold ms-3 d-none d-sm-block text-nowrap">
                      Phân loại loài:
                    </span>
                    <Form.Select
                      size="sm"
                      name="species_type"
                      className="ms-2 border-success border-opacity-25 rounded-pill shadow-none px-3 bg-light fw-bold text-success font-sans"
                      value={filters.species_type || "all"}
                      onChange={handleSortLimitChange}
                      style={{ width: "150px", cursor: "pointer" }}
                    >
                      <option value="all">Tất cả các loại</option>
                      {uiMapping.SPECIES_TYPE &&
                        Object.entries(uiMapping.SPECIES_TYPE).map(
                          ([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ),
                        )}
                    </Form.Select>
                  </>
                )}

                {filters.display_rank === "variety" && (
                  <>
                    <span className="text-muted small fw-bold ms-3 d-none d-sm-block text-nowrap">
                      Loại biến thể:
                    </span>
                    <Form.Select
                      size="sm"
                      name="variant_type"
                      className="ms-2 border-success border-opacity-25 rounded-pill shadow-none px-3 bg-light fw-bold 
                                            text-success font-sans"
                      value={filters.variant_type || "all"}
                      onChange={handleSortLimitChange}
                      style={{ width: "160px", cursor: "pointer" }}
                    >
                      <option value="all">Tất cả biến thể</option>
                      {uiMapping.VARIANT_TYPE &&
                        Object.entries(uiMapping.VARIANT_TYPE).map(
                          ([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ),
                        )}
                    </Form.Select>
                  </>
                )}
                <FaSortAmountDown className="text-success me-2 flex-shrink-0 ms-3" />
                <span className="text-muted small fw-bold me-2 d-none d-sm-block text-nowrap">
                  Sắp xếp:
                </span>
                <Form.Select
                  size="sm"
                  className="border-success border-opacity-25 rounded-pill shadow-none px-3 py-1 bg-light fw-medium"
                  value={filters.sort}
                  onChange={handleSortChange}
                  style={{ width: "200px", cursor: "pointer" }}
                >
                  <option value="createdAt_desc">Mới nhất - Cũ nhất</option>
                  <option value="createdAt_asc">Cũ nhất - Mới nhất</option>
                  <option value="name_asc">Tên hiển thị (A - Z)</option>
                  <option value="name_desc">Tên hiển thị (Z - A)</option>
                  <option value="view_count_desc">Lượt xem (Cao - Thấp)</option>
                  <option value="view_count_asc">Lượt xem (Thấp - Cao)</option>
                  <option value="image_count_desc">
                    Kho sưu tập hình ảnh (Lớn - Nhỏ)
                  </option>
                  <option value="image_count_asc">
                    Kho sưu tập hình ảnh (Nhỏ - Lớn)
                  </option>
                </Form.Select>
                <span className="text-muted small fw-bold ms-2 d-none d-sm-block">
                  Hiển thị:
                </span>
                <Form.Select
                  size="sm"
                  name="limit"
                  className="ms-2 border-success border-opacity-25 rounded-pill shadow-none px-3 bg-light fw-medium"
                  value={filters.limit}
                  onChange={handleSortLimitChange}
                  style={{ width: "80px", cursor: "pointer" }}
                >
                  <option value="12">12</option>
                  <option value="24">24</option>
                  <option value="48">48</option>
                </Form.Select>
              </div>
            </div>

            {initialLoading ? (
              <div className="d-flex justify-content-center py-5 mt-5">
                <Spinner animation="grow" variant="success" />
              </div>
            ) : (
              <div
                style={{
                  transition: "opacity 0.3s ease",
                  opacity: isFiltering ? 0.4 : 1,
                }}
              >
                <TaxonomyGrid
                  data={data}
                  compareList={compareList}
                  onToggleCompare={toggleCompare}
                  onNavigate={(id, rank) => {
                    navigate(`/taxonomy/detail/${id}?rank=${rank}`);
                  }}
                  backendUrl={backendUrl}
                  isExpanded={isSidebarExpanded}
                  display_rank={filters.display_rank}
                  species_type={filters.species_type}
                  variant_type={filters.variant_type}
                />

                {pagination.totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-5 mb-5 pb-5">
                    <Pagination className="shadow-sm">
                      <Pagination.Prev
                        disabled={pagination.page === 1}
                        onClick={() => handlePageChange(pagination.page - 1)}
                      />

                      {(() => {
                        const { page, totalPages } = pagination;
                        const pageSlots = [];

                        if (totalPages <= 8) {
                          // Nếu tổng số trang nhỏ hơn hoặc bằng 8, hiển thị toàn bộ không cần ẩn
                          for (let p = 1; p <= totalPages; p++)
                            pageSlots.push(p);
                        } else {
                          // Luôn luôn hiển thị trang đầu tiên
                          pageSlots.push(1);

                          if (page <= 4) {
                            // Trường hợp trang hiện tại ở gần đầu biên trái
                            for (let p = 2; p <= 6; p++) pageSlots.push(p);
                            pageSlots.push("...");
                            pageSlots.push(totalPages);
                          } else if (page >= totalPages - 3) {
                            // Trường hợp trang hiện tại ở gần đầu biên phải
                            pageSlots.push("...");
                            for (let p = totalPages - 5; p < totalPages; p++)
                              pageSlots.push(p);
                            pageSlots.push(totalPages);
                          } else {
                            // Trường hợp trang hiện tại nằm ở giữa (Cửa sổ trượt hiện 8-9 ô số cân bằng)
                            pageSlots.push("...");
                            for (let p = page - 2; p <= page + 2; p++)
                              pageSlots.push(p);
                            pageSlots.push("...");
                            pageSlots.push(totalPages);
                          }
                        }

                        return pageSlots.map((item, idx) => {
                          if (item === "...") {
                            return (
                              <Pagination.Ellipsis
                                key={`ellipsis-${idx}`}
                                disabled
                              />
                            );
                          }
                          return (
                            <Pagination.Item
                              key={item}
                              active={item === page}
                              onClick={() => handlePageChange(item)}
                            >
                              {item}
                            </Pagination.Item>
                          );
                        });
                      })()}

                      <Pagination.Next
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => handlePageChange(pagination.page + 1)}
                      />
                    </Pagination>
                  </div>
                )}
              </div>
            )}
          </Col>
        </Row>
      </Container>

      {compareList.length > 0 && (
        <div className="position-fixed bottom-0 end-0 m-4 z-3 d-flex align-items-center gap-2 animation-slide-up">
          <Button
            variant="white"
            className="bg-white rounded-circle shadow-lg border border-light p-0 d-flex align-items-center justify-content-center text-muted hover-text-danger transition-all"
            style={{ width: "50px", height: "50px" }}
            onClick={() => {
              setCompareList([]);
              setCompareData([]);
            }}
            title="Xóa toàn bộ danh sách so sánh"
          >
            <span
              style={{
                fontSize: "1.4rem",
                fontWeight: "300",
                marginTop: "-2px",
              }}
            >
              &times;
            </span>
          </Button>

          <Button
            variant="success"
            size="lg"
            className="rounded-pill shadow-lg fw-bold px-4 d-flex align-items-center justify-content-center"
            style={{
              height: "50px",
              fontSize: "0.88rem",
              letterSpacing: "0.2px",
            }}
            onClick={openCompareModal}
          >
            <FaExchangeAlt className="me-2" size={13} /> So Sánh (
            {compareList.length})
          </Button>
        </div>
      )}

      <TaxonomyCompareModal
        show={showCompareModal}
        onHide={() => setShowCompareModal(false)}
        compareData={compareData}
        onRemoveItem={(item) => {
          const idKey = `${filters.display_rank || "species"}_id`;
          toggleCompare(item);
          setCompareData((prev) =>
            prev.filter((p) => p[idKey] !== item[idKey]),
          );
        }}
        backendUrl={backendUrl}
        uiMapping={uiMapping}
        display_rank={filters.display_rank}
      />

      <Modal
        show={showSearchGuide}
        onHide={() => setShowSearchGuide(false)}
        centered
        size="xl"
        className="search-guide-modal"
      >
        <Modal.Header
          closeButton
          className="bg-success text-white border-0 py-3 rounded-top-4 shadow-sm"
        >
          <Modal.Title className="fw-bold d-flex align-items-center fs-5">
            <FaLightbulb className="me-2 text-warning" /> Cẩm Nang Hướng Dẫn Tra
            Cứu & Đối Chiếu Thực Vật
          </Modal.Title>
        </Modal.Header>

        <Modal.Body
          className="p-4 bg-light custom-scrollbar"
          style={{ maxHeight: "80vh", overflowY: "auto" }}
        >
          <div className="alert alert-success border-0 p-3 mb-4 small text-success bg-success bg-opacity-10 rounded-3">
            <h6 className="fw-bold mb-1">
              💡 Chào mừng bạn đến với Thư viện số PlantDB:
            </h6>
            Hệ thống được thiết kế giúp bạn tìm kiếm cây trồng một cách nhanh
            nhất bằng tên gọi hoặc phân tích sâu dựa trên các đặc điểm tự nhiên
            của cây (lá, thân, hoa). Hãy đọc nhanh 4 mẹo dưới đây để làm chủ các
            tính năng của website.
          </div>

          <Row className="g-4">
            {/* 1. TÌM KIẾM NHANH BẰNG TỪ KHÓA */}
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100 rounded-3 bg-white border-top border-success border-3">
                <Card.Body className="p-4">
                  <h6
                    className="fw-bold text-success border-bottom pb-2 d-flex align-items-center"
                    style={{ fontSize: "0.95rem" }}
                  >
                    <FaSearch className="me-2" /> 1. Sử dụng Ô Tìm Kiếm Nhanh
                  </h6>
                  <p className="small text-muted mt-2 lh-base">
                    Ô nhập từ khóa ở trên cùng dùng để tìm kiếm các thông tin
                    ghi nhớ ngắn gọn. Bạn chỉ nên nhập:
                  </p>
                  <ul className="mb-0 small text-dark lh-lg ps-3">
                    <li>
                      <b>Tên thường gọi:</b> Nhập tên cây quen thuộc bằng tiếng
                      Việt hoặc tiếng Anh (VD:{" "}
                      <i>Đinh lăng, Đinh lăng lá đĩa</i>).
                    </li>
                    <li>
                      <b>Tên khoa học Latin:</b> Tên danh pháp quốc tế chuẩn của
                      cây (VD: <i>Polyscias</i>).
                    </li>
                    <li>
                      <b>Mã số cây:</b> Mã quản lý nội bộ được cấp riêng cho
                      từng cây (VD: <code>SPC-0102</code>).
                    </li>
                  </ul>
                  <div
                    className="text-danger small mt-2 fw-medium"
                    style={{ fontSize: "0.78rem" }}
                  >
                    ⚠️ <b>Lưu ý:</b> Không gõ các câu mô tả dài (như "cây có lá
                    màu xanh mép răng cưa") vào ô này.
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* 2. CHỌN BẬC PHÂN LOẠI PHÙ HỢP */}
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100 rounded-3 bg-white border-top border-primary border-3">
                <Card.Body className="p-4">
                  <h6
                    className="fw-bold text-primary border-bottom pb-2 d-flex align-items-center"
                    style={{ fontSize: "0.95rem" }}
                  >
                    <FaTree className="me-2" /> 2. Chọn "Bậc Phân Loại Hiển Thị"
                    Theo Nhu Cầu
                  </h6>
                  <p className="small text-muted mt-2 lh-base">
                    Hộp chọn ngay bên cạnh ô tìm kiếm quyết định nhóm dữ liệu
                    nào sẽ hiện ra trên màn hình:
                  </p>
                  <ul className="mb-0 small text-dark lh-lg ps-3">
                    <li>
                      <b>Người dùng phổ thông:</b> Nếu bạn muốn tìm các loài cây
                      dân dã, cây trồng nông nghiệp hay cây thuốc, hãy luôn đặt
                      hộp chọn ở mục <b>Loài Thực Vật (Species)</b> hoặc{" "}
                      <b>Biến thể / Thứ (Variety)</b>.
                    </li>
                    <li>
                      <b>Nhà nghiên cứu chuyên sâu:</b> Nếu bạn cần tìm kiếm
                      theo cụm phân loại lớn, hãy đổi sang mục{" "}
                      <b>Ngành, Lớp, Bộ, Họ, hoặc Chi</b>.
                    </li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>

            {/* 3. MẸO SỬ DỤNG BỘ LỌC ĐẶC TÍNH (SIDEBAR TRÁI) */}
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100 rounded-3 bg-white border-top border-warning border-3">
                <Card.Body className="p-4">
                  <h6
                    className="fw-bold text-warning border-bottom pb-2 d-flex align-items-center"
                    style={{ fontSize: "0.95rem", color: "#b9750e !important" }}
                  >
                    <FaFilter className="me-2" /> 3. Tìm Cây Khi Không Biết Tên
                    (Sidebar Trái)
                  </h6>
                  <p className="small text-muted mt-2 lh-base">
                    Khi bạn có một chiếc lá hoặc ảnh chụp một cây lạ và muốn
                    biết đó là cây gì, hãy sử dụng bộ lọc ở danh mục bên trái:
                  </p>
                  <ul className="mb-0 small text-dark lh-lg ps-3">
                    <li>
                      <b>Gạt công tắc kích hoạt (Switch):</b> Bạn bắt buộc phải
                      gạt bật công tắc của từng mục (Hình thái Lá, Thân, hoặc
                      Hoa) thì các lựa chọn chi tiết ở mục đó mới có hiệu lực.
                    </li>
                    <li>
                      <b>Tự động thu hẹp thông minh:</b> Các ô chọn liên kết với
                      nhau. Ví dụ nếu bạn chọn Họ là{" "}
                      <i>Họ Nhân Sâm (Araliaceae)</i>, ô mục "Chi thực vật" bên
                      dưới sẽ tự động thu gọn lại chỉ hiện các Chi thuộc họ Nhân
                      sâm, giúp bạn không bao giờ bị chọn sai.
                    </li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>

            {/* 4. CÔNG CỤ ĐỐI CHIẾU SONG SÁNG & SÁCH TRA CỨU */}
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100 rounded-3 bg-white border-top border-info border-3">
                <Card.Body className="p-4">
                  <h6
                    className="fw-bold text-info border-bottom pb-2 d-flex align-items-center"
                    style={{ fontSize: "0.95rem" }}
                  >
                    <FaBook className="me-2" /> 4. Tra Cứu Theo Sách & Bảng Đối
                    Chiếu Song Song
                  </h6>
                  <p className="small text-muted mt-2 lh-base">
                    Hai tính năng cao cấp hỗ trợ đắc lực cho công tác học tập và
                    nghiên cứu:
                  </p>
                  <ul className="mb-0 small text-dark lh-lg ps-3">
                    <li>
                      <b>Tính năng So sánh:</b> Nhấn nút <b>"+ So sánh"</b> dưới
                      chân các thẻ cây để đưa chúng vào danh sách chờ. Sau đó
                      nhấn nút <b>"So Sánh"</b> màu xanh hiện ra ở góc màn hình
                      để mở bảng đối chiếu song song các đặc điểm lá, thân, hoa
                      và công dụng trị liệu.
                    </li>
                    <li>
                      <b>Mẹo tìm theo trang sách:</b> Khi tìm kiếm theo số trang
                      của bộ sách <i>"Cây cỏ Việt Nam" của GS. Phạm Hoàng Hộ</i>
                      , do bản quét trang sách thực tế có thể lệch nhẹ từ 1 đến
                      7 trang so với mục lục, bạn nên nới rộng khoảng trang ra
                      (Ví dụ: nhập từ trang 45 đến 55 thay vì gõ đúng trang 50)
                      để tìm thấy bản scan chính xác nhất.
                    </li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default TaxonomyLibraryPage;
