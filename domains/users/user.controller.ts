import { NextResponse, type NextRequest } from "next/server";
import { AuthService } from "@/domains/auth/auth.service";
import { requireRole } from "@/domains/shared/auth";
import { handleHttpError } from "@/domains/shared/http";

const authService = new AuthService();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function listUsers(request: NextRequest) {
  try {
    requireRole(request, "admin");
    const users = await authService.listUsers();
    return NextResponse.json({ users });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function createUser(request: NextRequest) {
  try {
    requireRole(request, "admin");
    const body = await request.json();
    const result = await authService.register(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function getUser(request: NextRequest, context: RouteContext) {
  try {
    requireRole(request, "admin");
    const { id } = await context.params;
    const user = await authService.getCurrentUser(id);
    return NextResponse.json({ user });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function updateUser(request: NextRequest, context: RouteContext) {
  try {
    requireRole(request, "admin");
    const { id } = await context.params;
    const body = await request.json();
    const user = await authService.updateUser(id, body);
    return NextResponse.json({ user });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function deleteUser(request: NextRequest, context: RouteContext) {
  try {
    requireRole(request, "admin");
    const { id } = await context.params;
    await authService.deleteUser(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleHttpError(error);
  }
}
