import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { ScoreDocument } from "./score.types";

const SCORES_COLLECTION = "scores";

async function scoresCollection(): Promise<Collection<ScoreDocument>> {
  const db = await getDb();
  const collection = db.collection<ScoreDocument>(SCORES_COLLECTION);
  await collection.createIndex({ user_id: 1 });
  return collection;
}

export class ScoreRepository {
  async create(score: ScoreDocument): Promise<ScoreDocument> {
    const collection = await scoresCollection();
    const result = await collection.insertOne(score);
    return { ...score, _id: result.insertedId };
  }

  async findAll(): Promise<ScoreDocument[]> {
    const collection = await scoresCollection();
    return collection.find().sort({ updatedAt: -1 }).toArray();
  }

  async findById(id: string): Promise<ScoreDocument | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await scoresCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  }

  async updateScore(id: string, score: number): Promise<ScoreDocument | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const now = new Date();
    const collection = await scoresCollection();
    return collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          score,
          scoreUpdatedAt: now,
          updatedAt: now,
        },
      },
      { returnDocument: "after" },
    );
  }

  async delete(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }

    const collection = await scoresCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }
}
