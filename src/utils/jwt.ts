import jwt, { type SignOptions } from "jsonwebtoken";
import type { Role } from "@prisma/client";

export type JwtPayload = {
  userId: number;
  role: Role;
};

const ISSUER = "doctor-consultation";
const AUDIENCE = "doctor-consultation-app";

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }
  return secret;
};

export const generateToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: "1d",
    issuer: ISSUER,
    audience: AUDIENCE,
  };
  return jwt.sign(payload, getSecret(), options);
};

export const verifyToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, getSecret(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  return decoded as JwtPayload;
};
