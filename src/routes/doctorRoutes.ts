import { Router } from "express";
import { getDoctors, getDoctorById } from "../controllers/doctorController";
import { validateParams } from "../middleware/validateParams";
import { idParamSchema } from "../schemas/commonSchema";

const router = Router();

router.get("/", getDoctors);
router.get("/:id", validateParams(idParamSchema), getDoctorById);

export default router;
