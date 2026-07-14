import { z } from "zod";

// Register
export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["PATIENT", "DOCTOR"]),
    specialization: z.string().min(2).optional(),
    yearsExperience: z.number().int().min(0).optional(),
  })
  .refine(
    (data) =>
      data.role !== "DOCTOR" ||
      (data.specialization !== undefined && data.yearsExperience !== undefined),
    {
      message: "Doctors must provide specialization and yearsExperience",
      path: ["role"],
    },
  );

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
