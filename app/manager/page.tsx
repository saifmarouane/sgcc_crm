"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ManagerUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  department_id: string;
};

type Lead = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  source: "CALL" | "REGIES";
  desired_product: string;
  sector: string;
  status: string;
  assigned_agent_id: string;
  converted_dossier_id: string;
  notes: string;
};

type Dossier = {
  id: string;
  lead_id: string;
  assigned_agent_id: string;
  product: string;
  color: string;
  sector: string;
  surface_range: string;
  source_type: string;
  status: string;
  appointment_date: string | null;
};

type Commission = {
  id: string;
  dossier_id: string;
  agent_id: string;
  total_amount: number;
  deposit_amount: number;
  balance_amount: number;
  deposit_status: string;
  balance_status: string;
  global_status: string;
  calculated_at: string;
};

type CommissionRule = {
  id: string;
  product: string;
  color: string;
  sector: string;
  surface_range: string;
  source_type: string;
  total_amount: number;
  deposit_amount: number;
  balance_amount: number;
  version: number;
  is_active: boolean;
};

type AgentStatisticRow = {
  id: string;
  name: string;
  email: string;
  departmentName: string;
  nombreVentes: number;
  nombreFactures: number;
  status: string;
};

type DashboardPayload = {
  kpi: {
    total_leads: number;
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
};

type LeadForm = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  source: "CALL" | "REGIES";
  desired_product: string;
  sector: string;
  assigned_agent_id: string;
  notes: string;
};

type ManagerView =
  | "dashboard"
  | "leads"
  | "dossiers"
  | "commissions"
  | "rules"
  | "team";

const emptyLeadForm: LeadForm = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  source: "CALL",
  desired_product: "",
  sector: "",
  assigned_agent_id: "",
  notes: "",
};

const productOptions = ["PAC/SSC", "PAC/BTD", "PAC DUO", "PAC/BS", "SSC", "PAC/BE"];
const sectorOptions = ["H1", "H2", "H3"];
const nextDossierStatuses: Record<string, string[]> = {
  NOUVEAU: ["QUALIFIE", "RDV_PLANIFIE", "PERDU", "ANNULE"],
  QUALIFIE: ["RDV_PLANIFIE", "PERDU", "ANNULE"],
  RDV_PLANIFIE: ["DEVIS_ENVOYE", "PERDU", "ANNULE"],
  DEVIS_ENVOYE: ["SIGNE_ACOMPTE_A_VALIDER", "PERDU", "ANNULE"],
  SIGNE_ACOMPTE_A_VALIDER: ["ACOMPTE_VALIDE", "ANNULE"],
  ACOMPTE_VALIDE: ["DEPOT_MPR", "ANNULE"],
  DEPOT_MPR: ["POSE_SOLDE_A_VALIDER", "ANNULE"],
  POSE_SOLDE_A_VALIDER: ["SOLDE_VALIDE", "ANNULE"],
  SOLDE_VALIDE: ["ARCHIVE"],
};

export default function ManagerPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ManagerView>("dashboard");
  const [token, setToken] = useState("");
  const [user, setUser] = useState<ManagerUser | null>(null);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [teamAgents, setTeamAgents] = useState<AgentStatisticRow[]>([]);
  const [leadForm, setLeadForm] = useState<LeadForm>(emptyLeadForm);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  const agentById = useMemo(
    () => new Map(teamAgents.map((agent) => [agent.id, agent])),
    [teamAgents],
  );

  useEffect(() => {
    const storedToken = localStorage.getItem("sgcc_token");

    if (!storedToken) {
      router.push("/login");
      return;
    }

    setToken(storedToken);
    loadWorkspace(storedToken);
  }, [router]);

  async function loadWorkspace(authToken = token) {
    if (!authToken) {
      return;
    }

    setLoading(true);
    const headers = { Authorization: `Bearer ${authToken}` };

    try {
      const [
        meResponse,
        dashboardResponse,
        leadsResponse,
        dossiersResponse,
        commissionsResponse,
        rulesResponse,
        teamResponse,
      ] = await Promise.all([
        fetch("/api/auth/me", { headers }),
        fetch("/api/dashboard", { headers }),
        fetch("/api/leads", { headers }),
        fetch("/api/dossiers", { headers }),
        fetch("/api/commissions", { headers }),
        fetch("/api/commission-rules?is_active=true", { headers }),
        fetch("/api/statistiques-agents", { headers }),
      ]);

      const mePayload = await meResponse.json().catch(() => ({}));
      const dashboardPayload = await dashboardResponse.json().catch(() => ({}));
      const leadsPayload = await leadsResponse.json().catch(() => ({}));
      const dossiersPayload = await dossiersResponse.json().catch(() => ({}));
      const commissionsPayload = await commissionsResponse.json().catch(() => ({}));
      const rulesPayload = await rulesResponse.json().catch(() => ({}));
      const teamPayload = await teamResponse.json().catch(() => ({}));

      if (!meResponse.ok || mePayload.user?.role !== "manager") {
        router.push(
          mePayload.user?.role === "admin"
            ? "/admin"
            : mePayload.user?.role === "agent"
              ? "/agent"
              : "/login",
        );
        return;
      }

      for (const [response, payload, label] of [
        [dashboardResponse, dashboardPayload, "dashboard"],
        [leadsResponse, leadsPayload, "leads"],
        [dossiersResponse, dossiersPayload, "dossiers"],
        [commissionsResponse, commissionsPayload, "commissions"],
        [rulesResponse, rulesPayload, "commission rules"],
        [teamResponse, teamPayload, "team"],
      ] as const) {
        if (!response.ok) {
          throw new Error(payload.error ?? `Failed to load ${label}.`);
        }
      }

      setUser(mePayload.user);
      setDashboard(dashboardPayload.dashboard ?? null);
      setLeads(leadsPayload.leads ?? []);
      setDossiers(dossiersPayload.dossiers ?? []);
      setCommissions(commissionsPayload.commissions ?? []);
      setRules(rulesPayload.commission_rules ?? []);
      setTeamAgents(teamPayload.agents ?? []);
      setLeadForm((current) => ({
        ...current,
        assigned_agent_id: current.assigned_agent_id || teamPayload.agents?.[0]?.id || "",
      }));
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }

  async function createLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setActionLoading("create-lead");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(leadForm),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.error ?? "Lead create failed.");
        return;
      }

      setLeads((current) => [data.lead, ...current]);
      setLeadForm({
        ...emptyLeadForm,
        assigned_agent_id: leadForm.assigned_agent_id,
      });
      setMessageType("success");
      setMessage("Lead cree et assigne.");
      await loadWorkspace();
    } finally {
      setActionLoading("");
    }
  }

  async function changeDossierStatus(id: string, status: string) {
    setMessage("");
    setActionLoading(`status-${id}`);

    try {
      const response = await fetch(`/api/dossiers/${id}/change-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.error ?? "Dossier status update failed.");
        return;
      }

      setDossiers((current) =>
        current.map((dossier) => (dossier.id === id ? data.dossier : dossier)),
      );
      setMessageType("success");
      setMessage("Statut dossier mis a jour.");
      await loadWorkspace();
    } finally {
      setActionLoading("");
    }
  }

  async function downloadReport(path: string, filename: string) {
    setActionLoading(`export-${filename}`);

    try {
      const response = await fetch(path, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMessageType("error");
        setMessage(data.error ?? "Export failed.");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setActionLoading("");
    }
  }

  function logout() {
    localStorage.removeItem("sgcc_token");
    localStorage.removeItem("sgcc_user");
    router.push("/login");
  }

  const kpi = dashboard?.kpi;

  return (
    <main className="manager-dashboard">
      {loading || actionLoading ? (
        <div className="page-loading-overlay" role="status">
          <span className="loading-spinner" />
          <span>{loading ? "Chargement superviseur..." : "Traitement..."}</span>
        </div>
      ) : null}

      <aside className="manager-sidebar">
        <div className="manager-brand">
          <div className="manager-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="SGCC" src="/uploads/images/logo.png" />
          </div>
          <div>
            <strong>Supervision</strong>
            <span>{user?.name ?? "Manager"}</span>
          </div>
        </div>
        <nav className="manager-nav">
          {[
            ["dashboard", "Dashboard"],
            ["leads", "Leads equipe"],
            ["dossiers", "Dossiers"],
            ["commissions", "Commissions"],
            ["rules", "Grille"],
            ["team", "Equipe"],
          ].map(([view, label]) => (
            <button
              className={activeView === view ? "active" : ""}
              key={view}
              onClick={() => setActiveView(view as ManagerView)}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>
        <button className="manager-logout" onClick={logout} type="button">
          Logout
        </button>
      </aside>

      <section className="manager-main">
        <header className="manager-topbar">
          <div>
            <p>Vue equipe</p>
            <h1>Tableau de bord superviseur</h1>
          </div>
          <button onClick={() => loadWorkspace()} type="button">
            Actualiser
          </button>
        </header>

        {message ? (
          <p className={`agent-message ${messageType}`}>{message}</p>
        ) : null}

        <section className="manager-metrics">
          <div>
            <span>Leads</span>
            <strong>{kpi?.total_leads ?? 0}</strong>
            <small>{kpi?.leads_converted ?? 0} convertis</small>
          </div>
          <div>
            <span>Dossiers</span>
            <strong>{kpi?.total_dossiers ?? 0}</strong>
            <small>{kpi?.dossiers_signed ?? 0} signes</small>
          </div>
          <div>
            <span>Commissions</span>
            <strong>{kpi?.commissions_amount ?? 0}</strong>
            <small>{kpi?.total_commissions ?? 0} calculees</small>
          </div>
          <div>
            <span>A surveiller</span>
            <strong>{kpi?.dossiers_pending_over_30_days ?? 0}</strong>
            <small>dossiers +30j</small>
          </div>
        </section>

        {activeView === "leads" ? (
          <section className="manager-grid">
            <form className="manager-card" onSubmit={createLead}>
              <div className="manager-card-header">
                <div>
                  <p>Assignation</p>
                  <h2>Nouveau lead equipe</h2>
                </div>
              </div>
              <div className="manager-form-grid">
                <label>
                  Prenom
                  <input
                    onChange={(event) =>
                      setLeadForm({ ...leadForm, first_name: event.target.value })
                    }
                    required
                    value={leadForm.first_name}
                  />
                </label>
                <label>
                  Nom
                  <input
                    onChange={(event) =>
                      setLeadForm({ ...leadForm, last_name: event.target.value })
                    }
                    required
                    value={leadForm.last_name}
                  />
                </label>
                <label>
                  Telephone
                  <input
                    onChange={(event) =>
                      setLeadForm({ ...leadForm, phone: event.target.value })
                    }
                    required
                    value={leadForm.phone}
                  />
                </label>
                <label>
                  Agent
                  <select
                    onChange={(event) =>
                      setLeadForm({
                        ...leadForm,
                        assigned_agent_id: event.target.value,
                      })
                    }
                    required
                    value={leadForm.assigned_agent_id}
                  >
                    <option value="">Selectionner</option>
                    {teamAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Source
                  <select
                    onChange={(event) =>
                      setLeadForm({
                        ...leadForm,
                        source: event.target.value as LeadForm["source"],
                      })
                    }
                    value={leadForm.source}
                  >
                    <option value="CALL">CALL</option>
                    <option value="REGIES">REGIES</option>
                  </select>
                </label>
                <label>
                  Produit
                  <select
                    onChange={(event) =>
                      setLeadForm({
                        ...leadForm,
                        desired_product: event.target.value,
                      })
                    }
                    value={leadForm.desired_product}
                  >
                    <option value="">Non defini</option>
                    {productOptions.map((product) => (
                      <option key={product} value={product}>
                        {product}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Secteur
                  <select
                    onChange={(event) =>
                      setLeadForm({ ...leadForm, sector: event.target.value })
                    }
                    value={leadForm.sector}
                  >
                    <option value="">Non defini</option>
                    {sectorOptions.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Email
                  <input
                    onChange={(event) =>
                      setLeadForm({ ...leadForm, email: event.target.value })
                    }
                    type="email"
                    value={leadForm.email}
                  />
                </label>
              </div>
              <button className="manager-primary" type="submit">
                Creer lead
              </button>
            </form>

            <DataTable
              columns={["Lead", "Agent", "Source", "Produit", "Statut"]}
              rows={leads.map((lead) => [
                `${lead.first_name} ${lead.last_name}\n${lead.phone}`,
                agentById.get(lead.assigned_agent_id)?.name ?? lead.assigned_agent_id,
                lead.source,
                lead.desired_product || "-",
                lead.status,
              ])}
              title="Leads equipe"
            />
          </section>
        ) : null}

        {activeView === "dossiers" ? (
          <section className="manager-card">
            <div className="manager-card-header">
              <div>
                <p>Workflow</p>
                <h2>Dossiers equipe</h2>
              </div>
              <button
                onClick={() =>
                  downloadReport("/api/reports/export/dossiers", "dossiers-equipe.csv")
                }
                type="button"
              >
                Export CSV
              </button>
            </div>
            <div className="manager-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Dossier</th>
                    <th>Agent</th>
                    <th>Produit</th>
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dossiers.map((dossier) => (
                    <tr key={dossier.id}>
                      <td>{dossier.id.slice(-8)}</td>
                      <td>{agentById.get(dossier.assigned_agent_id)?.name ?? dossier.assigned_agent_id}</td>
                      <td>{`${dossier.product} / ${dossier.color} / ${dossier.surface_range}`}</td>
                      <td>{dossier.status}</td>
                      <td>
                        <select
                          onChange={(event) => {
                            const value = event.target.value;
                            event.target.value = "";
                            if (value) {
                              changeDossierStatus(dossier.id, value);
                            }
                          }}
                          value=""
                        >
                          <option value="">Changer statut</option>
                          {(nextDossierStatuses[dossier.status] ?? []).map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {activeView === "commissions" ? (
          <DataTable
            actions={
              <button
                onClick={() =>
                  downloadReport(
                    "/api/reports/export/commissions",
                    "commissions-equipe.csv",
                  )
                }
                type="button"
              >
                Export CSV
              </button>
            }
            columns={["Dossier", "Agent", "Total", "Acompte", "Solde", "Statut"]}
            rows={commissions.map((commission) => [
              commission.dossier_id.slice(-8),
              agentById.get(commission.agent_id)?.name ?? commission.agent_id,
              `${commission.total_amount} EUR`,
              `${commission.deposit_amount} / ${commission.deposit_status}`,
              `${commission.balance_amount} / ${commission.balance_status}`,
              commission.global_status,
            ])}
            title="Commissions equipe"
          />
        ) : null}

        {activeView === "rules" ? (
          <DataTable
            columns={["Produit", "Critere", "Type", "Montants", "Version"]}
            rows={rules.map((rule) => [
              rule.product,
              `${rule.color} / ${rule.sector} / ${rule.surface_range}`,
              rule.source_type,
              `${rule.total_amount} = ${rule.deposit_amount} + ${rule.balance_amount}`,
              `v${rule.version}`,
            ])}
            title="Grille commissions active"
          />
        ) : null}

        {activeView === "team" ? (
          <DataTable
            columns={["Agent", "Departement", "Ventes", "Factures", "Statut"]}
            rows={teamAgents.map((agent) => [
              `${agent.name}\n${agent.email}`,
              agent.departmentName,
              agent.nombreVentes,
              agent.nombreFactures,
              agent.status,
            ])}
            title="Equipe"
          />
        ) : null}

        {activeView === "dashboard" ? (
          <section className="manager-grid">
            <DataTable
              columns={["Indicateur", "Valeur"]}
              rows={[
                ["Leads convertis", kpiValue(kpi?.leads_converted)],
                ["Dossiers signes", kpiValue(kpi?.dossiers_signed)],
                ["Dossiers poses", kpiValue(kpi?.dossiers_installed)],
                ["Acomptes en attente", kpiValue(kpi?.pending_deposit_amount)],
                ["Soldes en attente", kpiValue(kpi?.pending_balance_amount)],
                ["Montant paye", kpiValue(kpi?.paid_amount)],
              ]}
              title="KPI equipe"
            />
            <DataTable
              columns={["Agent", "Ventes", "Factures"]}
              rows={teamAgents.map((agent) => [
                agent.name,
                agent.nombreVentes,
                agent.nombreFactures,
              ])}
              title="Performance rapide"
            />
          </section>
        ) : null}
      </section>
    </main>
  );
}

function kpiValue(value: number | undefined): number {
  return value ?? 0;
}

function DataTable({
  actions,
  columns,
  rows,
  title,
}: {
  actions?: ReactNode;
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
  title: string;
}) {
  return (
    <section className="manager-card">
      <div className="manager-card-header">
        <div>
          <p>Supervision</p>
          <h2>{title}</h2>
        </div>
        {actions}
      </div>
      <div className="manager-table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>Aucune donnee.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
