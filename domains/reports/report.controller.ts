import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/domains/shared/auth";
import { handleHttpError } from "@/domains/shared/http";
import { ReportService } from "./report.service";

const reportService = new ReportService();

export async function exportCommissionsCsv(request: NextRequest) {
  try {
    const actor = requireAuth(request);
    const csv = await reportService.exportCommissionsCsv(actor);
    return createCsvResponse(csv, "commissions.csv");
  } catch (error) {
    return handleHttpError(error);
  }
}

export async function exportDossiersCsv(request: NextRequest) {
  try {
    const actor = requireAuth(request);
    const csv = await reportService.exportDossiersCsv(actor);
    return createCsvResponse(csv, "dossiers.csv");
  } catch (error) {
    return handleHttpError(error);
  }
}

function createCsvResponse(csv: string, filename: string): NextResponse {
  return new NextResponse(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}

