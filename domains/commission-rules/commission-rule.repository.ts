import { ObjectId, type Collection, type Filter } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type {
  CommissionRuleDocument,
  ListCommissionRulesFilter,
} from "./commission-rule.types";

const COMMISSION_RULES_COLLECTION = "commission_rules";
let commissionRulesIndexesReady: Promise<string[]> | null = null;

async function commissionRulesCollection(): Promise<
  Collection<CommissionRuleDocument>
> {
  const db = await getDb();
  const collection = db.collection<CommissionRuleDocument>(
    COMMISSION_RULES_COLLECTION,
  );
  commissionRulesIndexesReady ??= Promise.all([
    collection.createIndex({
      product: 1,
      color: 1,
      sector: 1,
      surface_range: 1,
      source_type: 1,
      is_active: 1,
    }),
    collection.createIndex({ is_active: 1, updatedAt: -1 }),
  ]);
  await commissionRulesIndexesReady;
  return collection;
}

export class CommissionRuleRepository {
  async create(
    commissionRule: CommissionRuleDocument,
  ): Promise<CommissionRuleDocument> {
    const collection = await commissionRulesCollection();
    const result = await collection.insertOne(commissionRule);
    return { ...commissionRule, _id: result.insertedId };
  }

  async find(
    filter: ListCommissionRulesFilter,
  ): Promise<CommissionRuleDocument[]> {
    const collection = await commissionRulesCollection();
    const query: Filter<CommissionRuleDocument> = {};

    if (filter.is_active !== undefined) {
      query.is_active = filter.is_active;
    }

    if (filter.product) {
      query.product = filter.product;
    }

    if (filter.color) {
      query.color = filter.color;
    }

    if (filter.sector) {
      query.sector = filter.sector;
    }

    if (filter.surface_range) {
      query.surface_range = filter.surface_range;
    }

    if (filter.source_type) {
      query.source_type = filter.source_type;
    }

    return collection
      .find(query)
      .sort({ is_active: -1, version: -1, updatedAt: -1 })
      .limit(filter.limit ?? 200)
      .toArray();
  }

  async findById(id: string): Promise<CommissionRuleDocument | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await commissionRulesCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  }

  async findActiveDuplicate(
    rule: Pick<
      CommissionRuleDocument,
      "product" | "color" | "sector" | "surface_range" | "source_type"
    >,
    excludedId?: string,
  ): Promise<CommissionRuleDocument | null> {
    const collection = await commissionRulesCollection();
    const query: Filter<CommissionRuleDocument> = {
      product: rule.product,
      color: rule.color,
      sector: rule.sector,
      surface_range: rule.surface_range,
      source_type: rule.source_type,
      is_active: true,
    };

    if (excludedId && ObjectId.isValid(excludedId)) {
      query._id = { $ne: new ObjectId(excludedId) };
    }

    return collection.findOne(query);
  }

  async findActiveMatch(
    rule: Pick<
      CommissionRuleDocument,
      "product" | "color" | "sector" | "surface_range" | "source_type"
    >,
    at = new Date(),
  ): Promise<CommissionRuleDocument | null> {
    const collection = await commissionRulesCollection();
    return collection.findOne(
      {
        product: rule.product,
        color: rule.color,
        sector: rule.sector,
        surface_range: rule.surface_range,
        source_type: rule.source_type,
        is_active: true,
        $and: [
          {
            $or: [{ starts_at: null }, { starts_at: { $lte: at } }],
          },
          {
            $or: [{ ends_at: null }, { ends_at: { $gte: at } }],
          },
        ],
      },
      { sort: { version: -1, updatedAt: -1 } },
    );
  }

  async updateById(
    id: string,
    updates: Partial<Omit<CommissionRuleDocument, "_id" | "createdAt">>,
  ): Promise<CommissionRuleDocument | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await commissionRulesCollection();
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
