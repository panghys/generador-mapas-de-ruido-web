import dotenv from 'dotenv';
dotenv.config();

import app from "./app.js";
import { sequelize } from "./persintence/database/database.js";

async function main() {
  await sequelize.sync({ force: false });

  const port = process.env.PORT || 4009;

  // Escuchar siempre en todas las interfaces (accesible desde fuera del contenedor)
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
  });
}

main();