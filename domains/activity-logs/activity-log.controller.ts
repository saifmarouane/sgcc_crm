import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/domains/shared/auth";
import { handleHttpError } from "@/domains/shared/http";
import { ActivityLogService } from "./activity-log.service";

const activityLogService = new ActivityLogService();

export async function listActivityLogs(request: NextRequest) {
  try {
    requireRole(request, "admin");
    const { searchParams } = new URL(request.url);
    const logs = await activityLogService.list({
      entity_type: searchParams.get("entity_type") ?? undefined,
      entity_id: searchParams.get("entity_id") ?? undefined,
      user_id: searchParams.get("user_id") ?? undefined,
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
    });

    return NextResponse.json({ activity_logs: logs });
  } catch (error) {
    return handleHttpError(error);
  }
}

