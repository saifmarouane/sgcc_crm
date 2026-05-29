import type { JwtUserPayload } from "@/domains/auth/auth.types";
import { CommissionService } from "@/domains/commissions/commission.service";
import { DossierService } from "@/domains/dossiers/dossier.service";
import { toCsv } from "./csv";

export class ReportService {
  constructor(
    private readonly commissionService = new CommissionService(),
    private readonly dossierService = new DossierService(),
  ) {}

  async exportCommissionsCsv(actor: JwtUserPayload): Promise<string> {
    const commissions = await this.commissionService.list(actor, { limit: 200 });

    return toCsv(
      commissions.map((commission) => ({
        commission_id: commission.id,
        dossier_id: commission.dossier_id,
        agent_id: commission.agent_id,
        total_amount: commission.total_amount,
        deposit_amount: commission.deposit_amount,
        balance_amount: commission.balance_amount,
        deposit_status: commission.deposit_status,
        balance_status: commission.balance_status,
        global_status: commission.global_status,
        calculated_at: commission.calculated_at,
        deposit_validated_at: commission.deposit_validated_at ?? "",
        balance_validated_at: commission.balance_validated_at ?? "",
        deposit_paid_at: commission.deposit_paid_at ?? "",
        balance_paid_at: commission.balance_paid_at ?? "",
      })),
    );
  }

  async exportDossiersCsv(actor: JwtUserPayload): Promise<string> {
    const dossiers = await this.dossierService.list(actor, { limit: 200 });

    return toCsv(
      dossiers.map((dossier) => ({
        dossier_id: dossier.id,
        lead_id: dossier.lead_id,
        client_id: dossier.client_id,
        agent_id: dossier.assigned_agent_id,
        product: dossier.product,
        color: dossier.color,
        sector: dossier.sector,
        surface_range: dossier.surface_range,
        source_type: dossier.source_type,
        status: dossier.status,
        first_contact_date: dossier.first_contact_date ?? "",
        appointment_date: dossier.appointment_date ?? "",
        quote_sent_date: dossier.quote_sent_date ?? "",
        signature_date: dossier.signature_date ?? "",
        mpr_deposit_date: dossier.mpr_deposit_date ?? "",
        installation_date: dossier.installation_date ?? "",
        created_at: dossier.createdAt,
        updated_at: dossier.updatedAt,
      })),
    );
  }
}

