import type { JwtUserPayload } from "@/domains/auth/auth.types";
import { LeadService } from "@/domains/leads/lead.service";
import { DossierService } from "@/domains/dossiers/dossier.service";
import { CommissionService } from "@/domains/commissions/commission.service";
import { DOSSIER_STATUS, LEAD_STATUS } from "@/domains/shared/business";
import type { DossierStatus } from "@/domains/shared/business";
import type { DashboardPayload } from "./dashboard.types";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const signedStatuses: DossierStatus[] = [
  DOSSIER_STATUS.SIGNE_ACOMPTE_A_VALIDER,
  DOSSIER_STATUS.ACOMPTE_VALIDE,
  DOSSIER_STATUS.DEPOT_MPR,
  DOSSIER_STATUS.POSE_SOLDE_A_VALIDER,
  DOSSIER_STATUS.SOLDE_VALIDE,
  DOSSIER_STATUS.ARCHIVE,
];
const installedStatuses: DossierStatus[] = [
  DOSSIER_STATUS.POSE_SOLDE_A_VALIDER,
  DOSSIER_STATUS.SOLDE_VALIDE,
  DOSSIER_STATUS.ARCHIVE,
];
const closedStatuses: DossierStatus[] = [
  DOSSIER_STATUS.ARCHIVE,
  DOSSIER_STATUS.ANNULE,
  DOSSIER_STATUS.PERDU,
];

export class DashboardService {
  constructor(
    private readonly leadService = new LeadService(),
    private readonly dossierService = new DossierService(),
    private readonly commissionService = new CommissionService(),
  ) {}

  async getOverview(actor: JwtUserPayload): Promise<DashboardPayload> {
    const [leads, dossiers, commissions] = await Promise.all([
      this.leadService.list(actor, { limit: 200 }),
      this.dossierService.list(actor, { limit: 200 }),
      this.commissionService.list(actor, { limit: 200 }),
    ]);
    const now = Date.now();

    return {
      scope: actor.role === "admin" ? "global" : actor.role === "manager" ? "team" : "agent",
      kpi: {
        total_leads: leads.length,
        leads_qualified: leads.filter((lead) => lead.status === LEAD_STATUS.QUALIFIE).length,
        leads_converted: leads.filter((lead) => lead.status === LEAD_STATUS.CONVERTI).length,
        total_dossiers: dossiers.length,
        dossiers_signed: dossiers.filter((dossier) =>
          signedStatuses.includes(dossier.status),
        ).length,
        dossiers_installed: dossiers.filter((dossier) =>
          installedStatuses.includes(dossier.status),
        ).length,
        dossiers_pending_over_30_days: dossiers.filter((dossier) => {
          if (
            closedStatuses.includes(dossier.status)
          ) {
            return false;
          }

          return now - new Date(dossier.updatedAt).getTime() > THIRTY_DAYS_MS;
        }).length,
        total_commissions: commissions.length,
        commissions_amount: commissions.reduce(
          (total, commission) => total + commission.total_amount,
          0,
        ),
        pending_deposit_amount: commissions
          .filter((commission) => commission.deposit_status === "ACOMPTE_EN_ATTENTE")
          .reduce((total, commission) => total + commission.deposit_amount, 0),
        pending_balance_amount: commissions
          .filter((commission) => commission.balance_status === "SOLDE_EN_ATTENTE")
          .reduce((total, commission) => total + commission.balance_amount, 0),
        paid_amount: commissions.reduce((total, commission) => {
          const depositPaid =
            commission.deposit_status === "ACOMPTE_PAYE"
              ? commission.deposit_amount
              : 0;
          const balancePaid =
            commission.balance_status === "SOLDE_PAYE"
              ? commission.balance_amount
              : 0;

          return total + depositPaid + balancePaid;
        }, 0),
      },
    };
  }
}
