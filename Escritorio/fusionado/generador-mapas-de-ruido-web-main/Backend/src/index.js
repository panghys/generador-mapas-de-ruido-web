import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carga el .env de la raíz de manera infalible
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config();

import app from "./app.js";
import { sequelize } from "./persintence/database/database.js";

async function main() {
  await sequelize.sync({ force: false });

  const port = process.env.PORT || 4003;

  app.listen(port, "0.0.0.0", () => {
    console.log(`el server esta corriendo en: http://0.0.0.0:${port}`);
  });
}

main();