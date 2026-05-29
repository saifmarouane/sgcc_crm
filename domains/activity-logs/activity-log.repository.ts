import { type Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type {
  ActivityLogDocument,
  ListActivityLogsFilter,
} from "./activity-log.types";

const ACTIVITY_LOGS_COLLECTION = "activity_logs";
let activityLogIndexesReady: Promise<string[]> | null = null;

async function activityLogsCollection(): Promise<
  Collection<ActivityLogDocument>
> {
  const db = await getDb();
  const collection = db.collection<ActivityLogDocument>(
    ACTIVITY_LOGS_COLLECTION,
  );
  activityLogIndexesReady ??= Promise.all([
    collection.createIndex({ entity_type: 1, entity_id: 1, createdAt: -1 }),
    collection.createIndex({ user_id: 1, createdAt: -1 }),
    collection.createIndex({ createdAt: -1 }),
  ]);
  await activityLogIndexesReady;
  return collection;
}

export class ActivityLogRepository {
  async create(activityLog: ActivityLogDocument): Promise<ActivityLogDocument> {
    const collection = await activityLogsCollection();
    const result = await collection.insertOne(activityLog);
    return { ...activityLog, _id: result.insertedId };
  }

  async find(filter: ListActivityLogsFilter): Promise<ActivityLogDocument[]> {
    const collection = await activityLogsCollection();
    const query: Record<string, string> = {};

    if (filter.entity_type) {
      query.entity_type = filter.entity_type;
    }

    if (filter.entity_id) {
      query.entity_id = filter.entity_id;
    }

    if (filter.user_id) {
      query.user_id = filter.user_id;
    }

    return collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(filter.limit ?? 100)
      .toArray();
  }
}

