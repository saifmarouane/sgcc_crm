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
  leadsCount: number;
  leadsConverted: number;
  dossiersCount: number;
  dossiersSigned: number;
  dossiersInstalled: number;
  commissionsCount: number;
  commissionsAmount: number;
  commissionsPaidAmount: number;
  commissionsPendingAmount: number;
  conversionRate: number;
  signatureRate: number;
  lastSaleAt: string | null;
  lastReference: string;
  status: "actif" | "sans-vente";
};

export type AgentStatisticsSummary = {
  totalAgents: number;
  totalVentes: number;
  totalFactures: number;
  totalLeads: number;
  totalLeadsConverted: number;
  totalDossiers: number;
  totalDossiersSigned: number;
  totalDossiersInstalled: number;
  totalCommissions: number;
  totalCommissionsAmount: number;
  totalCommissionsPaidAmount: number;
  totalCommissionsPendingAmount: number;
  totalDepartments: number;
  moyenneVentesParAgent: number;
  moyenneLeadsParAgent: number;
  moyenneCommissionsParAgent: number;
  agentsAvecVentes: number;
  agentsAvecCommissions: number;
};

export type AgentStatisticsPayload = {
  summary: AgentStatisticsSummary;
  agents: AgentStatisticRow[];
};
