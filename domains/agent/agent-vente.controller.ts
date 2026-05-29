import { NextResponse, type NextRequest } from "next/server";
import { AppError } from "@/domains/auth/auth.errors";
import { getBearerToken } from "@/domains/auth/auth.controller";
import { verifyAuthToken } from "@/domains/auth/jwt";
import { DocumentService } from "@/domains/documents/document.service";
import { NombreVenteService } from "@/domains/nombre-ventes/nombre-vente.service";

const documentService = new DocumentService();
const nombreVenteService = new NombreVenteService();

export async function createAgentVente(request: NextRequest) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      throw new AppError("Authorization bearer token is required.", 401);
    }

    const payload = verifyAuthToken(token);

    if (payload.role !== "agent") {
      throw new AppError("Only agents can insert sales.", 403);
    }

    const body = await request.json();
    const files: unknown[] = Array.isArray(body.factures)
      ? body.factures
      : [body.facture ?? body.document_file];
    const factures = files
      .map((file) => (typeof file === "string" ? file.trim() : ""))
      .filter(Boolean);
    const motif = typeof body.motif === "string" ? body.motif.trim() : "";

    if (!factures.length) {
      throw new AppError("at least one facture is required.", 400);
    }

    const documents = await Promise.all(
      factures.map((facture) =>
        documentService.create({
          user_id: payload.sub,
          document_file: facture,
        }),
      ),
    );
    const reference = generateSaleReference();
    const nombre_vente = await nombreVenteService.increment({
      user_id: payload.sub,
      document_id: documents[0].id,
      document_ids: documents.map((document) => document.id),
      reference,
      motif,
    });

    return NextResponse.json(
      {
        vente: {
          reference,
          documents,
          nombre_vente,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleAgentError(error);
  }
}

export async function addAgentVenteDocuments(request: NextRequest) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      throw new AppError("Authorization bearer token is required.", 401);
    }

    const payload = verifyAuthToken(token);

    if (payload.role !== "agent") {
      throw new AppError("Only agents can update their sales.", 403);
    }

    const body = await request.json();
    const venteId = typeof body.vente_id === "string" ? body.vente_id.trim() : "";
    const files: unknown[] = Array.isArray(body.factures)
      ? body.factures
      : [body.facture ?? body.document_file];
    const factures = files
      .map((file) => (typeof file === "string" ? file.trim() : ""))
      .filter(Boolean);

    if (!venteId) {
      throw new AppError("vente_id is required.", 400);
    }

    if (!factures.length) {
      throw new AppError("at least one facture is required.", 400);
    }

    const documents = await Promise.all(
      factures.map((facture) =>
        documentService.create({
          user_id: payload.sub,
          document_file: facture,
        }),
      ),
    );
    const vente = await nombreVenteService.addDocuments({
      id: venteId,
      user_id: payload.sub,
      document_ids: documents.map((document) => document.id),
    });

    return NextResponse.json({ vente, documents });
  } catch (error) {
    return handleAgentError(error);
  }
}

export async function listAgentVentes(request: NextRequest) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      throw new AppError("Authorization bearer token is required.", 401);
    }

    const payload = verifyAuthToken(token);

    if (payload.role !== "agent") {
      throw new AppError("Only agents can view their sales.", 403);
    }

    const ventes = await nombreVenteService.listByUserId(payload.sub);
    const documentIds = Array.from(
      new Set(ventes.flatMap((vente) => vente.document_ids)),
    );
    const documents = await documentService.listByIds(documentIds);
    const documentById = new Map(
      documents.map((document) => [document.id, document]),
    );
    const enrichedVentes = ventes.map((vente) => {
      const venteDocuments = vente.document_ids
        .map((documentId) => documentById.get(documentId))
        .filter((document) => document !== undefined);

      return {
        ...vente,
        document: venteDocuments[0] ?? null,
        documents: venteDocuments,
      };
    });

    return NextResponse.json({ ventes: enrichedVentes });
  } catch (error) {
    return handleAgentError(error);
  }
}

function generateSaleReference(): string {
  const date = new Date();
  const day = date.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `FAC-${day}-${suffix}`;
}

function handleAgentError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode },
    );
  }

  if (error instanceof Error && error.name === "JsonWebTokenError") {
    return NextResponse.json({ error: "Invalid token." }, { status: 401 });
  }

  if (error instanceof Error && error.name === "TokenExpiredError") {
    return NextResponse.json({ error: "Token expired." }, { status: 401 });
  }

  const message =
    error instanceof Error ? error.message : "Unexpected agent vente error.";

  return NextResponse.json({ error: message }, { status: 500 });
}
