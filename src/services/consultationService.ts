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
