import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { RAW_ENUMS } from './enums.js';

export const CommonName = sequelize.define('CommonName', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_entity: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    rank: { type: DataTypes.ENUM(...RAW_ENUMS.RANK_TYPE), allowNull: false },
    lang: { type: DataTypes.ENUM(...RAW_ENUMS.LANGUAGE), defaultValue: 'vie'},
    primary: { type: DataTypes.BOOLEAN, defaultValue: false }, // Có phải tên phổ biến nhất không
}, { tableName: 'common_names', timestamps: true 
    ,indexes: [
        {
        // Index tối thượng cho UI: Phục vụ chính xác logic tìm kiếm đại diện
        // Sắp xếp "primary" DESC (true lên trước) và "id" ASC (bản ghi đầu tiên lên trước)
        fields: ['id_entity', 'rank', 'lang', 'primary', 'id'],
        name: 'idx_common_names_representative'
    },
    {
            fields: ['rank', 'lang', 'name'],
            name: 'idx_common_names_search_lookup'
    }
    ]
});

export const TaxonomyHistory = sequelize.define('TaxonomyHistory', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_entity: { type: DataTypes.INTEGER, allowNull: false },
    scientific_name: { type: DataTypes.STRING, allowNull: false },
    canonical_name: { type: DataTypes.STRING },
    rank: { type: DataTypes.ENUM(...RAW_ENUMS.RANK_TYPE), allowNull: false },
    authority: { type: DataTypes.STRING },
    status: { type: DataTypes.ENUM(...RAW_ENUMS.STATUS_TAXONOMY), defaultValue: 'unresolved' },
    externalIds: { type: DataTypes.JSONB },
}, { tableName: 'taxonomy_history', timestamps: true 
    ,indexes: [
        {
        // Giúp truy xuất toàn bộ lịch sử đồng danh, đổi tên của một đối tượng cụ thể cực nhanh
        fields: ['id_entity', 'rank'],
        name: 'idx_taxonomy_history_entity_lookup'
    },
    {
        // Dự phòng cho các tác vụ thống kê hoặc lọc danh sách theo trạng thái (VD: unresolved) trên UI
        fields: ['rank', 'status'],
        name: 'idx_taxonomy_history_rank_status'
    }
    ]
});