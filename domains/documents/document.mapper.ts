import type { DocumentRecord, PublicDocument } from "./document.types";

export function toPublicDocument(document: DocumentRecord): PublicDocument {
  if (!document._id) {
    throw new Error("Cannot map document without _id.");
  }

  return {
    id: document._id.toString(),
    user_id: document.user_id,
    document_file: document.document_file,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}
