import type { ObjectId } from "mongodb";

export type ActivityLogDocument = {
  _id?: ObjectId;
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value: unknown | null;
  new_value: unknown | null;
  createdAt: Date;
};

export type PublicActivityLog = {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value: unknown | null;
  new_value: unknown | null;
  createdAt: string;
};

export type CreateActivityLogInput = {
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value?: unknown | null;
  new_value?: unknown | null;
};

export type ListActivityLogsFilter = {
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  limit?: number;
};

