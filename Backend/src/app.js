import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

// Permite leer el .env tanto si estás en la raíz como dentro de Backend/
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config();

const app = express();

import userRoutes from "./routes/users.routes.js";
import authRoutes from "./routes/auth.routes.js";

app.use(morgan("dev"));
app.use(express.json());

// Lista blanca que permite tanto producción como tus pruebas en local
const allowedOrigins = [
  process.env.ORIGIN,
  "http://localhost:3003",
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

export default app;