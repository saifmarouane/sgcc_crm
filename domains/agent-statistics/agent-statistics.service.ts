import { AuthService } from "@/domains/auth/auth.service";
import { DepartmentService } from "@/domains/departments/department.service";
import { DocumentService } from "@/domains/documents/document.service";
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
  ) {}

  async getOverview(): Promise<AgentStatisticsPayload> {
    const [users, departments, documents, ventes] = await Promise.all([
      this.authService.listUsers(),
      this.departmentService.list(),
      this.documentService.list(),
      this.nombreVenteService.list(),
    ]);

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

    const agents = users
      .filter((user) => user.role === "agent")
      .map<AgentStatisticRow>((user) => {
        const venteStats = venteStatsByUser.get(user.id);
        const nombreVentes = venteStats?.nombreVentes ?? 0;

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
          lastSaleAt: venteStats?.lastSaleAt ?? null,
          lastReference: venteStats?.lastReference ?? "",
          status: nombreVentes > 0 ? "actif" : "sans-vente",
        };
      })
      .sort((firstAgent, secondAgent) => {
        if (secondAgent.nombreVentes !== firstAgent.nombreVentes) {
          return secondAgent.nombreVentes - firstAgent.nombreVentes;
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

    return {
      summary: {
        totalAgents: agents.length,
        totalVentes,
        totalFactures,
        totalDepartments: departments.length,
        moyenneVentesParAgent: agents.length
          ? Number((totalVentes / agents.length).toFixed(1))
          : 0,
        agentsAvecVentes,
      },
      agents,
    };
  }
}
