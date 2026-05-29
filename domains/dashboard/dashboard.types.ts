export type DashboardKpi = {
  total_leads: number;
  leads_qualified: number;
  leads_converted: number;
  total_dossiers: number;
  dossiers_signed: number;
  dossiers_installed: number;
  dossiers_pending_over_30_days: number;
  total_commissions: number;
  commissions_amount: number;
  pending_deposit_amount: number;
  pending_balance_amount: number;
  paid_amount: number;
};

export type DashboardPayload = {
  scope: "agent" | "team" | "global";
  kpi: DashboardKpi;
};

