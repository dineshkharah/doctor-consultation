import { Router } from "express";
import authRoutes from "./authRoutes";
import { getProfile } from "../controllers/authController";
import { authenticateUser } from "../middleware/authenticateUser";

const router = Router();

router.use("/auth", authRoutes);
router.get("/profile", authenticateUser, getProfile);

export default router;
