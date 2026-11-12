import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { optionalVerifyToken } from "../middlewares/optionalVerifyToken.js";
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
import {
  listarPublicos,
  detallePublico,
  valorarPublico,
} from "../controllers/publicProject.controller.js";

const router = Router();

// Las consultas públicas no requieren sesión. Si hay un JWT válido,
// también devuelven la valoración que ya realizó ese usuario.
router.get("/publicos", optionalVerifyToken, listarPublicos);
router.get("/publicos/:id", optionalVerifyToken, detallePublico);

// Solo usuarios autenticados pueden crear o actualizar una valoración.
router.post("/publicos/:id/valoracion", verifyToken, valorarPublico);

// Las operaciones privadas existentes siguen exigiendo JWT.
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
