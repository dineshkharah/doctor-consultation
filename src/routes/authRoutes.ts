import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login } from "../controllers/authController";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema } from "../schemas/authSchema";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    error: {
      message: "Too many attempts, please try again later",
      code: "RATE_LIMITED",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);

export default router;
