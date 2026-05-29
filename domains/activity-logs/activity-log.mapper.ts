import type {
  ActivityLogDocument,
  PublicActivityLog,
} from "./activity-log.types";

export function toPublicActivityLog(
  activityLog: ActivityLogDocument,
): PublicActivityLog {
  return {
    id: activityLog._id?.toString() ?? "",
    user_id: activityLog.user_id,
    entity_type: activityLog.entity_type,
    entity_id: activityLog.entity_id,
    action: activityLog.action,
    old_value: activityLog.old_value ?? null,
    new_value: activityLog.new_value ?? null,
    createdAt: activityLog.createdAt.toISOString(),
  };
}

