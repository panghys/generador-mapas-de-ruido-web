import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

// Permite leer el .env tanto si estás en la raíz como dentro de Backend/
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config();

const app = express();
app.set("etag", false);

import userRoutes from "./routes/users.routes.js";
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";

app.use(morgan("dev"));
app.use(express.json());
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

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
app.use("/api/proyectos", projectRoutes);

export default app;