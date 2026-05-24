import { NextResponse, type NextRequest } from "next/server";
import { handleHttpError } from "@/domains/shared/http";
import { DocumentService } from "./document.service";

const documentService = new DocumentService();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function createDocument(request: NextRequest) {
  try {
    const body = await request.json();
    const document = await documentService.create(body);
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function listDocuments() {
  try {
    const documents = await documentService.list();
    return NextResponse.json({ documents });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function getDocument(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const document = await documentService.getById(id);
    return NextResponse.json({ document });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function updateDocument(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const document = await documentService.update(id, body);
    return NextResponse.json({ document });
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function deleteDocument(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    await documentService.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleHttpError(error);
  }
}
