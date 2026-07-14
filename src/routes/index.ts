import { Router } from "express";
import authRoutes from "./authRoutes";
import doctorRoutes from "./doctorRoutes";
import { getProfile } from "../controllers/authController";
import { authenticateUser } from "../middleware/authenticateUser";

const router = Router();

router.use("/auth", authRoutes);
router.get("/profile", authenticateUser, getProfile);
router.use("/doctors", authenticateUser, doctorRoutes);

export default router;
