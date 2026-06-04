import type { ObjectId } from "mongodb";

export const ELIGIBILITY_STATUS = {
  ELIGIBLE: "eligible",
  NON_ELIGIBLE: "non_eligible",
  INCOMPLETE: "incomplete",
} as const;

export const HOUSING_STATUS = {
  OWNER_OCCUPANT: "owner_occupant",
  OWNER_LANDLORD: "owner_landlord",
  TENANT: "tenant",
} as const;

export const CONSTRUCTION_AGE_STATUS = {
  MORE_THAN_15_YEARS: "more_than_15_years",
  LESS_THAN_15_YEARS: "less_than_15_years",
} as const;

export const HOUSE_SURFACE_STATUS = {
  BETWEEN_50_AND_350: "between_50_and_350",
  OUTSIDE_RANGE: "outside_range",
} as const;

export const HEATING_SYSTEM = {
  OIL_BOILER: "oil_boiler",
  GAS_BOILER: "gas_boiler",
  WOOD_BOILER: "wood_boiler",
  PELLET_BOILER: "pellet_boiler",
  PAC_BEFORE_2023: "pac_before_2023",
  OTHER: "other",
} as const;

export const RFR_TRANCHE = {
  BLUE: "blue",
  YELLOW: "yellow",
  PURPLE: "purple",
  ABOVE: "above",
} as const;

export const MPR_ACCOUNT_STATUS = {
  ACTIVE: "active",
  NOT_YET: "not_yet",
  UNKNOWN: "unknown",
} as const;

export const MPR_DOCUMENT_STATUS = {
  RECEIVED: "received",
  MISSING: "missing",
} as const;

export const MPR_APPOINTMENT_STATUS = {
  PLANNED: "planned",
  CANCELLED: "cancelled",
  DONE: "done",
} as const;

export type EligibilityStatus =
  (typeof ELIGIBILITY_STATUS)[keyof typeof ELIGIBILITY_STATUS];
export type HousingStatus = (typeof HOUSING_STATUS)[keyof typeof HOUSING_STATUS];
export type ConstructionAgeStatus =
  (typeof CONSTRUCTION_AGE_STATUS)[keyof typeof CONSTRUCTION_AGE_STATUS];
export type HouseSurfaceStatus =
  (typeof HOUSE_SURFACE_STATUS)[keyof typeof HOUSE_SURFACE_STATUS];
export type HeatingSystem = (typeof HEATING_SYSTEM)[keyof typeof HEATING_SYSTEM];
export type RfrTranche = (typeof RFR_TRANCHE)[keyof typeof RFR_TRANCHE];
export type MprAccountStatus =
  (typeof MPR_ACCOUNT_STATUS)[keyof typeof MPR_ACCOUNT_STATUS];
export type MprDocumentStatus =
  (typeof MPR_DOCUMENT_STATUS)[keyof typeof MPR_DOCUMENT_STATUS];
export type MprAppointmentStatus =
  (typeof MPR_APPOINTMENT_STATUS)[keyof typeof MPR_APPOINTMENT_STATUS];

export type EligibleProduct =
  | "PAC seule"
  | "PAC + SSC"
  | "PAC + BS"
  | "PAC + BE"
  | "PAC + BT"
  | "SSC seul";

export type RequiredDocumentType =
  | "avis_imposition"
  | "taxe_habitation"
  | "taxe_fonciere"
  | "piece_identite"
  | "photo_chaudiere"
  | "photo_compteur_electrique"
  | "photo_toit"
  | "justificatif_domicile"
  | "bail_location";

export type EligibilityAnswersInput = {
  housing_status?: HousingStatus;
  construction_age_status?: ConstructionAgeStatus;
  house_surface_status?: HouseSurfaceStatus;
  house_surface_value?: number | null;
  heating_system?: HeatingSystem;
  fiscal_household_size?: number;
  rfr_amount?: number | null;
  rfr_tranche?: RfrTranche;
  has_balloon_space?: boolean;
  has_pac_space?: boolean;
  has_roof_space?: boolean;
  mpr_account_status?: MprAccountStatus;
  appointment_at?: string | null;
  agent_note?: string;
};

export type EligibilityEvaluation = {
  eligibility_status: EligibilityStatus;
  non_eligibility_reasons: string[];
  eligible_products: EligibleProduct[];
  required_documents: RequiredDocumentType[];
};

export type EligibilityAnswerDocument = {
  _id?: ObjectId;
  lead_id: string;
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
  eligibility_status: EligibilityStatus;
  non_eligibility_reasons: string[];
  eligible_products: EligibleProduct[];
  required_documents: RequiredDocumentType[];
  createdAt: Date;
  updatedAt: Date;
};

export type PublicEligibilityAnswer = Omit<
  EligibilityAnswerDocument,
  "_id" | "createdAt" | "updatedAt"
> & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type ProspectDocumentRecord = {
  _id?: ObjectId;
  lead_id: string;
  document_type: RequiredDocumentType;
  file_path: string;
  status: MprDocumentStatus;
  uploaded_by: string;
  uploaded_at: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicProspectDocument = Omit<
  ProspectDocumentRecord,
  "_id" | "uploaded_at" | "createdAt" | "updatedAt"
> & {
  id: string;
  uploaded_at: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateProspectDocumentInput = {
  document_type?: RequiredDocumentType;
  file_path?: string;
  status?: MprDocumentStatus;
};

export type ProspectNoteRecord = {
  _id?: ObjectId;
  lead_id: string;
  user_id: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicProspectNote = Omit<
  ProspectNoteRecord,
  "_id" | "createdAt" | "updatedAt"
> & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateProspectNoteInput = {
  note?: string;
};

export type ProspectAppointmentRecord = {
  _id?: ObjectId;
  lead_id: string;
  appointment_at: Date;
  agent_id: string;
  status: MprAppointmentStatus;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicProspectAppointment = Omit<
  ProspectAppointmentRecord,
  "_id" | "appointment_at" | "createdAt" | "updatedAt"
> & {
  id: string;
  appointment_at: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateProspectAppointmentInput = {
  appointment_at?: string;
  status?: MprAppointmentStatus;
  comment?: string;
};

export type ListEligibilityFilter = {
  assigned_agent_id?: string;
  assigned_agent_ids?: string[];
  status?: EligibilityStatus;
  product?: EligibleProduct;
  date_from?: Date;
  date_to?: Date;
  limit?: number;
};
