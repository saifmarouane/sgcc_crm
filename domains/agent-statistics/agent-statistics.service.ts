import { AuthService } from "@/domains/auth/auth.service";
import type { JwtUserPayload } from "@/domains/auth/auth.types";
import { CommissionService } from "@/domains/commissions/commission.service";
import { DepartmentService } from "@/domains/departments/department.service";
import { DocumentService } from "@/domains/documents/document.service";
import { DossierService } from "@/domains/dossiers/dossier.service";
import { LeadService } from "@/domains/leads/lead.service";
import { NombreVenteService } from "@/domains/nombre-ventes/nombre-vente.service";
import type {
  AgentStatisticRow,
  AgentStatisticsPayload,
} from "./agent-statistics.types";

export class AgentStatisticsService {
  constructor(
    private readonly authService = new AuthService(),
    private readonly departmentService = new DepartmentService(),
    private readonly documentService = new DocumentService(),
    private readonly nombreVenteService = new NombreVenteService(),
    private readonly leadService = new LeadService(),
    private readonly dossierService = new DossierService(),
    private readonly commissionService = new CommissionService(),
  ) {}

  async getOverview(actor?: JwtUserPayload): Promise<AgentStatisticsPayload> {
    const [users, departments, documents, ventes] = await Promise.all([
      this.authService.listUsers(),
      this.departmentService.list(),
      this.documentService.list(),
      this.nombreVenteService.list(),
    ]);

    const [leads, dossiers, commissions] = actor
      ? await Promise.all([
          this.leadService.list(actor, { limit: 200 }),
          this.dossierService.list(actor, { limit: 200 }),
          this.commissionService.list(actor, { limit: 200 }),
        ])
      : [[], [], []];

    const departmentById = new Map(
      departments.map((department) => [department.id, department.name]),
    );
    const factureCountByUser = new Map<string, number>();
    const venteStatsByUser = new Map<
      string,
      {
        nombreVentes: number;
        lastSaleAt: string | null;
        lastReference: string;
      }
    >();
    const leadsByUser = new Map<string, { total: number; converted: number }>();
    const dossiersByUser = new Map<
      string,
      { total: number; signed: number; installed: number }
    >();
    const commissionsByUser = new Map<
      string,
      {
        total: number;
        amount: number;
        paidAmount: number;
        pendingAmount: number;
      }
    >();

    for (const document of documents) {
      factureCountByUser.set(
        document.user_id,
        (factureCountByUser.get(document.user_id) ?? 0) + 1,
      );
    }

    for (const vente of ventes) {
      const current = venteStatsByUser.get(vente.user_id) ?? {
        nombreVentes: 0,
        lastSaleAt: null,
        lastReference: "",
      };
      const lastSaleAt =
        !current.lastSaleAt || vente.updatedAt > current.lastSaleAt
          ? vente.updatedAt
          : current.lastSaleAt;

      venteStatsByUser.set(vente.user_id, {
        nombreVentes: current.nombreVentes + vente.nombre_vente,
        lastSaleAt,
        lastReference:
          lastSaleAt === vente.updatedAt
            ? vente.reference
            : current.lastReference,
      });
    }

    for (const lead of leads) {
      const current = leadsByUser.get(lead.assigned_agent_id) ?? {
        total: 0,
        converted: 0,
      };

      leadsByUser.set(lead.assigned_agent_id, {
        total: current.total + 1,
        converted: current.converted + (lead.status === "CONVERTI" ? 1 : 0),
      });
    }

    for (const dossier of dossiers) {
      const current = dossiersByUser.get(dossier.assigned_agent_id) ?? {
        total: 0,
        signed: 0,
        installed: 0,
      };

      dossiersByUser.set(dossier.assigned_agent_id, {
        total: current.total + 1,
        signed:
          current.signed +
          ([
            "SIGNE_ACOMPTE_A_VALIDER",
            "ACOMPTE_VALIDE",
            "DEPOT_MPR",
            "POSE_SOLDE_A_VALIDER",
            "SOLDE_VALIDE",
            "ARCHIVE",
          ].includes(dossier.status)
            ? 1
            : 0),
        installed:
          current.installed +
          (["POSE_SOLDE_A_VALIDER", "SOLDE_VALIDE", "ARCHIVE"].includes(
            dossier.status,
          )
            ? 1
            : 0),
      });
    }

    for (const commission of commissions) {
      const current = commissionsByUser.get(commission.agent_id) ?? {
        total: 0,
        amount: 0,
        paidAmount: 0,
        pendingAmount: 0,
      };
      const paidAmount =
        (commission.deposit_status === "ACOMPTE_PAYE"
          ? commission.deposit_amount
          : 0) +
        (commission.balance_status === "SOLDE_PAYE"
          ? commission.balance_amount
          : 0);

      commissionsByUser.set(commission.agent_id, {
        total: current.total + 1,
        amount: current.amount + commission.total_amount,
        paidAmount: current.paidAmount + paidAmount,
        pendingAmount:
          current.pendingAmount + Math.max(commission.total_amount - paidAmount, 0),
      });
    }

    const visibleUsers =
      actor?.role === "manager"
        ? users.filter((user) => user.department_id === actor.department_id)
        : users;

    const agents = visibleUsers
      .filter((user) => user.role === "agent")
      .map<AgentStatisticRow>((user) => {
        const venteStats = venteStatsByUser.get(user.id);
        const nombreVentes = venteStats?.nombreVentes ?? 0;
        const leadStats = leadsByUser.get(user.id) ?? { total: 0, converted: 0 };
        const dossierStats = dossiersByUser.get(user.id) ?? {
          total: 0,
          signed: 0,
          installed: 0,
        };
        const commissionStats = commissionsByUser.get(user.id) ?? {
          total: 0,
          amount: 0,
          paidAmount: 0,
          pendingAmount: 0,
        };

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          image: user.image,
          departmentId: user.department_id,
          departmentName:
            departmentById.get(user.department_id) ?? "Non assigne",
          nombreVentes,
          nombreFactures: factureCountByUser.get(user.id) ?? 0,
          leadsCount: leadStats.total,
          leadsConverted: leadStats.converted,
          dossiersCount: dossierStats.total,
          dossiersSigned: dossierStats.signed,
          dossiersInstalled: dossierStats.installed,
          commissionsCount: commissionStats.total,
          commissionsAmount: commissionStats.amount,
          commissionsPaidAmount: commissionStats.paidAmount,
          commissionsPendingAmount: commissionStats.pendingAmount,
          conversionRate: leadStats.total
            ? Number(((leadStats.converted / leadStats.total) * 100).toFixed(1))
            : 0,
          signatureRate: dossierStats.total
            ? Number(((dossierStats.signed / dossierStats.total) * 100).toFixed(1))
            : 0,
          lastSaleAt: venteStats?.lastSaleAt ?? null,
          lastReference: venteStats?.lastReference ?? "",
          status:
            nombreVentes > 0 || leadStats.total > 0 || dossierStats.total > 0
              ? "actif"
              : "sans-vente",
        };
      })
      .sort((firstAgent, secondAgent) => {
        if (secondAgent.commissionsAmount !== firstAgent.commissionsAmount) {
          return secondAgent.commissionsAmount - firstAgent.commissionsAmount;
        }

        if (secondAgent.dossiersSigned !== firstAgent.dossiersSigned) {
          return secondAgent.dossiersSigned - firstAgent.dossiersSigned;
        }

        return firstAgent.name.localeCompare(secondAgent.name);
      });

    const totalVentes = agents.reduce(
      (total, agent) => total + agent.nombreVentes,
      0,
    );
    const totalFactures = agents.reduce(
      (total, agent) => total + agent.nombreFactures,
      0,
    );
    const agentsAvecVentes = agents.filter(
      (agent) => agent.nombreVentes > 0,
    ).length;
    const totalLeads = agents.reduce((total, agent) => total + agent.leadsCount, 0);
    const totalLeadsConverted = agents.reduce(
      (total, agent) => total + agent.leadsConverted,
      0,
    );
    const totalDossiers = agents.reduce(
      (total, agent) => total + agent.dossiersCount,
      0,
    );
    const totalDossiersSigned = agents.reduce(
      (total, agent) => total + agent.dossiersSigned,
      0,
    );
    const totalDossiersInstalled = agents.reduce(
      (total, agent) => total + agent.dossiersInstalled,
      0,
    );
    const totalCommissions = agents.reduce(
      (total, agent) => total + agent.commissionsCount,
      0,
    );
    const totalCommissionsAmount = agents.reduce(
      (total, agent) => total + agent.commissionsAmount,
      0,
    );
    const totalCommissionsPaidAmount = agents.reduce(
      (total, agent) => total + agent.commissionsPaidAmount,
      0,
    );
    const totalCommissionsPendingAmount = agents.reduce(
      (total, agent) => total + agent.commissionsPendingAmount,
      0,
    );
    const agentsAvecCommissions = agents.filter(
      (agent) => agent.commissionsCount > 0,
    ).length;

    return {
      summary: {
        totalAgents: agents.length,
        totalVentes,
        totalFactures,
        totalLeads,
        totalLeadsConverted,
        totalDossiers,
        totalDossiersSigned,
        totalDossiersInstalled,
        totalCommissions,
        totalCommissionsAmount,
        totalCommissionsPaidAmount,
        totalCommissionsPendingAmount,
        totalDepartments: departments.length,
        moyenneVentesParAgent: agents.length
          ? Number((totalVentes / agents.length).toFixed(1))
          : 0,
        moyenneLeadsParAgent: agents.length
          ? Number((totalLeads / agents.length).toFixed(1))
          : 0,
        moyenneCommissionsParAgent: agents.length
          ? Number((totalCommissionsAmount / agents.length).toFixed(1))
          : 0,
        agentsAvecVentes,
        agentsAvecCommissions,
      },
      agents,
    };
  }
}
