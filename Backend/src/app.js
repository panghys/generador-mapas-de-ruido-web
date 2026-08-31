import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from 'dotenv';

//init
dotenv.config();
const app = express();

// Import routes
import userRoutes from "./routes/users.routes.js";

// Middlewares
app.use(morgan("dev"));
app.use(express.json());

// Configura CORS
app.use(
  cors({
    origin: [process.env.ORIGIN],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Routes
app.use("/api/users", userRoutes);

export default app;
