// models/Morphology.js

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { RAW_ENUMS } from "./enums.js";
import generateCustomId from "../utils/idGenerator.js";

// Morphology Leaves (Lá)
const MorphologyLeaf = sequelize.define(
  "MorphologyLeaf",
  {
    leaf_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    variety_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    leaf_type: {
      type: DataTypes.ENUM(...RAW_ENUMS.LEAF_TYPE),
      allowNull: false,
    },
    shape: { type: DataTypes.ENUM(...RAW_ENUMS.LEAF_SHAPE), allowNull: false },
    arrangement: {
      type: DataTypes.ENUM(...RAW_ENUMS.LEAF_ARRANGEMENT),
      allowNull: false,
    },
    margin: {
      type: DataTypes.ENUM(...RAW_ENUMS.LEAF_MARGIN),
      allowNull: false,
    },
    // ... Thêm các field khác như length_min, width_max...
    length_min: { type: DataTypes.FLOAT }, //cm
    length_max: { type: DataTypes.FLOAT }, //cm
    width_min: { type: DataTypes.FLOAT }, //cm
    width_max: { type: DataTypes.FLOAT }, //cm
    petiole_length: { type: DataTypes.FLOAT }, //cm
    description: { type: DataTypes.TEXT },
  },
  { tableName: "morphology_leaves", timestamps: true },
);

const MorphologyLeafSpecies = sequelize.define(
  "MorphologyLeafSpecies",
  {
    leaf_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    species_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    leaf_type: {
      type: DataTypes.ENUM(...RAW_ENUMS.LEAF_TYPE),
      allowNull: false,
    },
    shape: { type: DataTypes.ENUM(...RAW_ENUMS.LEAF_SHAPE), allowNull: false },
    arrangement: {
      type: DataTypes.ENUM(...RAW_ENUMS.LEAF_ARRANGEMENT),
      allowNull: false,
    },
    margin: {
      type: DataTypes.ENUM(...RAW_ENUMS.LEAF_MARGIN),
      allowNull: false,
    },
    // ... Thêm các field khác như length_min, width_max...
    length_min: { type: DataTypes.FLOAT }, //cm
    length_max: { type: DataTypes.FLOAT }, //cm
    width_min: { type: DataTypes.FLOAT }, //cm
    width_max: { type: DataTypes.FLOAT }, //cm
    petiole_length: { type: DataTypes.FLOAT }, //cm
    description: { type: DataTypes.TEXT },
  },
  { tableName: "morphology_leaves_species", timestamps: true },
);

// Morphology Stem
const MorphologyStem = sequelize.define(
  "MorphologyStem",
  {
    stem_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    variety_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    stem_type: {
      type: DataTypes.ENUM(...RAW_ENUMS.STEM_TYPE),
      allowNull: false,
    },
    color: { type: DataTypes.STRING },
    surface: {
      type: DataTypes.ENUM(...RAW_ENUMS.STEM_SURFACE),
      allowNull: false,
    },
    // ... Thêm các field khác như height_min, height_max...
    height_min: { type: DataTypes.FLOAT }, //met
    height_max: { type: DataTypes.FLOAT }, //met
    description: { type: DataTypes.TEXT },
  },
  { tableName: "morphology_stems", timestamps: true },
);

const MorphologyStemSpecies = sequelize.define(
  "MorphologyStemSpecies",
  {
    stem_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    species_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    stem_type: {
      type: DataTypes.ENUM(...RAW_ENUMS.STEM_TYPE),
      allowNull: false,
    },
    color: { type: DataTypes.STRING },
    surface: {
      type: DataTypes.ENUM(...RAW_ENUMS.STEM_SURFACE),
      allowNull: false,
    },
    // ... Thêm các field khác như height_min, height_max...
    height_min: { type: DataTypes.FLOAT }, //met
    height_max: { type: DataTypes.FLOAT }, //met
    description: { type: DataTypes.TEXT },
  },
  { tableName: "morphology_stems_species", timestamps: true },
);

// Morphology Flower
const MorphologyFlower = sequelize.define(
  "MorphologyFlower",
  {
    flower_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    variety_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    inflorescence: {
      type: DataTypes.ENUM(...RAW_ENUMS.INFLORESCENCE),
      allowNull: false,
    },
    color: { type: DataTypes.STRING, allowNull: false },
    petal_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    blooming_season: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
  },
  { tableName: "morphology_flowers", timestamps: true },
);

const MorphologyFlowerSpecies = sequelize.define(
  "MorphologyFlowerSpecies",
  {
    flower_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    species_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    inflorescence: {
      type: DataTypes.ENUM(...RAW_ENUMS.INFLORESCENCE),
      allowNull: false,
    },
    color: { type: DataTypes.STRING, allowNull: false },
    petal_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    blooming_season: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
  },
  { tableName: "morphology_flowers_species", timestamps: true },
);

// Có thể thêm MorphologyStem (MST-xxxxx) và MorphologyFlower (MFL-xxxxx) tương tự

const MorphologyFruit = sequelize.define(
  "MorphologyFruit",
  {
    fruit_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    variety_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    fruit_type: {
      type: DataTypes.ENUM(...RAW_ENUMS.FRUIT_TYPE),
      allowNull: false,
    },
    color: { type: DataTypes.STRING },
    surface: {
      type: DataTypes.ENUM(...RAW_ENUMS.FRUIT_SURFACE),
      allowNull: false,
    },
    // ... Thêm các field khác như weight_min, weight_max...
    weight_min: { type: DataTypes.FLOAT }, //gram
    weight_max: { type: DataTypes.FLOAT }, //gram
    description: { type: DataTypes.TEXT },
  },
  { tableName: "morphology_fruits", timestamps: true },
);

const MorphologyFruitSpecies = sequelize.define(
  "MorphologyFruitSpecies",
  {
    fruit_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    species_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    fruit_type: {
      type: DataTypes.ENUM(...RAW_ENUMS.FRUIT_TYPE),
      allowNull: false,
    },
    color: { type: DataTypes.STRING },
    surface: {
      type: DataTypes.ENUM(...RAW_ENUMS.FRUIT_SURFACE),
      allowNull: false,
    },
    // ... Thêm các field khác như weight_min, weight_max...
    weight_min: { type: DataTypes.FLOAT }, //gram
    weight_max: { type: DataTypes.FLOAT }, //gram
    description: { type: DataTypes.TEXT },
  },
  { tableName: "morphology_fruits_species", timestamps: true },
);

export {
  MorphologyLeaf,
  MorphologyStem,
  MorphologyFlower,
  MorphologyFruit,
  MorphologyLeafSpecies,
  MorphologyStemSpecies,
  MorphologyFlowerSpecies,
  MorphologyFruitSpecies,
};
