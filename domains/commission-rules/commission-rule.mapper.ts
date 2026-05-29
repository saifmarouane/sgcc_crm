import type {
  CommissionRuleDocument,
  PublicCommissionRule,
} from "./commission-rule.types";

export function toPublicCommissionRule(
  rule: CommissionRuleDocument,
): PublicCommissionRule {
  return {
    id: rule._id?.toString() ?? "",
    product: rule.product,
    color: rule.color,
    sector: rule.sector,
    surface_range: rule.surface_range,
    source_type: rule.source_type,
    total_amount: rule.total_amount,
    deposit_amount: rule.deposit_amount,
    balance_amount: rule.balance_amount,
    version: rule.version,
    is_active: rule.is_active,
    starts_at: rule.starts_at?.toISOString() ?? null,
    ends_at: rule.ends_at?.toISOString() ?? null,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}

