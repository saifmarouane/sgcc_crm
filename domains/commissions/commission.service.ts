import type { JwtUserPayload } from "@/domains/auth/auth.types";
import { AuthService } from "@/domains/auth/auth.service";
import { ActivityLogService } from "@/domains/activity-logs/activity-log.service";
import { DossierRepository } from "@/domains/dossiers/dossier.repository";
import type { DossierDocument } from "@/domains/dossiers/dossier.types";
import { CommissionRuleRepository } from "@/domains/commission-rules/commission-rule.repository";
import {
  COMMISSION_STATUS,
  type CommissionStatus,
} from "@/domains/shared/business";
import {
  canAccessAgentScope,
  isAgent,
  isSalesManager,
  isSupervisor,
} from "@/domains/shared/auth";
import { AppError } from "@/domains/shared/app-error";
import { toPublicCommission } from "./commission.mapper";
import { CommissionRepository } from "./commission.repository";
import type {
  CommissionDocument,
  ListCommissionsFilter,
  PublicCommission,
} from "./commission.types";

const MAX_LIMIT = 200;
const validCommissionStatuses = new Set<CommissionStatus>(
  Object.values(COMMISSION_STATUS),
);

export class CommissionService {
  constructor(
    private readonly repository = new CommissionRepository(),
    private readonly dossierRepository = new DossierRepository(),
    private readonly commissionRuleRepository = new CommissionRuleRepository(),
    private readonly authService = new AuthService(),
    private readonly activityLogService = new ActivityLogService(),
  ) {}

  async calculateForDossier(
    dossierId: string,
    actor: JwtUserPayload,
  ): Promise<PublicCommission> {
    const dossier = await this.getDossierOrFail(dossierId);
    await this.ensureCanAccessAgent(actor, dossier.assigned_agent_id);
    const existingCommission = await this.repository.findByDossierId(dossierId);

    if (existingCommission) {
      throw new AppError("Ce dossier est deja commissionne.", 409);
    }

    const rule = await this.commissionRuleRepository.findActiveMatch({
      product: dossier.product,
      color: dossier.color,
      sector: dossier.sector,
      surface_range: dossier.surface_range,
      source_type: dossier.source_type,
    });

    if (!rule) {
      throw new AppError(
        "Aucune regle de commission ne correspond a ce dossier.",
        404,
      );
    }

    const now = new Date();
    const commission = await this.repository.create({
      dossier_id: dossierId,
      agent_id: dossier.assigned_agent_id,
      commission_rule_id: rule._id?.toString() ?? "",
      total_amount: rule.total_amount,
      deposit_amount: rule.deposit_amount,
      balance_amount: rule.balance_amount,
      deposit_status: COMMISSION_STATUS.ACOMPTE_EN_ATTENTE,
      balance_status: COMMISSION_STATUS.SOLDE_EN_ATTENTE,
      global_status: COMMISSION_STATUS.CALCULEE,
      calculated_at: now,
      deposit_validated_at: null,
      balance_validated_at: null,
      deposit_paid_at: null,
      balance_paid_at: null,
      validated_by_id: "",
      createdAt: now,
      updatedAt: now,
    });

    await this.activityLogService.create({
      user_id: actor.sub,
      entity_type: "commission",
      entity_id: commission._id?.toString() ?? "",
      action: "COMMISSION_CALCULATED",
      new_value: toPublicCommission(commission),
    });

    return toPublicCommission(commission);
  }

  async ensureCalculatedForDossier(
    dossier: DossierDocument,
    actor: JwtUserPayload,
  ): Promise<PublicCommission> {
    const dossierId = dossier._id?.toString() ?? "";
    const existingCommission = await this.repository.findByDossierId(dossierId);

    if (existingCommission) {
      return toPublicCommission(existingCommission);
    }

    return this.calculateForDossier(dossierId, actor);
  }

  async ensureRuleAvailableForDossier(
    dossier: DossierDocument,
    actor: JwtUserPayload,
  ): Promise<void> {
    await this.ensureCanAccessAgent(actor, dossier.assigned_agent_id);
    const dossierId = dossier._id?.toString() ?? "";
    const existingCommission = await this.repository.findByDossierId(dossierId);

    if (existingCommission) {
      return;
    }

    const rule = await this.commissionRuleRepository.findActiveMatch({
      product: dossier.product,
      color: dossier.color,
      sector: dossier.sector,
      surface_range: dossier.surface_range,
      source_type: dossier.source_type,
    });

    if (!rule) {
      throw new AppError(
        "Aucune regle de commission ne correspond a ce dossier.",
        404,
      );
    }
  }

  async list(
    actor: JwtUserPayload,
    filter: ListCommissionsFilter,
  ): Promise<PublicCommission[]> {
    const scopedFilter = await this.applyReadScope(actor, validateListFilter(filter));
    const commissions = await this.repository.find(scopedFilter);
    return commissions.map(toPublicCommission);
  }

  async getById(id: string, actor: JwtUserPayload): Promise<PublicCommission> {
    const commission = await this.repository.findById(id);

    if (!commission) {
      throw new AppError("Commission not found.", 404);
    }

    await this.ensureCanAccessAgent(actor, commission.agent_id);
    return toPublicCommission(commission);
  }

  async validateDeposit(
    id: string,
    actor: JwtUserPayload,
  ): Promise<PublicCommission> {
    this.requireSalesManager(actor);
    const commission = await this.getCommissionOrFail(id);

    if (commission.deposit_status !== COMMISSION_STATUS.ACOMPTE_EN_ATTENTE) {
      throw new AppError("L'acompte n'est pas en attente de validation.", 400);
    }

    const updatedCommission = await this.updateCommissionOrFail(id, {
      deposit_status: COMMISSION_STATUS.ACOMPTE_VALIDE,
      global_status: COMMISSION_STATUS.ACOMPTE_VALIDE,
      deposit_validated_at: new Date(),
      validated_by_id: actor.sub,
    });

    await this.log(actor, "COMMISSION_DEPOSIT_VALIDATED", id, commission, updatedCommission);
    return toPublicCommission(updatedCommission);
  }

  async validateBalance(
    id: string,
    actor: JwtUserPayload,
  ): Promise<PublicCommission> {
    this.requireSalesManager(actor);
    const commission = await this.getCommissionOrFail(id);

    if (commission.balance_status !== COMMISSION_STATUS.SOLDE_EN_ATTENTE) {
      throw new AppError("Le solde n'est pas en attente de validation.", 400);
    }

    const dossier = await this.getDossierOrFail(commission.dossier_id);

    if (dossier.status !== "POSE_SOLDE_A_VALIDER") {
      throw new AppError("Le solde devient validable uniquement apres la pose.", 400);
    }

    const updatedCommission = await this.updateCommissionOrFail(id, {
      balance_status: COMMISSION_STATUS.SOLDE_VALIDE,
      global_status: COMMISSION_STATUS.SOLDE_VALIDE,
      balance_validated_at: new Date(),
      validated_by_id: actor.sub,
    });

    await this.log(actor, "COMMISSION_BALANCE_VALIDATED", id, commission, updatedCommission);
    return toPublicCommission(updatedCommission);
  }

  async markDepositPaid(
    id: string,
    actor: JwtUserPayload,
  ): Promise<PublicCommission> {
    this.requireSalesManager(actor);
    const commission = await this.getCommissionOrFail(id);

    if (commission.deposit_status !== COMMISSION_STATUS.ACOMPTE_VALIDE) {
      throw new AppError("L'acompte doit etre valide avant paiement.", 400);
    }

    const updatedCommission = await this.updateCommissionOrFail(id, {
      deposit_status: COMMISSION_STATUS.ACOMPTE_PAYE,
      global_status:
        commission.balance_status === COMMISSION_STATUS.SOLDE_PAYE
          ? COMMISSION_STATUS.SOLDEE
          : COMMISSION_STATUS.ACOMPTE_PAYE,
      deposit_paid_at: new Date(),
      validated_by_id: actor.sub,
    });

    await this.log(actor, "COMMISSION_DEPOSIT_PAID", id, commission, updatedCommission);
    return toPublicCommission(updatedCommission);
  }

  async markBalancePaid(
    id: string,
    actor: JwtUserPayload,
  ): Promise<PublicCommission> {
    this.requireSalesManager(actor);
    const commission = await this.getCommissionOrFail(id);

    if (commission.balance_status !== COMMISSION_STATUS.SOLDE_VALIDE) {
      throw new AppError("Le solde doit etre valide avant paiement.", 400);
    }

    const updatedCommission = await this.updateCommissionOrFail(id, {
      balance_status: COMMISSION_STATUS.SOLDE_PAYE,
      global_status:
        commission.deposit_status === COMMISSION_STATUS.ACOMPTE_PAYE
          ? COMMISSION_STATUS.SOLDEE
          : COMMISSION_STATUS.SOLDE_PAYE,
      balance_paid_at: new Date(),
      validated_by_id: actor.sub,
    });

    await this.log(actor, "COMMISSION_BALANCE_PAID", id, commission, updatedCommission);
    return toPublicCommission(updatedCommission);
  }

  private async getDossierOrFail(id: string): Promise<DossierDocument> {
    const dossier = await this.dossierRepository.findById(id);

    if (!dossier) {
      throw new AppError("Dossier not found.", 404);
    }

    return dossier;
  }

  private async getCommissionOrFail(id: string): Promise<CommissionDocument> {
    const commission = await this.repository.findById(id);

    if (!commission) {
      throw new AppError("Commission not found.", 404);
    }

    return commission;
  }

  private async updateCommissionOrFail(
    id: string,
    updates: Partial<Omit<CommissionDocument, "_id" | "createdAt">>,
  ): Promise<CommissionDocument> {
    const commission = await this.repository.updateById(id, updates);

    if (!commission) {
      throw new AppError("Commission not found.", 404);
    }

    return commission;
  }

  private requireSalesManager(actor: JwtUserPayload): void {
    if (!isSalesManager(actor)) {
      throw new AppError("Vous n'avez pas les droits necessaires.", 403);
    }
  }

  private async ensureCanAccessAgent(
    actor: JwtUserPayload,
    agentId: string,
  ): Promise<void> {
    if (isSalesManager(actor)) {
      return;
    }

    if (isAgent(actor)) {
      if (agentId === actor.sub) {
        return;
      }

      throw new AppError("Vous n'avez pas les droits necessaires.", 403);
    }

    if (isSupervisor(actor)) {
      const agent = await this.authService.getCurrentUser(agentId);

      if (canAccessAgentScope(actor, agentId, agent.department_id)) {
        return;
      }
    }

    throw new AppError("Vous n'avez pas les droits necessaires.", 403);
  }

  private async applyReadScope(
    actor: JwtUserPayload,
    filter: ListCommissionsFilter,
  ): Promise<ListCommissionsFilter> {
    if (isSalesManager(actor)) {
      return filter;
    }

    if (isAgent(actor)) {
      return { ...filter, agent_id: actor.sub, agent_ids: undefined };
    }

    const users = await this.authService.listUsers();
    const teamAgentIds = users
      .filter(
        (user) =>
          user.role === "agent" && user.department_id === actor.department_id,
      )
      .map((user) => user.id);

    return { ...filter, agent_ids: teamAgentIds, agent_id: undefined };
  }

  private async log(
    actor: JwtUserPayload,
    action: string,
    commissionId: string,
    oldValue: unknown,
    newValue: unknown,
  ): Promise<void> {
    await this.activityLogService.create({
      user_id: actor.sub,
      entity_type: "commission",
      entity_id: commissionId,
      action,
      old_value: oldValue,
      new_value: newValue,
    });
  }
}

function validateListFilter(filter: ListCommissionsFilter): ListCommissionsFilter {
  const limit = Number(filter.limit ?? 100);

  return {
    dossier_id: filter.dossier_id?.trim() || undefined,
    global_status: validateOptionalStatus(filter.global_status),
    limit:
      Number.isFinite(limit) && limit > 0
        ? Math.min(Math.trunc(limit), MAX_LIMIT)
        : 100,
  };
}

function validateOptionalStatus(
  status?: CommissionStatus,
): CommissionStatus | undefined {
  if (!status) {
    return undefined;
  }

  if (!validCommissionStatuses.has(status)) {
    throw new AppError("Invalid commission status.", 400);
  }

  return status;
}
