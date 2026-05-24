import { NextResponse, type NextRequest } from "next/server";
import { handleHttpError } from "@/domains/shared/http";
import { requireRole } from "@/domains/shared/auth";
import { NombreVenteService } from "./nombre-vente.service";

const nombreVenteService = new NombreVenteService();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function incrementNombreVente(request: NextRequest) {
  try {
    requireRole(request, "admin");
    const body = await request.json();
    const nombre_vente = await nombreVenteService.increment(body);
    return NextResponse.json({ nombre_vente }, { status: 201 });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function listNombreVentes(request: NextRequest) {
  try {
    requireRole(request, "admin");
    const nombre_ventes = await nombreVenteService.list();
    return NextResponse.json({ nombre_ventes });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function getNombreVente(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    requireRole(_request, "admin");
    const { id } = await context.params;
    const nombre_vente = await nombreVenteService.getById(id);
    return NextResponse.json({ nombre_vente });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function incrementNombreVenteById(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    requireRole(_request, "admin");
    const { id } = await context.params;
    const nombre_vente = await nombreVenteService.incrementById(id);
    return NextResponse.json({ nombre_vente });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function deleteNombreVente(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    requireRole(_request, "admin");
    const { id } = await context.params;
    await nombreVenteService.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleHttpError(error);
  }
}
