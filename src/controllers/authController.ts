import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { AppError } from "../utils/AppError";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";
import type { RegisterInput, LoginInput } from "../schemas/authSchema";

const publicUser = (user: {
  id: number;
  name: string;
  email: string;
  role: "PATIENT" | "DOCTOR";
}) => ({ id: user.id, name: user.name, email: user.email, role: user.role });

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, specialization, yearsExperience } =
    req.body as RegisterInput;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("Email already in use", 409, "EMAIL_TAKEN");
  }

  const passwordHash = await hashPassword(password);

  const data: Prisma.UserCreateInput = { name, email, passwordHash, role };

  // For doctors, create the User and the DoctorProfile together.
  if (role === "DOCTOR") {
    data.doctorProfile = {
      create: {
        specialization: specialization!,
        yearsExperience: yearsExperience!,
      },
    };
  }

  const user = await prisma.user.create({ data });
  const token = generateToken({ userId: user.id, role: user.role });

  res.status(201).json({ user: publicUser(user), token });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const passwordOk = await comparePassword(password, user.passwordHash);
  if (!passwordOk) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const token = generateToken({ userId: user.id, role: user.role });
  res.json({ user: publicUser(user), token });
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { doctorProfile: true },
  });

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  const { passwordHash, ...safeUser } = user;
  res.json(safeUser);
});
