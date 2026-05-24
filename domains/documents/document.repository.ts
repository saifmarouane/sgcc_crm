import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { DocumentRecord } from "./document.types";

const DOCUMENTS_COLLECTION = "documents";

async function documentsCollection(): Promise<Collection<DocumentRecord>> {
  const db = await getDb();
  const collection = db.collection<DocumentRecord>(DOCUMENTS_COLLECTION);
  await collection.createIndex({ user_id: 1 });
  return collection;
}

export class DocumentRepository {
  async create(document: DocumentRecord): Promise<DocumentRecord> {
    const collection = await documentsCollection();
    const result = await collection.insertOne(document);
    return { ...document, _id: result.insertedId };
  }

  async findAll(): Promise<DocumentRecord[]> {
    const collection = await documentsCollection();
    return collection.find().sort({ createdAt: -1 }).toArray();
  }

  async findById(id: string): Promise<DocumentRecord | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await documentsCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  }

  async updateFile(id: string, documentFile: string): Promise<DocumentRecord | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await documentsCollection();
    return collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          document_file: documentFile,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
  }

  async delete(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }

    const collection = await documentsCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }
}
