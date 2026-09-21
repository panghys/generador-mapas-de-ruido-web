import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { getStreets, createStreet, updateStreet, deleteStreet } from "../controllers/street.controller.js";

// mergeParams permite leer :proyectoId, definido en project.routes.js
const router = Router({ mergeParams: true });

router.use(verifyToken);

router.get("/", getStreets);
router.post("/", createStreet);
router.put("/:id", updateStreet);
router.delete("/:id", deleteStreet);

export default router;