import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import { Project } from "./Project.js";

export const Street = sequelize.define(
  "streets",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_calle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    trazo_calle: {
      // GeoJSON LineString: { type: "LineString", coordinates: [[lng, lat], ...] }
      type: DataTypes.JSON,
      allowNull: false,
    },
    tipo_calle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    trafico_vehiculos_grandes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    trafico_vehiculos_medianos: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    trafico_vehiculos_pequenos: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    tipo_calculo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nivel_ruido_dba: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    color_asignado: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: false,
  }
);

// Un proyecto tiene muchas calles; si se borra el proyecto, se borran sus calles
Project.hasMany(Street, { foreignKey: "proyecto_id", as: "calles", onDelete: "CASCADE" });
Street.belongsTo(Project, { foreignKey: "proyecto_id", as: "proyecto" });