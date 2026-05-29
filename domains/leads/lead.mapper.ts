import type { LeadDocument, PublicLead } from "./lead.types";

export function toPublicLead(lead: LeadDocument): PublicLead {
  return {
    id: lead._id?.toString() ?? "",
    first_name: lead.first_name,
    last_name: lead.last_name,
    phone: lead.phone,
    email: lead.email,
    address: lead.address,
    source: lead.source,
    desired_product: lead.desired_product,
    approx_surface: lead.approx_surface,
    sector: lead.sector,
    status: lead.status,
    assigned_agent_id: lead.assigned_agent_id,
    converted_dossier_id: lead.converted_dossier_id,
    first_contact_date: lead.first_contact_date?.toISOString() ?? null,
    notes: lead.notes,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

