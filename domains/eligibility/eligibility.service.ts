import type { JwtUserPayload } from "@/domains/auth/auth.types";
import { AuthService } from "@/domains/auth/auth.service";
import { LeadRepository } from "@/domains/leads/lead.repository";
import type { LeadDocument } from "@/domains/leads/lead.types";
import {
  canAccessAgentScope,
  isAgent,
  isSalesManager,
  isSupervisor,
} from "@/domains/shared/auth";
import { AppError } from "@/domains/shared/app-error";
import {
  toPublicEligibilityAnswer,
  toPublicProspectAppointment,
  toPublicProspectDocument,
  toPublicProspectNote,
} from "./eligibility.mapper";
import { EligibilityRepository } from "./eligibility.repository";
import {
  CONSTRUCTION_AGE_STATUS,
  HEATING_SYSTEM,
  HOUSING_STATUS,
  HOUSE_SURFACE_STATUS,
  MPR_ACCOUNT_STATUS,
  MPR_APPOINTMENT_STATUS,
  MPR_DOCUMENT_STATUS,
  RFR_TRANCHE,
  type ConstructionAgeStatus,
  type CreateProspectAppointmentInput,
  type CreateProspectDocumentInput,
  type CreateProspectNoteInput,
  type EligibilityAnswersInput,
  type HeatingSystem,
  type HousingStatus,
  type HouseSurfaceStatus,
  type ListEligibilityFilter,
  type MprAccountStatus,
  type MprAppointmentStatus,
  type MprDocumentStatus,
  type PublicEligibilityAnswer,
  type PublicProspectAppointment,
  type PublicProspectDocument,
  type PublicProspectNote,
  type RequiredDocumentType,
  type RfrTranche,
} from "./eligibility.types";
import { MaPrimeRenovEligibilityService } from "./eligibility-evaluator.service";

const MAX_LIMIT = 200;
const validHousingStatuses = new Set<HousingStatus>(Object.values(HOUSING_STATUS));
const validConstructionAgeStatuses = new Set<ConstructionAgeStatus>(
  Object.values(CONSTRUCTION_AGE_STATUS),
);
const validHouseSurfaceStatuses = new Set<HouseSurfaceStatus>(
  Object.values(HOUSE_SURFACE_STATUS),
);
const validHeatingSystems = new Set<HeatingSystem>(Object.values(HEATING_SYSTEM));
const validRfrTranches = new Set<RfrTranche>(Object.values(RFR_TRANCHE));
const validMprAccountStatuses = new Set<MprAccountStatus>(
  Object.values(MPR_ACCOUNT_STATUS),
);
const validDocumentStatuses = new Set<MprDocumentStatus>(
  Object.values(MPR_DOCUMENT_STATUS),
);
const validAppointmentStatuses = new Set<MprAppointmentStatus>(
  Object.values(MPR_APPOINTMENT_STATUS),
);
const validDocumentTypes = new Set<RequiredDocumentType>([
  "avis_imposition",
  "taxe_habitation",
  "taxe_fonciere",
  "piece_identite",
  "photo_chaudiere",
  "photo_compteur_electrique",
  "photo_toit",
  "justificatif_domicile",
  "bail_location",
]);

type ValidatedEligibilityAnswers = {
  housing_status: HousingStatus;
  construction_age_status: ConstructionAgeStatus;
  house_surface_status: HouseSurfaceStatus;
  house_surface_value: number | null;
  heating_system: HeatingSystem;
  fiscal_household_size: number;
  rfr_amount: number | null;
  rfr_tranche: RfrTranche;
  has_balloon_space: boolean;
  has_pac_space: boolean;
  has_roof_space: boolean;
  mpr_account_status: MprAccountStatus;
};

export class EligibilityService {
  constructor(
    private readonly repository = new EligibilityRepository(),
    private readonly leadRepository = new LeadRepository(),
    private readonly authService = new AuthService(),
    private readonly evaluator = new MaPrimeRenovEligibilityService(),
  ) {}

  async saveEligibility(
    leadId: string,
    input: EligibilityAnswersInput,
    actor: JwtUserPayload,
  ): Promise<PublicEligibilityAnswer> {
    const lead = await this.getLeadOrFail(leadId);
    await this.ensureCanAccessLead(actor, lead);

    const data = validateEligibilityAnswers(input);
    const evaluation = this.evaluator.evaluate(data);
    const now = new Date();
    const answer = await this.repository.upsertAnswer(leadId, {
      lead_id: leadId,
      ...data,
      ...evaluation,
      createdAt: now,
      updatedAt: now,
    });

    if (input.agent_note?.trim()) {
      await this.createNote(leadId, { note: input.agent_note }, actor);
    }

    if (input.appointment_at) {
      await this.createAppointment(
        leadId,
        {
          appointment_at: input.appointment_at,
          status: MPR_APPOINTMENT_STATUS.PLANNED,
          comment: input.agent_note,
        },
        actor,
      );
    }

    return toPublicEligibilityAnswer(answer);
  }

  async getEligibility(
    leadId: string,
    actor: JwtUserPayload,
  ): Promise<PublicEligibilityAnswer | null> {
    const lead = await this.getLeadOrFail(leadId);
    await this.ensureCanAccessLead(actor, lead);
    const answer = await this.repository.findAnswerByLeadId(leadId);
    return answer ? toPublicEligibilityAnswer(answer) : null;
  }

  async createDocument(
    leadId: string,
    input: CreateProspectDocumentInput,
    actor: JwtUserPayload,
  ): Promise<PublicProspectDocument> {
    const lead = await this.getLeadOrFail(leadId);
    await this.ensureCanAccessLead(actor, lead);
    const data = validateDocumentInput(input);
    const now = new Date();
    const document = await this.repository.createDocument({
      lead_id: leadId,
      document_type: data.document_type,
      file_path: data.file_path,
      status: data.status,
      uploaded_by: actor.sub,
      uploaded_at: now,
      createdAt: now,
      updatedAt: now,
    });
    return toPublicProspectDocument(document);
  }

  async listDocuments(
    leadId: string,
    actor: JwtUserPayload,
  ): Promise<PublicProspectDocument[]> {
    const lead = await this.getLeadOrFail(leadId);
    await this.ensureCanAccessLead(actor, lead);
    const documents = await this.repository.findDocumentsByLeadId(leadId);
    return documents.map(toPublicProspectDocument);
  }

  async deleteDocument(
    leadId: string,
    documentId: string,
    actor: JwtUserPayload,
  ): Promise<void> {
    const lead = await this.getLeadOrFail(leadId);
    await this.ensureCanAccessLead(actor, lead);
    const deleted = await this.repository.deleteDocument(leadId, documentId);

    if (!deleted) {
      throw new AppError("Document not found.", 404);
    }
  }

  async createNote(
    leadId: string,
    input: CreateProspectNoteInput,
    actor: JwtUserPayload,
  ): Promise<PublicProspectNote> {
    const lead = await this.getLeadOrFail(leadId);
    await this.ensureCanAccessLead(actor, lead);
    const note = validateNoteInput(input);
    const now = new Date();
    const record = await this.repository.createNote({
      lead_id: leadId,
      user_id: actor.sub,
      note,
      createdAt: now,
      updatedAt: now,
    });
    return toPublicProspectNote(record);
  }

  async listNotes(
    leadId: string,
    actor: JwtUserPayload,
  ): Promise<PublicProspectNote[]> {
    const lead = await this.getLeadOrFail(leadId);
    await this.ensureCanAccessLead(actor, lead);
    const notes = await this.repository.findNotesByLeadId(leadId);
    return notes.map(toPublicProspectNote);
  }

  async createAppointment(
    leadId: string,
    input: CreateProspectAppointmentInput,
    actor: JwtUserPayload,
  ): Promise<PublicProspectAppointment> {
    const lead = await this.getLeadOrFail(leadId);
    await this.ensureCanAccessLead(actor, lead);
    const data = validateAppointmentInput(input);
    const now = new Date();
    const appointment = await this.repository.createAppointment({
      lead_id: leadId,
      appointment_at: data.appointment_at,
      agent_id: lead.assigned_agent_id,
      status: data.status,
      comment: data.comment,
      createdAt: now,
      updatedAt: now,
    });
    return toPublicProspectAppointment(appointment);
  }

  async listLeadAppointments(
    leadId: string,
    actor: JwtUserPayload,
  ): Promise<PublicProspectAppointment[]> {
    const lead = await this.getLeadOrFail(leadId);
    await this.ensureCanAccessLead(actor, lead);
    const appointments = await this.repository.findAppointmentsByLeadId(leadId);
    return appointments.map(toPublicProspectAppointment);
  }

  async listAppointments(
    actor: JwtUserPayload,
    filter: ListEligibilityFilter,
  ): Promise<PublicProspectAppointment[]> {
    const scopedFilter = await this.applyAppointmentScope(
      actor,
      validateListFilter(filter),
    );
    const appointments = await this.repository.findAppointments(scopedFilter);
    return appointments.map(toPublicProspectAppointment);
  }

  private async getLeadOrFail(id: string): Promise<LeadDocument> {
    const lead = await this.leadRepository.findById(id);

    if (!lead) {
      throw new AppError("Lead not found.", 404);
    }

    return lead;
  }

  private async ensureCanAccessLead(
    actor: JwtUserPayload,
    lead: LeadDocument,
  ): Promise<void> {
    if (isSalesManager(actor)) {
      return;
    }

    if (isAgent(actor) && lead.assigned_agent_id === actor.sub) {
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

    throw new AppError("Vous n'avez pas les droits necessaires.", 403);
  }

  private async applyAppointmentScope(
    actor: JwtUserPayload,
    filter: ListEligibilityFilter,
  ): Promise<ListEligibilityFilter> {
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

function validateEligibilityAnswers(
  input: EligibilityAnswersInput,
): ValidatedEligibilityAnswers {
  return {
    housing_status: requireEnum(
      input.housing_status,
      validHousingStatuses,
      "housing_status",
    ),
    construction_age_status: requireEnum(
      input.construction_age_status,
      validConstructionAgeStatuses,
      "construction_age_status",
    ),
    house_surface_status: requireEnum(
      input.house_surface_status,
      validHouseSurfaceStatuses,
      "house_surface_status",
    ),
    house_surface_value:
      input.house_surface_value === undefined || input.house_surface_value === null
        ? null
        : requirePositiveNumber(input.house_surface_value, "house_surface_value"),
    heating_system: requireEnum(
      input.heating_system,
      validHeatingSystems,
      "heating_system",
    ),
    fiscal_household_size: requireHouseholdSize(input.fiscal_household_size),
    rfr_amount:
      input.rfr_amount === undefined || input.rfr_amount === null
        ? null
        : requirePositiveNumber(input.rfr_amount, "rfr_amount"),
    rfr_tranche: requireEnum(input.rfr_tranche, validRfrTranches, "rfr_tranche"),
    has_balloon_space: requireBoolean(input.has_balloon_space, "has_balloon_space"),
    has_pac_space: requireBoolean(input.has_pac_space, "has_pac_space"),
    has_roof_space: requireBoolean(input.has_roof_space, "has_roof_space"),
    mpr_account_status: requireEnum(
      input.mpr_account_status,
      validMprAccountStatuses,
      "mpr_account_status",
    ),
  };
}

function validateDocumentInput(
  input: CreateProspectDocumentInput,
): Required<CreateProspectDocumentInput> {
  return {
    document_type: requireEnum(
      input.document_type,
      validDocumentTypes,
      "document_type",
    ),
    file_path: requireNonEmpty(input.file_path, "file_path"),
    status: input.status
      ? requireEnum(input.status, validDocumentStatuses, "status")
      : MPR_DOCUMENT_STATUS.RECEIVED,
  };
}

function validateNoteInput(input: CreateProspectNoteInput): string {
  return requireNonEmpty(input.note, "note");
}

function validateAppointmentInput(input: CreateProspectAppointmentInput): {
  appointment_at: Date;
  status: MprAppointmentStatus;
  comment: string;
} {
  const appointmentAt = input.appointment_at
    ? new Date(input.appointment_at)
    : null;

  if (!appointmentAt || Number.isNaN(appointmentAt.getTime())) {
    throw new AppError("appointment_at is required and must be valid.", 400);
  }

  return {
    appointment_at: appointmentAt,
    status: input.status
      ? requireEnum(input.status, validAppointmentStatuses, "status")
      : MPR_APPOINTMENT_STATUS.PLANNED,
    comment: input.comment?.trim() ?? "",
  };
}

function validateListFilter(filter: ListEligibilityFilter): ListEligibilityFilter {
  const limit = Number(filter.limit ?? 100);

  return {
    assigned_agent_id: filter.assigned_agent_id?.trim() || undefined,
    assigned_agent_ids: filter.assigned_agent_ids,
    date_from: filter.date_from,
    date_to: filter.date_to,
    limit:
      Number.isFinite(limit) && limit > 0
        ? Math.min(Math.trunc(limit), MAX_LIMIT)
        : 100,
  };
}

function requireEnum<T extends string>(
  value: T | undefined,
  validValues: Set<T>,
  field: string,
): T {
  if (!value || !validValues.has(value)) {
    throw new AppError(`${field} is required and must be valid.`, 400);
  }

  return value;
}

function requireBoolean(value: boolean | undefined, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new AppError(`${field} is required and must be boolean.`, 400);
  }

  return value;
}

function requirePositiveNumber(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new AppError(`${field} must be a positive number.`, 400);
  }

  return value;
}

function requireHouseholdSize(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) {
    throw new AppError("fiscal_household_size must be between 1 and 5.", 400);
  }

  return value;
}

function requireNonEmpty(value: string | undefined, field: string): string {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    throw new AppError(`${field} is required.`, 400);
  }

  return trimmedValue;
}
