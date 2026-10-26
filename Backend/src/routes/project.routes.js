import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
} from "../controllers/project.controller.js";
import streetRoutes from "./street.routes.js";
import { listarPublicos, detallePublico } from "../controllers/publicProject.controller.js";

const router = Router();

// Consultas públicas: solo lectura, antes del middleware JWT.
router.get("/publicos", listarPublicos);
router.get("/publicos/:id", detallePublico);

// Las operaciones privadas siguen exigiendo JWT.
router.use(verifyToken);

router.get("/", getProjects);
router.post("/", createProject);
router.get("/:id", getProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

// Rutas de calles, anidadas bajo un proyecto: /api/proyectos/:proyectoId/calles
router.use("/:proyectoId/calles", streetRoutes);

export default router;