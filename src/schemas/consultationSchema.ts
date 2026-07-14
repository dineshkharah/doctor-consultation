import { z } from "zod";

export const createConsultationSchema = z.object({
  doctorId: z.coerce.number().int().positive(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "COMPLETED"]),
});

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
