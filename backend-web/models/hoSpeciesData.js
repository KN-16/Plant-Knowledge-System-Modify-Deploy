import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const HoSpeciesData = sequelize.define(
  "HoSpeciesData",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    habit_stem_root: { type: DataTypes.TEXT },
    leaves: { type: DataTypes.TEXT },
    reproduction: { type: DataTypes.TEXT },
    phenology: { type: DataTypes.TEXT },
    habitat_ecology: { type: DataTypes.TEXT },
    locations: { type: DataTypes.ARRAY(DataTypes.STRING) },
    usages: { type: DataTypes.TEXT },
    notes: { type: DataTypes.TEXT },
    volume: { type: DataTypes.INTEGER },
    page_number: { type: DataTypes.INTEGER },
    image_filename: { type: DataTypes.STRING },
  },
  {
    tableName: "ho_species_data",
    timestamps: true,
    indexes: [
      {
        fields: ["species_id"],
        name: "idx_ho_species_data_lookup",
      },
      {
        fields: ["genus_id"],
        name: "idx_ho_species_data_lookup_genus",
      },
      {
        fields: ["variety_id"],
        name: "idx_ho_species_data_lookup_variety",
      },
    ],
    // 1 trong 3 cột (species_id, genus_id, variety_id) sẽ có giá trị, 2 cột còn lại sẽ null.
    validate: {
      // Bạn có thể giữ lại hàm JS này để Sequelize check nhanh trên Node.js trước khi gửi query
      exactlyOneId() {
        const filledCount = [
          this.species_id,
          this.genus_id,
          this.variety_id,
        ].filter((v) => v != null).length;
        if (filledCount !== 1) throw new Error("Phải nhập đúng 1 trong 3 ID!");
      },
    },
  },
);

export default HoSpeciesData;
