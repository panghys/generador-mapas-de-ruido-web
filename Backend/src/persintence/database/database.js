import Sequelize from "sequelize";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config();

const isDocker = fs.existsSync("/.dockerenv");
const dbHost = isDocker ? (process.env.DB_HOST || "grupo3_db") : "localhost";

export const sequelize = new Sequelize(
  process.env.DB_NAME || "test",
  process.env.DB_USER || "manager_test",
  process.env.DB_PASSWORD || "RqoKdtp88Z94v7vL#XKVHPxWdb9dw",
  {
    host: dbHost,
    port: Number(process.env.DB_PORT) || 3306,
    dialect: "mariadb",
    logging: false,
  }
);