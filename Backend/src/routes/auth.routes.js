import { Router } from "express";
import { googleLogin , register, login} from "../controllers/auth.controller.js";

const router = Router();

router.post("/google", googleLogin);
router.post("/register", register);
router.post("/login", login);

export default router;