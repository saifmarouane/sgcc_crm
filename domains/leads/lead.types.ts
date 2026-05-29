import type { ObjectId } from "mongodb";
import type {
  LeadStatus,
  Product,
  Sector,
  SourceType,
} from "@/domains/shared/business";

export type LeadDocument = {
  _id?: ObjectId;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string;
  source: SourceType;
  desired_product: Product | "";
  approx_surface: string;
  sector: Sector | "";
  status: LeadStatus;
  assigned_agent_id: string;
  converted_dossier_id: string;
  first_contact_date: Date | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicLead = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string;
  source: SourceType;
  desired_product: Product | "";
  approx_surface: string;
  sector: Sector | "";
  status: LeadStatus;
  assigned_agent_id: string;
  converted_dossier_id: string;
  first_contact_date: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateLeadInput = {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  address?: string;
  source: SourceType;
  desired_product?: Product | "";
  approx_surface?: string;
  sector?: Sector | "";
  status?: LeadStatus;
  assigned_agent_id?: string;
  first_contact_date?: string | null;
  notes?: string;
};

export type UpdateLeadInput = Partial<CreateLeadInput> & {
  converted_dossier_id?: string;
};

export type ListLeadsFilter = {
  assigned_agent_id?: string;
  assigned_agent_ids?: string[];
  status?: LeadStatus;
  search?: string;
  limit?: number;
};

