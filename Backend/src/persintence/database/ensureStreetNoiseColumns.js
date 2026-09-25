import { DataTypes } from "sequelize";
import { sequelize } from "./database.js";

export async function ensureStreetNoiseColumns() {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();
  const streetsTableExists = tables.some((table) => {
    const tableName =
      typeof table === "string" ? table : table.tableName || Object.values(table)[0];
    return typeof tableName === "string" && tableName.toLowerCase() === "streets";
  });

  if (!streetsTableExists) return;

  const columns = await queryInterface.describeTable("streets");
  const noiseColumns = {
    nivelRuidoCalculado: { type: DataTypes.FLOAT, allowNull: true },
    velocidadPromedio: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 50 },
    tipoSuperficie: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "asfalto_no_ranurado",
    },
    periodoConteo: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "15_minutos",
    },
  };

  for (const [name, definition] of Object.entries(noiseColumns)) {
    if (!columns[name]) {
      await queryInterface.addColumn("streets", name, definition);
    }
  }
}
