// models/Taxonomy.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import generateCustomId from '../utils/idGenerator.js';
import { RAW_ENUMS } from './enums.js';

// 1. PHYLUM (Ngành)
export const Phylum = sequelize.define('Phylum', {
    phylum_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING, unique: true }, // VD: PHYL-00001
    scientific_name: { type: DataTypes.STRING, allowNull: false },
    canonical_name: { type: DataTypes.STRING },
    slug: { type: DataTypes.STRING }, // Chuỗi định danh thân thiện với URL
    description: { type: DataTypes.TEXT },
    authority: { type: DataTypes.STRING },
    is_recorded_in_vietnam: { type: DataTypes.BOOLEAN, defaultValue: true },
    url_external: { type: DataTypes.STRING },
    view_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    externalIds: { type: DataTypes.JSONB }, 
}, { tableName: 'phyla' , timestamps: true , indexes: [
    {
        unique: true, // Không cho phép trùng lặp
        fields: ['scientific_name'], // Tên khoa học phải duy nhất
        name: 'unique_phylum_entry' // Tên constraint (tùy chọn)
    },
    {
        fields: ['is_recorded_in_vietnam'],
        name: 'idx_phylum_is_recorded_in_vietnam'
    },
    {
        fields: ['canonical_name'],
        name: 'idx_phylum_canonical_name'
    }
]});

Phylum.beforeValidate(async (phylum, options) => {
    if (!phylum.code) {
        let transaction = options.transaction || null;
        phylum.code = await generateCustomId('Phylum', 'PHYL', transaction);
    }
});

// 2. CLASS (Lớp)
export const Class = sequelize.define('Class', {
    class_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING, unique: true }, // VD: CLASS-00001
    scientific_name: { type: DataTypes.STRING, allowNull: false },
    canonical_name: { type: DataTypes.STRING },
    is_recorded_in_vietnam: { type: DataTypes.BOOLEAN, defaultValue: true },
    description: { type: DataTypes.TEXT },
    authority: { type: DataTypes.STRING },
    view_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    url_external: { type: DataTypes.STRING },
    slug: { type: DataTypes.STRING }, // Chuỗi định danh thân thiện với URL,
    externalIds: { type: DataTypes.JSONB }, 
}, { tableName: 'classes' , timestamps: true , indexes: [
    {
        unique: true, // Không cho phép trùng lặp
        fields: ['scientific_name'], // Tên khoa học phải duy nhất
        name: 'unique_class_entry' // Tên constraint (tùy chọn)
    },
    {
        fields: ['is_recorded_in_vietnam'],
        name: 'idx_class_is_recorded_in_vietnam'
    },
    {
        fields: ['canonical_name'],
        name: 'idx_class_canonical_name'
    },
    {
        fields: ['phylum_id'],
        name: 'idx_class_phylum_id'
    }
]});

Class.beforeValidate(async (cls, options) => {
    if (!cls.code) {
        let transaction = options.transaction || null;
        cls.code = await generateCustomId('Class', 'CLASS', transaction);
    }
});

// 3. ORDER (Bộ)
export const Order = sequelize.define('Order', {
    order_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING, unique: true }, // VD: ORD-00001
    scientific_name: { type: DataTypes.STRING, allowNull: false },
    canonical_name: { type: DataTypes.STRING },
    slug: { type: DataTypes.STRING }, // Chuỗi định danh thân thiện với URL
    description: { type: DataTypes.TEXT },
    authority: { type: DataTypes.STRING },
    url_external: { type: DataTypes.STRING },
    view_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    externalIds: { type: DataTypes.JSONB },
    is_recorded_in_vietnam: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'orders' , timestamps: true , indexes: [
    {
        unique: true, // Không cho phép trùng lặp
        fields: ['scientific_name'], // Tên khoa học phải duy nhất
        name: 'unique_order_entry' // Tên constraint (tùy chọn)
    },
    {
        fields: ['canonical_name'],
        name: 'idx_order_canonical_name'
    },
    {
        fields: ['is_recorded_in_vietnam'],
        name: 'idx_order_is_recorded_in_vietnam'
    },
    {
        fields: ['class_id'],
        name: 'idx_order_class_id'
    }
]});

Order.beforeValidate(async (order, options) => {
    if (!order.code) {
        let transaction = options.transaction || null;
        order.code = await generateCustomId('Order', 'ORD', transaction);
    }
});

// 4. FAMILY (Họ)
export const Family = sequelize.define('Family', {
    family_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING, unique: true }, // VD: FAM-00001
    scientific_name: { type: DataTypes.STRING, allowNull: false },
    canonical_name: { type: DataTypes.STRING },
    slug: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    authority: { type: DataTypes.STRING },
    url_external: { type: DataTypes.STRING },
    view_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    externalIds: { type: DataTypes.JSONB },
    is_recorded_in_vietnam: { type: DataTypes.BOOLEAN, defaultValue: true },
    vietnamese_name: {
    type: DataTypes.VIRTUAL,
    get() {
        // Trả về giá trị đã được inject từ subquery literal phía trên
        return this.getDataValue('vietnamese_name') || null;
    }
    }
}, { tableName: 'families' , timestamps: true , indexes: [
    {
        unique: true, // Không cho phép trùng lặp
        fields: ['scientific_name'], // Tên khoa học phải duy nhất
        name: 'unique_family_entry' // Tên constraint (tùy chọn)
    },
    {
        fields: ['is_recorded_in_vietnam'],
        name: 'idx_family_is_recorded_in_vietnam'
    },
    {
        fields: ['canonical_name'],
        name: 'idx_family_canonical_name'
    },
    { 
        fields: ['order_id'], 
        name: 'idx_families_order_id' 
    },
]});

Family.beforeValidate(async (family, options) => {
  // Chỉ tạo code nếu chưa có (để tránh ghi đè khi update hoặc nếu đã truyền tay)
  if (!family.code) {
    let transaction = options.transaction || null;
    family.code = await generateCustomId('Family', 'FAM', transaction);
  }
});

// 2. GENUS (Chi)
export const Genus = sequelize.define('Genus', {
    genus_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING, unique: true }, // VD: GEN-00001
    scientific_name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING },
    canonical_name: { type: DataTypes.STRING },
    authority: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    url_external: { type: DataTypes.STRING },
    view_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    externalIds: { type: DataTypes.JSONB },
    is_recorded_in_vietnam: { type: DataTypes.BOOLEAN, defaultValue: true },
    vietnamese_name: {
    type: DataTypes.VIRTUAL,
    get() {
        // Trả về giá trị đã được inject từ subquery literal phía trên
        return this.getDataValue('vietnamese_name') || null;
    }
}
}, { tableName: 'genera' , timestamps: true , indexes: [
    {
        unique: true, // Không cho phép trùng lặp
        fields: ['scientific_name'], // Tên khoa học phải duy nhất
        name: 'unique_genus_entry' // Tên constraint (tùy chọn)
    },
    {
        fields: ['is_recorded_in_vietnam'],
        name: 'idx_genus_is_recorded_in_vietnam'
    },
    {
        fields: ['canonical_name'],
        name: 'idx_genus_canonical_name'
    },
    { 
        fields: ['family_id'], 
        name: 'idx_genera_family_id' 
    },
]});

Genus.beforeValidate(async (genus, options) => {
    // Chỉ tạo code nếu chưa có (để tránh ghi đè khi update hoặc nếu đã truyền tay)
    if (!genus.code) {
        let transaction = options.transaction || null;
        genus.code = await generateCustomId('Genus', 'GEN', transaction);
    }
});

// 3. SPECIES (Loài - Bảng trung tâm)
export const Species = sequelize.define('Species', {
    species_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING, unique: true }, // VD: SPC-00001
    scientific_name: { type: DataTypes.STRING, allowNull: false },
    canonical_name: { type: DataTypes.STRING },
    slug: { type: DataTypes.STRING },
    uses: { type: DataTypes.TEXT },
    description: { type: DataTypes.TEXT },
    authority: { type: DataTypes.STRING },
    url_external: { type: DataTypes.STRING },
    view_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    externalIds: { type: DataTypes.JSONB },
    is_recorded_in_vietnam: { type: DataTypes.BOOLEAN, defaultValue: true },
    vietnamese_name: {
        type: DataTypes.VIRTUAL,
        get() {
            // Trả về giá trị đã được inject từ subquery literal phía trên
            return this.getDataValue('vietnamese_name') || null;
        }
    }
}, { tableName: 'species' , timestamps: true , indexes: [
    {
        unique: true, // Không cho phép trùng lặp
        fields: ['scientific_name'], // Tên khoa học phải duy nhất
        name: 'unique_species_entry' // Tên constraint (tùy chọn)
    },
    {
        fields: ['is_recorded_in_vietnam'],
        name: 'idx_species_is_recorded_in_vietnam'
    },
    {
        fields: ['canonical_name'],
        name: 'idx_species_canonical_name'
    },
    { 
        fields: ['genus_id'], 
        name: 'idx_species_genus_id' 
    },
]});

Species.beforeValidate(async (species, options) => {
    // Chỉ tạo code nếu chưa có (để tránh ghi đè khi update hoặc nếu đã truyền tay)
    if (!species.code) {
        let transaction = options.transaction || null;
        species.code = await generateCustomId('Species', 'SPC', transaction);
    }
});

export const Variety = sequelize.define('Variety', {
    variety_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING, unique: true }, // VD: VAR-00001
    variety_name: { type: DataTypes.STRING }, // Tên Latin biến thể (Thường ít khi dùng, có thể để trống)
    common_name: { type: DataTypes.STRING},  // Tên thường gọi (Đinh lăng lá nhỏ)
    variant_type: { type: DataTypes.ENUM(...RAW_ENUMS.VARIANT_TYPE),defaultValue: 'Cultivar' }, 
    authority: { type: DataTypes.STRING }, // Không bắt buộc khi không phải công bố chính thức 
    // Enum fields
    life_form: { type: DataTypes.ENUM(...RAW_ENUMS.LIFE_FORM) },
    externalIds: { type: DataTypes.JSONB },
    view_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    distinctive_feature: { type: DataTypes.TEXT },
    description: { type: DataTypes.TEXT },
    is_flowering: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_fruiting: { type: DataTypes.BOOLEAN, defaultValue: false },
    url_external: { type: DataTypes.STRING },
    slug: { type: DataTypes.STRING },
    is_recorded_in_vietnam: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'varieties', timestamps: true,
    indexes: [
        { 
            fields: ['species_id'], 
            name: 'idx_varieties_species_id' 
        },
    ]
});

Variety.beforeCreate(async (record) => {
    record.code = await generateCustomId('Variety', 'VAR');
});