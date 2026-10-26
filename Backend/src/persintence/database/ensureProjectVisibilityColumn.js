import { DataTypes } from "sequelize";
import { sequelize } from "./database.js";

/** Añade la columna sin borrar registros existentes. */
export async function ensureProjectVisibilityColumn() {
  const qi = sequelize.getQueryInterface();
  const columnas = await qi.describeTable("projects");
  if (!columnas.es_publico) {
    await qi.addColumn("projects", "es_publico", {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    });
    console.log("Columna projects.es_publico creada");
  }
}
