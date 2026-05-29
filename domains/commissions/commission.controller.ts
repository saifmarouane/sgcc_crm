import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/domains/shared/auth";
import { handleHttpError } from "@/domains/shared/http";
import { CommissionService } from "./commission.service";

const commissionService = new CommissionService();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function listCommissions(request: NextRequest) {
  try {
    const actor = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const commissions = await commissionService.list(actor, {
      dossier_id: searchParams.get("dossier_id") ?? undefined,
      global_status: searchParams.get("global_status") as never,
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
    });

    return NextResponse.json({ commissions });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function getCommission(request: NextRequest, context: RouteContext) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const commission = await commissionService.getById(id, actor);
    return NextResponse.json({ commission });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function calculateDossierCommission(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const commission = await commissionService.calculateForDossier(id, actor);
    return NextResponse.json({ commission }, { status: 201 });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function validateCommissionDeposit(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const commission = await commissionService.validateDeposit(id, actor);
    return NextResponse.json({ commission });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function validateCommissionBalance(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const commission = await commissionService.validateBalance(id, actor);
    return NextResponse.json({ commission });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function markCommissionDepositPaid(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const commission = await commissionService.markDepositPaid(id, actor);
    return NextResponse.json({ commission });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function markCommissionBalancePaid(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const actor = requireAuth(request);
    const { id } = await context.params;
    const commission = await commissionService.markBalancePaid(id, actor);
    return NextResponse.json({ commission });
  } catch (error) {
    return handleHttpError(error);
  }
}
