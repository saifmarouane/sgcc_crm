import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { DepartmentDocument } from "./department.types";

const DEPARTMENTS_COLLECTION = "departments";

async function departmentsCollection(): Promise<Collection<DepartmentDocument>> {
  const db = await getDb();
  const collection = db.collection<DepartmentDocument>(DEPARTMENTS_COLLECTION);
  await collection.createIndex({ name: 1 }, { unique: true });
  return collection;
}

export class DepartmentRepository {
  async create(department: DepartmentDocument): Promise<DepartmentDocument> {
    const collection = await departmentsCollection();
    const result = await collection.insertOne(department);
    return { ...department, _id: result.insertedId };
  }

  async findAll(): Promise<DepartmentDocument[]> {
    const collection = await departmentsCollection();
    return collection.find().sort({ name: 1 }).toArray();
  }

  async findById(id: string): Promise<DepartmentDocument | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await departmentsCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  }

  async findByName(name: string): Promise<DepartmentDocument | null> {
    const collection = await departmentsCollection();
    return collection.findOne({ name });
  }

  async updateById(
    id: string,
    updates: Pick<DepartmentDocument, "name">,
  ): Promise<DepartmentDocument | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await departmentsCollection();
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

    const collection = await departmentsCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }
}
