import type { ObjectId } from "mongodb";
import type {
  Color,
  Product,
  Sector,
  SourceType,
  SurfaceRange,
} from "@/domains/shared/business";

export type CommissionRuleDocument = {
  _id?: ObjectId;
  product: Product;
  color: Color;
  sector: Sector;
  surface_range: SurfaceRange;
  source_type: SourceType;
  total_amount: number;
  deposit_amount: number;
  balance_amount: number;
  version: number;
  is_active: boolean;
  starts_at: Date | null;
  ends_at: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicCommissionRule = {
  id: string;
  product: Product;
  color: Color;
  sector: Sector;
  surface_range: SurfaceRange;
  source_type: SourceType;
  total_amount: number;
  deposit_amount: number;
  balance_amount: number;
  version: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCommissionRuleInput = {
  product: Product;
  color: Color;
  sector: Sector;
  surface_range: SurfaceRange;
  source_type: SourceType;
  total_amount: number;
  deposit_amount: number;
  balance_amount: number;
  version?: number;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
};

export type UpdateCommissionRuleInput = Partial<CreateCommissionRuleInput>;

export type ListCommissionRulesFilter = {
  is_active?: boolean;
  product?: Product;
  color?: Color;
  sector?: Sector;
  surface_range?: SurfaceRange;
  source_type?: SourceType;
  limit?: number;
};

