import { NextResponse, type NextRequest } from "next/server";
import { handleHttpError } from "@/domains/shared/http";
import { requireAnyRole, requireRole } from "@/domains/shared/auth";
import { AppError } from "@/domains/shared/app-error";
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
    const actor = requireAnyRole(request, ["admin", "manager", "agent"]);
    const scope = request.nextUrl.searchParams.get("scope");
    const notifications =
      actor.role === "admin" && scope === "all"
        ? await notificationService.list()
        : await notificationService.listForUser(actor.sub);
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
    const actor = requireAnyRole(_request, ["admin", "manager", "agent"]);
    const { id } = await context.params;
    const notification = await notificationService.getById(id);

    assertCanAccessNotification(actor.sub, actor.role, notification.user_id);

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
    const actor = requireAnyRole(request, ["admin", "manager", "agent"]);
    const { id } = await context.params;
    const existingNotification = await notificationService.getById(id);

    assertCanAccessNotification(
      actor.sub,
      actor.role,
      existingNotification.user_id,
    );

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
    const actor = requireAnyRole(_request, ["admin", "manager", "agent"]);
    const { id } = await context.params;
    const notification = await notificationService.getById(id);

    assertCanAccessNotification(actor.sub, actor.role, notification.user_id);

    await notificationService.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleHttpError(error);
  }
}

function assertCanAccessNotification(
  actorId: string,
  actorRole: string,
  notificationUserId: string,
) {
  if (actorRole === "admin" || actorId === notificationUserId) {
    return;
  }

  throw new AppError("Forbidden.", 403);
}
