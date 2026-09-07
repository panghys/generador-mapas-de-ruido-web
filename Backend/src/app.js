import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from 'dotenv';

dotenv.config();
const app = express();

import userRoutes from "./routes/users.routes.js";
import authRoutes from "./routes/auth.routes.js";

app.use(morgan("dev"));
app.use(express.json());
app.use(
  cors({
    origin: [process.env.ORIGIN],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

export default app;