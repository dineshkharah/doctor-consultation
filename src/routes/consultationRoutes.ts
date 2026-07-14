import { Router } from "express";
import {
  createConsultation,
  getConsultations,
  getConsultationById,
  updateConsultationStatus,
} from "../controllers/consultationController";
import { validate } from "../middleware/validate";
import { validateParams } from "../middleware/validateParams";
import { requireRole } from "../middleware/requireRole";
import { idParamSchema } from "../schemas/commonSchema";
import {
  createConsultationSchema,
  updateStatusSchema,
} from "../schemas/consultationSchema";

const router = Router();

router.post(
  "/",
  requireRole("PATIENT"),
  validate(createConsultationSchema),
  createConsultation,
);
router.get("/", getConsultations);
router.get("/:id", validateParams(idParamSchema), getConsultationById);
router.patch(
  "/:id/status",
  validateParams(idParamSchema),
  validate(updateStatusSchema),
  updateConsultationStatus,
);

export default router;
