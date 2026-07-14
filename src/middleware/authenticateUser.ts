import type { RequestHandler } from "express";
import { verifyToken, type JwtPayload } from "../utils/jwt";
import { AppError } from "../utils/AppError";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateUser: RequestHandler = (req, _res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    throw new AppError("No token, authorization denied", 401, "NO_TOKEN");
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    throw new AppError("Token is not valid", 401, "INVALID_TOKEN");
  }
};
