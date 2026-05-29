import type { CommissionDocument, PublicCommission } from "./commission.types";

export function toPublicCommission(
  commission: CommissionDocument,
): PublicCommission {
  return {
    id: commission._id?.toString() ?? "",
    dossier_id: commission.dossier_id,
    agent_id: commission.agent_id,
    commission_rule_id: commission.commission_rule_id,
    total_amount: commission.total_amount,
    deposit_amount: commission.deposit_amount,
    balance_amount: commission.balance_amount,
    deposit_status: commission.deposit_status,
    balance_status: commission.balance_status,
    global_status: commission.global_status,
    calculated_at: commission.calculated_at.toISOString(),
    deposit_validated_at: commission.deposit_validated_at?.toISOString() ?? null,
    balance_validated_at: commission.balance_validated_at?.toISOString() ?? null,
    deposit_paid_at: commission.deposit_paid_at?.toISOString() ?? null,
    balance_paid_at: commission.balance_paid_at?.toISOString() ?? null,
    validated_by_id: commission.validated_by_id,
    createdAt: commission.createdAt.toISOString(),
    updatedAt: commission.updatedAt.toISOString(),
  };
}

