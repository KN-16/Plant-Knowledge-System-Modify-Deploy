// // SpeciesLibraryPage.jsx
// import React, { useState, useEffect } from 'react';
// import { Container, Row, Col, Button, Pagination, 
//     Form , Spinner, Card, InputGroup, Modal} from 'react-bootstrap';
// import { useSearchParams, useNavigate } from 'react-router-dom';
// import { FaExchangeAlt, FaSortAmountDown, FaSearch, FaTree, FaFilter, 
//     FaLightbulb, FaCheckCircle, FaBook } from 'react-icons/fa';
// import { Helmet} from 'react-helmet-async';
// import Swal from 'sweetalert2';
// import publicService from '../../../services/publicService';
// import './SpeciesLibraryPage.css';

// import LibraryFilterSidebar from '../../../components/common/SpeciesLibraryPage/LibraryFilterSidebar';
// import SpeciesGrid from '../../../components/common/SpeciesLibraryPage/SpeciesGrid';
// import SpeciesCompareModal from '../../../components/modal/ModalForm/SpeciesCompareModal';


// const SpeciesLibraryPage = () => {
//     const navigate = useNavigate();
//     const [searchParams, setSearchParams] = useSearchParams();
//     const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

//     const [data, setData] = useState([]);
//     const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

//     const [initialLoading, setInitialLoading] = useState(true);
//     const [isFiltering, setIsFiltering] = useState(false);

//     const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
//     const [uiMapping, setUiMapping] = useState({ });
//     const [showSearchGuide, setShowSearchGuide] = useState(false);

//     const [SmartSelectOptions, setSmartSelectOptions] = useState({ });

//     const [localClassOptions, setLocalClassOptions] = useState([]);
//     const [localOrderOptions, setLocalOrderOptions] = useState([]);
//     const [localFamilyOptions, setLocalFamilyOptions] = useState([]);
//     const [localGenusOptions, setLocalGenusOptions] = useState([]);

//     const [activeSections, setActiveSections] = useState({
//         ho_species_option: false,
//         leaf: false,
//         stem: false,
//         flower: false,
//     });

//     const [filters, setFilters] = useState({
//         search: searchParams.get('search') || '',
//         sort: searchParams.get('sort') || 'image_count_desc',
//         limit: searchParams.get('limit') || '12',
//         display_rank: searchParams.get('display_rank') || 'species',
//     });
//     console.log(filters.display_rank);
//     const [compareList, setCompareList] = useState([]);
//     const [showCompareModal, setShowCompareModal] = useState(false);
//     const [compareData, setCompareData] = useState([]);

//     useEffect(() => { 
//         const fetchSmartSelectOptions = async () => {
//             try {
//                 const [phylumData, classData, orderData, familiesData, generaData] = await publicService.getSpeciesPageSmartSelectOptions();
//                 const phylumOptions = phylumData.map(item => ({ value: item.phylum_id, label: `${item.scientific_name} ${item.vietnamese_name ? '- ' + item.vietnamese_name: ''}` }));
//                 const classOptions = classData.map(item => ({ value: item.class_id, label: `${item.scientific_name} ${item.vietnamese_name ? '- ' + item.vietnamese_name: ''}`, 
//                     phylum_id: item.phylum_id }));
//                 const orderOptions = orderData.map(item => ({ value: item.order_id, label: `${item.scientific_name} ${item.vietnamese_name ? '- ' + item.vietnamese_name: ''}`, 
//                     class_id: item.Class?.class_id, phylum_id: item.Class?.phylum_id }));
//                 const familyOptions = familiesData.map(item => ({ value: item.family_id, label: `${item.scientific_name} ${item.vietnamese_name ? '- ' + item.vietnamese_name: ''}`, 
//                     order_id: item.Order?.order_id, class_id: item.Order?.Class?.class_id, phylum_id: item.Order?.Class?.phylum_id }));
//                 const genusOptions = generaData.map(item => ({ value: item.genus_id, label: `${item.scientific_name} ${item.vietnamese_name ? '- ' + item.vietnamese_name: ''}`, 
//                     family_id: item.Family?.family_id, order_id: item.Family?.Order?.order_id, class_id: item.Family?.Order?.Class?.class_id, 
//                     phylum_id: item.Family?.Order?.Class?.phylum_id }));
//                 setSmartSelectOptions({
//                     phylum: phylumOptions,
//                     class: classOptions,
//                     order: orderOptions,
//                     family: familyOptions,
//                     genus: genusOptions,
//                 });
//                 setLocalClassOptions(classOptions);
//                 setLocalOrderOptions(orderOptions);
//                 setLocalFamilyOptions(familyOptions);
//                 setLocalGenusOptions(genusOptions);
//             } catch (error) {
//                 console.error('Error fetching smart select options:', error);
//             }
//         };
        
//         const fetchInitialData = async () => {
//             try {
//                 const mapping = await publicService.getUIEnumMapping();
//                 setUiMapping(mapping);
//                 await fetchSmartSelectOptions();
//             } catch (error) {
//                 console.error('Error fetching initial data:', error);
//             }
//         };
//         fetchInitialData();
//     }, []);

//     useEffect(() => {
//     // Nếu người dùng không nhập gì hoặc giá trị khớp hoàn toàn với param hiện tại trên URL thì bỏ qua
//     const currentUrlSearch = searchParams.get('search') || '';
//     if (filters.search === currentUrlSearch && initialLoading === false) return;

//     // Thiết lập thời gian chờ 600ms kể từ ký tự cuối cùng được gõ
//     const delayDebounceFn = setTimeout(() => {
//         // Tự động kích hoạt hàm đóng gói và áp dụng bộ lọc lên URL Parameter công khai
//         applyFilters();
//     }, 600); 

//     // Hàm dọn dẹp hủy bỏ bộ đếm cũ nếu người dùng tiếp tục gõ ký tự tiếp theo trong khoảng < 600ms
//     return () => clearTimeout(delayDebounceFn);
//     }, [filters.search]);
    
//     useEffect( () => { 
//         fetchData();
//         //scroll top
//         window.scrollTo({ top: 0, behavior: 'smooth' });
    
//     }, [searchParams]);
    
//     const fetchData = async () => {
//         setIsFiltering(true);
//         try {
//             const params = Object.fromEntries([...searchParams]);
//             const response = await publicService.getSpeciesList(params);
//             setData(response.data);
//             setPagination(response.pagination);
//         } catch (error) {
//             console.error('Error fetching data:', error);
//         } finally {
//             setInitialLoading(false);
//             setIsFiltering(false);
//         }
//     };

//     const handleSortChange = (e) => {
//         const newSort = e.target.value;
//         setFilters(prev => ({ ...prev, sort: newSort }));
        
//         const activeFilters = { page: 1 };
//         Object.keys(filters).forEach(key => { 
//             if (filters[key] && key !== 'sort') activeFilters[key] = filters[key]; 
//         });
//         activeFilters.sort = newSort;
//         setSearchParams(activeFilters);
//     };

//     const handleFilterChange = (e) => {
//         const { name, value } = e.target;
//         setFilters(prev => ({ ...prev, [name]: value }));
//     };

//     const applyFilters = () => {
//         const activeFilters = { page: 1 , sort: filters.sort, limit: filters.limit, display_rank: filters.display_rank || 'species' };
        
//         if (filters.display_rank !== 'species') {
//             delete filters.habit_stem_root;
//             delete filters.leaves;
//             delete filters.reproduction;
//             delete filters.phenology;
//             delete filters.habitat_ecology;
//             delete filters.usages;
//             delete filters.notes;
//             delete filters.book_volume;
//             delete filters.book_page_from; 
//             delete filters.book_page_to;
//             delete filters.leaf_margin;
//             delete filters.leaf_type;
//             delete filters.leaf_shape;
//             delete filters.leaf_arrangement;
//             delete filters.leaf_length_min;
//             delete filters.leaf_width_min;
//             delete filters.petiole_length_min;
//             delete filters.stem_type;
//             delete filters.stem_surface;
//             delete filters.stem_height_min;
//             delete filters.stem_color;
//             delete filters.inflorescence;
//             delete filters.flower_color;
//             delete filters.flower_petal_count;
//         }
        
//         if (!activeSections.ho_species_option) {
//             delete filters.habit_stem_root;
//             delete filters.leaves;
//             delete filters.reproduction;
//             delete filters.phenology;
//             delete filters.habitat_ecology;
//             delete filters.usages;
//             delete filters.notes;
//             delete filters.book_volume;
//             delete filters.book_page_from;
//             delete filters.book_page_to;
//         }

//         if (!activeSections.leaf) {
//             delete filters.leaf_margin;
//             delete filters.leaf_type;
//             delete filters.leaf_shape;
//             delete filters.leaf_arrangement;
//             delete filters.leaf_length_min;
//             delete filters.leaf_width_min;
//             delete filters.petiole_length_min;
//         }
//         if (!activeSections.stem) {
//             delete filters.stem_type;
//             delete filters.stem_surface;
//             delete filters.stem_height_min;
//             delete filters.stem_color;
//         }
//         if (!activeSections.flower) {
//             delete filters.inflorescence;
//             delete filters.flower_color;
//             delete filters.flower_petal_count
//         }

//         activeFilters.has_leaf_filter = activeSections.leaf && filters.display_rank === 'species';
//         activeFilters.has_stem_filter = activeSections.stem && filters.display_rank === 'species';
//         activeFilters.has_flower_filter = activeSections.flower && filters.display_rank === 'species';

//         // Xử lý các filter SmartSelect đặc biệt: species_option, genus_option, family_option, dist_province_option
//         if (filters.phylum_option) 
//             activeFilters.phylum_id = filters.phylum_option.value;
//         if (filters.class_option) {
//             activeFilters.class_id = filters.class_option.value;
//         }
//         if (filters.order_option) {
//             activeFilters.order_id = filters.order_option.value;
//         }
//         if (filters.family_option) {
//             activeFilters.family_id = filters.family_option.value;
//         }
//         if (filters.genus_option) {
//             activeFilters.genus_id = filters.genus_option.value;
//         }

//         Object.keys(filters).forEach(key => { 
//             if (filters[key]) 
//                 if (typeof filters[key] === 'string' && filters[key].trim() === '') return; // Bỏ qua filter rỗng
//                 activeFilters[key] = filters[key]; 
//         });
//         setSearchParams(activeFilters);
//     };

//     const resetFilters = () => {
//         setFilters({ search: '', sort: 'image_count_desc', limit: '12' , phylum_option: null, class_option: null, order_option: null, family_option: null, genus_option: null, display_rank: 'species' });
//         setLocalClassOptions(SmartSelectOptions.class || []);
//         setLocalOrderOptions(SmartSelectOptions.order || []);
//         setLocalFamilyOptions(SmartSelectOptions.family || []);
//         setLocalGenusOptions(SmartSelectOptions.genus || []);
//         setActiveSections({ ho_species_option: false });
//         setSearchParams({sort: 'image_count_desc', page: 1, limit: 12, display_rank: 'species' });
//     };

//     const toggleCompare = (plant) => {
//     // Lấy key định danh động theo bậc đang hiển thị
//     const idKey = `${filters.display_rank || 'species'}_id`;
//     const plantId = plant[idKey];
//     setCompareList(prev => {
//         // Tìm kiếm xem thực thể đã tồn tại trong danh sách chờ chưa bằng ID động
//         const isExist = prev.find(item => item[idKey] === plantId);
        
//         if (isExist) {
//             // Nếu đã tồn tại thì tiến hành xóa bỏ khỏi mảng
//             return prev.filter(item => item[idKey] !== plantId);
//         }
        
//         return [...prev, plant];
//     });
// };

//     const handleSortLimitChange = (e) => {
//         const { name, value } = e.target;
//         setFilters(prev => ({ ...prev, [name]: value }));
        
//         if (name === 'display_rank') {
//         setCompareList([]);
//         setCompareData([]);
//     }

//         const activeFilters = { page: 1 };
//         Object.keys(filters).forEach(key => { 
//             if (filters[key] && key !== name) { 
//             if (typeof filters[key] === 'string' && filters[key].trim() === '') return; // Bỏ qua filter rỗng
//             activeFilters[key] = filters[key]; }
//         });
//         activeFilters[name] = value;
//         setSearchParams(activeFilters);
//     };

//     const openCompareModal = async () => {
//     // Xác định key ID động chính xác dựa trên display_rank hiện tại
//     const idKey = `${filters.display_rank || 'species'}_id`;
    
//     // Trích xuất mảng ID an toàn không lo sợ rủi ro undefined
//     const ids = compareList.map(item => item[idKey]);
    
//     const detailData = await publicService.getCompareDataSpecies(ids, filters.display_rank || 'species');
//     setCompareData(detailData);
//     setShowCompareModal(true);
//     };

//     const handlePageChange = (newPage) => {
//         const currentParams = new URLSearchParams(searchParams);
//         // 2. Cập nhật tham số page
//         currentParams.set('page', newPage);
//         setSearchParams(currentParams);
//         // (Tùy chọn) Cuộn mượt mà lên đầu trang lưới dữ liệu
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//     };

//     return (
//         <div className="library-wrapper bg-light min-vh-100 font-sans">
//             <Helmet>
//                 <title>PlantDB | Thư viện thực vật</title>
//                 <meta name="description" content="Khám phá thư viện loài thực vật của hệ thống, cung cấp thông tin chi tiết và hình ảnh về các loài thực vật khác nhau." />
//             </Helmet>
//             <Container fluid className="px-3 px-xl-5">
//                 <Row className="g-4 mt-1 flex-lg-nowrap">
//                     <Col lg={isSidebarExpanded ? 4 : 3}>
//                         <LibraryFilterSidebar 
//                             filters={filters} 
//                             onFilterChange={handleFilterChange} 
//                             onApply={applyFilters} 
//                             onReset={resetFilters}
//                             onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
//                             isExpanded={isSidebarExpanded}
//                             uiMapping={uiMapping}
//                             loading={initialLoading}
//                             activeSections={activeSections}
//                             setActiveSections={setActiveSections}
//                             SmartSelectOptions={SmartSelectOptions}
//                             localClassOptions={localClassOptions}
//                             localOrderOptions={localOrderOptions}
//                             localFamilyOptions={localFamilyOptions}
//                             localGenusOptions={localGenusOptions}
//                             setLocalClassOptions={setLocalClassOptions}
//                             setLocalOrderOptions={setLocalOrderOptions}
//                             setLocalFamilyOptions={setLocalFamilyOptions}
//                             setLocalGenusOptions={setLocalGenusOptions}
//                         />
//                     </Col>

//                     <Col lg={isSidebarExpanded ? 8 : 9} className="transition-all">
//                         <Card className="border-0 shadow-sm rounded-4 p-3 mb-3 bg-white">
//                             <Row className="g-3 align-items-center">
//                                 {/* VẾ TRÁI: Ô TÌM KIẾM TỰ DO */}
//                                 <Col xs={12} md={7} lg={8}>
//                                     <div className="d-flex justify-content-between align-items-center mb-1.5">
//                                         <Form.Label className="small fw-bolder text-dark mb-0">Từ khóa tra cứu</Form.Label>
//                                         <Button 
//                                             variant="link" 
//                                             className="p-0 text-success text-decoration-none small d-flex align-items-center fw-medium m-0" 
//                                             onClick={() => setShowSearchGuide(true)}
//                                             style={{ fontSize: '0.8rem' }}
//                                         >
//                                             <span className="me-1">💡</span> Hướng dẫn tra cứu
//                                         </Button>
//                                     </div>
//                                     <InputGroup className="shadow-sm rounded-pill overflow-hidden border border-success border-opacity-25 bg-light">
//                                         <InputGroup.Text className="bg-transparent border-0 text-success pe-2"><FaSearch size={14}/></InputGroup.Text>
//                                         <Form.Control 
//                                             name="search"
//                                             placeholder="Nhập tên khoa học, tên tiếng việt hoặc mã số..." 
//                                             value={filters.search || ''}
//                                             onChange={handleFilterChange}
//                                             className="border-0 ps-1 shadow-none bg-transparent small font-sans"
//                                             onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
//                                         />
//                                     </InputGroup>
//                                 </Col>

//                                 {/* VẾ PHẢI: CHỌN BẬC PHÂN LOẠI HIỂN THỊ */}
//                                 <Col xs={12} md={5} lg={4}>
//                                     <Form.Label className="small fw-bolder text-dark mb-1.5 d-flex align-items-center">
//                                         <FaTree className="me-1 text-success" size={12}/> Bậc phân loại hiển thị
//                                     </Form.Label>
//                                     <Form.Select 
//                                         size="sm" 
//                                         name="display_rank"
//                                         className="border-success border-opacity-25 rounded-pill shadow-none px-3 py-1.5 bg-light fw-bold text-success font-sans"
//                                         value={filters.display_rank || 'species'}
//                                         onChange={handleSortLimitChange}
//                                         style={{ cursor: 'pointer' }}
//                                     >
//                                         <option value="phylum">Ngành Thực vật (Phylum)</option>
//                                         <option value="class">Lớp Thực vật (Class)</option>
//                                         <option value="order">Bộ Thực vật (Order)</option>
//                                         <option value="family">Họ Thực vật (Family)</option>
//                                         <option value="genus">Chi Thực vật (Genus)</option>
//                                         <option value="species">Loài Thực vật (Species)</option>
//                                     </Form.Select>
//                                 </Col>
//                             </Row>
//                         </Card>
//                         {/* THANH ĐIỀU KHIỂN SẮP XẾP */}
//                         <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-4 shadow-sm mb-4">
//                             <span className="text-muted fw-medium d-none d-md-block">
//                                 Tìm thấy <strong className="text-success">{pagination.total || data.length}</strong> kết quả phù hợp
//                             </span>
//                             <div className="d-flex align-items-center w-auto">
//                                 <FaSortAmountDown className="text-success me-2 flex-shrink-0" />
//                                 <span className="text-muted small fw-bold me-2 d-none d-sm-block text-nowrap">Sắp xếp:</span>
//                                 <Form.Select 
//                                     size="sm" 
//                                     className="border-success border-opacity-25 rounded-pill shadow-none px-3 py-1 bg-light fw-medium"
//                                     value={filters.sort}
//                                     onChange={handleSortChange}
//                                     style={{ width: '200px', cursor: 'pointer' }}
//                                 >
//                                     <option value="createdAt_desc">Mới nhất - Cũ nhất</option>
//                                     <option value="name_asc">Tên hiển thị (A - Z)</option>
//                                     <option value="name_desc">Tên hiển thị (Z - A)</option>
//                                     <option value="view_count_desc">Lượt xem (Cao - Thấp)</option>
//                                     <option value="view_count_asc">Lượt xem (Thấp - Cao)</option>
//                                     <option value="image_count_desc">Kho sưu tập hình ảnh (Lớn - Nhỏ)</option>
//                                     <option value="image_count_asc">Kho sưu tập hình ảnh (Nhỏ - Lớn)</option>
//                                 </Form.Select>
//                                 <span className="text-muted small fw-bold ms-2 d-none d-sm-block">Hiển thị:</span>
//                                 <Form.Select 
//                                     size="sm" 
//                                     name="limit"
//                                     className="ms-2 border-success border-opacity-25 rounded-pill shadow-none px-3 bg-light fw-medium"
//                                     value={filters.limit}
//                                     onChange={handleSortLimitChange}
//                                     style={{ width: '80px', cursor: 'pointer' }}
//                                 >
//                                     <option value="12">12</option>
//                                     <option value="24">24</option>
//                                     <option value="48">48</option>
//                                 </Form.Select>
//                             </div>
//                         </div>

//                         {initialLoading ? (
//                             <div className="d-flex justify-content-center py-5 mt-5"><Spinner animation="grow" variant="success" /></div>
//                         ) : (
//                             <div style={{ transition: 'opacity 0.3s ease', opacity: isFiltering ? 0.4 : 1 }}>
//                                 <SpeciesGrid 
//                                     data={data} 
//                                     compareList={compareList} 
//                                     onToggleCompare={toggleCompare} 
//                                     onNavigate={(id, rank) => {
//                                         navigate(`/species/detail/${id}?rank=${rank}`);
//                                     }}
//                                     backendUrl={backendUrl}
//                                     isExpanded={isSidebarExpanded}
//                                     display_rank={filters.display_rank} 
//                                 />

//                                 {/* PHÂN TRANG */}
//                                 {pagination.totalPages > 1 && (
//                                     <div className="d-flex justify-content-center mt-5 mb-5 pb-5">
//                                         <Pagination className="shadow-sm">
//                                             <Pagination.Prev disabled={pagination.page === 1} onClick={() => handlePageChange(pagination.page - 1)} />
                                            
//                                             {/* Logic render số trang (Ví dụ: 1 2 3 ... 10) */}
//                                             {[...Array(pagination.totalPages)].map((_, idx) => {
//                                                 const p = idx + 1;
//                                                 // Chỉ show 2 trang đầu, 2 trang cuối, và các trang gần trang hiện tại
//                                                 if (p === 1 || p === pagination.totalPages || (p >= pagination.page - 1 && p <= pagination.page + 1)) {
//                                                     return (
//                                                         <Pagination.Item key={p} active={p === pagination.page} onClick={() => handlePageChange(p)}>
//                                                             {p}
//                                                         </Pagination.Item>
//                                                     );
//                                                 }
//                                                 // Hiển thị dấu ... nếu bị cách quãng
//                                                 if (p === pagination.page - 2 || p === pagination.page + 2) {
//                                                     return <Pagination.Ellipsis key={p} disabled />;
//                                                 }
//                                                 return null;
//                                             })}

//                                             <Pagination.Next disabled={pagination.page === pagination.totalPages} onClick={() => handlePageChange(pagination.page + 1)} />
//                                         </Pagination>
//                                     </div>
//                                 )}
//                             </div>
//                         )}

//                     </Col>
//                 </Row>
//             </Container>

//             {compareList.length > 0 && (
//     <div className="position-fixed bottom-0 end-0 m-4 z-3 d-flex align-items-center gap-2 animation-slide-up">
        
//         {/* NÚT XÓA SẠCH (CLEAR ALL) - DESIGN TRÒN MINIMALIST SANG TRỌNG */}
//         <Button 
//             variant="white" 
//             className="bg-white rounded-circle shadow-lg border border-light p-0 d-flex align-items-center justify-content-center text-muted hover-text-danger transition-all" 
//             style={{ width: '50px', height: '50px' }}
//             onClick={() => {setCompareList([]); setCompareData([]);}}
//             title="Xóa toàn bộ danh sách so sánh"
//         >
//             <span style={{ fontSize: '1.4rem', fontWeight: '300', marginTop: '-2px' }}>&times;</span>
//         </Button>

//         {/* NÚT ĐIỀU HƯỚNG MA TRẬN SO SÁNH CHÍNH */}
//         <Button 
//             variant="success" 
//             size="lg" 
//             className="rounded-pill shadow-lg fw-bold px-4 d-flex align-items-center justify-content-center" 
//             style={{ height: '50px', fontSize: '0.88rem', letterSpacing: '0.2px' }}
//             onClick={openCompareModal}
//         >
//             <FaExchangeAlt className="me-2" size={13} /> So Sánh ({compareList.length})
//         </Button>
        
//     </div>
// )}

//             <SpeciesCompareModal 
//                 show={showCompareModal} 
//                 onHide={() => setShowCompareModal(false)} 
//                 compareData={compareData} 
//                 onRemoveItem={(item) => {
//                 // 1. Xác định key ID động (Ví dụ: 'species_id', 'genus_id',...)
//                 const idKey = `${filters.display_rank || 'species'}_id`;
                
//                 // 2. Kích hoạt xóa khỏi danh sách tag chọn ở ngoài giao diện chính
//                 toggleCompare(item);
                
//                 // 3. Lọc bỏ item khỏi ma trận đối chiếu hiện tại trong modal dựa trên ID động
//                 setCompareData(prev => prev.filter(p => p[idKey] !== item[idKey]));
//                 }}
//                 backendUrl={backendUrl}
//                 uiMapping={uiMapping}
//                 display_rank={filters.display_rank}
//             />
//            {/* MODAL HƯỚNG DẪN TÌM KIẾM TINH GỌN & TỐI ƯU CHIỀU NGANG */}
// <Modal show={showSearchGuide} onHide={() => setShowSearchGuide(false)} centered size="xl">
//     <Modal.Header closeButton className="bg-success text-white border-0 py-3 rounded-top-4">
//         <Modal.Title className="fw-bold d-flex align-items-center fs-5">
//             <FaLightbulb className="me-2 text-warning"/> Cẩm Nang Tra Cứu Hệ Thống Thực Vật
//         </Modal.Title>
//     </Modal.Header>
    
//     <Modal.Body className="p-4 bg-light">
//         <Row className="g-4">
//             {/* KHỐI 1: TÌM KIẾM TỰ DO */}
//             <Col md={6}>
//                 <Card className="border-0 shadow-sm h-100 rounded-3 bg-white">
//                     <Card.Body className="p-4">
//                         <h6 className="fw-bold text-success border-bottom pb-2 d-flex align-items-center">
//                             <FaSearch className="me-2"/> Ô "Từ khóa tự do" tìm gì?
//                         </h6>
//                         <p className="small text-muted mt-2">
//                             Cơ chế tìm nhanh thông minh tự động quét trên toàn bộ các tầng dữ liệu:
//                         </p>
//                         <ul className="list-unstyled mb-0 small text-dark lh-lg ps-1">
//                             <li><FaCheckCircle className="text-success me-2 small"/> <b>Tên thực vật:</b> Tên tiếng Việt, tiếng Anh phổ thông hoặc tên đồng nghĩa (Synonyms).</li>
//                             <li><FaCheckCircle className="text-success me-2 small"/> <b>Danh pháp khoa học:</b> Tên Latin chuẩn quốc tế (Ví dụ: <i>Psilotum nudum</i>).</li>
//                             <li><FaCheckCircle className="text-success me-2 small"/> <b>Mã hệ thống:</b> Mã định danh mẫu vật được cấp tự động (Ví dụ: <code>SPC-0102</code>).</li>
//                         </ul>
//                     </Card.Body>
//                 </Card>
//             </Col>

//             {/* KHỐI 2: BỘ LỌC CHUYÊN BIỆT */}
//             <Col md={6}>
//                 <Card className="border-0 shadow-sm h-100 rounded-3 bg-white">
//                     <Card.Body className="p-4">
//                         <h6 className="fw-bold text-primary border-bottom pb-2 d-flex align-items-center">
//                             <FaFilter className="me-2"/> Lọc Chuyên Biệt (Smart Logic)
//                         </h6>
//                         <p className="small text-muted mt-2">
//                             Kết hợp nhiều tiêu chí để thu hẹp phạm vi và loại bỏ 100% kết quả rác:
//                         </p>
//                         <ul className="list-unstyled mb-0 small text-dark lh-lg ps-1">
//                             <li><FaCheckCircle className="text-primary me-2 small"/> <b>Cây phả hệ:</b> Giới hạn vùng tìm kiếm theo mạch đệ quy Ngành → Lớp → Bộ → Họ → Chi.</li>
//                             <li><FaCheckCircle className="text-primary me-2 small"/> <b>Hình thái học:</b> Bật/Tắt các phân khu đặc tính cơ quan Lá, Thân, Hoa để lọc chuyên sâu.</li>
//                         </ul>
//                     </Card.Body>
//                 </Card>
//             </Col>

//             {/* KHỐI 3: TRA CỨU THEO TRANG SÁCH */}
//             <Col xs={12}>
//                 <Card className="border-0 shadow-sm rounded-3 bg-white">
//                     <Card.Body className="p-4">
//                         <h6 className="fw-bold text-danger border-bottom pb-2 d-flex align-items-center">
//                             <FaBook className="me-2"/> Tra cứu theo Thư mục Sách "Cây cỏ Việt Nam"
//                         </h6>
//                         <p className="small text-dark mt-2 mb-3">
//                             Cho phép khoanh vùng loài số hóa theo cấu trúc chương mục và số hiệu trang in thực tế của cố GS. Phạm Hoàng Hộ.
//                         </p>
                        
//                         <div className="alert alert-warning border-0 p-3 mb-0 small text-dark">
//                             <div className="fw-bold mb-1">
//                                 💡 Mẹo nhỏ:
//                             </div>
//                             <p className="mb-0 text-justify lh-base">
//                                 Trong tài liệu số hóa, giữa <b>chỉ mục dữ liệu thô</b> và <b>trang in bản quét (scan)</b> thực tế thường có độ lệch tuyến tính từ 1 đến 7 trang (do các trang phụ bản hoặc bảng tra cứu phát sinh). 
//                                 Vì vậy, khi lọc trang, bạn nên nới rộng khoảng tra cứu để đạt kết quả chính xác nhất mà không bị sót tư liệu. 
//                                 <i> (Ví dụ: Nếu muốn tìm loài ở trang 50, hãy nhập bộ lọc khoảng từ trang 45 đến trang 55).</i>
//                             </p>
//                         </div>
//                     </Card.Body>
//                 </Card>
//             </Col>
//         </Row>
//     </Modal.Body>
// </Modal>
//         </div>
//     );
// };

// export default SpeciesLibraryPage;


// SpeciesLibraryPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Pagination, Form, Spinner, Card, InputGroup, Modal } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaExchangeAlt, FaSortAmountDown, FaSearch, FaTree, FaFilter, FaLightbulb, FaCheckCircle, FaBook } from 'react-icons/fa';
import { Helmet } from 'react-helmet-async';
import publicService from '../../../services/publicService';
import './SpeciesLibraryPage.css';

import LibraryFilterSidebar from '../../../components/common/SpeciesLibraryPage/LibraryFilterSidebar';
import SpeciesGrid from '../../../components/common/SpeciesLibraryPage/SpeciesGrid';
import SpeciesCompareModal from '../../../components/modal/ModalForm/SpeciesCompareModal';

const SpeciesLibraryPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

    const [initialLoading, setInitialLoading] = useState(true);
    const [isFiltering, setIsFiltering] = useState(false);

    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [uiMapping, setUiMapping] = useState({});
    const [showSearchGuide, setShowSearchGuide] = useState(false);

    const [SmartSelectOptions, setSmartSelectOptions] = useState({});

    const [localClassOptions, setLocalClassOptions] = useState([]);
    const [localOrderOptions, setLocalOrderOptions] = useState([]);
    const [localFamilyOptions, setLocalFamilyOptions] = useState([]);
    const [localGenusOptions, setLocalGenusOptions] = useState([]);

    const [activeSections, setActiveSections] = useState({
        ho_species_option: false,
        leaf: false,
        stem: false,
        flower: false,
    });

    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        sort: searchParams.get('sort') || 'image_count_desc',
        limit: searchParams.get('limit') || '12',
        display_rank: searchParams.get('display_rank') || 'species',
    });

    const [compareList, setCompareList] = useState([]);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [compareData, setCompareData] = useState([]);

    // EFFECT 1: Nạp danh mục dữ liệu cấu hình ban đầu hệ thống (Chỉ chạy khi Mount)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const mapping = await publicService.getUIEnumMapping();
                setUiMapping(mapping);

                const [phylumData, classData, orderData, familiesData, generaData] = await publicService.getSpeciesPageSmartSelectOptions();
                const phylumOptions = phylumData.map(item => ({ value: item.phylum_id, label: `${item.scientific_name} ${item.vietnamese_name ? '- ' + item.vietnamese_name : ''}` }));
                const classOptions = classData.map(item => ({ value: item.class_id, label: `${item.scientific_name} ${item.vietnamese_name ? '- ' + item.vietnamese_name : ''}`, phylum_id: item.phylum_id }));
                const orderOptions = orderData.map(item => ({ value: item.order_id, label: `${item.scientific_name} ${item.vietnamese_name ? '- ' + item.vietnamese_name : ''}`, class_id: item.Class?.class_id, phylum_id: item.Class?.phylum_id }));
                const familyOptions = familiesData.map(item => ({ value: item.family_id, label: `${item.scientific_name} ${item.vietnamese_name ? '- ' + item.vietnamese_name : ''}`, order_id: item.Order?.order_id, class_id: item.Order?.Class?.class_id, phylum_id: item.Order?.Class?.phylum_id }));
                const genusOptions = generaData.map(item => ({ value: item.genus_id, label: `${item.scientific_name} ${item.vietnamese_name ? '- ' + item.vietnamese_name : ''}`, family_id: item.Family?.family_id, order_id: item.Family?.Order?.order_id, class_id: item.Family?.Order?.Class?.class_id, phylum_id: item.Family?.Order?.Class?.phylum_id }));
                
                setSmartSelectOptions({
                    phylum: phylumOptions,
                    class: classOptions,
                    order: orderOptions,
                    family: familyOptions,
                    genus: genusOptions,
                });
            } catch (error) {
                console.error('Error fetching initial system metadata:', error);
            }
        };
        fetchInitialData();
    }, []);

    // EFFECT 2: ĐỒNG BỘ NGƯỢC (URL Parameter -> Component State) - Giải quyết dứt điểm lỗi điều hướng từ Navbar
    useEffect(() => {
        const params = Object.fromEntries([...searchParams]);
        
        setFilters(prev => {
            const nextFilters = { ...prev };
            nextFilters.search = params.search || '';
            nextFilters.sort = params.sort || 'image_count_desc';
            nextFilters.limit = params.limit || '12';
            nextFilters.display_rank = params.display_rank || 'species';
            nextFilters.is_recorded_in_vietnam = params.is_recorded_in_vietnam || '';
            nextFilters.uses = params.uses || '';
            nextFilters.description = params.description || '';

            // Khôi phục đồng bộ các trường hình thái học nâng cao từ URL
            const advancedMorphoKeys = [
                'leaf_type', 'leaf_shape', 'leaf_arrangement', 'leaf_margin',
                'leaf_length_min', 'leaf_width_min', 'petiole_length_min',
                'stem_type', 'stem_surface', 'stem_color', 'stem_height_min',
                'inflorescence', 'flower_color', 'flower_petal_count',
                'habit_stem_root', 'leaves', 'reproduction', 'phenology', 
                'habitat_ecology', 'usages', 'notes', 'book_volume', 'book_page_from', 'book_page_to'
            ];
            advancedMorphoKeys.forEach(key => {
                nextFilters[key] = params[key] || '';
            });

            // Đồng bộ thực thể Object được chọn cho cấu trúc SmartSelect
            if (SmartSelectOptions.phylum) nextFilters.phylum_option = SmartSelectOptions.phylum.find(o => String(o.value) === String(params.phylum_id)) || null;
            if (SmartSelectOptions.class) nextFilters.class_option = SmartSelectOptions.class.find(o => String(o.value) === String(params.class_id)) || null;
            if (SmartSelectOptions.order) nextFilters.order_option = SmartSelectOptions.order.find(o => String(o.value) === String(params.order_id)) || null;
            if (SmartSelectOptions.family) nextFilters.family_option = SmartSelectOptions.family.find(o => String(o.value) === String(params.family_id)) || null;
            if (SmartSelectOptions.genus) nextFilters.genus_option = SmartSelectOptions.genus.find(o => String(o.value) === String(params.genus_id)) || null;

            return nextFilters;
        });

        // Tự động mở phân khu chức năng Sidebar nếu URL đang chứa biến lọc thuộc phân khu đó
        setActiveSections({
            ho_species_option: !!(params.habit_stem_root || params.leaves || params.reproduction || params.phenology || params.habitat_ecology || params.usages || params.notes || params.book_volume || params.book_page_from || params.book_page_to),
            leaf: params.has_leaf_filter === 'true' || !!(params.leaf_type || params.leaf_shape || params.leaf_arrangement || params.leaf_margin),
            stem: params.has_stem_filter === 'true' || !!(params.stem_type || params.stem_surface || params.stem_color || params.stem_height_min),
            flower: params.has_flower_filter === 'true' || !!(params.inflorescence || params.flower_color || params.flower_petal_count)
        });

    }, [searchParams, SmartSelectOptions]);

    // EFFECT 3: Tự động tính toán bộ lọc phả hệ cây phân loại (Cascading Options Tree)
    useEffect(() => {
        if (!SmartSelectOptions.phylum) return;

        const pId = filters.phylum_option?.value;
        const cId = filters.class_option?.value;
        const oId = filters.order_option?.value;
        const fId = filters.family_option?.value;

        setLocalClassOptions(pId ? SmartSelectOptions.class.filter(c => c.phylum_id === pId) : SmartSelectOptions.class);
        setLocalOrderOptions(cId ? SmartSelectOptions.order.filter(o => o.class_id === cId) : pId ? SmartSelectOptions.order.filter(o => o.phylum_id === pId) : SmartSelectOptions.order);
        setLocalFamilyOptions(oId ? SmartSelectOptions.family.filter(f => f.order_id === oId) : cId ? SmartSelectOptions.family.filter(f => f.class_id === cId) : pId ? SmartSelectOptions.family.filter(f => f.phylum_id === pId) : SmartSelectOptions.family);
        setLocalGenusOptions(fId ? SmartSelectOptions.genus.filter(g => g.family_id === fId) : oId ? SmartSelectOptions.genus.filter(g => g.order_id === oId) : cId ? SmartSelectOptions.genus.filter(g => g.class_id === cId) : pId ? SmartSelectOptions.genus.filter(g => g.phylum_id === pId) : SmartSelectOptions.genus);

    }, [filters.phylum_option, filters.class_option, filters.order_option, filters.family_option, SmartSelectOptions]);

    // EFFECT 4: Xử lý độ trễ bàn phím (Debounce Search Input) hạn chế quá tải Request API
    useEffect(() => {
        const currentUrlSearch = searchParams.get('search') || '';
        if (filters.search === currentUrlSearch) return;

        const delayDebounceFn = setTimeout(() => {
            applyFilters();
        }, 600);

        return () => clearTimeout(delayDebounceFn);
    }, [filters.search]);

    // EFFECT 5: Gọi API truy vấn và lấy dữ liệu chính xác từ Database dựa trên URL Parameter thực tế
    useEffect(() => {
        const fetchData = async () => {
            setIsFiltering(true);
            try {
                const params = Object.fromEntries([...searchParams]);
                const response = await publicService.getSpeciesList(params);
                setData(response.data);
                setPagination(response.pagination);
            } catch (error) {
                console.error('Error in fetching plant matrix database data:', error);
            } finally {
                setInitialLoading(false);
                setIsFiltering(false);
            }
        };
        
        fetchData();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [searchParams]);

    // HÀM TỔNG HỢP & ÁP DỤNG BỘ LỌC CHUẨN (Hàm duy nhất đẩy dữ liệu lên URL)
    const applyFilters = (customChanges = {}) => {
        // Tạo bản sao shallow-copy, kết hợp thay đổi tức thì (nếu có) để triệt tiêu lỗi đột biến state trực tiếp
        const workingFilters = { ...filters, ...customChanges };
        
        const activeFilters = { 
            page: 1, 
            sort: workingFilters.sort, 
            limit: workingFilters.limit, 
            display_rank: workingFilters.display_rank || 'species' 
        };

        // Loại bỏ các thuộc tính chuyên biệt nếu bậc phân loại hiển thị khác Loài
        if (workingFilters.display_rank !== 'species') {
            const speciesSpecificKeys = [
                'habit_stem_root', 'leaves', 'reproduction', 'phenology', 'habitat_ecology', 'usages', 'notes',
                'book_volume', 'book_page_from', 'book_page_to', 'leaf_margin', 'leaf_type', 'leaf_shape',
                'leaf_arrangement', 'leaf_length_min', 'leaf_width_min', 'petiole_length_min', 'stem_type',
                'stem_surface', 'stem_height_min', 'stem_color', 'inflorescence', 'flower_color', 'flower_petal_count'
            ];
            speciesSpecificKeys.forEach(k => delete workingFilters[k]);
        } else {
            // Kiểm tra trạng thái đóng/mở của các phân khu tiêu chí hình thái học ở bậc Loài
            if (!activeSections.ho_species_option) {
                ['habit_stem_root', 'leaves', 'reproduction', 'phenology', 'habitat_ecology', 'usages', 'notes', 'book_volume', 'book_page_from', 'book_page_to'].forEach(k => delete workingFilters[k]);
            }
            if (!activeSections.leaf) {
                ['leaf_margin', 'leaf_type', 'leaf_shape', 'leaf_arrangement', 'leaf_length_min', 'leaf_width_min', 'petiole_length_min'].forEach(k => delete workingFilters[k]);
            }
            if (!activeSections.stem) {
                ['stem_type', 'stem_surface', 'stem_height_min', 'stem_color'].forEach(k => delete workingFilters[k]);
            }
            if (!activeSections.flower) {
                ['inflorescence', 'flower_color', 'flower_petal_count'].forEach(k => delete workingFilters[k]);
            }
        }

        // Đóng gói cờ boolean kiểm soát trạng thái liên kết bảng lồng nhau ở phía Backend
        activeFilters.has_leaf_filter = activeSections.leaf && workingFilters.display_rank === 'species';
        activeFilters.has_stem_filter = activeSections.stem && workingFilters.display_rank === 'species';
        activeFilters.has_flower_filter = activeSections.flower && workingFilters.display_rank === 'species';

        // Trích xuất ID từ SmartSelect Object để gán vào tham số phẳng, tránh truyền nhầm Object thô gây lỗi URL
        if (workingFilters.phylum_option) activeFilters.phylum_id = workingFilters.phylum_option.value;
        if (workingFilters.class_option) activeFilters.class_id = workingFilters.class_option.value;
        if (workingFilters.order_option) activeFilters.order_id = workingFilters.order_option.value;
        if (workingFilters.family_option) activeFilters.family_id = workingFilters.family_option.value;
        if (workingFilters.genus_option) activeFilters.genus_id = workingFilters.genus_option.value;

        // Tiến hành lọc sạch chuỗi rỗng trước khi đẩy tham số lên URL Parameter công khai
        const optionObjectKeys = ['phylum_option', 'class_option', 'order_option', 'family_option', 'genus_option'];
        Object.keys(workingFilters).forEach(key => {
            if (optionObjectKeys.includes(key)) return; // Bỏ qua object cấu hình gốc của dropdown
            
            const value = workingFilters[key];
            if (value !== undefined && value !== null) {
                if (typeof value === 'string' && value.trim() === '') return;
                activeFilters[key] = value;
            }
        });

        setSearchParams(activeFilters);
    };

    const resetFilters = () => {
        setCompareList([]);
        setCompareData([]);
        setActiveSections({ ho_species_option: false, leaf: false, stem: false, flower: false });
        setSearchParams({ sort: 'image_count_desc', page: 1, limit: 12, display_rank: 'species' });
    };

    const handleSortChange = (e) => {
        const newSort = e.target.value;
        setFilters(prev => ({ ...prev, sort: newSort }));
        applyFilters({ sort: newSort });
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSortLimitChange = (e) => {
        const { name, value } = e.target;
        const variations = { [name]: value };
        
        if (name === 'display_rank') {
            setCompareList([]);
            setCompareData([]);
        }
        
        setFilters(prev => ({ ...prev, ...variations }));
        applyFilters(variations);
    };

    const toggleCompare = (plant) => {
        const idKey = `${filters.display_rank || 'species'}_id`;
        const plantId = plant[idKey];
        setCompareList(prev => {
            const isExist = prev.find(item => item[idKey] === plantId);
            if (isExist) return prev.filter(item => item[idKey] !== plantId);
            return [...prev, plant];
        });
    };

    const openCompareModal = async () => {
        const idKey = `${filters.display_rank || 'species'}_id`;
        const ids = compareList.map(item => item[idKey]);
        const detailData = await publicService.getCompareDataSpecies(ids, filters.display_rank || 'species');
        setCompareData(detailData);
        setShowCompareModal(true);
    };

    const handlePageChange = (newPage) => {
        const currentParams = new URLSearchParams(searchParams);
        currentParams.set('page', newPage);
        setSearchParams(currentParams);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="library-wrapper bg-light min-vh-100 font-sans">
            <Helmet>
                <title>PlantDB | Thư viện thực vật</title>
                <meta name="description" content="Khám phá thư viện loài thực vật của hệ thống, cung cấp thông tin chi tiết và hình ảnh về các loài thực vật khác nhau." />
            </Helmet>
            <Container fluid className="px-3 px-xl-5">
                <Row className="g-4 mt-1 flex-lg-nowrap">
                    <Col lg={isSidebarExpanded ? 4 : 3}>
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
                            setLocalClassOptions={setLocalClassOptions}
                            setLocalOrderOptions={setLocalOrderOptions}
                            setLocalFamilyOptions={setLocalFamilyOptions}
                            setLocalGenusOptions={setLocalGenusOptions}
                        />
                    </Col>

                    <Col lg={isSidebarExpanded ? 8 : 9} className="transition-all">
                        <Card className="border-0 shadow-sm rounded-4 p-3 mb-3 bg-white">
                            <Row className="g-3 align-items-center">
                                <Col xs={12} md={7} lg={8}>
                                    <div className="d-flex justify-content-between align-items-center mb-1.5">
                                        <Form.Label className="small fw-bolder text-dark mb-0">Từ khóa tra cứu</Form.Label>
                                        <Button 
                                            variant="link" 
                                            className="p-0 text-success text-decoration-none small d-flex align-items-center fw-medium m-0" 
                                            onClick={() => setShowSearchGuide(true)}
                                            style={{ fontSize: '0.8rem' }}
                                        >
                                            <span className="me-1">💡</span> Hướng dẫn tra cứu
                                        </Button>
                                    </div>
                                    <InputGroup className="shadow-sm rounded-pill overflow-hidden border border-success border-opacity-25 bg-light">
                                        <InputGroup.Text className="bg-transparent border-0 text-success pe-2"><FaSearch size={14}/></InputGroup.Text>
                                        <Form.Control 
                                            name="search"
                                            placeholder="Nhập tên khoa học, tên tiếng việt hoặc mã số..." 
                                            value={filters.search || ''}
                                            onChange={handleFilterChange}
                                            className="border-0 ps-1 shadow-none bg-transparent small font-sans"
                                            onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
                                        />
                                    </InputGroup>
                                </Col>

                                <Col xs={12} md={5} lg={4}>
                                    <Form.Label className="small fw-bolder text-dark mb-1.5 d-flex align-items-center">
                                        <FaTree className="me-1 text-success" size={12}/> Bậc phân loại hiển thị
                                    </Form.Label>
                                    <Form.Select 
                                        size="sm" 
                                        name="display_rank"
                                        className="border-success border-opacity-25 rounded-pill shadow-none px-3 py-1.5 bg-light fw-bold text-success font-sans"
                                        value={filters.display_rank || 'species'}
                                        onChange={handleSortLimitChange}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <option value="phylum">Ngành Thực vật (Phylum)</option>
                                        <option value="class">Lớp Thực vật (Class)</option>
                                        <option value="order">Bộ Thực vật (Order)</option>
                                        <option value="family">Họ Thực vật (Family)</option>
                                        <option value="genus">Chi Thực vật (Genus)</option>
                                        <option value="species">Loài Thực vật (Species)</option>
                                    </Form.Select>
                                </Col>
                            </Row>
                        </Card>

                        <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-4 shadow-sm mb-4">
                            <span className="text-muted fw-medium d-none d-md-block">
                                Tìm thấy <strong className="text-success">{pagination.total || data.length}</strong> kết quả phù hợp
                            </span>
                            <div className="d-flex align-items-center w-auto">
                                <FaSortAmountDown className="text-success me-2 flex-shrink-0" />
                                <span className="text-muted small fw-bold me-2 d-none d-sm-block text-nowrap">Sắp xếp:</span>
                                <Form.Select 
                                    size="sm" 
                                    className="border-success border-opacity-25 rounded-pill shadow-none px-3 py-1 bg-light fw-medium"
                                    value={filters.sort}
                                    onChange={handleSortChange}
                                    style={{ width: '200px', cursor: 'pointer' }}
                                >
                                    <option value="createdAt_desc">Mới nhất - Cũ nhất</option>
                                    <option value="name_asc">Tên hiển thị (A - Z)</option>
                                    <option value="name_desc">Tên hiển thị (Z - A)</option>
                                    <option value="view_count_desc">Lượt xem (Cao - Thấp)</option>
                                    <option value="view_count_asc">Lượt xem (Thấp - Cao)</option>
                                    <option value="image_count_desc">Kho sưu tập hình ảnh (Lớn - Nhỏ)</option>
                                    <option value="image_count_asc">Kho sưu tập hình ảnh (Nhỏ - Lớn)</option>
                                </Form.Select>
                                <span className="text-muted small fw-bold ms-2 d-none d-sm-block">Hiển thị:</span>
                                <Form.Select 
                                    size="sm" 
                                    name="limit"
                                    className="ms-2 border-success border-opacity-25 rounded-pill shadow-none px-3 bg-light fw-medium"
                                    value={filters.limit}
                                    onChange={handleSortLimitChange}
                                    style={{ width: '80px', cursor: 'pointer' }}
                                >
                                    <option value="12">12</option>
                                    <option value="24">24</option>
                                    <option value="48">48</option>
                                </Form.Select>
                            </div>
                        </div>

                        {initialLoading ? (
                            <div className="d-flex justify-content-center py-5 mt-5"><Spinner animation="grow" variant="success" /></div>
                        ) : (
                            <div style={{ transition: 'opacity 0.3s ease', opacity: isFiltering ? 0.4 : 1 }}>
                                <SpeciesGrid 
                                    data={data} 
                                    compareList={compareList} 
                                    onToggleCompare={toggleCompare} 
                                    onNavigate={(id, rank) => {
                                        navigate(`/species/detail/${id}?rank=${rank}`);
                                    }}
                                    backendUrl={backendUrl}
                                    isExpanded={isSidebarExpanded}
                                    display_rank={filters.display_rank} 
                                />

                                {pagination.totalPages > 1 && (
                                    <div className="d-flex justify-content-center mt-5 mb-5 pb-5">
                                        <Pagination className="shadow-sm">
                                            <Pagination.Prev disabled={pagination.page === 1} onClick={() => handlePageChange(pagination.page - 1)} />
                                            {[...Array(pagination.totalPages)].map((_, idx) => {
                                                const p = idx + 1;
                                                if (p === 1 || p === pagination.totalPages || (p >= pagination.page - 1 && p <= pagination.page + 1)) {
                                                    return (
                                                        <Pagination.Item key={p} active={p === pagination.page} onClick={() => handlePageChange(p)}>
                                                            {p}
                                                        </Pagination.Item>
                                                    );
                                                }
                                                if (p === pagination.page - 2 || p === pagination.page + 2) {
                                                    return <Pagination.Ellipsis key={p} disabled />;
                                                }
                                                return null;
                                            })}
                                            <Pagination.Next disabled={pagination.page === pagination.totalPages} onClick={() => handlePageChange(pagination.page + 1)} />
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
                        style={{ width: '50px', height: '50px' }}
                        onClick={() => { setCompareList([]); setCompareData([]); }}
                        title="Xóa toàn bộ danh sách so sánh"
                    >
                        <span style={{ fontSize: '1.4rem', fontWeight: '300', marginTop: '-2px' }}>&times;</span>
                    </Button>

                    <Button 
                        variant="success" 
                        size="lg" 
                        className="rounded-pill shadow-lg fw-bold px-4 d-flex align-items-center justify-content-center" 
                        style={{ height: '50px', fontSize: '0.88rem', letterSpacing: '0.2px' }}
                        onClick={openCompareModal}
                    >
                        <FaExchangeAlt className="me-2" size={13} /> So Sánh ({compareList.length})
                    </Button>
                </div>
            )}

            <SpeciesCompareModal 
                show={showCompareModal} 
                onHide={() => setShowCompareModal(false)} 
                compareData={compareData} 
                onRemoveItem={(item) => {
                    const idKey = `${filters.display_rank || 'species'}_id`;
                    toggleCompare(item);
                    setCompareData(prev => prev.filter(p => p[idKey] !== item[idKey]));
                }}
                backendUrl={backendUrl}
                uiMapping={uiMapping}
                display_rank={filters.display_rank}
            />

            <Modal show={showSearchGuide} onHide={() => setShowSearchGuide(false)} centered size="xl">
                <Modal.Header closeButton className="bg-success text-white border-0 py-3 rounded-top-4">
                    <Modal.Title className="fw-bold d-flex align-items-center fs-5">
                        <FaLightbulb className="me-2 text-warning"/> Cẩm Nang Tra Cứu Hệ Thống Thực Vật
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 bg-light">
                    <Row className="g-4">
                        <Col md={6}>
                            <Card className="border-0 shadow-sm h-100 rounded-3 bg-white">
                                <Card.Body className="p-4">
                                    <h6 className="fw-bold text-success border-bottom pb-2 d-flex align-items-center">
                                        <FaSearch className="me-2"/> Ô "Từ khóa tự do" tìm gì?
                                    </h6>
                                    <p className="small text-muted mt-2">Cơ chế tìm nhanh thông minh tự động quét trên toàn bộ các tầng dữ liệu:</p>
                                    <ul className="list-unstyled mb-0 small text-dark lh-lg ps-1">
                                        <li><FaCheckCircle className="text-success me-2 small"/> <b>Tên thực vật:</b> Tên tiếng Việt, tiếng Anh phổ thông hoặc tên đồng nghĩa (Synonyms).</li>
                                        <li><FaCheckCircle className="text-success me-2 small"/> <b>Danh pháp khoa học:</b> Tên Latin chuẩn quốc tế (Ví dụ: <i>Psilotum nudum</i>).</li>
                                        <li><FaCheckCircle className="text-success me-2 small"/> <b>Mã hệ thống:</b> Mã định danh mẫu vật được cấp tự động (Ví dụ: <code>SPC-0102</code>).</li>
                                    </ul>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={6}>
                            <Card className="border-0 shadow-sm h-100 rounded-3 bg-white">
                                <Card.Body className="p-4">
                                    <h6 className="fw-bold text-primary border-bottom pb-2 d-flex align-items-center">
                                        <FaFilter className="me-2"/> Lọc Chuyên Biệt (Smart Logic)
                                    </h6>
                                    <p className="small text-muted mt-2">Kết hợp nhiều tiêu chí để thu hẹp phạm vi và loại bỏ 100% kết quả rác:</p>
                                    <ul className="list-unstyled mb-0 small text-dark lh-lg ps-1">
                                        <li><FaCheckCircle className="text-primary me-2 small"/> <b>Cây phả hệ:</b> Giới hạn vùng tìm kiếm theo mạch đệ quy Ngành → Lớp → Bộ → Họ → Chi.</li>
                                        <li><FaCheckCircle className="text-primary me-2 small"/> <b>Hình thái học:</b> Bật/Tắt các phân khu đặc tính cơ quan Lá, Thân, Hoa để lọc chuyên sâu.</li>
                                    </ul>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col xs={12}>
                            <Card className="border-0 shadow-sm rounded-3 bg-white">
                                <Card.Body className="p-4">
                                    <h6 className="fw-bold text-danger border-bottom pb-2 d-flex align-items-center">
                                        <FaBook className="me-2"/> Tra cứu theo Thư mục Sách "Cây cỏ Việt Nam"
                                    </h6>
                                    <p className="small text-dark mt-2 mb-3">Cho phép khoanh vùng loài số hóa theo cấu trúc chương mục và số hiệu trang in thực tế của cố GS. Phạm Hoàng Hộ.</p>
                                    <div className="alert alert-warning border-0 p-3 mb-0 small text-dark">
                                        <div className="fw-bold mb-1">💡 Mẹo nhỏ:</div>
                                        <p className="mb-0 text-justify lh-base">
                                            Trong tài liệu số hóa, giữa <b>chỉ mục dữ liệu thô</b> và <b>trang in bản quét (scan)</b> thực tế thường có độ lệch tuyến tính từ 1 đến 7 trang. Vì vậy, khi lọc trang, bạn nên nới rộng khoảng tra cứu để đạt kết quả chính xác nhất.
                                        </p>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default SpeciesLibraryPage;