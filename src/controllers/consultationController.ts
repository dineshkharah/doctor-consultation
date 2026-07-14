import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { AppError } from "../utils/AppError";
import {
  assertTransition,
  assertNoOpenDuplicate,
} from "../services/consultationService";
import type {
  CreateConsultationInput,
  UpdateStatusInput,
} from "../schemas/consultationSchema";

// The related fields we pull in for every consultation response.
const consultationInclude = {
  patient: { select: { id: true, name: true } },
  doctor: {
    select: {
      id: true,
      name: true,
      doctorProfile: { select: { specialization: true } },
    },
  },
} satisfies Prisma.ConsultationInclude;

type ConsultationWithParties = Prisma.ConsultationGetPayload<{
  include: typeof consultationInclude;
}>;

const toConsultationDto = (c: ConsultationWithParties) => ({
  id: c.id,
  status: c.status,
  createdAt: c.createdAt,
  patient: { id: c.patient.id, name: c.patient.name },
  doctor: {
    id: c.doctor.id,
    name: c.doctor.name,
    specialization: c.doctor.doctorProfile?.specialization ?? null,
  },
});

export const createConsultation = asyncHandler(async (req, res) => {
  const { doctorId } = req.body as CreateConsultationInput;
  const patientId = req.user!.userId;

  const doctor = await prisma.user.findFirst({
    where: { id: doctorId, role: "DOCTOR" },
  });
  if (!doctor) {
    throw new AppError("Doctor not found", 404, "DOCTOR_NOT_FOUND");
  }

  await assertNoOpenDuplicate(patientId, doctorId);

  const consultation = await prisma.consultation.create({
    data: { patientId, doctorId },
    include: consultationInclude,
  });

  res.status(201).json(toConsultationDto(consultation));
});

export const getConsultations = asyncHandler(async (req, res) => {
  const { userId, role } = req.user!;
  const where =
    role === "DOCTOR" ? { doctorId: userId } : { patientId: userId };

  const consultations = await prisma.consultation.findMany({
    where,
    include: consultationInclude,
    orderBy: { createdAt: "desc" },
  });

  res.json(consultations.map(toConsultationDto));
});

export const getConsultationById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const consultation = await prisma.consultation.findUnique({
    where: { id },
    include: consultationInclude,
  });
  if (!consultation) {
    throw new AppError("Consultation not found", 404, "CONSULTATION_NOT_FOUND");
  }

  const { userId } = req.user!;
  if (consultation.patientId !== userId && consultation.doctorId !== userId) {
    throw new AppError(
      "You are not allowed to view this consultation",
      403,
      "FORBIDDEN",
    );
  }

  res.json(toConsultationDto(consultation));
});

export const updateConsultationStatus = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body as UpdateStatusInput;

  const consultation = await prisma.consultation.findUnique({ where: { id } });
  if (!consultation) {
    throw new AppError("Consultation not found", 404, "CONSULTATION_NOT_FOUND");
  }

  if (consultation.doctorId !== req.user!.userId) {
    throw new AppError(
      "Only the assigned doctor can change the status",
      403,
      "FORBIDDEN",
    );
  }

  assertTransition(consultation.status, status);

  const updated = await prisma.consultation.update({
    where: { id },
    data: { status },
    include: consultationInclude,
  });

  res.json(toConsultationDto(updated));
});
