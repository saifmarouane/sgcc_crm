import type { NextRequest } from "next/server";
import { verifyAuthToken } from "@/domains/auth/jwt";
import type { JwtUserPayload, UserRole } from "@/domains/auth/auth.types";
import { AppError } from "./app-error";

export function getBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

export function requireAuth(request: NextRequest): JwtUserPayload {
  const token = getBearerToken(request);

  if (!token) {
    throw new AppError("Authorization bearer token is required.", 401);
  }

  return verifyAuthToken(token);
}

export function requireRole(
  request: NextRequest,
  role: UserRole,
): JwtUserPayload {
  const payload = requireAuth(request);

  if (payload.role !== role) {
    throw new AppError("Forbidden.", 403);
  }

  return payload;
}
