import { NextResponse, type NextRequest } from "next/server";
import { handleHttpError } from "@/domains/shared/http";
import { requireAnyRole } from "@/domains/shared/auth";
import { AgentStatisticsService } from "./agent-statistics.service";

const agentStatisticsService = new AgentStatisticsService();

export async function getAgentStatistics(request: NextRequest) {
  try {
    const actor = requireAnyRole(request, ["admin", "manager"]);
    const statistics = await agentStatisticsService.getOverview(actor);
    return NextResponse.json(statistics);
  } catch (error) {
    return handleHttpError(error);
  }
}
