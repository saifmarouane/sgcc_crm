import type {
  NombreVenteDocument,
  PublicNombreVente,
} from "./nombre-vente.types";

export function toPublicNombreVente(
  vente: NombreVenteDocument,
): PublicNombreVente {
  if (!vente._id) {
    throw new Error("Cannot map nombre vente without _id.");
  }

  return {
    id: vente._id.toString(),
    user_id: vente.user_id,
    document_id: vente.document_id,
    document_ids: vente.document_ids?.length
      ? vente.document_ids
      : [vente.document_id],
    reference: vente.reference ?? "",
    motif: vente.motif ?? "",
    nombre_vente: vente.nombre_vente,
    saleInsertedAt: vente.saleInsertedAt.toISOString(),
    createdAt: vente.createdAt.toISOString(),
    updatedAt: vente.updatedAt.toISOString(),
  };
}
