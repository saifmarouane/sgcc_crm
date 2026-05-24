import { AppError } from "@/domains/shared/app-error";
import { toPublicDocument } from "./document.mapper";
import { DocumentRepository } from "./document.repository";
import type {
  CreateDocumentInput,
  PublicDocument,
  UpdateDocumentInput,
} from "./document.types";

export class DocumentService {
  constructor(private readonly repository = new DocumentRepository()) {}

  async create(input: CreateDocumentInput): Promise<PublicDocument> {
    const data = validateCreateDocument(input);
    const now = new Date();

    const document = await this.repository.create({
      user_id: data.user_id,
      document_file: data.document_file,
      createdAt: now,
      updatedAt: now,
    });

    return toPublicDocument(document);
  }

  async list(): Promise<PublicDocument[]> {
    const documents = await this.repository.findAll();
    return documents.map(toPublicDocument);
  }

  async getById(id: string): Promise<PublicDocument> {
    const document = await this.repository.findById(id);

    if (!document) {
      throw new AppError("Document not found.", 404);
    }

    return toPublicDocument(document);
  }

  async update(id: string, input: UpdateDocumentInput): Promise<PublicDocument> {
    const documentFile = validateDocumentFile(input.document_file);
    const document = await this.repository.updateFile(id, documentFile);

    if (!document) {
      throw new AppError("Document not found.", 404);
    }

    return toPublicDocument(document);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new AppError("Document not found.", 404);
    }
  }
}

function validateCreateDocument(input: CreateDocumentInput): CreateDocumentInput {
  const userId = input.user_id?.trim();
  const documentFile = validateDocumentFile(input.document_file);

  if (!userId) {
    throw new AppError("user_id is required.", 400);
  }

  return { user_id: userId, document_file: documentFile };
}

function validateDocumentFile(documentFile: string): string {
  const value = documentFile?.trim();

  if (!value) {
    throw new AppError("document_file is required.", 400);
  }

  return value;
}
