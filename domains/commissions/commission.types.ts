import type { ObjectId } from "mongodb";
import type { CommissionStatus } from "@/domains/shared/business";

export type CommissionDocument = {
  _id?: ObjectId;
  dossier_id: string;
  agent_id: string;
  commission_rule_id: string;
  total_amount: number;
  deposit_amount: number;
  balance_amount: number;
  deposit_status: CommissionStatus;
  balance_status: CommissionStatus;
  global_status: CommissionStatus;
  calculated_at: Date;
  deposit_validated_at: Date | null;
  balance_validated_at: Date | null;
  deposit_paid_at: Date | null;
  balance_paid_at: Date | null;
  validated_by_id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicCommission = {
  id: string;
  dossier_id: string;
  agent_id: string;
  commission_rule_id: string;
  total_amount: number;
  deposit_amount: number;
  balance_amount: number;
  deposit_status: CommissionStatus;
  balance_status: CommissionStatus;
  global_status: CommissionStatus;
  calculated_at: string;
  deposit_validated_at: string | null;
  balance_validated_at: string | null;
  deposit_paid_at: string | null;
  balance_paid_at: string | null;
  validated_by_id: string;
  createdAt: string;
  updatedAt: string;
};

export type ListCommissionsFilter = {
  agent_id?: string;
  agent_ids?: string[];
  dossier_id?: string;
  global_status?: CommissionStatus;
  limit?: number;
};

