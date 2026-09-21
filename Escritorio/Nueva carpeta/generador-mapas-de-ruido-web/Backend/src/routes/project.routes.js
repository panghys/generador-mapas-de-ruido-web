import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
} from "../controllers/project.controller.js";

const router = Router();

// Todas las rutas de proyectos requieren estar autenticado
router.use(verifyToken);

router.get("/", getProjects);
router.post("/", createProject);
router.get("/:id", getProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

export default router;