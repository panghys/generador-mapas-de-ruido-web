import dotenv from 'dotenv';
dotenv.config();

import app from "./app.js";
import { sequelize } from "./persintence/database/database.js";

async function main() {
  await sequelize.sync({ force: false });

  const port = process.env.PORT || 4009;

  app.listen(port, '0.0.0.0', () => {
    console.log(`el server esta corriendo en: http://0.0.0.0:${port}`);
  });
}

main();