// models/AI.js

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { RAW_ENUMS } from "./enums.js";

export const PlantImage = sequelize.define(
  "PlantImage",
  {
    plant_image_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    url: { type: DataTypes.STRING, allowNull: false }, // URL hình ảnh, xem là objectkey cho minio
    part_type: {
      type: DataTypes.ENUM(...RAW_ENUMS.PART_TYPE),
      allowNull: false,
    }, // Phần của cây (lá, hoa, thân, toàn cây)
    status: {
      type: DataTypes.ENUM(...RAW_ENUMS.IMAGE_STATUS),
      allowNull: false,
    }, // Tình trạng hình ảnh
    is_background: { type: DataTypes.BOOLEAN, defaultValue: false }, // Có phải hình ảnh nền không
    cnn_feature_vector: { type: DataTypes.ARRAY(DataTypes.FLOAT) }, // Vector đặc trưng CNN
    is_standard: { type: DataTypes.BOOLEAN, defaultValue: true }, // Có phải hình ảnh tiêu chuan AI khong
  },
  { tableName: "plant_images", timestamps: true },
);

export const TaxonomyImage = sequelize.define(
  "TaxonomyImage",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    url: { type: DataTypes.TEXT, allowNull: false }, // URL hình ảnh, xem là objectkey cho minio
    id_entity: { type: DataTypes.INTEGER, allowNull: false }, // ID của thực thể (có thể là species_id, v.v.)
    // part_type: { type: DataTypes.ENUM(...RAW_ENUMS.PART_TYPE)}, // Phần của cây (lá, hoa, thân, toàn cây)
    rank: { type: DataTypes.ENUM(...RAW_ENUMS.RANK_TYPE), allowNull: false }, // Cấp phân loại (loài, chi, họ, v.v.)
    is_external: { type: DataTypes.BOOLEAN, defaultValue: true }, // Có phải hình ảnh từ nguồn bên ngoài không
    // status: { type: DataTypes.ENUM(...RAW_ENUMS.IMAGE_STATUS), allowNull: false }, // Tình trạng hình ảnh
    is_background: { type: DataTypes.BOOLEAN, defaultValue: false }, // Có phải hình ảnh nền không
    // cnn_feature_vector: { type: DataTypes.ARRAY(DataTypes.FLOAT) }, // Vector đặc trưng CNN
    // is_standard: { type: DataTypes.BOOLEAN, defaultValue: true }, // Có phải hình ảnh tiêu chuan AI khong
  },
  {
    tableName: "taxonomy_images",
    timestamps: true,
    indexes: [
      {
        name: "idx_taxonomy_images_cover_lookup",
        fields: [
          "id_entity",
          "rank",
          "is_background",
          { attribute: "createdAt", order: "DESC" }, // Sắp xếp giảm dần theo thời gian tạo
        ],
      },
    ],
  },
);

export const BookImage = sequelize.define(
  "BookImage",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    url: { type: DataTypes.STRING, allowNull: false },
    is_external: { type: DataTypes.BOOLEAN, defaultValue: false },
    // file_name đặt Unique để làm gốc tham chiếu khóa ngoại
    file_name: { type: DataTypes.STRING, allowNull: false, unique: true },
    volume: { type: DataTypes.INTEGER, allowNull: false },
    page_number: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: "book_images",
    timestamps: true,
    indexes: [
      {
        fields: ["volume", "page_number"],
        name: "idx_book_images_navigation",
      },
    ],
  },
);
