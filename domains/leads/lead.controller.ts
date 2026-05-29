import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/domains/shared/auth";
import { handleHttpError } from "@/domains/shared/http";
import { LeadService } from "./lead.service";

const leadService = new LeadService();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function createLead(request: NextRequest) {
  try {
    const actor = requireAuth(request);
    const body = await request.json();
    const lead = await leadService.create(body, actor);
    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function listLeads(request: NextRequest) {
  try {
    const actor = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const leads = await leadService.list(actor, {
      status: searchParams.get("status") as never,
      search: searchParams.get("search") ?? undefined,
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
    });

    return NextResponse.json({ leads });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function getLead(request: NextRequest, context: RouteContext) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const lead = await leadService.getById(id, actor);
    return NextResponse.json({ lead });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function updateLead(request: NextRequest, context: RouteContext) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const lead = await leadService.update(id, body, actor);
    return NextResponse.json({ lead });
  } catch (error) {
    return handleHttpError(error);
  }
}

