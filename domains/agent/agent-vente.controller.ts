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
    const facture = body.facture?.trim() || body.document_file?.trim();

    if (!facture) {
      throw new AppError("facture is required.", 400);
    }

    const document = await documentService.create({
      user_id: payload.sub,
      document_file: facture,
    });
    const reference = generateSaleReference();
    const nombre_vente = await nombreVenteService.increment({
      user_id: payload.sub,
      document_id: document.id,
      reference,
    });

    return NextResponse.json(
      {
        vente: {
          reference,
          document,
          nombre_vente,
        },
      },
      { status: 201 },
    );
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
    return NextResponse.json({ ventes });
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
