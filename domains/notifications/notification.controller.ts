import { NextResponse, type NextRequest } from "next/server";
import { handleHttpError } from "@/domains/shared/http";
import { requireRole } from "@/domains/shared/auth";
import { NotificationService } from "./notification.service";

const notificationService = new NotificationService();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function createNotification(request: NextRequest) {
  try {
    requireRole(request, "admin");
    const body = await request.json();
    const notification = await notificationService.create(body);
    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function listNotifications(request: NextRequest) {
  try {
    requireRole(request, "admin");
    const notifications = await notificationService.list();
    return NextResponse.json({ notifications });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function getNotification(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    requireRole(_request, "admin");
    const { id } = await context.params;
    const notification = await notificationService.getById(id);
    return NextResponse.json({ notification });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function updateNotification(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    requireRole(request, "admin");
    const { id } = await context.params;
    const body = await request.json();
    const notification = await notificationService.update(id, body);
    return NextResponse.json({ notification });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function deleteNotification(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    requireRole(_request, "admin");
    const { id } = await context.params;
    await notificationService.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleHttpError(error);
  }
}
