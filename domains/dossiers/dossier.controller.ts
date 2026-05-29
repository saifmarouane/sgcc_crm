import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/domains/shared/auth";
import { handleHttpError } from "@/domains/shared/http";
import { DossierService } from "./dossier.service";

const dossierService = new DossierService();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function createDossier(request: NextRequest) {
  try {
    const actor = requireAuth(request);
    const body = await request.json();
    const dossier = await dossierService.create(body, actor);
    return NextResponse.json({ dossier }, { status: 201 });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function listDossiers(request: NextRequest) {
  try {
    const actor = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const dossiers = await dossierService.list(actor, {
      status: searchParams.get("status") as never,
      search: searchParams.get("search") ?? undefined,
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
    });

    return NextResponse.json({ dossiers });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function getDossier(request: NextRequest, context: RouteContext) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const dossier = await dossierService.getById(id, actor);
    return NextResponse.json({ dossier });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function updateDossier(request: NextRequest, context: RouteContext) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const dossier = await dossierService.update(id, body, actor);
    return NextResponse.json({ dossier });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function changeDossierStatus(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const dossier = await dossierService.changeStatus(id, body, actor);
    return NextResponse.json({ dossier });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function convertLeadToDossier(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const dossier = await dossierService.convertLead(id, body, actor);
    return NextResponse.json({ dossier }, { status: 201 });
  } catch (error) {
    return handleHttpError(error);
  }
}
