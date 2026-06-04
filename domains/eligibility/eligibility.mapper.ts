import type {
  EligibilityAnswerDocument,
  ProspectAppointmentRecord,
  ProspectDocumentRecord,
  ProspectNoteRecord,
  PublicEligibilityAnswer,
  PublicProspectAppointment,
  PublicProspectDocument,
  PublicProspectNote,
} from "./eligibility.types";

export function toPublicEligibilityAnswer(
  answer: EligibilityAnswerDocument,
): PublicEligibilityAnswer {
  return {
    id: answer._id?.toString() ?? "",
    lead_id: answer.lead_id,
    housing_status: answer.housing_status,
    construction_age_status: answer.construction_age_status,
    house_surface_status: answer.house_surface_status,
    house_surface_value: answer.house_surface_value,
    heating_system: answer.heating_system,
    fiscal_household_size: answer.fiscal_household_size,
    rfr_amount: answer.rfr_amount,
    rfr_tranche: answer.rfr_tranche,
    has_balloon_space: answer.has_balloon_space,
    has_pac_space: answer.has_pac_space,
    has_roof_space: answer.has_roof_space,
    mpr_account_status: answer.mpr_account_status,
    eligibility_status: answer.eligibility_status,
    non_eligibility_reasons: answer.non_eligibility_reasons,
    eligible_products: answer.eligible_products,
    required_documents: answer.required_documents,
    createdAt: answer.createdAt.toISOString(),
    updatedAt: answer.updatedAt.toISOString(),
  };
}

export function toPublicProspectDocument(
  document: ProspectDocumentRecord,
): PublicProspectDocument {
  return {
    id: document._id?.toString() ?? "",
    lead_id: document.lead_id,
    document_type: document.document_type,
    file_path: document.file_path,
    status: document.status,
    uploaded_by: document.uploaded_by,
    uploaded_at: document.uploaded_at.toISOString(),
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

export function toPublicProspectNote(
  note: ProspectNoteRecord,
): PublicProspectNote {
  return {
    id: note._id?.toString() ?? "",
    lead_id: note.lead_id,
    user_id: note.user_id,
    note: note.note,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export function toPublicProspectAppointment(
  appointment: ProspectAppointmentRecord,
): PublicProspectAppointment {
  return {
    id: appointment._id?.toString() ?? "",
    lead_id: appointment.lead_id,
    appointment_at: appointment.appointment_at.toISOString(),
    agent_id: appointment.agent_id,
    status: appointment.status,
    comment: appointment.comment,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
  };
}
