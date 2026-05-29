import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { NombreVenteDocument } from "./nombre-vente.types";

const NOMBRE_VENTES_COLLECTION = "nombre_ventes";
let nombreVentesIndexesReady: Promise<string[]> | null = null;

async function nombreVentesCollection(): Promise<Collection<NombreVenteDocument>> {
  const db = await getDb();
  const collection = db.collection<NombreVenteDocument>(
    NOMBRE_VENTES_COLLECTION,
  );
  nombreVentesIndexesReady ??= Promise.all([
    collection.createIndex({ user_id: 1 }),
    collection.createIndex({ document_id: 1 }),
    collection.createIndex({ user_id: 1, document_id: 1 }, { unique: true }),
  ]);
  await nombreVentesIndexesReady;
  return collection;
}

export class NombreVenteRepository {
  async incrementByUserAndDocument(
    userId: string,
    documentId: string,
    documentIds: string[],
    reference: string,
    motif: string,
  ): Promise<NombreVenteDocument> {
    const now = new Date();
    const collection = await nombreVentesCollection();

    const vente = await collection.findOneAndUpdate(
      { user_id: userId, document_id: documentId },
      {
        $setOnInsert: {
          user_id: userId,
          document_id: documentId,
          document_ids: documentIds,
          reference,
          motif,
          saleInsertedAt: now,
          createdAt: now,
        },
        $inc: { nombre_vente: 1 },
        $set: { updatedAt: now },
      },
      { upsert: true, returnDocument: "after" },
    );

    if (!vente) {
      throw new Error("Failed to increment nombre_vente.");
    }

    return vente;
  }

  async addDocumentIds(
    id: string,
    userId: string,
    documentIds: string[],
  ): Promise<NombreVenteDocument | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await nombreVentesCollection();
    return collection.findOneAndUpdate(
      { _id: new ObjectId(id), user_id: userId },
      {
        $addToSet: { document_ids: { $each: documentIds } },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" },
    );
  }

  async incrementById(id: string): Promise<NombreVenteDocument | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await nombreVentesCollection();
    return collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $inc: { nombre_vente: 1 },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" },
    );
  }

  async findAll(): Promise<NombreVenteDocument[]> {
    const collection = await nombreVentesCollection();
    return collection.find().sort({ updatedAt: -1 }).toArray();
  }

  async findByUserId(userId: string): Promise<NombreVenteDocument[]> {
    const collection = await nombreVentesCollection();
    return collection.find({ user_id: userId }).sort({ updatedAt: -1 }).toArray();
  }

  async findById(id: string): Promise<NombreVenteDocument | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await nombreVentesCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  }

  async delete(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }

    const collection = await nombreVentesCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }
}
