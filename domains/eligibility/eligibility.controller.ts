import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/domains/shared/auth";
import { handleHttpError } from "@/domains/shared/http";
import { EligibilityService } from "./eligibility.service";

const eligibilityService = new EligibilityService();

type LeadRouteContext = {
  params: Promise<{ id: string; documentId?: string }>;
};

export async function saveEligibility(
  request: NextRequest,
  context: LeadRouteContext,
) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const eligibility = await eligibilityService.saveEligibility(id, body, actor);
    return NextResponse.json({
      success: true,
      prospect_id: id,
      eligibility_status: eligibility.eligibility_status,
      non_eligibility_reasons: eligibility.non_eligibility_reasons,
      eligible_products: eligibility.eligible_products,
      required_documents: eligibility.required_documents,
      eligibility,
    });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function getEligibility(
  request: NextRequest,
  context: LeadRouteContext,
) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const eligibility = await eligibilityService.getEligibility(id, actor);
    return NextResponse.json({ eligibility });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function createDocument(
  request: NextRequest,
  context: LeadRouteContext,
) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const document = await eligibilityService.createDocument(id, body, actor);
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function listDocuments(
  request: NextRequest,
  context: LeadRouteContext,
) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const documents = await eligibilityService.listDocuments(id, actor);
    return NextResponse.json({ documents });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function deleteDocument(
  request: NextRequest,
  context: LeadRouteContext,
) {
  try {
    const actor = requireAuth(request);
    const { id, documentId } = await context.params;
    await eligibilityService.deleteDocument(id, documentId ?? "", actor);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function createNote(
  request: NextRequest,
  context: LeadRouteContext,
) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const note = await eligibilityService.createNote(id, body, actor);
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function listNotes(
  request: NextRequest,
  context: LeadRouteContext,
) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const notes = await eligibilityService.listNotes(id, actor);
    return NextResponse.json({ notes });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function createAppointment(
  request: NextRequest,
  context: LeadRouteContext,
) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const appointment = await eligibilityService.createAppointment(id, body, actor);
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function listLeadAppointments(
  request: NextRequest,
  context: LeadRouteContext,
) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const appointments = await eligibilityService.listLeadAppointments(id, actor);
    return NextResponse.json({ appointments });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function listAppointments(request: NextRequest) {
  try {
    const actor = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const appointments = await eligibilityService.listAppointments(actor, {
      assigned_agent_id: searchParams.get("agent") ?? undefined,
      date_from: parseDateParam(searchParams.get("date_from")),
      date_to: parseDateParam(searchParams.get("date_to")),
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
    });
    return NextResponse.json({ appointments });
  } catch (error) {
    return handleHttpError(error);
  }
}

function parseDateParam(value: string | null): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
