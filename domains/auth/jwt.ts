import jwt, { type SignOptions } from "jsonwebtoken";
import type { JwtUserPayload } from "./auth.types";

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }

  return value;
}

const jwtSecret = requireEnv("JWT_SECRET");
const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? "7d";

export function signAuthToken(payload: JwtUserPayload): string {
  const options: SignOptions = {
    expiresIn: jwtExpiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, jwtSecret, options);
}

export function verifyAuthToken(token: string): JwtUserPayload {
  return jwt.verify(token, jwtSecret) as JwtUserPayload;
}
