import { AppError } from "@/domains/shared/app-error";
import { toPublicActivityLog } from "./activity-log.mapper";
import { ActivityLogRepository } from "./activity-log.repository";
import type {
  CreateActivityLogInput,
  ListActivityLogsFilter,
  PublicActivityLog,
} from "./activity-log.types";

const MAX_LIMIT = 200;

export class ActivityLogService {
  constructor(private readonly repository = new ActivityLogRepository()) {}

  async create(input: CreateActivityLogInput): Promise<PublicActivityLog> {
    const data = validateCreateActivityLog(input);
    const activityLog = await this.repository.create({
      user_id: data.user_id,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      action: data.action,
      old_value: data.old_value ?? null,
      new_value: data.new_value ?? null,
      createdAt: new Date(),
    });

    return toPublicActivityLog(activityLog);
  }

  async list(filter: ListActivityLogsFilter): Promise<PublicActivityLog[]> {
    const logs = await this.repository.find(validateListFilter(filter));
    return logs.map(toPublicActivityLog);
  }
}

function validateCreateActivityLog(
  input: CreateActivityLogInput,
): CreateActivityLogInput {
  const userId = input.user_id?.trim();
  const entityType = input.entity_type?.trim();
  const entityId = input.entity_id?.trim();
  const action = input.action?.trim();

  if (!userId || !entityType || !entityId || !action) {
    throw new AppError(
      "user_id, entity_type, entity_id and action are required.",
      400,
    );
  }

  return {
    user_id: userId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    old_value: input.old_value ?? null,
    new_value: input.new_value ?? null,
  };
}

function validateListFilter(
  filter: ListActivityLogsFilter,
): ListActivityLogsFilter {
  const limit = Number(filter.limit ?? 100);

  return {
    entity_type: filter.entity_type?.trim() || undefined,
    entity_id: filter.entity_id?.trim() || undefined,
    user_id: filter.user_id?.trim() || undefined,
    limit:
      Number.isFinite(limit) && limit > 0
        ? Math.min(Math.trunc(limit), MAX_LIMIT)
        : 100,
  };
}

