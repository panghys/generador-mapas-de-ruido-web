import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import { User } from "./User.js";

export const Project = sequelize.define(
  "projects",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    comuna: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    estado: {
      type: DataTypes.STRING,
      defaultValue: "borrador",
    },
    fecha_modificacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    zona: {
      // GeoJSON Polygon: { type: "Polygon", coordinates: [[[lng, lat], ...]] }
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    timestamps: false,
  }
);

// Relación: un usuario tiene muchos proyectos, un proyecto pertenece a un usuario
User.hasMany(Project, { foreignKey: "usuario_id", as: "proyectos" });
Project.belongsTo(User, { foreignKey: "usuario_id", as: "usuario" });