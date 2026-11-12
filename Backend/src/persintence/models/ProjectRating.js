import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

// Una fila representa la valoración de un usuario para un mapa público.
// El índice único impide que una misma persona tenga más de una valoración
// por proyecto; una nueva valoración actualiza la existente.
export const ProjectRating = sequelize.define(
  "ProjectRating",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    proyecto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "projects",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    puntuacion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
  },
  {
    tableName: "valoraciones_proyectos",
    timestamps: false,
    indexes: [
      {
        name: "uq_valoracion_proyecto_usuario",
        unique: true,
        fields: ["proyecto_id", "usuario_id"],
      },
    ],
  }
);
