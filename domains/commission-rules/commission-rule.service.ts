import type { JwtUserPayload } from "@/domains/auth/auth.types";
import { ActivityLogService } from "@/domains/activity-logs/activity-log.service";
import {
  COLOR,
  PRODUCT,
  SECTOR,
  SOURCE_TYPE,
  SURFACE_RANGE,
  type Color,
  type Product,
  type Sector,
  type SourceType,
  type SurfaceRange,
} from "@/domains/shared/business";
import { AppError } from "@/domains/shared/app-error";
import { toPublicCommissionRule } from "./commission-rule.mapper";
import { CommissionRuleRepository } from "./commission-rule.repository";
import type {
  CommissionRuleDocument,
  CreateCommissionRuleInput,
  ListCommissionRulesFilter,
  PublicCommissionRule,
  UpdateCommissionRuleInput,
} from "./commission-rule.types";

const MAX_LIMIT = 300;
const validProducts = new Set<Product>(Object.values(PRODUCT));
const validColors = new Set<Color>(Object.values(COLOR));
const validSectors = new Set<Sector>(Object.values(SECTOR));
const validSurfaceRanges = new Set<SurfaceRange>(Object.values(SURFACE_RANGE));
const validSourceTypes = new Set<SourceType>(Object.values(SOURCE_TYPE));

export class CommissionRuleService {
  constructor(
    private readonly repository = new CommissionRuleRepository(),
    private readonly activityLogService = new ActivityLogService(),
  ) {}

  async create(
    input: CreateCommissionRuleInput,
    actor: JwtUserPayload,
  ): Promise<PublicCommissionRule> {
    const data = validateCreateCommissionRule(input);

    if (data.is_active) {
      await this.ensureNoActiveDuplicate(data);
    }

    const now = new Date();
    const rule = await this.repository.create({
      ...data,
      createdAt: now,
      updatedAt: now,
    });

    await this.log(actor, "COMMISSION_RULE_CREATED", rule._id?.toString() ?? "", null, rule);
    return toPublicCommissionRule(rule);
  }

  async list(
    filter: ListCommissionRulesFilter,
  ): Promise<PublicCommissionRule[]> {
    const rules = await this.repository.find(validateListFilter(filter));
    return rules.map(toPublicCommissionRule);
  }

  async update(
    id: string,
    input: UpdateCommissionRuleInput,
    actor: JwtUserPayload,
  ): Promise<PublicCommissionRule> {
    const existingRule = await this.getRuleOrFail(id);
    const updates = validateUpdateCommissionRule(input, existingRule);
    const nextRule = { ...existingRule, ...updates };

    if (nextRule.is_active) {
      await this.ensureNoActiveDuplicate(nextRule, id);
    }

    const updatedRule = await this.repository.updateById(id, updates);

    if (!updatedRule) {
      throw new AppError("Commission rule not found.", 404);
    }

    await this.log(actor, "COMMISSION_RULE_UPDATED", id, existingRule, updatedRule);
    return toPublicCommissionRule(updatedRule);
  }

  async deactivate(id: string, actor: JwtUserPayload): Promise<PublicCommissionRule> {
    const existingRule = await this.getRuleOrFail(id);
    const updatedRule = await this.repository.updateById(id, {
      is_active: false,
      ends_at: existingRule.ends_at ?? new Date(),
    });

    if (!updatedRule) {
      throw new AppError("Commission rule not found.", 404);
    }

    await this.log(
      actor,
      "COMMISSION_RULE_DEACTIVATED",
      id,
      existingRule,
      updatedRule,
    );
    return toPublicCommissionRule(updatedRule);
  }

  private async getRuleOrFail(id: string): Promise<CommissionRuleDocument> {
    const rule = await this.repository.findById(id);

    if (!rule) {
      throw new AppError("Commission rule not found.", 404);
    }

    return rule;
  }

  private async ensureNoActiveDuplicate(
    rule: Pick<
      CommissionRuleDocument,
      "product" | "color" | "sector" | "surface_range" | "source_type"
    >,
    excludedId?: string,
  ): Promise<void> {
    const duplicate = await this.repository.findActiveDuplicate(rule, excludedId);

    if (duplicate) {
      throw new AppError(
        "Une regle active existe deja pour cette combinaison.",
        409,
      );
    }
  }

  private async log(
    actor: JwtUserPayload,
    action: string,
    ruleId: string,
    oldValue: unknown,
    newValue: unknown,
  ): Promise<void> {
    await this.activityLogService.create({
      user_id: actor.sub,
      entity_type: "commission_rule",
      entity_id: ruleId,
      action,
      old_value: oldValue,
      new_value: newValue,
    });
  }
}

function validateCreateCommissionRule(
  input: CreateCommissionRuleInput,
): Omit<CommissionRuleDocument, "_id" | "createdAt" | "updatedAt"> {
  const totalAmount = validateAmount(input.total_amount, "total_amount");
  const depositAmount = validateAmount(input.deposit_amount, "deposit_amount");
  const balanceAmount = validateAmount(input.balance_amount, "balance_amount");

  if (depositAmount + balanceAmount !== totalAmount) {
    throw new AppError(
      "deposit_amount + balance_amount must equal total_amount.",
      400,
    );
  }

  return {
    product: validateProduct(input.product),
    color: validateColor(input.color),
    sector: validateSector(input.sector),
    surface_range: validateSurfaceRange(input.surface_range),
    source_type: validateSourceType(input.source_type),
    total_amount: totalAmount,
    deposit_amount: depositAmount,
    balance_amount: balanceAmount,
    version: validateVersion(input.version),
    is_active: input.is_active ?? true,
    starts_at: parseOptionalDate(input.starts_at, "starts_at"),
    ends_at: parseOptionalDate(input.ends_at, "ends_at"),
  };
}

function validateUpdateCommissionRule(
  input: UpdateCommissionRuleInput,
  existingRule: CommissionRuleDocument,
): Partial<Omit<CommissionRuleDocument, "_id" | "createdAt">> {
  const updates: Partial<Omit<CommissionRuleDocument, "_id" | "createdAt">> = {};

  if (input.product !== undefined) {
    updates.product = validateProduct(input.product);
  }

  if (input.color !== undefined) {
    updates.color = validateColor(input.color);
  }

  if (input.sector !== undefined) {
    updates.sector = validateSector(input.sector);
  }

  if (input.surface_range !== undefined) {
    updates.surface_range = validateSurfaceRange(input.surface_range);
  }

  if (input.source_type !== undefined) {
    updates.source_type = validateSourceType(input.source_type);
  }

  if (input.total_amount !== undefined) {
    updates.total_amount = validateAmount(input.total_amount, "total_amount");
  }

  if (input.deposit_amount !== undefined) {
    updates.deposit_amount = validateAmount(
      input.deposit_amount,
      "deposit_amount",
    );
  }

  if (input.balance_amount !== undefined) {
    updates.balance_amount = validateAmount(
      input.balance_amount,
      "balance_amount",
    );
  }

  if (input.version !== undefined) {
    updates.version = validateVersion(input.version);
  }

  if (input.is_active !== undefined) {
    updates.is_active = Boolean(input.is_active);
  }

  if (input.starts_at !== undefined) {
    updates.starts_at = parseOptionalDate(input.starts_at, "starts_at");
  }

  if (input.ends_at !== undefined) {
    updates.ends_at = parseOptionalDate(input.ends_at, "ends_at");
  }

  const totalAmount = updates.total_amount ?? existingRule.total_amount;
  const depositAmount = updates.deposit_amount ?? existingRule.deposit_amount;
  const balanceAmount = updates.balance_amount ?? existingRule.balance_amount;

  if (depositAmount + balanceAmount !== totalAmount) {
    throw new AppError(
      "deposit_amount + balance_amount must equal total_amount.",
      400,
    );
  }

  if (!Object.keys(updates).length) {
    throw new AppError("At least one field is required.", 400);
  }

  return updates;
}

function validateListFilter(
  filter: ListCommissionRulesFilter,
): ListCommissionRulesFilter {
  const limit = Number(filter.limit ?? 200);

  return {
    is_active: filter.is_active,
    product: filter.product ? validateProduct(filter.product) : undefined,
    color: filter.color ? validateColor(filter.color) : undefined,
    sector: filter.sector ? validateSector(filter.sector) : undefined,
    surface_range: filter.surface_range
      ? validateSurfaceRange(filter.surface_range)
      : undefined,
    source_type: filter.source_type
      ? validateSourceType(filter.source_type)
      : undefined,
    limit:
      Number.isFinite(limit) && limit > 0
        ? Math.min(Math.trunc(limit), MAX_LIMIT)
        : 200,
  };
}

function validateProduct(product?: string): Product {
  if (!product || !validProducts.has(product as Product)) {
    throw new AppError("product is required and must be valid.", 400);
  }

  return product as Product;
}

function validateColor(color?: string): Color {
  if (!color || !validColors.has(color as Color)) {
    throw new AppError("color is required and must be valid.", 400);
  }

  return color as Color;
}

function validateSector(sector?: string): Sector {
  if (!sector || !validSectors.has(sector as Sector)) {
    throw new AppError("sector is required and must be valid.", 400);
  }

  return sector as Sector;
}

function validateSurfaceRange(surfaceRange?: string): SurfaceRange {
  if (!surfaceRange || !validSurfaceRanges.has(surfaceRange as SurfaceRange)) {
    throw new AppError("surface_range is required and must be valid.", 400);
  }

  return surfaceRange as SurfaceRange;
}

function validateSourceType(sourceType?: string): SourceType {
  if (!sourceType || !validSourceTypes.has(sourceType as SourceType)) {
    throw new AppError("source_type is required and must be valid.", 400);
  }

  return sourceType as SourceType;
}

function validateAmount(value: number, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new AppError(`${field} must be a positive number.`, 400);
  }

  return value;
}

function validateVersion(version?: number): number {
  if (version === undefined) {
    return 1;
  }

  if (!Number.isInteger(version) || version < 1) {
    throw new AppError("version must be a positive integer.", 400);
  }

  return version;
}

function parseOptionalDate(value: string | null | undefined, field: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${field} is invalid.`, 400);
  }

  return date;
}

