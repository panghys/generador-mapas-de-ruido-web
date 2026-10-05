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
  "http://grupo3.146.83.216.166.nip.io",
  "http://grupo3.146.83.216.166.nip.io/",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      try {
        const url = new URL(origin);
        const hostname = url.hostname;
        if (
          allowedOrigins.includes(origin) ||
          hostname === "localhost" ||
          hostname === "127.0.0.1" ||
          hostname.startsWith("192.168.") ||
          hostname.startsWith("10.") ||
          hostname.startsWith("172.")
        ) {
          return callback(null, true);
        }
      } catch (e) {}
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/proyectos", projectRoutes);

export default app;