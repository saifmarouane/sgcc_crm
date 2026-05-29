import { NextResponse, type NextRequest } from "next/server";
import { handleHttpError } from "@/domains/shared/http";
import { requireRole } from "@/domains/shared/auth";
import { ScoreService } from "./score.service";

const scoreService = new ScoreService();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function createScore(request: NextRequest) {
  try {
    requireRole(request, "admin");
    const body = await request.json();
    const score = await scoreService.create(body);
    return NextResponse.json({ score }, { status: 201 });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function listScores(request: NextRequest) {
  try {
    requireRole(request, "admin");
    const scores = await scoreService.list();
    return NextResponse.json({ scores });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function getScore(_request: NextRequest, context: RouteContext) {
  try {
    requireRole(_request, "admin");
    const { id } = await context.params;
    const score = await scoreService.getById(id);
    return NextResponse.json({ score });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function updateScore(request: NextRequest, context: RouteContext) {
  try {
    requireRole(request, "admin");
    const { id } = await context.params;
    const body = await request.json();
    const score = await scoreService.update(id, body);
    return NextResponse.json({ score });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function deleteScore(_request: NextRequest, context: RouteContext) {
  try {
    requireRole(_request, "admin");
    const { id } = await context.params;
    await scoreService.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleHttpError(error);
  }
}
