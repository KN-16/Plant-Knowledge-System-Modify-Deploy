// import React, { useState, useEffect } from 'react';
// import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
// import { FaProjectDiagram, FaSearch, FaRedo, FaExclamationTriangle } from 'react-icons/fa';
// import publicService from '../../services/publicService'; 
// import SmartSelect from '../../components/common/SmartSelect';
// import TaxonomyTreeView from '../../components/common/TaxonomyTreeView';
// import { Helmet } from 'react-helmet-async';

// const TaxonomyExplorerPage = () => {
//     // Lưu trữ Master Data cho Select
//     const [SmartSelectOptions, setSmartSelectOptions] = useState({});
    
//     // Tùy chọn cục bộ thay đổi dựa theo quan hệ cha con
//     const [localGenusOptions, setLocalGenusOptions] = useState([]);
//     const [localSpeciesOptions, setLocalSpeciesOptions] = useState([]);
    
//     // State lưu giá trị đang chọn
//     const [selectedFilters, setSelectedFilters] = useState({
//         phylum_option: null,
//         class_option: null,
//         order_option: null,
//         family_option: null,
//         genus_option: null,
//         species_option: null
//     });
//     const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
//     const [treeData, setTreeData] = useState(null);
//     const [isFetching, setIsFetching] = useState(false);
//     const [focusedNode, setFocusedNode] = useState({ level: null, id: null });
//     const [uiMapping, setUIMapping] = useState({});

//     // Lấy dữ liệu cơ sở cho SmartSelect khi mới vào trang
//     useEffect(() => {
//         const fetchSelectOptions = async () => {
//             try {

//                 const uiMappingData = await publicService.getUIEnumMapping();
//                 setUIMapping(uiMappingData);


//                 const [familiesData, generaData, speciesData] = await Promise.all([
//                     publicService.fetchAllItems('families'),
//                     publicService.fetchAllItems('genera'),
//                     publicService.fetchAllItems('species')
//                 ]);
                
//                 const familyOpts = familiesData.map(item => ({ value: item.family_id, label: `${item.scientific_name} - ${item.vietnamese_name}` }));
//                 const genusOpts = generaData.map(item => ({ value: item.genus_id, label: `${item.scientific_name} - ${item.vietnamese_name}`, family_id: item.Family.family_id }));
//                 const speciesOpts = speciesData.map(item => ({ value: item.species_id, label: `${item.scientific_name} - ${item.vietnamese_name}`, genus_id: item.Genus.genus_id, family_id: item.Genus.Family.family_id }));
                
//                 setSmartSelectOptions({ family: familyOpts, genus: genusOpts, species: speciesOpts });
//                 setLocalGenusOptions(genusOpts);
//                 setLocalSpeciesOptions(speciesOpts);
//             } catch (error) {
//                 console.error('Error fetching options:', error);
//             }
//         };
//         fetchSelectOptions();
//     }, []);

//     const handleReset = () => {
//         setSelectedFilters({ family_option: null, genus_option: null, species_option: null });
//         setLocalGenusOptions(SmartSelectOptions.genus || []);
//         setLocalSpeciesOptions(SmartSelectOptions.species || []);
//         setTreeData(null); // Xóa sơ đồ cũ
//         setFocusedNode({ level: null, id: null });
//     };
    
//     const handleExtractTree = async () => {
//         // --- LOGIC BẢO VỆ SERVER: BẮT BUỘC CHỌN TỐI THIỂU LÀ "HỌ" ---
//         // if (!selectedFilters.family_option) {
//         //     alert("Vui lòng chọn tối thiểu một Họ thực vật (Family) để tránh quá tải hệ thống!");
//         //     return;
//         // }

//         setIsFetching(true);
//         try {
//             const params = {};
//             // Ghi nhớ Node sâu nhất được chọn để Highlight
//             if (selectedFilters.species_option) {
//                 params.species_id = selectedFilters.species_option.value;
//                 setFocusedNode({ level: 'species', id: selectedFilters.species_option.value });
//             } else if (selectedFilters.genus_option) {
//                 params.genus_id = selectedFilters.genus_option.value;
//                 setFocusedNode({ level: 'genus', id: selectedFilters.genus_option.value });
//             } else if (selectedFilters.family_option) {
//                 // Rơi vào đây tức là đã có family_option
//                 params.family_id = selectedFilters.family_option.value;
//                 setFocusedNode({ level: 'family', id: selectedFilters.family_option.value });
//             }

//             const response = await publicService.getTaxonomyTree(params);
//             setTreeData(response.data);
//         } catch (error) {
//             console.error("Lỗi khi trích xuất sơ đồ:", error);
//             alert("Có lỗi xảy ra khi lấy dữ liệu sơ đồ.");
//         } finally {
//             setIsFetching(false);
//         }
//     };

//     return (
//         <div className="bg-light min-vh-100 py-5 font-sans">
//             <Helmet>
//                 <title>PlantDB | Sơ đồ phân loại</title>
//                 <meta name="description" content="Khoanh vùng dữ liệu theo từng Họ, Chi hoặc Loài để trích xuất Sơ đồ quan hệ hình thái cây trồng trực quan, tránh quá tải khi tải dữ liệu lớn." />
//             </Helmet>
//             <Container>
//                 {/* Header Trang */}
//                 <div className="text-center mb-5">
//                     <h2 className="fw-bolder text-success d-flex align-items-center justify-content-center">
//                         <FaProjectDiagram className="me-3"/> Hệ Thống Tra Cứu Phân Loại Học
//                     </h2>
//                     <p className="text-muted mx-auto" style={{maxWidth: '700px'}}>
//                         Khoanh vùng dữ liệu theo từng Họ, Chi hoặc Loài để trích xuất Sơ đồ quan hệ hình thái cây trồng trực quan, tránh quá tải khi tải dữ liệu lớn.
//                     </p>
//                 </div>

//                 <Row className="justify-content-center">
//                     <Col lg={10} xl={8}>
//                         {/* BẢNG ĐIỀU KHIỂN CHỌN LỌC (CONTROL PANEL) */}
//                         <Card className="border-0 shadow-sm rounded-4 mb-4">
//                             <Card.Body className="p-4 p-md-5">
//                                 <h6 className="fw-bold mb-4 text-dark border-bottom pb-2">Khoanh vùng trích xuất</h6>
//                                 <Row className="g-3">
//                                     <Col md={4}>
//                                         <Form.Group>
//                                             <Form.Label className="small fw-bold text-muted">Ngành Thực vật (Phylum) <span className="text-danger">*</span></Form.Label>
//                                             <SmartSelect 
//                                                 placeholder="Chọn Họ..."
//                                                 label="Họ" 
//                                                 options={SmartSelectOptions.phylum || []}
//                                                 value={selectedFilters.family_option}
//                                                 isNewable={false}
//                                                 isNullable={true}
//                                                 onChange={(option) => {
//                                                     setSelectedFilters(prev => ({ ...prev, family_option: option.value ? option : null, genus_option: null, species_option: null }));
//                                                     // Chỉ hiện Chi thuộc Họ này
//                                                     if (option.value) {
//                                                     setLocalGenusOptions(SmartSelectOptions.genus?.filter(g => g.family_id === option.value) || []);
//                                                     setLocalSpeciesOptions(SmartSelectOptions.species?.filter(s => s.family_id === option.value) || []);
//                                                     } else {
//                                                     setLocalGenusOptions(SmartSelectOptions.genus || []);
//                                                     setLocalSpeciesOptions(SmartSelectOptions.species || []);
//                                                     }
//                                                 }} 
//                                             />
//                                         </Form.Group>
//                                     </Col>
//                                     <Col md={4}>
//                                         <Form.Group>
//                                             <Form.Label className="small fw-bold text-muted">Chi (Genus)</Form.Label>
//                                             <SmartSelect 
//                                                 placeholder="Chọn Chi..."
//                                                 label="Chi" 
//                                                 options={localGenusOptions}
//                                                 value={selectedFilters.genus_option}
//                                                 isNewable={false}
//                                                 isNullable={true}
//                                                 onChange={(option) => {
//                                                     if (option.value)
//                                                     {
//                                                     const parentFamily = SmartSelectOptions.family?.find(f => f.value === option.family_id) || null;
//                                                     setSelectedFilters(prev => ({ ...prev, genus_option: option, species_option: null, family_option: parentFamily }));
//                                                     // Chỉ hiện Loài thuộc Chi này
//                                                     setLocalSpeciesOptions(SmartSelectOptions.species?.filter(s => s.genus_id === option.value) || []);
//                                                     } else
//                                                     {
//                                                         setSelectedFilters(prev => ({ ...prev, genus_option: null, species_option: null }));
//                                                         setLocalSpeciesOptions(selectedFilters.family_option ? SmartSelectOptions.species?.filter(s => s.family_id === selectedFilters.family_option.value) || [] : SmartSelectOptions.species || []);
//                                                     }
//                                                 }} 
//                                             />
//                                         </Form.Group>
//                                     </Col>
//                                     <Col md={4}>
//                                         <Form.Group>
//                                             <Form.Label className="small fw-bold text-muted">Loài (Species)</Form.Label>
//                                             <SmartSelect 
//                                                 placeholder="Chọn Loài..."
//                                                 label="Loài" 
//                                                 options={localSpeciesOptions}
//                                                 value={selectedFilters.species_option}
//                                                 isNewable={false}
//                                                 isNullable={true}
//                                                 onChange={(option) => {
//                                                     if (option.value)
//                                                     {
//                                                     const parentGenus = SmartSelectOptions.genus?.find(g => g.value === option.genus_id) || null;
//                                                     const parentFamily = SmartSelectOptions.family?.find(f => f.value === option.family_id) || null;
//                                                     setSelectedFilters({ species_option: option, genus_option: parentGenus, family_option: parentFamily });
//                                                     } else
//                                                     {
//                                                         setSelectedFilters(prev => ({ ...prev, species_option: null }));
//                                                     }
//                                                 }} 
//                                             />
//                                         </Form.Group>
//                                     </Col>
//                                 </Row>
//                                 <Row className="g-3">
//                                     <Col md={4}>
//                                         <Form.Group>
//                                             <Form.Label className="small fw-bold text-muted">Họ Thực vật (Family) <span className="text-danger">*</span></Form.Label>
//                                             <SmartSelect 
//                                                 placeholder="Chọn Họ..."
//                                                 label="Họ" 
//                                                 options={SmartSelectOptions.family || []}
//                                                 value={selectedFilters.family_option}
//                                                 isNewable={false}
//                                                 isNullable={true}
//                                                 onChange={(option) => {
//                                                     setSelectedFilters(prev => ({ ...prev, family_option: option.value ? option : null, genus_option: null, species_option: null }));
//                                                     // Chỉ hiện Chi thuộc Họ này
//                                                     if (option.value) {
//                                                     setLocalGenusOptions(SmartSelectOptions.genus?.filter(g => g.family_id === option.value) || []);
//                                                     setLocalSpeciesOptions(SmartSelectOptions.species?.filter(s => s.family_id === option.value) || []);
//                                                     } else {
//                                                     setLocalGenusOptions(SmartSelectOptions.genus || []);
//                                                     setLocalSpeciesOptions(SmartSelectOptions.species || []);
//                                                     }
//                                                 }} 
//                                             />
//                                         </Form.Group>
//                                     </Col>
//                                     <Col md={4}>
//                                         <Form.Group>
//                                             <Form.Label className="small fw-bold text-muted">Chi (Genus)</Form.Label>
//                                             <SmartSelect 
//                                                 placeholder="Chọn Chi..."
//                                                 label="Chi" 
//                                                 options={localGenusOptions}
//                                                 value={selectedFilters.genus_option}
//                                                 isNewable={false}
//                                                 isNullable={true}
//                                                 onChange={(option) => {
//                                                     if (option.value)
//                                                     {
//                                                     const parentFamily = SmartSelectOptions.family?.find(f => f.value === option.family_id) || null;
//                                                     setSelectedFilters(prev => ({ ...prev, genus_option: option, species_option: null, family_option: parentFamily }));
//                                                     // Chỉ hiện Loài thuộc Chi này
//                                                     setLocalSpeciesOptions(SmartSelectOptions.species?.filter(s => s.genus_id === option.value) || []);
//                                                     } else
//                                                     {
//                                                         setSelectedFilters(prev => ({ ...prev, genus_option: null, species_option: null }));
//                                                         setLocalSpeciesOptions(selectedFilters.family_option ? SmartSelectOptions.species?.filter(s => s.family_id === selectedFilters.family_option.value) || [] : SmartSelectOptions.species || []);
//                                                     }
//                                                 }} 
//                                             />
//                                         </Form.Group>
//                                     </Col>
//                                     <Col md={4}>
//                                         <Form.Group>
//                                             <Form.Label className="small fw-bold text-muted">Loài (Species)</Form.Label>
//                                             <SmartSelect 
//                                                 placeholder="Chọn Loài..."
//                                                 label="Loài" 
//                                                 options={localSpeciesOptions}
//                                                 value={selectedFilters.species_option}
//                                                 isNewable={false}
//                                                 isNullable={true}
//                                                 onChange={(option) => {
//                                                     if (option.value)
//                                                     {
//                                                     const parentGenus = SmartSelectOptions.genus?.find(g => g.value === option.genus_id) || null;
//                                                     const parentFamily = SmartSelectOptions.family?.find(f => f.value === option.family_id) || null;
//                                                     setSelectedFilters({ species_option: option, genus_option: parentGenus, family_option: parentFamily });
//                                                     } else
//                                                     {
//                                                         setSelectedFilters(prev => ({ ...prev, species_option: null }));
//                                                     }
//                                                 }} 
//                                             />
//                                         </Form.Group>
//                                     </Col>
//                                 </Row>

//                                 <div className="d-flex justify-content-end mt-4 gap-2">
//                                     <Button variant="light" className="fw-bold px-4 text-muted border" onClick={handleReset}>
//                                         <FaRedo className="me-2"/> Làm mới
//                                     </Button>
                                    
//                                     {/* FIX UX: Khóa nút nếu chưa chọn Family */}
//                                     <Button 
//                                         variant="success" 
//                                         className="fw-bold px-4 shadow-sm" 
//                                         onClick={handleExtractTree} 
//                                         disabled={isFetching}
//                                     >
//                                         {isFetching ? <Spinner size="sm" className="me-2"/> : <FaSearch className="me-2"/>} 
//                                         Trích xuất Sơ đồ
//                                     </Button>
//                                 </div>
//                             </Card.Body>
//                         </Card>

//                         {/* KHU VỰC HIỂN THỊ SƠ ĐỒ */}
//                         {treeData && (
//                             <div className="animation-fade-in">
//                                 <TaxonomyTreeView 
//                                     treeData={treeData} 
//                                     focusedLevel={focusedNode.level} 
//                                     focusedId={focusedNode.id}
//                                     backendUrl={backendUrl}
//                                     uiMapping={uiMapping}
//                                 />
//                             </div>
//                         )}
                        
//                         {/* {!treeData && !isFetching && (
//                             <Alert variant="warning" className="text-center p-4 mt-3 border-dashed rounded-4 bg-white opacity-75">
//                                 <FaExclamationTriangle className="me-2 text-warning mb-1" size={20}/>
//                                 <br/>
//                                 <strong>Bắt buộc:</strong> Vui lòng chọn ít nhất một <b>Họ thực vật (Family)</b> và ấn "Trích xuất" để vẽ cấu trúc phả hệ.
//                             </Alert>
//                         )} */}
//                     </Col>
//                 </Row>
//             </Container>
            
//             <style>{`
//                 .border-dashed { border-style: dashed !important; border-width: 2px !important; border-color: #ffc107 !important; }
//                 .animation-fade-in { animation: fadeIn 0.5s ease-in-out; }
//                 @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
//             `}</style>
//         </div>
//     );
// };

// export default TaxonomyExplorerPage;


// TaxonomyExplorerPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert , Form} from 'react-bootstrap';
import { FaProjectDiagram, FaSearch, FaRedo, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import publicService from '../../services/publicService'; 
import SmartSelect from '../../components/common/SmartSelect';
import TaxonomyTreeView from '../../components/common/TaxonomyTreeView';
import { Helmet } from 'react-helmet-async';

const TaxonomyExplorerPage = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    // Master Data nạp từ API lưu trữ cố định một lần duy nhất
    const [smartSelectOptions, setSmartSelectOptions] = useState({
        phylum: [], class: [], order: [], family: [], genus: [], species: []
    });

    const [filters, setFilters] = useState({
        phylum_option: null,
        class_option: null,
        order_option: null,
        family_option: null,
        genus_option: null,
        species_option: null
    });

    const [treeData, setTreeData] = useState(null);
    const [orphanData, setOrphanData] = useState(null);
    const [isFetching, setIsFetching] = useState(false);
    const [uiMapping, setUIMapping] = useState({});
    const [initialLoading, setInitialLoading] = useState(true);

    // Xác định Node sâu nhất làm điểm nhấn Highlight đồ họa cây
    const [focusedNode, setFocusedNode] = useState({ level: null, id: null });

    useEffect(() => {
        const initMetadata = async () => {
            try {
                const uiMappingData = await publicService.getUIEnumMapping();
                setUIMapping(uiMappingData);

                const response = await publicService.getTaxonomyTreeSmartSelectOptions();
                setSmartSelectOptions(response);
            } catch (error) {
                console.error('Lỗi khởi tạo danh mục trang sơ đồ:', error);
            } finally {
                setInitialLoading(false);
            }
        };
        initMetadata();
    }, []);

    // ────────────────────────────────────────────────────────────────────────
    // TOÁN TỬ HIỆU NĂNG CAO: Tự động lọc mảng con đồng bộ dựa vào lựa chọn cha
    // Sử dụng useMemo loại bỏ hoàn toàn 100% rủi ro re-render lặp vô hạn gây lag UI
    // ────────────────────────────────────────────────────────────────────────
    const filteredOptions = useMemo(() => {
        const { phylum_option, class_option, order_option, family_option, genus_option } = filters;
        
        return {
            class: phylum_option ? smartSelectOptions.class.filter(c => c.phylum_id === phylum_option.value) : smartSelectOptions.class,
            order: class_option ? smartSelectOptions.order.filter(o => o.class_id === class_option.value) : phylum_option ? smartSelectOptions.order.filter(o => o.phylum_id === phylum_option.value) : smartSelectOptions.order,
            family: order_option ? smartSelectOptions.family.filter(f => f.order_id === order_option.value) : class_option ? smartSelectOptions.family.filter(f => f.class_id === class_option.value) : phylum_option ? smartSelectOptions.family.filter(f => f.phylum_id === phylum_option.value) : smartSelectOptions.family,
            genus: family_option ? smartSelectOptions.genus.filter(g => g.family_id === family_option.value) : order_option ? smartSelectOptions.genus.filter(g => g.order_id === order_option.value) : smartSelectOptions.class_option ? smartSelectOptions.genus.filter(g => g.class_id === class_option.value) : smartSelectOptions.genus,
            species: genus_option ? smartSelectOptions.species.filter(s => s.genus_id === genus_option.value) : family_option ? smartSelectOptions.species.filter(s => s.family_id === family_option.value) : smartSelectOptions.species
        };
    }, [filters, smartSelectOptions]);

    const handleFilterReset = () => {
        setFilters({ phylum_option: null, class_option: null, order_option: null, family_option: null, genus_option: null, species_option: null });
        setTreeData(null);
        setOrphanData(null);
        setFocusedNode({ level: null, id: null });
    };

    const handleExtractTree = async () => {
        setIsFetching(true);
        try {
            const params = {};
            let nodeLevel = null;
            let nodeId = null;

            // Xác định cấp độ lọc sâu nhất của người dùng
            if (filters.species_option) { params.species_id = filters.species_option.value; nodeLevel = 'species'; nodeId = filters.species_option.value; }
            else if (filters.genus_option) { params.genus_id = filters.genus_option.value; nodeLevel = 'genus'; nodeId = filters.genus_option.value; }
            else if (filters.family_option) { params.family_id = filters.family_option.value; nodeLevel = 'family'; nodeId = filters.family_option.value; }
            else if (filters.order_option) { params.order_id = filters.order_option.value; nodeLevel = 'order'; nodeId = filters.order_option.value; }
            else if (filters.class_option) { params.class_id = filters.class_option.value; nodeLevel = 'class'; nodeId = filters.class_option.value; }
            else if (filters.phylum_option) { params.phylum_id = filters.phylum_option.value; nodeLevel = 'phylum'; nodeId = filters.phylum_option.value; }

            setFocusedNode({ level: nodeLevel, id: nodeId });
            const response = await publicService.getTaxonomyTree(params);
            
            setTreeData(response.tree);
            setOrphanData(response.orphans);
        } catch (error) {
            console.error("Lỗi kết xuất bản đồ phả hệ:", error);
        } finally {
            setIsFetching(false);
        }
    };

    // Kiểm tra xem người dùng có đang để trống bộ lọc không khoanh vùng không
    const isFiltersEmpty = !filters.phylum_option && !filters.class_option && !filters.order_option && !filters.family_option && !filters.genus_option && !filters.species_option;

    if (initialLoading) return <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light"><Spinner animation="border" variant="success" /></div>;

    return (
        <div className="bg-light min-vh-100 py-4 font-sans">
            <Helmet>
                <title>PlantDB | Đồ họa sơ đồ phân loại</title>
                <meta name="description" content="Hệ thống trực quan hóa cây phân loại thực vật đa cấp từ Ngành đến Biến thể loài." />
            </Helmet>
            <Container fluid className="px-3 px-xl-5">
                <div className="text-center mb-4">
                    <h2 className="fw-bolder text-success d-flex align-items-center justify-content-center">
                        <FaProjectDiagram className="me-3"/> Sơ Đồ Phả Hệ Phân Loại Học Thực Vật
                    </h2>
                    <p className="text-muted mx-auto mb-0" style={{ maxWidth: '750px' }}>
                        Hệ thống tự động biên dịch, đồng bộ hình ảnh tư liệu chuẩn hóa và tái lập bản đồ quan hệ huyết thống thực vật từ tầng cao Ngành xuống từng dạng Biến thể nội loài.
                    </p>
                </div>

                <Row className="g-4">
                    <Col lg={4} xl={3}>
                        {/* KHỐI ĐIỀU KHIỂN TRA CỨU CHUYÊN SÂU */}
                        <Card className="border-0 shadow-sm rounded-4 sticky-top border-top border-4 border-success" style={{ top: '24px' }}>
                            <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                                    <h6 className="fw-bold mb-0 text-dark">Khoanh vùng trích xuất</h6>
                                    <Button variant="outline-danger" size="sm" className="rounded-pill px-2.5 py-0.5 fw-bold" onClick={handleFilterReset} style={{ fontSize: '0.75rem' }}>
                                        <FaRedo size={10} className="me-1"/> Làm mới
                                    </Button>
                                </div>

                                <div className="d-flex flex-column gap-2.5">
                                    <Form.Group>
                                        <Form.Label className="small fw-bolder text-muted mb-1">1. Ngành Thực vật (Phylum)</Form.Label>
                                        <SmartSelect placeholder="Tất cả Ngành..." options={smartSelectOptions.phylum} value={filters.phylum_option} isNewable={false} isNullable={true}
                                            onChange={(opt) => setFilters(prev => ({ ...prev, phylum_option: opt.value ? opt : null, class_option: null, order_option: null, family_option: null, genus_option: null, species_option: null }))}
                                        />
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label className="small fw-bolder text-muted mb-1">2. Lớp Thực vật (Class)</Form.Label>
                                        <SmartSelect placeholder="Chọn Lớp..." options={filteredOptions.class} value={filters.class_option} isNewable={false} isNullable={true}
                                            onChange={(opt) => {
                                                setFilters(prev => ({ ...prev, class_option: opt.value ? opt : null, order_option: null, family_option: null, genus_option: null, species_option: null }));
                                                if (opt.value) setFilters(prev => ({ ...prev, phylum_option: smartSelectOptions.phylum.find(p => p.value === opt.phylum_id) || prev.phylum_option }));
                                            }}
                                        />
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label className="small fw-bolder text-muted mb-1">3. Bộ Thực vật (Order)</Form.Label>
                                        <SmartSelect placeholder="Chọn Bộ..." options={filteredOptions.order} value={filters.order_option} isNewable={false} isNullable={true}
                                            onChange={(opt) => {
                                                setFilters(prev => ({ ...prev, order_option: opt.value ? opt : null, family_option: null, genus_option: null, species_option: null }));
                                                if (opt.value) {
                                                    const parentCls = smartSelectOptions.class.find(c => c.value === opt.class_id);
                                                    setFilters(prev => ({ ...prev, class_option: parentCls || prev.class_option, phylum_option: smartSelectOptions.phylum.find(p => p.value === opt.phylum_id) || prev.phylum_option }));
                                                }
                                            }}
                                        />
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label className="small fw-bolder text-muted mb-1">4. Họ Thực vật (Family)</Form.Label>
                                        <SmartSelect placeholder="Chọn Họ..." options={filteredOptions.family} value={filters.family_option} isNewable={false} isNullable={true}
                                            onChange={(opt) => {
                                                setFilters(prev => ({ ...prev, family_option: opt.value ? opt : null, genus_option: null, species_option: null }));
                                                if (opt.value) {
                                                    const parentOrd = smartSelectOptions.order.find(o => o.value === opt.order_id);
                                                    const parentCls = smartSelectOptions.class.find(c => c.value === opt.class_id);
                                                    setFilters(prev => ({ ...prev, order_option: parentOrd || prev.order_option, class_option: parentCls || prev.class_option, phylum_option: smartSelectOptions.phylum.find(p => p.value === opt.phylum_id) || prev.phylum_option }));
                                                }
                                            }}
                                        />
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label className="small fw-bolder text-muted mb-1">5. Chi Thực vật (Genus)</Form.Label>
                                        <SmartSelect placeholder="Chọn Chi..." options={filteredOptions.genus} value={filters.genus_option} isNewable={false} isNullable={true}
                                            onChange={(opt) => {
                                                setFilters(prev => ({ ...prev, genus_option: opt.value ? opt : null, species_option: null }));
                                                if (opt.value) {
                                                    const parentFam = smartSelectOptions.family.find(f => f.value === opt.family_id);
                                                    const parentOrd = smartSelectOptions.order.find(o => o.value === opt.order_id);
                                                    const parentCls = smartSelectOptions.class.find(c => c.value === opt.class_id);
                                                    setFilters(prev => ({ ...prev, family_option: parentFam || prev.family_option, order_option: parentOrd || prev.order_option, class_option: parentCls || prev.class_option, phylum_option: smartSelectOptions.phylum.find(p => p.value === opt.phylum_id) || prev.phylum_option }));
                                                }
                                            }}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-2">
                                        <Form.Label className="small fw-bolder text-muted mb-1">6. Loài Thực vật (Species)</Form.Label>
                                        <SmartSelect placeholder="Chọn Loài..." options={filteredOptions.species} value={filters.species_option} isNewable={false} isNullable={true}
                                            onChange={(opt) => {
                                                if (opt.value) {
                                                    const parentGen = smartSelectOptions.genus.find(g => g.value === opt.genus_id);
                                                    const parentFam = smartSelectOptions.family.find(f => f.value === opt.family_id);
                                                    setFilters({ species_option: opt, genus_option: parentGen || null, family_option: parentFam || null, order_option: parentGen?.order_id ? smartSelectOptions.order.find(o => o.value === parentGen.order_id) : null, class_option: parentGen?.class_id ? smartSelectOptions.class.find(c => c.value === parentGen.class_id) : null, phylum_option: parentGen?.phylum_id ? smartSelectOptions.phylum.find(p => p.value === parentGen.phylum_id) : null });
                                                } else {
                                                    setFilters(prev => ({ ...prev, species_option: null }));
                                                }
                                            }}
                                        />
                                    </Form.Group>
                                </div>

                                {isFiltersEmpty && (
                                    <Alert variant="warning" className="p-2.5 border-0 rounded-3 mt-3 mb-2 small d-flex align-items-start gap-2 text-dark bg-warning bg-opacity-25 animate-pulse">
                                        <FaExclamationTriangle className="text-warning flex-shrink-0 mt-0.5" size={13}/>
                                        <div style={{ fontSize: '0.78rem', lineHeight: '1.35' }}>
                                            <strong>Lưu ý hiệu năng:</strong> Bạn đang không giới hạn vùng lọc. Việc hiển thị toàn bộ cây dữ liệu hệ thống có thể gây trễ hiển thị cục bộ trên trình duyệt. Khuyên dùng chọn tối thiểu một <b>Họ</b> hoặc <b>Bộ</b>.
                                        </div>
                                    </Alert>
                                )}

                                <Button variant="success" className="w-100 rounded-pill fw-bold shadow-sm py-2 mt-2 d-flex align-items-center justify-content-center" onClick={handleExtractTree} disabled={isFetching}>
                                    {isFetching ? <Spinner size="sm" className="me-2"/> : <FaSearch className="me-2"/>} Trích xuất Sơ đồ Cây
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={8} xl={9}>
                        {/* VÙNG THỂ HIỆN ĐỒ HỌA CÂY PHẢ HỆ */}
                        {treeData ? (
                            <div className="animation-fade-in">
                                <TaxonomyTreeView 
                                    treeData={treeData} 
                                    orphanData={orphanData}
                                    focusedLevel={focusedNode.level} 
                                    focusedId={focusedNode.id}
                                    backendUrl={backendUrl}
                                    uiMapping={uiMapping}
                                />
                            </div>
                        ) : (
                            <Card className="border-0 shadow-sm rounded-4 text-center py-5 bg-white border-dashed-success">
                                <Card.Body className="p-5">
                                    <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                                        <FaInfoCircle className="text-success" size={24}/>
                                    </div>
                                    <h5 className="fw-bold text-dark mb-2">Hệ thống sẵn sàng trích xuất</h5>
                                    <p className="text-muted small mx-auto mb-0" style={{ maxWidth: '480px' }}>
                                        Thiết lập cấu trúc khoanh vùng phả hệ thực vật mong muốn ở bảng điều khiển bên trái, sau đó nhấn nút "Trích xuất Sơ đồ Cây" để khởi dựng giao diện phả hệ.
                                    </p>
                                </Card.Body>
                            </Card>
                        )}
                    </Col>
                </Row>
            </Container>
            
            <style>{`
                .border-dashed-success { border: 2px dashed #198754 !important; border-opacity: 0.3 !important; }
                .animation-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .animate-pulse { animation: pulse 2s infinite; }
                @keyframes pulse { 0% { opacity: 0.95; } 50% { opacity: 1; } 100% { opacity: 0.95; } }
            `}</style>
        </div>
    );
};

export default TaxonomyExplorerPage;