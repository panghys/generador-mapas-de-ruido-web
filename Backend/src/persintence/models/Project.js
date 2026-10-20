import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import { User } from "./User.js";
import { ProjectCollaborator } from "./ProjectCollaborator.js";

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
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    timestamps: false,
  }
);

// Relación directa de propietario
User.hasMany(Project, { foreignKey: "usuario_id", as: "proyectos" });
Project.belongsTo(User, { foreignKey: "usuario_id", as: "propietario" });

// Relación muchos-a-muchos para colaboradores
Project.belongsToMany(User, {
  through: ProjectCollaborator,
  foreignKey: "proyecto_id",
  otherKey: "usuario_id",
  as: "colaboradores",
});

User.belongsToMany(Project, {
  through: ProjectCollaborator,
  foreignKey: "usuario_id",
  otherKey: "proyecto_id",
  as: "proyectosColaborativos",
});

Project.hasMany(ProjectCollaborator, { foreignKey: "proyecto_id", as: "membresias" });
ProjectCollaborator.belongsTo(Project, { foreignKey: "proyecto_id" });
ProjectCollaborator.belongsTo(User, { foreignKey: "usuario_id", as: "usuario" });