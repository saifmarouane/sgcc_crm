import { ObjectId, type Collection, type Filter } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { LeadDocument, ListLeadsFilter } from "./lead.types";

const LEADS_COLLECTION = "leads";
let leadsIndexesReady: Promise<string[]> | null = null;

async function leadsCollection(): Promise<Collection<LeadDocument>> {
  const db = await getDb();
  const collection = db.collection<LeadDocument>(LEADS_COLLECTION);
  leadsIndexesReady ??= Promise.all([
    collection.createIndex({ phone: 1 }),
    collection.createIndex({ email: 1 }),
    collection.createIndex({ assigned_agent_id: 1, createdAt: -1 }),
    collection.createIndex({ status: 1, createdAt: -1 }),
  ]);
  await leadsIndexesReady;
  return collection;
}

export class LeadRepository {
  async create(lead: LeadDocument): Promise<LeadDocument> {
    const collection = await leadsCollection();
    const result = await collection.insertOne(lead);
    return { ...lead, _id: result.insertedId };
  }

  async find(filter: ListLeadsFilter): Promise<LeadDocument[]> {
    const collection = await leadsCollection();
    const query: Filter<LeadDocument> = {};

    if (filter.assigned_agent_id) {
      query.assigned_agent_id = filter.assigned_agent_id;
    }

    if (filter.assigned_agent_ids) {
      query.assigned_agent_id = { $in: filter.assigned_agent_ids };
    }

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.search) {
      const search = escapeRegex(filter.search);
      query.$or = [
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    return collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(filter.limit ?? 100)
      .toArray();
  }

  async findById(id: string): Promise<LeadDocument | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await leadsCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  }

  async findDuplicate(
    phone: string,
    email: string,
    excludedId?: string,
  ): Promise<LeadDocument | null> {
    const collection = await leadsCollection();
    const conditions: Filter<LeadDocument>[] = [];

    if (phone) {
      conditions.push({ phone });
    }

    if (email) {
      conditions.push({ email });
    }

    if (!conditions.length) {
      return null;
    }

    const query: Filter<LeadDocument> = { $or: conditions };

    if (excludedId && ObjectId.isValid(excludedId)) {
      query._id = { $ne: new ObjectId(excludedId) };
    }

    return collection.findOne(query);
  }

  async updateById(
    id: string,
    updates: Partial<Omit<LeadDocument, "_id" | "createdAt">>,
  ): Promise<LeadDocument | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await leadsCollection();
    return collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

