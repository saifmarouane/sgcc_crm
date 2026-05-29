import type { ObjectId } from "mongodb";
import type {
  Color,
  DossierStatus,
  Product,
  Sector,
  SourceType,
  SurfaceRange,
} from "@/domains/shared/business";

export type DossierDocument = {
  _id?: ObjectId;
  lead_id: string;
  client_id: string;
  assigned_agent_id: string;
  product: Product;
  color: Color;
  sector: Sector;
  surface_range: SurfaceRange;
  source_type: SourceType;
  status: DossierStatus;
  first_contact_date: Date | null;
  appointment_date: Date | null;
  quote_sent_date: Date | null;
  signature_date: Date | null;
  mpr_deposit_date: Date | null;
  installation_date: Date | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicDossier = {
  id: string;
  lead_id: string;
  client_id: string;
  assigned_agent_id: string;
  product: Product;
  color: Color;
  sector: Sector;
  surface_range: SurfaceRange;
  source_type: SourceType;
  status: DossierStatus;
  first_contact_date: string | null;
  appointment_date: string | null;
  quote_sent_date: string | null;
  signature_date: string | null;
  mpr_deposit_date: string | null;
  installation_date: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateDossierInput = {
  lead_id?: string;
  client_id?: string;
  assigned_agent_id: string;
  product: Product;
  color: Color;
  sector: Sector;
  surface_range: SurfaceRange;
  source_type: SourceType;
  status?: DossierStatus;
  first_contact_date?: string | null;
  appointment_date?: string | null;
  quote_sent_date?: string | null;
  signature_date?: string | null;
  mpr_deposit_date?: string | null;
  installation_date?: string | null;
  notes?: string;
};

export type UpdateDossierInput = Partial<CreateDossierInput>;

export type ConvertLeadToDossierInput = {
  product?: Product;
  color: Color;
  sector?: Sector;
  surface_range: SurfaceRange;
  appointment_date?: string | null;
  notes?: string;
};

export type ChangeDossierStatusInput = {
  status: DossierStatus;
};

export type ListDossiersFilter = {
  assigned_agent_id?: string;
  assigned_agent_ids?: string[];
  status?: DossierStatus;
  search?: string;
  limit?: number;
};
