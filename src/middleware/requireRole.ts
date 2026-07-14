import type { RequestHandler } from "express";
import type { Role } from "@prisma/client";
import { AppError } from "../utils/AppError";

export const requireRole =
  (role: Role): RequestHandler =>
  (req, _res, next) => {
    if (req.user?.role !== role) {
      throw new AppError("You are not allowed to do this", 403, "FORBIDDEN");
    }
    next();
  };
