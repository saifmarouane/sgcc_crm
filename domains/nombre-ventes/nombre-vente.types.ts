import type { ObjectId } from "mongodb";

export type NombreVenteDocument = {
  _id?: ObjectId;
  user_id: string;
  document_id: string;
  reference: string;
  nombre_vente: number;
  saleInsertedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicNombreVente = {
  id: string;
  user_id: string;
  document_id: string;
  reference: string;
  nombre_vente: number;
  saleInsertedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type IncrementNombreVenteInput = {
  user_id: string;
  document_id: string;
  reference?: string;
};
