import type { JwtUserPayload } from "@/domains/auth/auth.types";
import { AuthService } from "@/domains/auth/auth.service";
import { ActivityLogService } from "@/domains/activity-logs/activity-log.service";
import { CommissionService } from "@/domains/commissions/commission.service";
import { LeadRepository } from "@/domains/leads/lead.repository";
import { toPublicLead } from "@/domains/leads/lead.mapper";
import {
  COLOR,
  DOSSIER_STATUS,
  LEAD_STATUS,
  PRODUCT,
  SECTOR,
  SOURCE_TYPE,
  SURFACE_RANGE,
  type Color,
  type DossierStatus,
  type Product,
  type Sector,
  type SourceType,
  type SurfaceRange,
} from "@/domains/shared/business";
import {
  canAccessAgentScope,
  isAgent,
  isSalesManager,
  isSupervisor,
} from "@/domains/shared/auth";
import { AppError } from "@/domains/shared/app-error";
import { toPublicDossier } from "./dossier.mapper";
import { DossierRepository } from "./dossier.repository";
import type {
  ConvertLeadToDossierInput,
  CreateDossierInput,
  DossierDocument,
  ChangeDossierStatusInput,
  ListDossiersFilter,
  PublicDossier,
  UpdateDossierInput,
} from "./dossier.types";

const MAX_LIMIT = 200;
const validDossierStatuses = new Set<DossierStatus>(
  Object.values(DOSSIER_STATUS),
);
const validProducts = new Set<Product>(Object.values(PRODUCT));
const validColors = new Set<Color>(Object.values(COLOR));
const validSectors = new Set<Sector>(Object.values(SECTOR));
const validSurfaceRanges = new Set<SurfaceRange>(Object.values(SURFACE_RANGE));
const validSourceTypes = new Set<SourceType>(Object.values(SOURCE_TYPE));
const allowedStatusTransitions: Partial<Record<DossierStatus, DossierStatus[]>> = {
  [DOSSIER_STATUS.NOUVEAU]: [
    DOSSIER_STATUS.QUALIFIE,
    DOSSIER_STATUS.RDV_PLANIFIE,
    DOSSIER_STATUS.PERDU,
    DOSSIER_STATUS.ANNULE,
  ],
  [DOSSIER_STATUS.QUALIFIE]: [
    DOSSIER_STATUS.RDV_PLANIFIE,
    DOSSIER_STATUS.PERDU,
    DOSSIER_STATUS.ANNULE,
  ],
  [DOSSIER_STATUS.RDV_PLANIFIE]: [
    DOSSIER_STATUS.DEVIS_ENVOYE,
    DOSSIER_STATUS.PERDU,
    DOSSIER_STATUS.ANNULE,
  ],
  [DOSSIER_STATUS.DEVIS_ENVOYE]: [
    DOSSIER_STATUS.SIGNE_ACOMPTE_A_VALIDER,
    DOSSIER_STATUS.PERDU,
    DOSSIER_STATUS.ANNULE,
  ],
  [DOSSIER_STATUS.SIGNE_ACOMPTE_A_VALIDER]: [
    DOSSIER_STATUS.ACOMPTE_VALIDE,
    DOSSIER_STATUS.ANNULE,
  ],
  [DOSSIER_STATUS.ACOMPTE_VALIDE]: [
    DOSSIER_STATUS.DEPOT_MPR,
    DOSSIER_STATUS.ANNULE,
  ],
  [DOSSIER_STATUS.DEPOT_MPR]: [
    DOSSIER_STATUS.POSE_SOLDE_A_VALIDER,
    DOSSIER_STATUS.ANNULE,
  ],
  [DOSSIER_STATUS.POSE_SOLDE_A_VALIDER]: [
    DOSSIER_STATUS.SOLDE_VALIDE,
    DOSSIER_STATUS.ANNULE,
  ],
  [DOSSIER_STATUS.SOLDE_VALIDE]: [DOSSIER_STATUS.ARCHIVE],
};

export class DossierService {
  constructor(
    private readonly repository = new DossierRepository(),
    private readonly leadRepository = new LeadRepository(),
    private readonly authService = new AuthService(),
    private readonly activityLogService = new ActivityLogService(),
    private readonly commissionService = new CommissionService(),
  ) {}

  async create(
    input: CreateDossierInput,
    actor: JwtUserPayload,
  ): Promise<PublicDossier> {
    const data = validateCreateDossierInput(input);
    await this.ensureCanAccessAgent(actor, data.assigned_agent_id);

    const now = new Date();
    const dossier = await this.repository.create({
      ...data,
      lead_id: data.lead_id,
      client_id: data.client_id,
      createdAt: now,
      updatedAt: now,
    });

    await this.log(actor, "DOSSIER_CREATED", dossier._id?.toString() ?? "", null, dossier);
    return toPublicDossier(dossier);
  }

  async list(
    actor: JwtUserPayload,
    filter: ListDossiersFilter,
  ): Promise<PublicDossier[]> {
    const scopedFilter = await this.applyReadScope(actor, validateListFilter(filter));
    const dossiers = await this.repository.find(scopedFilter);
    return dossiers.map(toPublicDossier);
  }

  async getById(id: string, actor: JwtUserPayload): Promise<PublicDossier> {
    const dossier = await this.getDossierOrFail(id);
    await this.ensureCanReadDossier(actor, dossier);
    return toPublicDossier(dossier);
  }

  async update(
    id: string,
    input: UpdateDossierInput,
    actor: JwtUserPayload,
  ): Promise<PublicDossier> {
    const existingDossier = await this.getDossierOrFail(id);
    await this.ensureCanReadDossier(actor, existingDossier);
    const updates = validateUpdateDossierInput(input, actor);

    if (updates.assigned_agent_id) {
      await this.ensureCanAccessAgent(actor, updates.assigned_agent_id);
    }

    const updatedDossier = await this.repository.updateById(id, updates);

    if (!updatedDossier) {
      throw new AppError("Dossier not found.", 404);
    }

    await this.log(actor, "DOSSIER_UPDATED", id, existingDossier, updatedDossier);
    return toPublicDossier(updatedDossier);
  }

  async changeStatus(
    id: string,
    input: ChangeDossierStatusInput,
    actor: JwtUserPayload,
  ): Promise<PublicDossier> {
    const existingDossier = await this.getDossierOrFail(id);
    await this.ensureCanReadDossier(actor, existingDossier);
    const nextStatus = validateStatus(input.status);

    if (nextStatus === existingDossier.status) {
      return toPublicDossier(existingDossier);
    }

    assertAllowedTransition(existingDossier.status, nextStatus);

    if (nextStatus === DOSSIER_STATUS.SIGNE_ACOMPTE_A_VALIDER) {
      await this.commissionService.ensureRuleAvailableForDossier(
        existingDossier,
        actor,
      );
    }

    const dateUpdates = buildStatusDateUpdates(nextStatus);
    const updatedDossier = await this.repository.updateById(id, {
      status: nextStatus,
      ...dateUpdates,
    });

    if (!updatedDossier) {
      throw new AppError("Dossier not found.", 404);
    }

    await this.log(
      actor,
      "DOSSIER_STATUS_CHANGED",
      id,
      { status: existingDossier.status },
      { status: updatedDossier.status },
    );

    if (nextStatus === DOSSIER_STATUS.SIGNE_ACOMPTE_A_VALIDER) {
      await this.commissionService.ensureCalculatedForDossier(updatedDossier, actor);
    }

    return toPublicDossier(updatedDossier);
  }

  async convertLead(
    leadId: string,
    input: ConvertLeadToDossierInput,
    actor: JwtUserPayload,
  ): Promise<PublicDossier> {
    const lead = await this.leadRepository.findById(leadId);

    if (!lead) {
      throw new AppError("Lead not found.", 404);
    }

    await this.ensureCanAccessAgent(actor, lead.assigned_agent_id);

    if (lead.converted_dossier_id) {
      throw new AppError("Ce lead est deja converti en dossier.", 409);
    }

    if (lead.status !== LEAD_STATUS.QUALIFIE && lead.status !== LEAD_STATUS.NOUVEAU) {
      throw new AppError("Seul un lead nouveau ou qualifie peut etre converti.", 400);
    }

    const product = validateProduct(input.product || lead.desired_product);
    const sector = validateSector(input.sector || lead.sector);
    const color = validateColor(input.color);
    const surfaceRange = validateSurfaceRange(input.surface_range);

    const now = new Date();
    const dossier = await this.repository.create({
      lead_id: leadId,
      client_id: leadId,
      assigned_agent_id: lead.assigned_agent_id,
      product,
      color,
      sector,
      surface_range: surfaceRange,
      source_type: lead.source,
      status: input.appointment_date
        ? DOSSIER_STATUS.RDV_PLANIFIE
        : DOSSIER_STATUS.NOUVEAU,
      first_contact_date: lead.first_contact_date,
      appointment_date: parseOptionalDate(input.appointment_date, "appointment_date"),
      quote_sent_date: null,
      signature_date: null,
      mpr_deposit_date: null,
      installation_date: null,
      notes: input.notes?.trim() || lead.notes,
      createdAt: now,
      updatedAt: now,
    });

    const dossierId = dossier._id?.toString() ?? "";
    const updatedLead = await this.leadRepository.updateById(leadId, {
      status: LEAD_STATUS.CONVERTI,
      converted_dossier_id: dossierId,
    });

    await this.log(actor, "LEAD_CONVERTED_TO_DOSSIER", dossierId, toPublicLead(lead), {
      dossier: toPublicDossier(dossier),
      lead: updatedLead ? toPublicLead(updatedLead) : null,
    });

    return toPublicDossier(dossier);
  }

  private async getDossierOrFail(id: string): Promise<DossierDocument> {
    const dossier = await this.repository.findById(id);

    if (!dossier) {
      throw new AppError("Dossier not found.", 404);
    }

    return dossier;
  }

  private async ensureCanReadDossier(
    actor: JwtUserPayload,
    dossier: DossierDocument,
  ): Promise<void> {
    await this.ensureCanAccessAgent(actor, dossier.assigned_agent_id);
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
    filter: ListDossiersFilter,
  ): Promise<ListDossiersFilter> {
    if (isSalesManager(actor)) {
      return filter;
    }

    if (isAgent(actor)) {
      return { ...filter, assigned_agent_id: actor.sub, assigned_agent_ids: undefined };
    }

    const users = await this.authService.listUsers();
    const teamAgentIds = users
      .filter(
        (user) =>
          user.role === "agent" && user.department_id === actor.department_id,
      )
      .map((user) => user.id);

    return { ...filter, assigned_agent_ids: teamAgentIds, assigned_agent_id: undefined };
  }

  private async log(
    actor: JwtUserPayload,
    action: string,
    dossierId: string,
    oldValue: unknown,
    newValue: unknown,
  ): Promise<void> {
    await this.activityLogService.create({
      user_id: actor.sub,
      entity_type: "dossier",
      entity_id: dossierId,
      action,
      old_value: oldValue,
      new_value: newValue,
    });
  }
}

function validateCreateDossierInput(
  input: CreateDossierInput,
): Omit<DossierDocument, "_id" | "createdAt" | "updatedAt"> {
  const assignedAgentId = input.assigned_agent_id?.trim();

  if (!assignedAgentId) {
    throw new AppError("assigned_agent_id is required.", 400);
  }

  return {
    lead_id: input.lead_id?.trim() ?? "",
    client_id: input.client_id?.trim() ?? input.lead_id?.trim() ?? "",
    assigned_agent_id: assignedAgentId,
    product: validateProduct(input.product),
    color: validateColor(input.color),
    sector: validateSector(input.sector),
    surface_range: validateSurfaceRange(input.surface_range),
    source_type: validateSourceType(input.source_type),
    status: validateOptionalStatus(input.status) ?? DOSSIER_STATUS.NOUVEAU,
    first_contact_date: parseOptionalDate(
      input.first_contact_date,
      "first_contact_date",
    ),
    appointment_date: parseOptionalDate(input.appointment_date, "appointment_date"),
    quote_sent_date: parseOptionalDate(input.quote_sent_date, "quote_sent_date"),
    signature_date: parseOptionalDate(input.signature_date, "signature_date"),
    mpr_deposit_date: parseOptionalDate(
      input.mpr_deposit_date,
      "mpr_deposit_date",
    ),
    installation_date: parseOptionalDate(
      input.installation_date,
      "installation_date",
    ),
    notes: input.notes?.trim() ?? "",
  };
}

function validateUpdateDossierInput(
  input: UpdateDossierInput,
  actor: JwtUserPayload,
): Partial<Omit<DossierDocument, "_id" | "createdAt">> {
  const updates: Partial<Omit<DossierDocument, "_id" | "createdAt">> = {};

  if (input.assigned_agent_id !== undefined) {
    if (isAgent(actor)) {
      throw new AppError("Vous ne pouvez pas reassigner un dossier.", 403);
    }

    updates.assigned_agent_id = requireNonEmpty(
      input.assigned_agent_id,
      "assigned_agent_id",
    );
  }

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

  if (input.status !== undefined) {
    updates.status = validateOptionalStatus(input.status);
  }

  if (input.appointment_date !== undefined) {
    updates.appointment_date = parseOptionalDate(
      input.appointment_date,
      "appointment_date",
    );
  }

  if (input.quote_sent_date !== undefined) {
    updates.quote_sent_date = parseOptionalDate(
      input.quote_sent_date,
      "quote_sent_date",
    );
  }

  if (input.signature_date !== undefined) {
    updates.signature_date = parseOptionalDate(
      input.signature_date,
      "signature_date",
    );
  }

  if (input.mpr_deposit_date !== undefined) {
    updates.mpr_deposit_date = parseOptionalDate(
      input.mpr_deposit_date,
      "mpr_deposit_date",
    );
  }

  if (input.installation_date !== undefined) {
    updates.installation_date = parseOptionalDate(
      input.installation_date,
      "installation_date",
    );
  }

  if (input.notes !== undefined) {
    updates.notes = input.notes.trim();
  }

  if (!Object.keys(updates).length) {
    throw new AppError("At least one field is required.", 400);
  }

  return updates;
}

function validateListFilter(filter: ListDossiersFilter): ListDossiersFilter {
  const limit = Number(filter.limit ?? 100);

  return {
    status: validateOptionalStatus(filter.status),
    search: filter.search?.trim() || undefined,
    limit:
      Number.isFinite(limit) && limit > 0
        ? Math.min(Math.trunc(limit), MAX_LIMIT)
        : 100,
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

function validateOptionalStatus(status?: DossierStatus): DossierStatus | undefined {
  if (!status) {
    return undefined;
  }

  if (!validDossierStatuses.has(status)) {
    throw new AppError("Invalid dossier status.", 400);
  }

  return status;
}

function validateStatus(status?: DossierStatus): DossierStatus {
  const validStatus = validateOptionalStatus(status);

  if (!validStatus) {
    throw new AppError("status is required.", 400);
  }

  return validStatus;
}

function assertAllowedTransition(
  currentStatus: DossierStatus,
  nextStatus: DossierStatus,
): void {
  const allowedStatuses = allowedStatusTransitions[currentStatus] ?? [];

  if (!allowedStatuses.includes(nextStatus)) {
    throw new AppError(
      `Transition dossier non autorisee: ${currentStatus} -> ${nextStatus}.`,
      400,
    );
  }
}

function buildStatusDateUpdates(
  status: DossierStatus,
): Partial<
  Pick<
    DossierDocument,
    | "appointment_date"
    | "quote_sent_date"
    | "signature_date"
    | "mpr_deposit_date"
    | "installation_date"
  >
> {
  const now = new Date();

  if (status === DOSSIER_STATUS.RDV_PLANIFIE) {
    return { appointment_date: now };
  }

  if (status === DOSSIER_STATUS.DEVIS_ENVOYE) {
    return { quote_sent_date: now };
  }

  if (status === DOSSIER_STATUS.SIGNE_ACOMPTE_A_VALIDER) {
    return { signature_date: now };
  }

  if (status === DOSSIER_STATUS.DEPOT_MPR) {
    return { mpr_deposit_date: now };
  }

  if (status === DOSSIER_STATUS.POSE_SOLDE_A_VALIDER) {
    return { installation_date: now };
  }

  return {};
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

function requireNonEmpty(value: string, field: string): string {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    throw new AppError(`${field} is required.`, 400);
  }

  return trimmedValue;
}
