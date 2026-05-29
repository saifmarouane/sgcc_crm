import type { DossierDocument, PublicDossier } from "./dossier.types";

export function toPublicDossier(dossier: DossierDocument): PublicDossier {
  return {
    id: dossier._id?.toString() ?? "",
    lead_id: dossier.lead_id,
    client_id: dossier.client_id,
    assigned_agent_id: dossier.assigned_agent_id,
    product: dossier.product,
    color: dossier.color,
    sector: dossier.sector,
    surface_range: dossier.surface_range,
    source_type: dossier.source_type,
    status: dossier.status,
    first_contact_date: dossier.first_contact_date?.toISOString() ?? null,
    appointment_date: dossier.appointment_date?.toISOString() ?? null,
    quote_sent_date: dossier.quote_sent_date?.toISOString() ?? null,
    signature_date: dossier.signature_date?.toISOString() ?? null,
    mpr_deposit_date: dossier.mpr_deposit_date?.toISOString() ?? null,
    installation_date: dossier.installation_date?.toISOString() ?? null,
    notes: dossier.notes,
    createdAt: dossier.createdAt.toISOString(),
    updatedAt: dossier.updatedAt.toISOString(),
  };
}

