import { AppError } from "@/domains/shared/app-error";
import { toPublicNombreVente } from "./nombre-vente.mapper";
import { NombreVenteRepository } from "./nombre-vente.repository";
import type {
  IncrementNombreVenteInput,
  PublicNombreVente,
} from "./nombre-vente.types";

export class NombreVenteService {
  constructor(private readonly repository = new NombreVenteRepository()) {}

  async increment(input: IncrementNombreVenteInput): Promise<PublicNombreVente> {
    const data = validateIncrementInput(input);
    const vente = await this.repository.incrementByUserAndDocument(
      data.user_id,
      data.document_id,
      data.reference ?? generateSaleReference(),
    );

    return toPublicNombreVente(vente);
  }

  async list(): Promise<PublicNombreVente[]> {
    const ventes = await this.repository.findAll();
    return ventes.map(toPublicNombreVente);
  }

  async listByUserId(userId: string): Promise<PublicNombreVente[]> {
    const ventes = await this.repository.findByUserId(userId);
    return ventes.map(toPublicNombreVente);
  }

  async getById(id: string): Promise<PublicNombreVente> {
    const vente = await this.repository.findById(id);

    if (!vente) {
      throw new AppError("Nombre vente not found.", 404);
    }

    return toPublicNombreVente(vente);
  }

  async incrementById(id: string): Promise<PublicNombreVente> {
    const vente = await this.repository.incrementById(id);

    if (!vente) {
      throw new AppError("Nombre vente not found.", 404);
    }

    return toPublicNombreVente(vente);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new AppError("Nombre vente not found.", 404);
    }
  }
}

function validateIncrementInput(
  input: IncrementNombreVenteInput,
): IncrementNombreVenteInput {
  const userId = input.user_id?.trim();
  const documentId = input.document_id?.trim();
  const reference = input.reference?.trim() || generateSaleReference();

  if (!userId) {
    throw new AppError("user_id is required.", 400);
  }

  if (!documentId) {
    throw new AppError("document_id is required.", 400);
  }

  return {
    user_id: userId,
    document_id: documentId,
    reference,
  };
}

function generateSaleReference(): string {
  const date = new Date();
  const day = date.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `VTE-${day}-${suffix}`;
}
