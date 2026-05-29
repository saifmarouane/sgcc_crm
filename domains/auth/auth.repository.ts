import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { UserDocument } from "./auth.types";

const USERS_COLLECTION = "users";
let usersIndexesReady: Promise<string> | null = null;

async function usersCollection(): Promise<Collection<UserDocument>> {
  const db = await getDb();
  const collection = db.collection<UserDocument>(USERS_COLLECTION);
  usersIndexesReady ??= collection.createIndex({ email: 1 }, { unique: true });
  await usersIndexesReady;
  return collection;
}

export class AuthRepository {
  async create(user: UserDocument): Promise<UserDocument> {
    const collection = await usersCollection();
    const result = await collection.insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    const collection = await usersCollection();
    return collection.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await usersCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  }

  async findAll(): Promise<UserDocument[]> {
    const collection = await usersCollection();
    return collection.find().sort({ createdAt: -1 }).toArray();
  }

  async updateById(
    id: string,
    updates: Partial<
      Pick<
        UserDocument,
        "name" | "email" | "phone" | "image" | "role" | "department_id"
      >
    >,
  ): Promise<UserDocument | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await usersCollection();
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

  async deleteById(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }

    const collection = await usersCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }
}
