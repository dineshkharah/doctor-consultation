import type { Status } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

// The strict linear state machine: PENDING then ACTIVE then COMPLETED.
const NEXT_STATUS: Record<Status, Status[]> = {
  PENDING: ["ACTIVE"],
  ACTIVE: ["COMPLETED"],
  COMPLETED: [],
};

export const assertTransition = (current: Status, next: Status) => {
  if (!NEXT_STATUS[current].includes(next)) {
    throw new AppError(
      `Cannot change status from ${current} to ${next}`,
      400,
      "INVALID_STATUS_TRANSITION",
    );
  }
};

// A patient may not hold more than one open (PENDING or ACTIVE) consultation with the same doctor.
export const assertNoOpenDuplicate = async (
  patientId: number,
  doctorId: number,
) => {
  const existing = await prisma.consultation.findFirst({
    where: {
      patientId,
      doctorId,
      status: { in: ["PENDING", "ACTIVE"] },
    },
  });

  if (existing) {
    throw new AppError(
      "You already have an open consultation with this doctor",
      409,
      "DUPLICATE_CONSULTATION",
    );
  }
};

// Loads a consultation and confirms the caller is one of its two parties.
export const findConsultationForParty = async (id: number, userId: number) => {
  const consultation = await prisma.consultation.findUnique({ where: { id } });

  if (!consultation) {
    throw new AppError("Consultation not found", 404, "CONSULTATION_NOT_FOUND");
  }

  if (consultation.patientId !== userId && consultation.doctorId !== userId) {
    throw new AppError(
      "You are not allowed to view this consultation",
      403,
      "FORBIDDEN",
    );
  }

  return consultation;
};

// Messages may only be sent while the consultation is ACTIVE.
export const assertActiveForMessaging = (status: Status) => {
  if (status !== "ACTIVE") {
    throw new AppError(
      "Messages can only be sent while the consultation is active",
      409,
      "CONSULTATION_NOT_ACTIVE",
    );
  }
};
