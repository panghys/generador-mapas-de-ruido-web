import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const ProjectCollaborator = sequelize.define(
  "proyecto_colaboradores",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    proyecto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM("editor", "propietario"),
      defaultValue: "editor",
      allowNull: false,
    },
  },
  {
    tableName: "proyecto_colaboradores",
    timestamps: true, // Usa createdAt y updatedAt generados en MariaDB
  }
);