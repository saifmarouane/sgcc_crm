import type { ObjectId } from "mongodb";

export type DocumentRecord = {
  _id?: ObjectId;
  user_id: string;
  document_file: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicDocument = {
  id: string;
  user_id: string;
  document_file: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateDocumentInput = {
  user_id: string;
  document_file: string;
};

export type UpdateDocumentInput = {
  document_file: string;
};
