import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HoSpeciesData = sequelize.define('HoSpeciesData', {
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
}, { tableName: 'ho_species_data', timestamps: true,
    indexes: [
        {
            fields: ['species_id'],
            name: 'idx_ho_species_data_lookup'
        }
    ]
 });

export default HoSpeciesData;