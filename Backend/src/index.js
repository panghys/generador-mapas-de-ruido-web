import dotenv from "dotenv";
import path from "path";

// Asegura la lectura del .env en la raíz antes de inicializar la base de datos
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config();

import app from "./app.js";
import { sequelize } from "./persintence/database/database.js";

async function main() {
  await sequelize.sync({ force: false });

  // Cambiado de 4009 a 4003 como puerto por defecto para el Grupo 3
  const port = process.env.PORT || 4003;

  app.listen(port, "0.0.0.0", () => {
    console.log(`el server esta corriendo en: http://0.0.0.0:${port}`);
  });
}

main();