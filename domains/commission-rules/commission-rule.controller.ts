import { NextResponse, type NextRequest } from "next/server";
import { requireAnyRole, requireRole } from "@/domains/shared/auth";
import { handleHttpError } from "@/domains/shared/http";
import { CommissionRuleService } from "./commission-rule.service";

const commissionRuleService = new CommissionRuleService();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function createCommissionRule(request: NextRequest) {
  try {
    const actor = requireRole(request, "admin");
    const body = await request.json();
    const commission_rule = await commissionRuleService.create(body, actor);
    return NextResponse.json({ commission_rule }, { status: 201 });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function listCommissionRules(request: NextRequest) {
  try {
    requireAnyRole(request, ["admin", "manager"]);
    const { searchParams } = new URL(request.url);
    const activeParam = searchParams.get("is_active");
    const commission_rules = await commissionRuleService.list({
      is_active:
        activeParam === null ? undefined : activeParam === "true",
      product: searchParams.get("product") as never,
      color: searchParams.get("color") as never,
      sector: searchParams.get("sector") as never,
      surface_range: searchParams.get("surface_range") as never,
      source_type: searchParams.get("source_type") as never,
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
    });

    return NextResponse.json({ commission_rules });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function updateCommissionRule(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const actor = requireRole(request, "admin");
    const { id } = await context.params;
    const body = await request.json();
    const commission_rule = await commissionRuleService.update(id, body, actor);
    return NextResponse.json({ commission_rule });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function deactivateCommissionRule(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const actor = requireRole(request, "admin");
    const { id } = await context.params;
    const commission_rule = await commissionRuleService.deactivate(id, actor);
    return NextResponse.json({ commission_rule });
  } catch (error) {
    return handleHttpError(error);
  }
}

