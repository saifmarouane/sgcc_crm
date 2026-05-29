import type { UserRole } from "@/domains/auth/auth.types";

export const BUSINESS_ROLE = {
  AGENT: "agent",
  SUPERVISOR: "manager",
  SALES_MANAGER: "admin",
} as const satisfies Record<string, UserRole>;

export const BUSINESS_ROLE_LABEL: Record<UserRole, string> = {
  admin: "Responsable commercial",
  manager: "Superviseur",
  agent: "Agent commercial",
};

export const LEAD_STATUS = {
  NOUVEAU: "NOUVEAU",
  QUALIFIE: "QUALIFIE",
  NON_QUALIFIE: "NON_QUALIFIE",
  CONVERTI: "CONVERTI",
  PERDU: "PERDU",
} as const;

export const DOSSIER_STATUS = {
  NOUVEAU: "NOUVEAU",
  QUALIFIE: "QUALIFIE",
  RDV_PLANIFIE: "RDV_PLANIFIE",
  DEVIS_ENVOYE: "DEVIS_ENVOYE",
  SIGNE_ACOMPTE_A_VALIDER: "SIGNE_ACOMPTE_A_VALIDER",
  ACOMPTE_VALIDE: "ACOMPTE_VALIDE",
  DEPOT_MPR: "DEPOT_MPR",
  POSE_SOLDE_A_VALIDER: "POSE_SOLDE_A_VALIDER",
  SOLDE_VALIDE: "SOLDE_VALIDE",
  ARCHIVE: "ARCHIVE",
  ANNULE: "ANNULE",
  PERDU: "PERDU",
} as const;

export const COMMISSION_STATUS = {
  CALCULEE: "CALCULEE",
  ACOMPTE_EN_ATTENTE: "ACOMPTE_EN_ATTENTE",
  ACOMPTE_VALIDE: "ACOMPTE_VALIDE",
  ACOMPTE_PAYE: "ACOMPTE_PAYE",
  SOLDE_EN_ATTENTE: "SOLDE_EN_ATTENTE",
  SOLDE_VALIDE: "SOLDE_VALIDE",
  SOLDE_PAYE: "SOLDE_PAYE",
  SOLDEE: "SOLDEE",
  ANNULEE: "ANNULEE",
} as const;

export const SOURCE_TYPE = {
  CALL: "CALL",
  REGIES: "REGIES",
} as const;

export const PRODUCT = {
  PAC_SSC: "PAC/SSC",
  PAC_BTD: "PAC/BTD",
  PAC_DUO: "PAC DUO",
  PAC_BS: "PAC/BS",
  SSC: "SSC",
  PAC_BE: "PAC/BE",
} as const;

export const COLOR = {
  BLEU: "BLEU",
  JAUNE: "JAUNE",
  VIOLET: "VIOLET",
} as const;

export const SECTOR = {
  H1: "H1",
  H2: "H2",
  H3: "H3",
} as const;

export const SURFACE_RANGE = {
  LT_70: "<70",
  FROM_70_TO_89: "70-89",
  FROM_90_TO_109: "90-109",
  FROM_110_TO_130: "110-130",
  GT_130: ">130",
} as const;

export type LeadStatus = (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS];
export type DossierStatus = (typeof DOSSIER_STATUS)[keyof typeof DOSSIER_STATUS];
export type CommissionStatus =
  (typeof COMMISSION_STATUS)[keyof typeof COMMISSION_STATUS];
export type SourceType = (typeof SOURCE_TYPE)[keyof typeof SOURCE_TYPE];
export type Product = (typeof PRODUCT)[keyof typeof PRODUCT];
export type Color = (typeof COLOR)[keyof typeof COLOR];
export type Sector = (typeof SECTOR)[keyof typeof SECTOR];
export type SurfaceRange = (typeof SURFACE_RANGE)[keyof typeof SURFACE_RANGE];

