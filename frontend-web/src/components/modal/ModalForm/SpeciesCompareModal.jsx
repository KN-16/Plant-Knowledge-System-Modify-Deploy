// export default SpeciesCompareModal;

import React, { useState } from 'react';
import { Modal, Table, Button, Badge } from 'react-bootstrap';
import { FaTimes, FaLeaf, FaSeedling, FaPalette, 
    FaDna, FaTree, FaChevronDown, FaChevronUp, FaBook } from 'react-icons/fa';

const SpeciesCompareModal = ({ show, onHide, compareData, onRemoveItem, backendUrl, uiMapping, display_rank = 'species' }) => {
    
    const [expandedGroups, setExpandedGroups] = useState({
        general: true,
        leaf: false,
        stem: false,
        flower: false,
        ho_special: false,
    });

    const toggleGroup = (groupName) => {
        setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    const renderData = (data, suffix = '', prefix = '') => {
        if (data === null || data === undefined || data === '') return <span className="text-muted d-block text-center">-</span>;
        return <span>{prefix} {data} {suffix}</span>;
    };

    // Hàm render đồng bộ Bộ 3 Tên Hệ Thống cho mọi cấp bậc phân loại
    const renderTaxonomyCell = (node) => {
    if (!node) return <span className="text-muted d-block text-center">Chưa xác định</span>;
    return (
        <div className="py-1 mx-auto" style={{ maxWidth: '240px', overflow: 'hidden' }}>
            {/* TÊN 1: Tên khoa học viết nghiêng - Truncate tự động hóa dấu ... */}
            <div className="fw-bold text-success fst-italic text-truncate" title={node.scientific_name} style={{ fontSize: '0.95rem' }}>
                {node.scientific_name}
            </div>
            {/* TÊN 2: Tên thường gọi - Truncate tự động hóa dấu ... */}
            <div className="fw-bold text-dark small my-0.5 text-truncate" title={node.common_name || ''}>
                {node.common_name || <span className="text-muted fw-normal fst-italic" style={{ fontSize: '0.8rem' }}>Chưa cập nhật tên thường gọi</span>}
            </div>
            {/* TÊN 3: Danh pháp gốc Canonical - Truncate tự động hóa dấu ... */}
            {node.canonical_name && (
                <div className="text-muted fst-italic opacity-75 text-truncate" title={node.canonical_name} style={{ fontSize: '0.75rem' }}>
                    {node.canonical_name}
                </div>
            )}
        </div>
    );
};

    const getTaxonomyChain = (item, rank) => {
        let phylum = null, cls = null, order = null, family = null, genus = null;
        
        if (rank === 'species') {
            genus = item.Genus;
            family = genus?.Family;
            order = family?.Order;
            cls = order?.Class;
            phylum = cls?.Phylum;
        } else if (rank === 'genus') {
            family = item.Family;
            order = family?.Order;
            cls = order?.Class;
            phylum = cls?.Phylum;
        } else if (rank === 'family') {
            order = item.Order;
            cls = order?.Class;
            phylum = cls?.Phylum;
        } else if (rank === 'order') {
            cls = item.Class;
            phylum = cls?.Phylum;
        } else if (rank === 'class') {
            phylum = item.Phylum;
        }
        
        return { phylum, class: cls, order, family, genus };
    };

    const isSpeciesRank = display_rank === 'species';
    const primaryIdKey = `${display_rank}_id`;

    return (
        <Modal show={show} onHide={onHide} size="xl" centered className="compare-modal" fullscreen="lg-down">
            <Modal.Header closeButton className="bg-success text-white border-0 py-3">
                <Modal.Title className="fw-bold d-flex align-items-center fs-5">
                    <FaSeedling className="me-2 text-warning"/> Đối Chiếu Hệ Thống Phân Loại Thực Vật
                </Modal.Title>
            </Modal.Header>
            
            <Modal.Body className="p-0 bg-light custom-scrollbar" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
                {compareData.length === 0 ? (
                    <div className="text-center py-5 text-muted">Không có dữ liệu để đối chiếu.</div>
                ) : (
                    <Table responsive bordered hover className="text-center align-middle mb-0 compare-table bg-white">
                        
                        {/* STICKY HEADER */}
                        <thead className="position-sticky top-0 z-3 bg-white shadow-sm">
                            <tr>
                                <th className="text-start align-bottom p-3 bg-light border-end-0" style={{ minWidth: '220px', width: '20%' }}>
                                    <h6 className="fw-bold text-success mb-0">Tiêu chí so sánh</h6>
                                    <div className="text-muted small fw-normal mt-1">Bậc phân loại: <Badge bg="info" className="text-capitalize">{display_rank}</Badge></div>
                                </th>
                                
                                {compareData.map(item => {
                                    const imgUrl = item.thumbnail 
                                        ? (item.is_external_image ? item.thumbnail : `${backendUrl}${item.thumbnail}`)
                                        : (item.PlantImages?.length > 0 ? `${backendUrl}${item.PlantImages[0].url}` : '/default-plant.png');
                                        
                                    return (
                                        <th key={item[primaryIdKey]} style={{ minWidth: '260px', width: `${80 / compareData.length}%` }} className="p-3 bg-white position-relative">
                                            <Button 
                                                variant="danger" 
                                                className="position-absolute top-0 end-0 rounded-circle p-0 d-flex align-items-center justify-content-center shadow-sm m-2 transition-all" 
                                                style={{ width: '26px', height: '26px', zIndex: 10 }}
                                                onClick={() => onRemoveItem(item)}
                                                title="Xóa khỏi so sánh"
                                            >
                                                <FaTimes size={12} />
                                            </Button>

                                            <div className="rounded-3 overflow-hidden shadow-sm mb-3 position-relative bg-light" style={{ height: '140px' }}>
                                                <img src={imgUrl} alt={item.scientific_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            </div>

                                            {/* Render Bộ 3 tên chính tại Header */}
                                            {renderTaxonomyCell(item)}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        
                        <tbody>
                            {/* --- NHÓM 1: PHÂN LOẠI HOÁ & THÔNG TIN CHUNG --- */}
                            <tr className="table-success opacity-75 cursor-pointer" onClick={() => toggleGroup('general')}>
                                <td colSpan={compareData.length + 1} className="text-start fw-bold py-2">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span><FaDna className="me-2"/> Thông tin chung & Hệ thống phân loại</span>
                                        {expandedGroups.general ? <FaChevronUp className="text-muted"/> : <FaChevronDown className="text-muted"/>}
                                    </div>
                                </td>
                            </tr>
                            
                            {expandedGroups.general && (
                                <>
                                    {['class', 'order', 'family', 'genus', 'species'].includes(display_rank) && (
                                        <tr>
                                            <td className="text-start fw-bold bg-light text-muted">Ngành (Phylum)</td>
                                            {compareData.map(item => {
                                                const chain = getTaxonomyChain(item, display_rank);
                                                return <td key={`phylum-${item[primaryIdKey]}`}>{renderTaxonomyCell(chain.phylum)}</td>;
                                            })}
                                        </tr>
                                    )}
                                    {['order', 'family', 'genus', 'species'].includes(display_rank) && (
                                        <tr>
                                            <td className="text-start fw-bold bg-light text-muted">Lớp (Class)</td>
                                            {compareData.map(item => {
                                                const chain = getTaxonomyChain(item, display_rank);
                                                return <td key={`class-${item[primaryIdKey]}`}>{renderTaxonomyCell(chain.class)}</td>;
                                            })}
                                        </tr>
                                    )}
                                    {['family', 'genus', 'species'].includes(display_rank) && (
                                        <tr>
                                            <td className="text-start fw-bold bg-light text-muted">Bộ (Order)</td>
                                            {compareData.map(item => {
                                                const chain = getTaxonomyChain(item, display_rank);
                                                return <td key={`order-${item[primaryIdKey]}`}>{renderTaxonomyCell(chain.order)}</td>;
                                            })}
                                        </tr>
                                    )}
                                    {['genus', 'species'].includes(display_rank) && (
                                        <tr>
                                            <td className="text-start fw-bold bg-light text-muted">Họ (Family)</td>
                                            {compareData.map(item => {
                                                const chain = getTaxonomyChain(item, display_rank);
                                                return <td key={`family-${item[primaryIdKey]}`}>{renderTaxonomyCell(chain.family)}</td>;
                                            })}
                                        </tr>
                                    )}
                                    {['species'].includes(display_rank) && (
                                        <tr>
                                            <td className="text-start fw-bold bg-light text-muted">Chi (Genus)</td>
                                            {compareData.map(item => {
                                                const chain = getTaxonomyChain(item, display_rank);
                                                return <td key={`genus-${item[primaryIdKey]}`}>{renderTaxonomyCell(chain.genus)}</td>;
                                            })}
                                        </tr>
                                    )}

                                    <tr>
                                        <td className="text-start fw-bold bg-light text-muted">Ghi nhận tại Việt Nam</td>
                                        {compareData.map(item => (
                                            <td key={`vnrec-${item[primaryIdKey]}`}>
                                                <Badge bg={item.is_recorded_in_vietnam ? "success" : "secondary"}>
                                                    {item.is_recorded_in_vietnam ? "Có" : "Không"}
                                                </Badge>
                                            </td>
                                        ))}
                                    </tr>

                                    <tr>
                                        <td className="text-start fw-bold bg-light text-muted">Đặc điểm mô tả chung</td>
                                        {compareData.map(item => <td key={`desc-${item[primaryIdKey]}`} className="text-start small px-3">{renderData(item.description)}</td>)}
                                    </tr>

                                    {isSpeciesRank && (
                                        <tr>
                                            <td className="text-start fw-bold bg-light text-muted">Công dụng & Dược tính</td>
                                            {compareData.map(item => <td key={`uses-${item[primaryIdKey]}`} className="text-start small px-3 text-success fw-medium">{renderData(item.uses)}</td>)}
                                        </tr>
                                    )}
                                </>
                            )}

                            {/* CÁC THÀNH PHẦN HÌNH THÁI CHUYÊN BIỆT KHÁC - CHỈ HIỂN THỊ KHI SO SÁNH BẬC LOÀI */}
                            {isSpeciesRank && (
                                <>
                                    {/* --- NHÓM 2: HÌNH THÁI LÁ --- */}
                                    <tr className="table-success opacity-75 cursor-pointer" onClick={() => toggleGroup('leaf')}>
                                        <td colSpan={compareData.length + 1} className="text-start fw-bold py-2">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span><FaLeaf className="me-2"/> Đặc điểm Hình thái Lá</span>
                                                {expandedGroups.leaf ? <FaChevronUp className="text-muted"/> : <FaChevronDown className="text-muted"/>}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedGroups.leaf && (
                                        <>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Kiểu lá</td>
                                                {compareData.map(item => <td key={`lf-type-${item.species_id}`}>{renderData(item.MorphologyLeafSpecies?.leaf_type ? uiMapping.LEAF_TYPE[item.MorphologyLeafSpecies.leaf_type] : '')}</td>)}
                                            </tr>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Hình dáng lá</td>
                                                {compareData.map(item => <td key={`lf-sh-${item.species_id}`}>{renderData(item.MorphologyLeafSpecies?.shape ? uiMapping.LEAF_SHAPE[item.MorphologyLeafSpecies.shape] : '')}</td>)}
                                            </tr>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Cách sắp xếp mép lá</td>
                                                {compareData.map(item => <td key={`lf-mg-${item.species_id}`}>{renderData(item.MorphologyLeafSpecies?.margin ? uiMapping.LEAF_MARGIN[item.MorphologyLeafSpecies.margin] : '')}</td>)}
                                            </tr>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Kích thước Dài (Min - Max)</td>
                                                {compareData.map(item => <td key={`lf-len-${item.species_id}`}>{item.MorphologyLeafSpecies?.length_min || item.MorphologyLeafSpecies?.length_max ? `${item.MorphologyLeafSpecies.length_min || 0} - ${item.MorphologyLeafSpecies.length_max || 0} cm` : '-'}</td>)}
                                            </tr>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Kích thước Rộng (Min - Max)</td>
                                                {compareData.map(item => <td key={`lf-wid-${item.species_id}`}>{item.MorphologyLeafSpecies?.width_min || item.MorphologyLeafSpecies?.width_max ? `${item.MorphologyLeafSpecies.width_min || 0} - ${item.MorphologyLeafSpecies.width_max || 0} cm` : '-'}</td>)}
                                            </tr>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Mô tả chi tiết lá</td>
                                                {compareData.map(item => <td key={`lf-desc-${item.species_id}`} className="text-start small">{renderData(item.MorphologyLeafSpecies?.description)}</td>)}
                                            </tr>
                                        </>
                                    )}
                                    
                                    {/* --- NHÓM 3: HÌNH THÁI THÂN --- */}
                                    <tr className="table-success opacity-75 cursor-pointer" onClick={() => toggleGroup('stem')}>
                                        <td colSpan={compareData.length + 1} className="text-start fw-bold py-2">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span><FaTree className="me-2"/> Đặc điểm Hình thái Thân</span>
                                                {expandedGroups.stem ? <FaChevronUp className="text-muted"/> : <FaChevronDown className="text-muted"/>}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedGroups.stem && (
                                        <>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Kiểu thân</td>
                                                {compareData.map(item => <td key={`st-tp-${item.species_id}`}>{renderData(item.MorphologyStemSpecies?.stem_type ? uiMapping.STEM_TYPE[item.MorphologyStemSpecies.stem_type] : '')}</td>)}
                                            </tr>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Bề mặt vỏ</td>
                                                {compareData.map(item => <td key={`st-sf-${item.species_id}`}>{renderData(item.MorphologyStemSpecies?.surface ? uiMapping.STEM_SURFACE[item.MorphologyStemSpecies.surface] : '')}</td>)}
                                            </tr>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Màu sắc đặc trưng</td>
                                                {compareData.map(item => <td key={`st-col-${item.species_id}`}>{renderData(item.MorphologyStemSpecies?.color)}</td>)}
                                            </tr>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Chiều cao (Min - Max)</td>
                                                {compareData.map(item => <td key={`st-hgt-${item.species_id}`}>{item.MorphologyStemSpecies?.height_min || item.MorphologyStemSpecies?.height_max ? `${item.MorphologyStemSpecies.height_min || 0} - ${item.MorphologyStemSpecies.height_max || 0} m` : '-'}</td>)}
                                            </tr>
                                        </>
                                    )}

                                    {/* --- NHÓM 4: HÌNH THÁI HOA --- */}
                                    <tr className="table-success opacity-75 cursor-pointer" onClick={() => toggleGroup('flower')}>
                                        <td colSpan={compareData.length + 1} className="text-start fw-bold py-2">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span><FaPalette className="me-2"/> Đặc điểm Hình thái Hoa</span>
                                                {expandedGroups.flower ? <FaChevronUp className="text-muted"/> : <FaChevronDown className="text-muted"/>}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedGroups.flower && (
                                        <>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Kiểu cụm hoa (Inflorescence)</td>
                                                {compareData.map(item => <td key={`fl-inf-${item.species_id}`}>{renderData(item.MorphologyFlowerSpecies?.inflorescence ? uiMapping.INFLORESCENCE[item.MorphologyFlowerSpecies.inflorescence] : '')}</td>)}
                                            </tr>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Màu sắc hoa</td>
                                                {compareData.map(item => <td key={`fl-col-${item.species_id}`}>{renderData(item.MorphologyFlowerSpecies?.color)}</td>)}
                                            </tr>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Số lượng cánh hoa</td>
                                                {compareData.map(item => <td key={`fl-pt-${item.species_id}`}>{renderData(item.MorphologyFlowerSpecies?.petal_count)}</td>)}
                                            </tr>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Mùa nở hoa</td>
                                                {compareData.map(item => <td key={`fl-sea-${item.species_id}`}>{renderData(item.MorphologyFlowerSpecies?.blooming_season)}</td>)}
                                            </tr>
                                        </>
                                    )}

                                    {/* --- NHÓM 5: DỮ LIỆU SÁCH CỦA THẦY PHẠM HOÀNG HỘ --- */}
                                    <tr className="table-success opacity-75 cursor-pointer" onClick={() => toggleGroup('ho_special')}>
                                        <td colSpan={compareData.length + 1} className="text-start fw-bold py-2">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span><FaBook className="me-2"/> Dữ liệu từ Sách Thầy Phạm Hoàng Hộ</span>
                                                {expandedGroups.ho_special ? <FaChevronUp className="text-muted"/> : <FaChevronDown className="text-muted"/>}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedGroups.ho_special && (
                                        <>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Dạng sống & Hình thái thân, rễ</td>
                                                {compareData.map(item => <td key={`ho-hb-${item.species_id}`} className="text-start small">{renderData(item.HoSpeciesDatum?.habit_stem_root)}</td>)}
                                            </tr>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Đặc điểm hình thái Lá</td>
                                                {compareData.map(item => <td key={`ho-lf-${item.species_id}`} className="text-start small">{renderData(item.HoSpeciesDatum?.leaves)}</td>)}
                                            </tr>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Đặc điểm sinh sản (Bào tử/Hoa/Quả)</td>
                                                {compareData.map(item => <td key={`ho-rp-${item.species_id}`} className="text-start small">{renderData(item.HoSpeciesDatum?.reproduction)}</td>)}
                                            </tr>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Mùa hoa quả / Chu kỳ sinh trưởng</td>
                                                {compareData.map(item => <td key={`ho-ph-${item.species_id}`} className="text-start small">{renderData(item.HoSpeciesDatum?.phenology)}</td>)}
                                            </tr>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Môi trường sống & Sinh thái học</td>
                                                {compareData.map(item => <td key={`ho-eco-${item.species_id}`} className="text-start small">{renderData(item.HoSpeciesDatum?.habitat_ecology)}</td>)}
                                            </tr>
                                            <tr>
                                                <td className="text-start fw-bold bg-light text-muted">Công dụng trị liệu & Dược tính</td>
                                                {compareData.map(item => (
                                                    <td key={`ho-loc-${item.species_id}`} className="small">
                                                        {item.HoSpeciesDatum?.locations && item.HoSpeciesDatum.locations.length > 0 
                                                            ? item.HoSpeciesDatum.locations.join(', ') 
                                                            : <span className="text-muted">-</span>}
                                                    </td>
                                                ))}
                                            </tr>
                                        </>
                                    )}
                                </>
                            )}
                        </tbody>
                    </Table>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default SpeciesCompareModal;