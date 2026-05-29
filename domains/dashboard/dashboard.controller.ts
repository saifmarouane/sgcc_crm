import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/domains/shared/auth";
import { handleHttpError } from "@/domains/shared/http";
import { DashboardService } from "./dashboard.service";

const dashboardService = new DashboardService();

export async function getDashboard(request: NextRequest) {
  try {
    const actor = requireAuth(request);
    const dashboard = await dashboardService.getOverview(actor);
    return NextResponse.json({ dashboard });
  } catch (error) {
    return handleHttpError(error);
  }
}

