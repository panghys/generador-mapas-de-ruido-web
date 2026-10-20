import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  getCollaborators,
  addCollaborator,
  removeCollaborator,
} from "../controllers/project.controller.js";
import streetRoutes from "./street.routes.js";

const router = Router();

// Todas las rutas de proyectos requieren estar autenticado
router.use(verifyToken);

router.get("/", getProjects);
router.post("/", createProject);
router.get("/:id", getProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

// Gestión de colaboradores
router.get("/:id/colaboradores", getCollaborators);
router.post("/:id/colaboradores", addCollaborator);
router.delete("/:id/colaboradores/:userId", removeCollaborator);

// Rutas de calles anidadas: /api/proyectos/:proyectoId/calles
router.use("/:proyectoId/calles", streetRoutes);

export default router;