import { NextResponse, type NextRequest } from "next/server";
import { handleHttpError } from "@/domains/shared/http";
import { requireAuth, requireRole } from "@/domains/shared/auth";
import { DepartmentService } from "./department.service";

const departmentService = new DepartmentService();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function createDepartment(request: NextRequest) {
  try {
    requireRole(request, "admin");
    const body = await request.json();
    const department = await departmentService.create(body);
    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function listDepartments(request: NextRequest) {
  try {
    requireAuth(request);
    const departments = await departmentService.list();
    return NextResponse.json({ departments });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function getDepartment(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    requireAuth(_request);
    const { id } = await context.params;
    const department = await departmentService.getById(id);
    return NextResponse.json({ department });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function updateDepartment(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    requireRole(request, "admin");
    const { id } = await context.params;
    const body = await request.json();
    const department = await departmentService.update(id, body);
    return NextResponse.json({ department });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function deleteDepartment(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    requireRole(_request, "admin");
    const { id } = await context.params;
    await departmentService.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleHttpError(error);
  }
}
