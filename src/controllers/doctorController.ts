import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { AppError } from "../utils/AppError";

type DoctorWithProfile = Prisma.UserGetPayload<{
  include: { doctorProfile: true };
}>;

const toDoctorDto = (user: DoctorWithProfile) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  specialization: user.doctorProfile?.specialization ?? null,
  yearsExperience: user.doctorProfile?.yearsExperience ?? null,
});

export const getDoctors = asyncHandler(async (_req, res) => {
  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
    include: { doctorProfile: true },
    orderBy: { id: "asc" },
  });

  res.json(doctors.map(toDoctorDto));
});

export const getDoctorById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const doctor = await prisma.user.findFirst({
    where: { id, role: "DOCTOR" },
    include: { doctorProfile: true },
  });

  if (!doctor) {
    throw new AppError("Doctor not found", 404, "DOCTOR_NOT_FOUND");
  }

  res.json(toDoctorDto(doctor));
});
