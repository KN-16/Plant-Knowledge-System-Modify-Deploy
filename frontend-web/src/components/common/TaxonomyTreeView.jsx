// import React, { useState, useEffect } from 'react';
// import { Badge, Modal } from 'react-bootstrap';
// import { FaChevronRight, FaChevronDown, FaDna, FaSeedling, FaLeaf } from 'react-icons/fa';
// import { useNavigate } from 'react-router-dom';

// // Nhận thêm prop backendUrl
// const TaxonomyTreeView = ({ treeData, focusedLevel, focusedId, backendUrl , uiMapping}) => {
//     const navigate = useNavigate();
//     const [expandedNodes, setExpandedNodes] = useState({});
    
//     // State quản lý việc phóng to ảnh
//     const [showImageModal, setShowImageModal] = useState(false);
//     const [enlargedImageUrl, setEnlargedImageUrl] = useState('');

//     useEffect(() => {
//         if (treeData && treeData.length > 0) {
//             const initialExpanded = {};
//             treeData.forEach(fam => {
//                 initialExpanded[`fam-${fam.family_id}`] = true;
//                 fam.Genera?.forEach(gen => {
//                     initialExpanded[`gen-${gen.genus_id}`] = true;
//                     gen.Species?.forEach(sp => {
//                         initialExpanded[`sp-${sp.species_id}`] = true;
//                     });
//                 });
//             });
//             setExpandedNodes(initialExpanded);
//         } else {
//             setExpandedNodes({});
//         }
//     }, [treeData]);

//     const toggleNode = (nodeId) => {
//         setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
//     };

//     const isFocused = (level, id) => {
//         if (!focusedLevel || !focusedId) return false;
//         return focusedLevel === level && focusedId === id;
//     };

//     // Hàm xử lý khi bấm vào thumbnail (Phóng to ảnh)
//     const handleImageClick = (e, url) => {
//         e.stopPropagation(); // QUAN TRỌNG: Ngăn sự kiện click lan ra ngoài thẻ <div> (tránh bị chuyển trang)
//         setEnlargedImageUrl(url);
//         setShowImageModal(true);
//     };

//     if (!treeData || treeData.length === 0) {
//         return <div className="text-center text-muted p-4 fst-italic">Không có dữ liệu cây phân loại.</div>;
//     }

//     return (
//         <div className="taxonomy-tree-container p-3 p-md-4 bg-white rounded-4 shadow-sm border border-light">
//             <ul className="list-unstyled ms-0 mb-0">
//                 {treeData.map(family => (
//                     <li key={`fam-${family.family_id}`} className="mb-2">
//                         {/* Cấp 1: HỌ (FAMILY) */}
//                         <div 
//                             className={`d-flex align-items-center cursor-pointer p-2 rounded transition-all ${isFocused('family', family.family_id) ? 'bg-success bg-opacity-10 border border-success border-opacity-25' : 'hover-bg-light'}`}
//                             onClick={() => toggleNode(`fam-${family.family_id}`)}
//                         >
//                             {expandedNodes[`fam-${family.family_id}`] ? <FaChevronDown className="text-muted me-2 small"/> : <FaChevronRight className="text-muted me-2 small"/>}
//                             <FaDna className="text-danger me-2"/>
//                             <span className="fw-bold fs-6">{family.scientific_name}</span>
//                             {family.vietnamese_name && <span className="ms-2 text-muted small"> - {family.vietnamese_name}</span>}
//                             <Badge bg="light" text="dark" className="ms-auto border fw-normal">Họ (Family)</Badge>
//                         </div>

//                         {/* Cấp 2: CHI (GENUS) */}
//                         {expandedNodes[`fam-${family.family_id}`] && (
//                             <ul className="list-unstyled ms-4 ps-2 border-start border-success border-opacity-25 mt-1 transition-all">
//                                 {family.genera?.map(genus => (
//                                     <li key={`gen-${genus.genus_id}`} className="mb-1">
//                                         <div 
//                                             className={`d-flex align-items-center cursor-pointer p-1 rounded ${isFocused('genus', genus.genus_id) ? 'bg-success bg-opacity-10 fw-bold' : 'hover-bg-light'}`}
//                                             onClick={() => toggleNode(`gen-${genus.genus_id}`)}
//                                         >
//                                             {expandedNodes[`gen-${genus.genus_id}`] ? <FaChevronDown className="text-muted me-2 small"/> : <FaChevronRight className="text-muted me-2 small"/>}
//                                             <FaSeedling className="text-success me-2"/>
//                                             <span className="text-dark">{genus.scientific_name}</span>
//                                             {genus.vietnamese_name && <span className="ms-2 text-muted small"> - {genus.vietnamese_name}</span>}
//                                         </div>

//                                         {/* Cấp 3: LOÀI (SPECIES) */}
//                                         {expandedNodes[`gen-${genus.genus_id}`] && (
//                                             <ul className="list-unstyled ms-4 ps-2 border-start mt-1 transition-all">
//                                                 {genus.Species?.map(species => (
//                                                     <li key={`sp-${species.species_id}`} className="mb-1">
//                                                         <div 
//                                                             className={`d-flex align-items-center cursor-pointer p-1 rounded ${isFocused('species', species.species_id) ? 'bg-success bg-opacity-10 fw-bold' : 'hover-bg-light'}`}
//                                                             onClick={() => toggleNode(`sp-${species.species_id}`)}
//                                                         >
//                                                             {expandedNodes[`sp-${species.species_id}`] ? <FaChevronDown className="text-muted me-2 small"/> : <FaChevronRight className="text-muted me-2 small"/>}
//                                                             <FaLeaf className="text-success opacity-75 me-2"/>
//                                                             <span className="fst-italic text-dark">{species.scientific_name}</span>
//                                                             {species.vietnamese_name && <span className="ms-2 text-muted small fw-normal"> - {species.vietnamese_name}</span>}
//                                                         </div>

//                                                         {/* Cấp 4: BIẾN THỂ (VARIETY) */}
//                                                         {expandedNodes[`sp-${species.species_id}`] && (
//                                                             <ul className="list-unstyled ms-4 ps-3 mt-1 border-start border-light">
//                                                                 {species.Varieties?.map(variety => {
//                                                                     // Xác định URL ảnh
//                                                                     const imgUrl = variety.PlantImages && variety.PlantImages.length > 0 
//                                                                         ? `${backendUrl}${variety.PlantImages[0].url}` 
//                                                                         : '/default-plant.png';

//                                                                     return (
//                                                                     <li key={`var-${variety.variety_id}`} className="mb-1">
//                                                                         <div 
//                                                                             className="d-flex align-items-center p-1 rounded transition-all hover-bg-light" 
//                                                                             style={{cursor: 'pointer'}}
//                                                                             onClick={() => navigate(`/varieties/${variety.variety_id}`)}
//                                                                             title="Click để xem chi tiết biến thể"
//                                                                         >
//                                                                             <span className="text-success me-2 fw-bold" style={{fontSize: '1.2rem'}}>•</span>
                                                                            
//                                                                             {/* THUMBNAIL HÌNH ẢNH */}
//                                                                             <img 
//                                                                                 src={imgUrl} 
//                                                                                 alt="thumbnail" 
//                                                                                 className="rounded object-fit-cover shadow-sm me-2 border border-light tree-thumbnail"
//                                                                                 style={{ width: '36px', height: '36px' }}
//                                                                                 onClick={(e) => handleImageClick(e, imgUrl)}
//                                                                                 title="Phóng to ảnh"
//                                                                             />
                                                                            
//                                                                             <span className="text-primary hover-underline fw-medium">
//                                                                                 {variety.common_name || "Chưa có tên VN"}
//                                                                             </span>
                                                                            
//                                                                             <span className="ms-2 text-muted fst-italic small">
//                                                                                 ({variety.variety_name || 'var. chưa xác định'})
//                                                                             </span>
                                                                            
//                                                                             {variety.variant_type && (
//                                                                                 <Badge bg="warning" text="dark" className="ms-2 bg-opacity-75 fw-normal" style={{fontSize: '0.65rem'}}>
//                                                                                     {variety.variant_type ? uiMapping['VARIANT_TYPE'][variety.variant_type] : '-'}
//                                                                                 </Badge>
//                                                                             )}
//                                                                         </div>
//                                                                     </li>
//                                                                 )})}
//                                                                 {(!species.Varieties || species.Varieties.length === 0) && (
//                                                                     <li className="text-muted small ms-3 fst-italic py-1">Chưa ghi nhận biến thể nội loài.</li>
//                                                                 )}
//                                                             </ul>
//                                                         )}
//                                                     </li>
//                                                 ))}
//                                             </ul>
//                                         )}
//                                     </li>
//                                 ))}
//                             </ul>
//                         )}
//                     </li>
//                 ))}
//             </ul>
            
//             {/* MODAL HIỂN THỊ ẢNH PHÓNG TO */}
//             <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered size="lg">
//                 <Modal.Header closeButton className="border-0 pb-0 bg-dark" variant="dark"></Modal.Header>
//                 <Modal.Body className="text-center p-0 bg-dark rounded-bottom">
//                     <img 
//                         src={enlargedImageUrl} 
//                         alt="Enlarged" 
//                         className="img-fluid rounded-bottom" 
//                         style={{ maxHeight: '85vh', objectFit: 'contain', width: '100%' }} 
//                     />
//                 </Modal.Body>
//             </Modal>

//             <style>{`
//                 .hover-bg-light:hover { background-color: #f1f8f4; }
//                 .cursor-pointer { cursor: pointer; }
//                 .hover-underline:hover { text-decoration: underline; color: #198754 !important; }
//                 .tree-thumbnail { transition: transform 0.2s ease; cursor: zoom-in; }
//                 .tree-thumbnail:hover { transform: scale(1.1); box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important; }
//             `}</style>
//         </div>
//     );
// };

// export default TaxonomyTreeView;


// TaxonomyTreeView.jsx
import React, { useState, useEffect } from 'react';
import { Badge, Modal, Card, Button} from 'react-bootstrap';
import { FaChevronRight, FaChevronDown, FaDna, FaSeedling, FaLeaf, 
    FaFolder, FaLink, FaExclamationTriangle, FaEye, FaProjectDiagram } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const TaxonomyTreeView = ({ treeData, orphanData, focusedLevel, focusedId, backendUrl, uiMapping }) => {
    const navigate = useNavigate();
    const [expandedNodes, setExpandedNodes] = useState({});
    
    // Quản lý Modal thu phóng ảnh đại diện
    const [showImageModal, setShowImageModal] = useState(false);
    const [enlargedImageUrl, setEnlargedImageUrl] = useState('');

    // Cơ chế tự động mở rộng bung toàn bộ cây khi có kết quả mới nạp vào
    useEffect(() => {
        const initialExpanded = {};
        
        const autoExpand = (nodes, prefix) => {
            if (!nodes) return;
            nodes.forEach(node => {
                const idKey = `${prefix}-${node[`${prefix}_id`]}`;
                initialExpanded[idKey] = true;
                
                if (prefix === 'phylum') autoExpand(node.Classes, 'class');
                if (prefix === 'class') autoExpand(node.Orders, 'order');
                if (prefix === 'order') autoExpand(node.Families, 'family');
                if (prefix === 'family') autoExpand(node.Genera, 'genus');
                if (prefix === 'genus') autoExpand(node.Species, 'species');
            });
        };

        autoExpand(treeData, 'phylum');
        
        // Tự động mở rộng các khối mồ côi nếu có dữ liệu bên trong
        if (orphanData) {
            if (orphanData.classes?.length) initialExpanded['orphan-class'] = true;
            if (orphanData.orders?.length) initialExpanded['orphan-order'] = true;
            if (orphanData.families?.length) initialExpanded['orphan-family'] = true;
            if (orphanData.genera?.length) initialExpanded['orphan-genus'] = true;
            if (orphanData.species?.length) initialExpanded['orphan-species'] = true;
        }

        setExpandedNodes(initialExpanded);
    }, [treeData, orphanData]);

    const toggleNode = (nodeId) => {
        setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
    };

    const isFocused = (level, id) => {
        return focusedLevel === level && String(focusedId) === String(id);
    };

    const handleImageClick = (e, url) => {
        e.stopPropagation(); // Khóa đứng lan truyền luồng click, tránh bị chuyển trang vô ý
        setEnlargedImageUrl(url);
        setShowImageModal(true);
    };

    // RENDER HELPER: Xuất hiện thẻ chứa Node đại diện Cây phân học chung
    const renderTaxonRow = (node, prefix, label, icon, nextRankRender, detailUrl) => {
        const idField = `${prefix}_id`;
        const nodeId = node[idField];
        const nodeKey = `${prefix}-${nodeId}`;
        const isCurrentFocused = isFocused(prefix, nodeId);
        const hasChildren = node.isOrphan ? false : true; 

        const imgUrl = node.thumbnail 
            ? (node.is_external_image ? node.thumbnail : `${backendUrl}${node.thumbnail}`) 
            : '/default-plant.png';

        return (
            <div className="taxon-node-wrapper mb-2">
                <div 
                    className={`taxon-row-container d-flex align-items-center p-2 rounded-3 border transition-all ${
                        isCurrentFocused ? 'ring-focus bg-success bg-opacity-10 border-success' : 
                        node.isOrphan ? 'border-dashed-warning bg-warning bg-opacity-5' : 'bg-white border-light-subtle'
                    }`}
                >
                    {/* Mũi tên đóng mở rộng cây */}
                    <div className="chevron-trigger me-2 text-muted" onClick={() => toggleNode(nodeKey)} style={{ cursor: 'pointer', width: '16px' }}>
                        {expandedNodes[nodeKey] ? <FaChevronDown size={11} /> : <FaChevronRight size={11} />}
                    </div>

                    {/* Hình ảnh đại diện tí hon của Cấp Phân Vị */}
                    <img 
                        src={imgUrl} 
                        alt="cover" 
                        className="rounded-circle object-fit-cover shadow-sm me-2 border cursor-zoom"
                        style={{ width: '32px', height: '32px' }}
                        onClick={(e) => handleImageClick(e, imgUrl)}
                    />

                    {/* Khối chữ nhãn tên gọi */}
                    <div className="d-flex flex-column" onClick={() => toggleNode(nodeKey)} style={{ cursor: 'pointer' }}>
                        <div className="d-flex align-items-center gap-2">
                            {icon}
                            <span className={`fw-bold text-dark ${['genus', 'species'].includes(prefix) ? 'fst-italic' : ''}`} style={{ fontSize: '0.92rem' }}>
                                {node.scientific_name}
                            </span>
                            {node.common_name && (
                                <span className="text-muted fw-medium" style={{ fontSize: '0.82rem' }}>
                                    ({node.common_name})
                                </span>
                            )}
                            {node.isOrphan && (
                                <Badge bg="danger" className="bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-2" style={{ fontSize: '0.62rem' }}>
                                    <FaExclamationTriangle className="me-1"/> Khuyết liên kết cấp cha
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Nút hành động xem chi tiết */}
                    {detailUrl && (
                        <Button 
                            variant="light" 
                            size="sm" 
                            className="ms-auto rounded-circle p-0 d-flex align-items-center justify-content-center text-success border border-success border-opacity-10 shadow-inner hover-action"
                            style={{ width: '28px', height: '28px' }}
                            onClick={() => navigate(`${detailUrl}/${nodeId}?rank=${prefix}`)}
                            title={`Xem trang chi tiết hệ thống của ${label}`}
                        >
                            <FaEye size={12}/>
                        </Button>
                    )}
                    
                    <Badge bg="light" text="secondary" className="ms-2 border font-mono small text-uppercase fw-bolder" style={{ fontSize: '0.65rem', letterSpacing: '0.3px' }}>{label}</Badge>
                </div>

                {/* Khối đệ quy gọi nhánh con lồng lùi đầu dòng sâu */}
                {expandedNodes[nodeKey] && (
                    <div className="taxon-children-tree ps-4 ms-2 mt-1 position-relative tree-line-branch">
                        {nextRankRender()}
                    </div>
                )}
            </div>
        );
    };

    // Kiểm tra tính rỗng tổng quan của toàn cây dữ liệu hệ thống trả về
    const isTreeEmpty = (!treeData || treeData.length === 0) && 
        (!orphanData || (orphanData.classes?.length === 0 && orphanData.orders?.length === 0 && orphanData.families?.length === 0 && orphanData.genera?.length === 0 && orphanData.species?.length === 0));

    if (isTreeEmpty) return <div className="text-center text-muted bg-white border rounded-4 py-5 shadow-sm fst-italic">Không tìm thấy phân mục dữ liệu sơ đồ khớp điều kiện lọc.</div>;

    return (
        <div className="taxonomy-tree-main-view p-3 p-md-4 bg-white rounded-4 shadow-sm border border-light-subtle">
            <ul className="list-unstyled mb-0">
                
                {/* ─────────────────────────────────────────────────────────────
                    TUYẾN 1: CÂY PHẢ HỆ CHUẨN MỰC (XUẤT PHÁT TỪ NGÀNH GỐC)
                    ───────────────────────────────────────────────────────────── */}
                {treeData.map(phylum => 
                    renderTaxonRow(phylum, 'phylum', 'Ngành (Phylum)', <FaDna className="text-danger opacity-75" size={13}/>, () => (
                        <>
                            {phylum.Classes && phylum.Classes.length > 0 ? phylum.Classes.map(cls => 
                                renderTaxonRow(cls, 'class', 'Lớp (Class)', <FaFolder className="text-warning" size={13}/>, () => (
                                    <>
                                        {cls.Orders && cls.Orders.length > 0 ? cls.Orders.map(ord => 
                                            renderTaxonRow(ord, 'order', 'Bộ (Order)', <FaProjectDiagram className="text-info" size={13}/>, () => (
                                                <>
                                                    {ord.Families && ord.Families.length > 0 ? ord.Families.map(fam => 
                                                        renderTaxonRow(fam, 'family', 'Họ (Family)', <FaSeedling className="text-success" size={13}/>, () => (
                                                            <>
                                                                {fam.Genera && fam.Genera.length > 0 ? fam.Genera.map(gen => 
                                                                    renderTaxonRow(gen, 'genus', 'Chi (Genus)', <FaSeedling className="text-primary opacity-75" size={13}/>, () => (
                                                                        <>
                                                                            {gen.Species && gen.Species.length > 0 ? gen.Species.map(sp => 
                                                                                renderTaxonRow(sp, 'species', 'Loài (Species)', <FaLeaf className="text-success" size={13}/>, () => (
                                                                                    // CHUỖI RENDER BIẾN THỂ (VARIETIES) Ở TẦNG CUỐI CÙNG
                                                                                    <ul className="list-unstyled ms-2 ps-2 mt-1">
                                                                                        {sp.Varieties && sp.Varieties.length > 0 ? sp.Varieties.map(variety => {
                                                                                            const varImg = variety.thumbnail ? `${backendUrl}${variety.thumbnail}` : '/default-plant.png';
                                                                                            return (
                                                                                                <li key={`var-${variety.variety_id}`} className="mb-1.5 d-flex align-items-center p-1.5 bg-light bg-opacity-50 border border-light-subtle rounded-3 hover-action" onClick={() => navigate(`/varieties/${variety.variety_id}`)} style={{ cursor: 'pointer' }}>
                                                                                                    <span className="text-success me-2 fw-bold align-middle" style={{ fontSize: '1.2rem', marginTop: '-4px' }}>•</span>
                                                                                                    <img src={varImg} alt="var thumb" className="rounded object-fit-cover shadow-sm me-2 border" style={{ width: '28px', height: '28px' }} onClick={(e) => handleImageClick(e, varImg)}/>
                                                                                                    <span className="text-primary fw-semibold small hover-underline text-truncate">{variety.common_name || "Chưa có tên VN"}</span>
                                                                                                    <span className="ms-2 text-muted fst-italic small text-truncate">({variety.variety_name || 'var. chưa xác định'})</span>
                                                                                                    {variety.variant_type && uiMapping['VARIANT_TYPE'] && (
                                                                                                        <Badge bg="warning" text="dark" className="ms-auto bg-opacity-75 font-mono" style={{ fontSize: '0.6rem', fontWeight: '400' }}>
                                                                                                            {uiMapping['VARIANT_TYPE'][variety.variant_type]}
                                                                                                        </Badge>
                                                                                                    )}
                                                                                                </li>
                                                                                            );
                                                                                        }) : <li className="text-muted small fst-italic py-1 ps-2">Chưa ghi nhận biến thể nội loài nào.</li>}
                                                                                    </ul>
                                                                                ), `/species/detail`)
                                                                            ) : <div className="text-muted small fst-italic py-1 ps-3 border-start">Chi này chưa ghi nhận cấu trúc Loài con.</div>}
                                                                        </>
                                                                    ), `/genus/detail`)
                                                                ) : <div className="text-muted small fst-italic py-1 ps-3 border-start">Họ này chưa ghi nhận cấu trúc Chi con.</div>}
                                                            </>
                                                        ), `/family/detail`)
                                                    ) : <div className="text-muted small fst-italic py-1 ps-3 border-start">Bộ này chưa ghi nhận cấu trúc Họ con.</div>}
                                                </>
                                            ))
                                        ) : <div className="text-muted small fst-italic py-1 ps-3 border-start">Lớp này chưa ghi nhận cấu trúc Bộ con.</div>}
                                    </>
                                ))
                    ): <div className="text-muted small fst-italic py-1 ps-3 border-start">Ngành này chưa số hóa cấu trúc Lớp con.</div>}
                        </>
                    ))
                )}

                {/* ─────────────────────────────────────────────────────────────
                    TUYẾN 2: PHÂN KHU HỆ THỐNG MỒ CÔI (MẤT LIÊN KẾT CHA)
                    ───────────────────────────────────────────────────────────── */}
                {orphanData && (orphanData.classes?.length > 0 || orphanData.orders?.length > 0 || orphanData.families?.length > 0 || orphanData.genera?.length > 0 || orphanData.species?.length > 0) && (
                    <li className="mt-4 pt-3 border-top border-dashed border-danger border-opacity-50">
                        <div className="alert alert-danger bg-danger bg-opacity-5 border border-danger border-opacity-10 rounded-4 p-3 mb-3">
                            <h6 className="alert-heading fw-bold d-flex align-items-center text-danger mb-1" style={{ fontSize: '0.95rem' }}>
                                <FaExclamationTriangle className="me-2"/> Phân Khu Kiểm Soát Thực Thể Khuyết Cấp Bậc Cha
                            </h6>
                            <p className="text-muted mb-0 small lh-base">
                                Danh sách tập hợp các đơn vị phân loại chưa được liên kết hoặc bị đứt gãy phả hệ cấp trên trong cơ sở dữ liệu. Hệ thống tự động cô lập để phục vụ công tác hiệu chỉnh.
                            </p>
                        </div>

                        {/* RENDER CÁC LỚP MỒ CÔI */}
                        {orphanData.classes?.map(cls => renderTaxonRow(cls, 'class', 'Lớp (Class)', <FaFolder className="text-warning" size={13}/>, () => 
                            cls.Orders?.map(ord => renderTaxonRow(ord, 'order', 'Bộ (Order)', <FaProjectDiagram className="text-info" size={13}/>, () => null))
                        ))}

                        {/* RENDER CÁC BỘ MỒ CÔI */}
                        {orphanData.orders?.map(ord => renderTaxonRow(ord, 'order', 'Bộ (Order)', <FaProjectDiagram className="text-info" size={13}/>, () => 
                            ord.Families?.map(fa => renderTaxonRow(fa, 'family', 'Họ (Family)', <FaSeedling className="text-success" size={13}/>, () => null))
                        ))}

                        {/* RENDER CÁC HỌ MỒ CÔI */}
                        {orphanData.families?.map(fa => renderTaxonRow(fa, 'family', 'Họ (Family)', <FaSeedling className="text-success" size={13}/>, () => 
                            fa.Genera?.map(ge => renderTaxonRow(ge, 'genus', 'Chi (Genus)', <FaSeedling className="text-primary opacity-75" size={13}/>, () => null))
                        ))}

                        {/* RENDER CÁC CHI MỒ CÔI */}
                        {orphanData.genera?.map(ge => renderTaxonRow(ge, 'genus', 'Chi (Genus)', <FaSeedling className="text-primary opacity-75" size={13}/>, () => 
                            ge.Species?.map(sp => renderTaxonRow(sp, 'species', 'Loài (Species)', <FaLeaf className="text-success" size={13}/>, () => null))
                        ))}

                        {/* RENDER CÁC LOÀI MỒ CÔI */}
                        {orphanData.species?.map(sp => renderTaxonRow(sp, 'species', 'Loài (Species)', <FaLeaf className="text-success" size={13}/>, () => (
                            <ul className="list-unstyled ms-2 ps-2 mt-1">
                                {sp.Varieties?.map(v => (
                                    <li key={`var-${v.variety_id}`} className="mb-1 d-flex align-items-center p-1 bg-light rounded-2">
                                        <span className="text-success me-2 fw-bold">•</span>
                                        <span className="text-primary fw-medium small text-truncate">{v.common_name || "Chưa có tên VN"}</span>
                                        <span className="ms-2 text-muted fst-italic small">({v.variety_name})</span>
                                    </li>
                                ))}
                            </ul>
                        )))}
                    </li>
                )}
            </ul>

            {/* MODAL PHÓNG TO ẢNH CHUẨN UX CAO CẤP */}
            <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0 bg-dark text-white" variant="dark"></Modal.Header>
                <Modal.Body className="text-center p-0 bg-dark rounded-bottom">
                    <img src={enlargedImageUrl} alt="Enlarged" className="img-fluid rounded-bottom" style={{ maxHeight: '82vh', objectFit: 'contain', width: '100%' }} />
                </Modal.Body>
            </Modal>

            {/* DESIGN SYSTEM STYLES CHO CÂY PHẢ HỆ TRỰC QUAN */}
            <style>{`
                .taxon-row-container { transition: all 0.2s ease; border: 1px solid #eaeaea; }
                .taxon-row-container:hover { background-color: #f6faf7 !important; transform: translateX(3px); border-color: #bcd4c5 !important; }
                .ring-focus { box-shadow: 0 0 0 3px rgba(25, 135, 84, 0.15) !important; }
                .border-dashed-warning { border: 1px dashed #ffc107 !important; }
                .cursor-zoom { cursor: zoom-in; transition: transform 0.15s ease; }
                .cursor-zoom:hover { transform: scale(1.12); }
                .hover-action:hover { background-color: #e8f4ec !important; border-color: #198754 !important; }
                .hover-underline:hover { text-decoration: underline !important; color: #198754 !important; }
                
                /* Layout xương cá vẽ trục phả hệ bằng CSS nội bộ */
                .tree-line-branch::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 12px;
                    width: 1px;
                    height: calc(100% - 18px);
                    border-left: 1px dashed #cbdcd0;
                }
            `}</style>
        </div>
    );
};

export default TaxonomyTreeView;