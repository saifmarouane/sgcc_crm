import { NextResponse, type NextRequest } from "next/server";
import { AppError } from "./auth.errors";
import { AuthService } from "./auth.service";
import { verifyAuthToken } from "./jwt";

const authService = new AuthService();

export async function register(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await authService.register(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function login(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await authService.login(body);
    return NextResponse.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function me(request: NextRequest) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      throw new AppError("Authorization bearer token is required.", 401);
    }

    const payload = verifyAuthToken(token);
    const user = await authService.getCurrentUser(payload.sub);

    return NextResponse.json({ user });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function updateMe(request: NextRequest) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      throw new AppError("Authorization bearer token is required.", 401);
    }

    const payload = verifyAuthToken(token);
    const body = await request.json();
    const user = await authService.updateUser(payload.sub, {
      name: body.name,
      email: body.email,
      phone: body.phone,
      image: body.image,
      department_id: body.department_id,
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleAuthError(error);
  }
}

export function getBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

function handleAuthError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode },
    );
  }

  if (error instanceof Error && error.name === "JsonWebTokenError") {
    return NextResponse.json({ error: "Invalid token." }, { status: 401 });
  }

  if (error instanceof Error && error.name === "TokenExpiredError") {
    return NextResponse.json({ error: "Token expired." }, { status: 401 });
  }

  const message =
    error instanceof Error ? error.message : "Unexpected authentication error.";

  return NextResponse.json({ error: message }, { status: 500 });
}
