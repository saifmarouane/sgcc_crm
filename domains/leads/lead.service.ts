import type { JwtUserPayload } from "@/domains/auth/auth.types";
import { AuthService } from "@/domains/auth/auth.service";
import {
  LEAD_STATUS,
  PRODUCT,
  SECTOR,
  SOURCE_TYPE,
  type LeadStatus,
  type Product,
  type Sector,
  type SourceType,
} from "@/domains/shared/business";
import {
  canAccessAgentScope,
  isAgent,
  isSalesManager,
  isSupervisor,
} from "@/domains/shared/auth";
import { AppError } from "@/domains/shared/app-error";
import { ActivityLogService } from "@/domains/activity-logs/activity-log.service";
import { toPublicLead } from "./lead.mapper";
import { LeadRepository } from "./lead.repository";
import type {
  CreateLeadInput,
  LeadDocument,
  ListLeadsFilter,
  PublicLead,
  UpdateLeadInput,
} from "./lead.types";

const MAX_LIMIT = 200;
const validLeadStatuses = new Set<LeadStatus>(Object.values(LEAD_STATUS));
const validSourceTypes = new Set<SourceType>(Object.values(SOURCE_TYPE));
const validProducts = new Set<Product>(Object.values(PRODUCT));
const validSectors = new Set<Sector>(Object.values(SECTOR));

export class LeadService {
  constructor(
    private readonly repository = new LeadRepository(),
    private readonly authService = new AuthService(),
    private readonly activityLogService = new ActivityLogService(),
  ) {}

  async create(
    input: CreateLeadInput,
    actor: JwtUserPayload,
  ): Promise<PublicLead> {
    const data = validateCreateLeadInput(input, actor);
    await this.ensureCanAssignLead(actor, data.assigned_agent_id);
    await this.ensureNoDuplicate(data.phone, data.email);

    const now = new Date();
    const lead = await this.repository.create({
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      source: data.source,
      desired_product: data.desired_product,
      approx_surface: data.approx_surface,
      sector: data.sector,
      status: data.status,
      assigned_agent_id: data.assigned_agent_id,
      converted_dossier_id: "",
      first_contact_date: data.first_contact_date,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    });

    await this.activityLogService.create({
      user_id: actor.sub,
      entity_type: "lead",
      entity_id: lead._id?.toString() ?? "",
      action: "LEAD_CREATED",
      new_value: toPublicLead(lead),
    });

    return toPublicLead(lead);
  }

  async list(
    actor: JwtUserPayload,
    filter: ListLeadsFilter,
  ): Promise<PublicLead[]> {
    const scopedFilter = await this.applyReadScope(actor, validateListFilter(filter));
    const leads = await this.repository.find(scopedFilter);
    return leads.map(toPublicLead);
  }

  async getById(id: string, actor: JwtUserPayload): Promise<PublicLead> {
    const lead = await this.getLeadOrFail(id);
    await this.ensureCanReadLead(actor, lead);
    return toPublicLead(lead);
  }

  async update(
    id: string,
    input: UpdateLeadInput,
    actor: JwtUserPayload,
  ): Promise<PublicLead> {
    const existingLead = await this.getLeadOrFail(id);
    await this.ensureCanReadLead(actor, existingLead);

    const updates = validateUpdateLeadInput(input, existingLead, actor);

    if (updates.assigned_agent_id) {
      await this.ensureCanAssignLead(actor, updates.assigned_agent_id);
    }

    if (updates.phone || updates.email) {
      await this.ensureNoDuplicate(
        updates.phone ?? existingLead.phone,
        updates.email ?? existingLead.email,
        id,
      );
    }

    const updatedLead = await this.repository.updateById(id, updates);

    if (!updatedLead) {
      throw new AppError("Lead not found.", 404);
    }

    await this.activityLogService.create({
      user_id: actor.sub,
      entity_type: "lead",
      entity_id: id,
      action: "LEAD_UPDATED",
      old_value: toPublicLead(existingLead),
      new_value: toPublicLead(updatedLead),
    });

    return toPublicLead(updatedLead);
  }

  private async getLeadOrFail(id: string): Promise<LeadDocument> {
    const lead = await this.repository.findById(id);

    if (!lead) {
      throw new AppError("Lead not found.", 404);
    }

    return lead;
  }

  private async ensureNoDuplicate(
    phone: string,
    email: string,
    excludedId?: string,
  ): Promise<void> {
    const duplicate = await this.repository.findDuplicate(phone, email, excludedId);

    if (duplicate) {
      throw new AppError("Un lead existe deja avec ce telephone ou cet email.", 409);
    }
  }

  private async ensureCanAssignLead(
    actor: JwtUserPayload,
    assignedAgentId: string,
  ): Promise<void> {
    if (isAgent(actor) && assignedAgentId !== actor.sub) {
      throw new AppError("Vous ne pouvez assigner un lead qu'a vous-meme.", 403);
    }

    if (isSalesManager(actor)) {
      return;
    }

    if (isSupervisor(actor)) {
      const assignedAgent = await this.authService.getCurrentUser(assignedAgentId);

      if (assignedAgent.department_id !== actor.department_id) {
        throw new AppError("Vous ne pouvez assigner qu'un agent de votre equipe.", 403);
      }
    }
  }

  private async ensureCanReadLead(
    actor: JwtUserPayload,
    lead: LeadDocument,
  ): Promise<void> {
    if (isSalesManager(actor)) {
      return;
    }

    if (isSupervisor(actor)) {
      const assignedAgent = await this.authService.getCurrentUser(
        lead.assigned_agent_id,
      );

      if (
        canAccessAgentScope(
          actor,
          lead.assigned_agent_id,
          assignedAgent.department_id,
        )
      ) {
        return;
      }
    }

    if (isAgent(actor) && lead.assigned_agent_id === actor.sub) {
      return;
    }

    throw new AppError("Vous n'avez pas les droits necessaires.", 403);
  }

  private async applyReadScope(
    actor: JwtUserPayload,
    filter: ListLeadsFilter,
  ): Promise<ListLeadsFilter> {
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
}

function validateCreateLeadInput(
  input: CreateLeadInput,
  actor: JwtUserPayload,
): Omit<LeadDocument, "_id" | "converted_dossier_id" | "createdAt" | "updatedAt"> {
  const firstName = input.first_name?.trim();
  const lastName = input.last_name?.trim();
  const phone = input.phone?.trim();
  const email = input.email?.trim().toLowerCase() ?? "";
  const source = input.source;
  const assignedAgentId = isAgent(actor)
    ? actor.sub
    : input.assigned_agent_id?.trim() || actor.sub;

  if (!firstName || !lastName || !phone || !source || !assignedAgentId) {
    throw new AppError(
      "first_name, last_name, phone, source and assigned_agent_id are required.",
      400,
    );
  }

  if (!validSourceTypes.has(source)) {
    throw new AppError("source must be CALL or REGIES.", 400);
  }

  return {
    first_name: firstName,
    last_name: lastName,
    phone,
    email,
    address: input.address?.trim() ?? "",
    source,
    desired_product: validateOptionalProduct(input.desired_product),
    approx_surface: input.approx_surface?.trim() ?? "",
    sector: validateOptionalSector(input.sector),
    status: validateOptionalStatus(input.status) ?? LEAD_STATUS.NOUVEAU,
    assigned_agent_id: assignedAgentId,
    first_contact_date: parseOptionalDate(input.first_contact_date),
    notes: input.notes?.trim() ?? "",
  };
}

function validateUpdateLeadInput(
  input: UpdateLeadInput,
  existingLead: LeadDocument,
  actor: JwtUserPayload,
): Partial<Omit<LeadDocument, "_id" | "createdAt">> {
  const updates: Partial<Omit<LeadDocument, "_id" | "createdAt">> = {};

  if (input.first_name !== undefined) {
    updates.first_name = requireNonEmpty(input.first_name, "first_name");
  }

  if (input.last_name !== undefined) {
    updates.last_name = requireNonEmpty(input.last_name, "last_name");
  }

  if (input.phone !== undefined) {
    updates.phone = requireNonEmpty(input.phone, "phone");
  }

  if (input.email !== undefined) {
    updates.email = input.email.trim().toLowerCase();
  }

  if (input.address !== undefined) {
    updates.address = input.address.trim();
  }

  if (input.source !== undefined) {
    if (!validSourceTypes.has(input.source)) {
      throw new AppError("source must be CALL or REGIES.", 400);
    }

    updates.source = input.source;
  }

  if (input.desired_product !== undefined) {
    updates.desired_product = validateOptionalProduct(input.desired_product);
  }

  if (input.approx_surface !== undefined) {
    updates.approx_surface = input.approx_surface.trim();
  }

  if (input.sector !== undefined) {
    updates.sector = validateOptionalSector(input.sector);
  }

  if (input.status !== undefined) {
    updates.status = validateOptionalStatus(input.status) ?? existingLead.status;
  }

  if (input.assigned_agent_id !== undefined) {
    if (isAgent(actor)) {
      throw new AppError("Vous ne pouvez pas reassigner un lead.", 403);
    }

    updates.assigned_agent_id = requireNonEmpty(
      input.assigned_agent_id,
      "assigned_agent_id",
    );
  }

  if (input.converted_dossier_id !== undefined) {
    updates.converted_dossier_id = input.converted_dossier_id.trim();
  }

  if (input.first_contact_date !== undefined) {
    updates.first_contact_date = parseOptionalDate(input.first_contact_date);
  }

  if (input.notes !== undefined) {
    updates.notes = input.notes.trim();
  }

  if (!Object.keys(updates).length) {
    throw new AppError("At least one field is required.", 400);
  }

  return updates;
}

function validateListFilter(filter: ListLeadsFilter): ListLeadsFilter {
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

function requireNonEmpty(value: string, field: string): string {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    throw new AppError(`${field} is required.`, 400);
  }

  return trimmedValue;
}

function validateOptionalStatus(status?: LeadStatus): LeadStatus | undefined {
  if (!status) {
    return undefined;
  }

  if (!validLeadStatuses.has(status)) {
    throw new AppError("Invalid lead status.", 400);
  }

  return status;
}

function validateOptionalProduct(product?: Product | ""): Product | "" {
  if (!product) {
    return "";
  }

  if (!validProducts.has(product)) {
    throw new AppError("Invalid desired_product.", 400);
  }

  return product;
}

function validateOptionalSector(sector?: Sector | ""): Sector | "" {
  if (!sector) {
    return "";
  }

  if (!validSectors.has(sector)) {
    throw new AppError("Invalid sector.", 400);
  }

  return sector;
}

function parseOptionalDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError("first_contact_date is invalid.", 400);
  }

  return date;
}

