import { ObjectId, type Collection, type Filter } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { CommissionDocument, ListCommissionsFilter } from "./commission.types";

const COMMISSIONS_COLLECTION = "commissions";
let commissionsIndexesReady: Promise<string[]> | null = null;

async function commissionsCollection(): Promise<Collection<CommissionDocument>> {
  const db = await getDb();
  const collection = db.collection<CommissionDocument>(COMMISSIONS_COLLECTION);
  commissionsIndexesReady ??= Promise.all([
    collection.createIndex({ dossier_id: 1 }, { unique: true }),
    collection.createIndex({ agent_id: 1, calculated_at: -1 }),
    collection.createIndex({ global_status: 1, calculated_at: -1 }),
  ]);
  await commissionsIndexesReady;
  return collection;
}

export class CommissionRepository {
  async create(commission: CommissionDocument): Promise<CommissionDocument> {
    const collection = await commissionsCollection();
    const result = await collection.insertOne(commission);
    return { ...commission, _id: result.insertedId };
  }

  async find(filter: ListCommissionsFilter): Promise<CommissionDocument[]> {
    const collection = await commissionsCollection();
    const query: Filter<CommissionDocument> = {};

    if (filter.agent_id) {
      query.agent_id = filter.agent_id;
    }

    if (filter.agent_ids) {
      query.agent_id = { $in: filter.agent_ids };
    }

    if (filter.dossier_id) {
      query.dossier_id = filter.dossier_id;
    }

    if (filter.global_status) {
      query.global_status = filter.global_status;
    }

    return collection
      .find(query)
      .sort({ calculated_at: -1 })
      .limit(filter.limit ?? 100)
      .toArray();
  }

  async findByDossierId(dossierId: string): Promise<CommissionDocument | null> {
    const collection = await commissionsCollection();
    return collection.findOne({ dossier_id: dossierId });
  }

  async findById(id: string): Promise<CommissionDocument | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await commissionsCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  }
}

