import { ObjectId, type Collection, type Filter } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { DossierDocument, ListDossiersFilter } from "./dossier.types";

const DOSSIERS_COLLECTION = "dossiers";
let dossiersIndexesReady: Promise<string[]> | null = null;

async function dossiersCollection(): Promise<Collection<DossierDocument>> {
  const db = await getDb();
  const collection = db.collection<DossierDocument>(DOSSIERS_COLLECTION);
  dossiersIndexesReady ??= Promise.all([
    collection.createIndex({ lead_id: 1 }),
    collection.createIndex({ assigned_agent_id: 1, createdAt: -1 }),
    collection.createIndex({ status: 1, createdAt: -1 }),
    collection.createIndex({ product: 1, sector: 1, source_type: 1 }),
  ]);
  await dossiersIndexesReady;
  return collection;
}

export class DossierRepository {
  async create(dossier: DossierDocument): Promise<DossierDocument> {
    const collection = await dossiersCollection();
    const result = await collection.insertOne(dossier);
    return { ...dossier, _id: result.insertedId };
  }

  async find(filter: ListDossiersFilter): Promise<DossierDocument[]> {
    const collection = await dossiersCollection();
    const query: Filter<DossierDocument> = {};

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
        { product: { $regex: search, $options: "i" } },
        { sector: { $regex: search, $options: "i" } },
        { source_type: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    return collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(filter.limit ?? 100)
      .toArray();
  }

  async findById(id: string): Promise<DossierDocument | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await dossiersCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  }

  async findByLeadId(leadId: string): Promise<DossierDocument | null> {
    const collection = await dossiersCollection();
    return collection.findOne({ lead_id: leadId });
  }

  async updateById(
    id: string,
    updates: Partial<Omit<DossierDocument, "_id" | "createdAt">>,
  ): Promise<DossierDocument | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await dossiersCollection();
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

