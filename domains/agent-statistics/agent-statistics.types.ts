export type AgentStatisticRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string;
  departmentId: string;
  departmentName: string;
  nombreVentes: number;
  nombreFactures: number;
  lastSaleAt: string | null;
  lastReference: string;
  status: "actif" | "sans-vente";
};

export type AgentStatisticsSummary = {
  totalAgents: number;
  totalVentes: number;
  totalFactures: number;
  totalDepartments: number;
  moyenneVentesParAgent: number;
  agentsAvecVentes: number;
};

export type AgentStatisticsPayload = {
  summary: AgentStatisticsSummary;
  agents: AgentStatisticRow[];
};
