import { ObjectId, type Collection, type Filter } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type {
  EligibilityAnswerDocument,
  ListEligibilityFilter,
  ProspectAppointmentRecord,
  ProspectDocumentRecord,
  ProspectNoteRecord,
} from "./eligibility.types";

const ANSWERS_COLLECTION = "prospect_eligibility_answers";
const DOCUMENTS_COLLECTION = "prospect_documents";
const NOTES_COLLECTION = "prospect_notes";
const APPOINTMENTS_COLLECTION = "prospect_appointments";

let answersIndexesReady: Promise<string[]> | null = null;
let documentsIndexesReady: Promise<string[]> | null = null;
let notesIndexesReady: Promise<string[]> | null = null;
let appointmentsIndexesReady: Promise<string[]> | null = null;

async function answersCollection(): Promise<Collection<EligibilityAnswerDocument>> {
  const db = await getDb();
  const collection = db.collection<EligibilityAnswerDocument>(ANSWERS_COLLECTION);
  answersIndexesReady ??= Promise.all([
    collection.createIndex({ lead_id: 1 }, { unique: true }),
    collection.createIndex({ eligibility_status: 1, updatedAt: -1 }),
    collection.createIndex({ eligible_products: 1 }),
  ]);
  await answersIndexesReady;
  return collection;
}

async function documentsCollection(): Promise<Collection<ProspectDocumentRecord>> {
  const db = await getDb();
  const collection = db.collection<ProspectDocumentRecord>(DOCUMENTS_COLLECTION);
  documentsIndexesReady ??= Promise.all([
    collection.createIndex({ lead_id: 1, document_type: 1 }),
    collection.createIndex({ uploaded_by: 1, uploaded_at: -1 }),
  ]);
  await documentsIndexesReady;
  return collection;
}

async function notesCollection(): Promise<Collection<ProspectNoteRecord>> {
  const db = await getDb();
  const collection = db.collection<ProspectNoteRecord>(NOTES_COLLECTION);
  notesIndexesReady ??= Promise.all([
    collection.createIndex({ lead_id: 1, createdAt: -1 }),
    collection.createIndex({ user_id: 1, createdAt: -1 }),
  ]);
  await notesIndexesReady;
  return collection;
}

async function appointmentsCollection(): Promise<
  Collection<ProspectAppointmentRecord>
> {
  const db = await getDb();
  const collection =
    db.collection<ProspectAppointmentRecord>(APPOINTMENTS_COLLECTION);
  appointmentsIndexesReady ??= Promise.all([
    collection.createIndex({ lead_id: 1, appointment_at: -1 }),
    collection.createIndex({ agent_id: 1, appointment_at: -1 }),
    collection.createIndex({ status: 1, appointment_at: -1 }),
  ]);
  await appointmentsIndexesReady;
  return collection;
}

export class EligibilityRepository {
  async upsertAnswer(
    leadId: string,
    answer: EligibilityAnswerDocument,
  ): Promise<EligibilityAnswerDocument> {
    const collection = await answersCollection();
    const existing = await collection.findOne({ lead_id: leadId });

    if (existing) {
      const updated = await collection.findOneAndUpdate(
        { lead_id: leadId },
        {
          $set: {
            ...answer,
            _id: existing._id,
            createdAt: existing.createdAt,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" },
      );
      return updated ?? { ...answer, _id: existing._id };
    }

    const result = await collection.insertOne(answer);
    return { ...answer, _id: result.insertedId };
  }

  async findAnswerByLeadId(
    leadId: string,
  ): Promise<EligibilityAnswerDocument | null> {
    const collection = await answersCollection();
    return collection.findOne({ lead_id: leadId });
  }

  async createDocument(
    document: ProspectDocumentRecord,
  ): Promise<ProspectDocumentRecord> {
    const collection = await documentsCollection();
    const result = await collection.insertOne(document);
    return { ...document, _id: result.insertedId };
  }

  async findDocumentsByLeadId(leadId: string): Promise<ProspectDocumentRecord[]> {
    const collection = await documentsCollection();
    return collection.find({ lead_id: leadId }).sort({ createdAt: -1 }).toArray();
  }

  async deleteDocument(leadId: string, documentId: string): Promise<boolean> {
    if (!ObjectId.isValid(documentId)) {
      return false;
    }

    const collection = await documentsCollection();
    const result = await collection.deleteOne({
      _id: new ObjectId(documentId),
      lead_id: leadId,
    });
    return result.deletedCount === 1;
  }

  async createNote(note: ProspectNoteRecord): Promise<ProspectNoteRecord> {
    const collection = await notesCollection();
    const result = await collection.insertOne(note);
    return { ...note, _id: result.insertedId };
  }

  async findNotesByLeadId(leadId: string): Promise<ProspectNoteRecord[]> {
    const collection = await notesCollection();
    return collection.find({ lead_id: leadId }).sort({ createdAt: -1 }).toArray();
  }

  async createAppointment(
    appointment: ProspectAppointmentRecord,
  ): Promise<ProspectAppointmentRecord> {
    const collection = await appointmentsCollection();
    const result = await collection.insertOne(appointment);
    return { ...appointment, _id: result.insertedId };
  }

  async findAppointmentsByLeadId(
    leadId: string,
  ): Promise<ProspectAppointmentRecord[]> {
    const collection = await appointmentsCollection();
    return collection
      .find({ lead_id: leadId })
      .sort({ appointment_at: -1 })
      .toArray();
  }

  async findAppointments(
    filter: ListEligibilityFilter,
  ): Promise<ProspectAppointmentRecord[]> {
    const collection = await appointmentsCollection();
    const query: Filter<ProspectAppointmentRecord> = {};

    if (filter.assigned_agent_id) {
      query.agent_id = filter.assigned_agent_id;
    }

    if (filter.assigned_agent_ids) {
      query.agent_id = { $in: filter.assigned_agent_ids };
    }

    if (filter.date_from || filter.date_to) {
      query.appointment_at = {};

      if (filter.date_from) {
        query.appointment_at.$gte = filter.date_from;
      }

      if (filter.date_to) {
        query.appointment_at.$lte = filter.date_to;
      }
    }

    return collection
      .find(query)
      .sort({ appointment_at: -1 })
      .limit(filter.limit ?? 100)
      .toArray();
  }
}
