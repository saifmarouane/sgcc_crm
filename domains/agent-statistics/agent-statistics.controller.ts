import { NextResponse } from "next/server";
import { handleHttpError } from "@/domains/shared/http";
import { AgentStatisticsService } from "./agent-statistics.service";

const agentStatisticsService = new AgentStatisticsService();

export async function getAgentStatistics() {
  try {
    const statistics = await agentStatisticsService.getOverview();
    return NextResponse.json(statistics);
  } catch (error) {
    return handleHttpError(error);
  }
}
