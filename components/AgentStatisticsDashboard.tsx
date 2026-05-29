"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AgentStatisticRow = {
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

type AgentStatisticsPayload = {
  summary: {
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
  agents: AgentStatisticRow[];
};

const emptyPayload: AgentStatisticsPayload = {
  summary: {
    totalAgents: 0,
    totalVentes: 0,
    totalFactures: 0,
    totalLeads: 0,
    totalLeadsConverted: 0,
    totalDossiers: 0,
    totalDossiersSigned: 0,
    totalDossiersInstalled: 0,
    totalCommissions: 0,
    totalCommissionsAmount: 0,
    totalCommissionsPaidAmount: 0,
    totalCommissionsPendingAmount: 0,
    totalDepartments: 0,
    moyenneVentesParAgent: 0,
    moyenneLeadsParAgent: 0,
    moyenneCommissionsParAgent: 0,
    agentsAvecVentes: 0,
    agentsAvecCommissions: 0,
  },
  agents: [],
};

const avatarColors = [
  "#2563eb",
  "#16a34a",
  "#f97316",
  "#0891b2",
  "#7c3aed",
  "#dc2626",
  "#0f766e",
  "#ca8a04",
];

function initials(name: string) {
  const parts = name.trim().split(" ");
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function euro(value: number) {
  return `${value.toLocaleString("fr-FR")} EUR`;
}

export default function AgentStatisticsDashboard() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [payload, setPayload] = useState<AgentStatisticsPayload>(emptyPayload);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const loadStatistics = useCallback(
    async (authToken = token) => {
      if (!authToken) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/statistiques-agents", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error ?? "Chargement des statistiques echoue.");
        }

        setPayload(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Chargement des statistiques echoue.",
        );
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    const storedToken = localStorage.getItem("sgcc_token");

    if (!storedToken) {
      router.push("/login");
      return;
    }

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !["admin", "manager"].includes(data.user?.role)) {
          router.push(data.user?.role === "agent" ? "/agent" : "/login");
          return;
        }

        setToken(storedToken);
        await loadStatistics(storedToken);
      })
      .catch(() => router.push("/login"));
  }, [loadStatistics, router]);

  useEffect(() => {
    function syncFullscreenState() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await document.documentElement.requestFullscreen();
  }

  const departments = useMemo(
    () => Array.from(new Set(payload.agents.map((agent) => agent.departmentName))).sort(),
    [payload.agents],
  );

  const filteredAgents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return payload.agents.filter((agent) => {
      const matchesDepartment =
        departmentFilter === "all" || agent.departmentName === departmentFilter;
      const matchesQuery =
        !normalizedQuery ||
        agent.name.toLowerCase().includes(normalizedQuery) ||
        agent.email.toLowerCase().includes(normalizedQuery) ||
        agent.phone.toLowerCase().includes(normalizedQuery);

      return matchesDepartment && matchesQuery;
    });
  }, [departmentFilter, payload.agents, query]);

  const topAgents = filteredAgents.slice(0, 6);
  const bestAgent = topAgents[0];
  const maxCommission = Math.max(
    1,
    ...topAgents.map((agent) => agent.commissionsAmount),
  );
  const maxLeads = Math.max(1, ...topAgents.map((agent) => agent.leadsCount));
  const globalConversionRate = payload.summary.totalLeads
    ? Math.round(
        (payload.summary.totalLeadsConverted / payload.summary.totalLeads) * 100,
      )
    : 0;
  const globalSignatureRate = payload.summary.totalDossiers
    ? Math.round(
        (payload.summary.totalDossiersSigned / payload.summary.totalDossiers) *
          100,
      )
    : 0;
  const paidRate = payload.summary.totalCommissionsAmount
    ? Math.round(
        (payload.summary.totalCommissionsPaidAmount /
          payload.summary.totalCommissionsAmount) *
          100,
      )
    : 0;

  const summaryCards = [
    {
      label: "Agents",
      value: payload.summary.totalAgents,
      sub: `${payload.summary.agentsAvecVentes} actifs V1`,
    },
    {
      label: "Leads",
      value: payload.summary.totalLeads,
      sub: `${payload.summary.totalLeadsConverted} convertis`,
    },
    {
      label: "Dossiers signes",
      value: payload.summary.totalDossiersSigned,
      sub: `${payload.summary.totalDossiers} dossiers`,
    },
    {
      label: "Commissions",
      value: euro(payload.summary.totalCommissionsAmount),
      sub: `${payload.summary.totalCommissions} lignes`,
    },
    {
      label: "Payees",
      value: euro(payload.summary.totalCommissionsPaidAmount),
      sub: `${paidRate}% du total`,
    },
    {
      label: "En attente",
      value: euro(payload.summary.totalCommissionsPendingAmount),
      sub: "Acompte / solde restants",
    },
  ];

  return (
    <main className="agent-stats-page">
      {loading ? (
        <div className="page-loading-overlay" aria-live="polite" role="status">
          <span className="loading-spinner" />
          <span>Chargement des statistiques agents...</span>
        </div>
      ) : null}

      <header className="agent-stats-header">
        <div>
          <p>Performance commerciale</p>
          <h1>Statistiques agents</h1>
        </div>
        <div className="agent-stats-actions">
          <input
            aria-label="Rechercher un agent"
            className="agent-stats-search-input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Recherche agent..."
            value={query}
          />
          <select
            aria-label="Filtrer par departement"
            className="agent-stats-filter"
            onChange={(event) => setDepartmentFilter(event.target.value)}
            value={departmentFilter}
          >
            <option value="all">Tous les departements</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
          <button
            aria-label={
              isFullscreen ? "Quitter le plein ecran" : "Afficher en plein ecran"
            }
            className="agent-stats-fullscreen"
            onClick={toggleFullscreen}
            title={
              isFullscreen ? "Quitter le plein ecran" : "Afficher en plein ecran"
            }
            type="button"
          >
            <span
              className={
                isFullscreen
                  ? "agent-stats-fullscreen-icon exit"
                  : "agent-stats-fullscreen-icon"
              }
            />
          </button>
          <button
            className="agent-stats-refresh"
            disabled={loading}
            onClick={() => loadStatistics()}
            type="button"
          >
            {loading ? (
              <span className="button-loading-label">
                <span className="button-spinner" />
                Chargement...
              </span>
            ) : (
              "Actualiser"
            )}
          </button>
        </div>
      </header>

      <section className="agent-stats-main">
        {error ? <p className="agent-stats-error">{error}</p> : null}

        <section className="agent-stats-hero">
          <div>
            <p>Vue equipe</p>
            <h2>
              {bestAgent
                ? `${bestAgent.name} domine avec ${euro(bestAgent.commissionsAmount)}`
                : "Aucune performance agent disponible"}
            </h2>
            <span>
              Suivi combine V1 et V2: ventes/factures, leads, dossiers,
              signatures et commissions.
            </span>
          </div>
          <div className="agent-stats-radials">
            <div>
              <strong>{globalConversionRate}%</strong>
              <span>Conversion</span>
            </div>
            <div>
              <strong>{globalSignatureRate}%</strong>
              <span>Signature</span>
            </div>
            <div>
              <strong>{paidRate}%</strong>
              <span>Payees</span>
            </div>
          </div>
        </section>

        <section className="agent-stats-summary-grid">
          {summaryCards.map((card) => (
            <article className="agent-stats-summary-card" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.sub}</small>
            </article>
          ))}
        </section>

        <section className="agent-stats-charts">
          <article className="agent-stats-panel">
            <div className="agent-stats-panel-header">
              <div>
                <p>Classement</p>
                <h2>Top commissions</h2>
              </div>
              <span>{filteredAgents.length} agents</span>
            </div>
            <div className="agent-stats-bar-list">
              {topAgents.map((agent) => (
                <div className="agent-stats-bar-row" key={agent.id}>
                  <span>{agent.name}</span>
                  <div>
                    <i
                      style={{
                        width: `${Math.max(
                          4,
                          (agent.commissionsAmount / maxCommission) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  <strong>{euro(agent.commissionsAmount)}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="agent-stats-panel">
            <div className="agent-stats-panel-header">
              <div>
                <p>Pipeline</p>
                <h2>Leads et signatures</h2>
              </div>
            </div>
            <div className="agent-stats-combo-chart">
              {topAgents.map((agent) => (
                <div key={agent.id}>
                  <span>{agent.name}</span>
                  <b style={{ height: `${Math.max(8, (agent.leadsCount / maxLeads) * 100)}%` }} />
                  <i style={{ height: `${Math.max(8, agent.signatureRate)}%` }} />
                </div>
              ))}
            </div>
            <div className="agent-stats-legend">
              <span>Leads</span>
              <span>Signature %</span>
            </div>
          </article>
        </section>

        <div className="agent-stats-table-card">
          <div className="agent-stats-table-header">
            <h2>Performance detaillee par agent</h2>
            <div className="agent-stats-actions">
              <span>{filteredAgents.length} agents affiches</span>
            </div>
          </div>

          <div className="agent-stats-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Agent</th>
                  <th>Leads</th>
                  <th>Dossiers</th>
                  <th>Commissions</th>
                  <th>Payees</th>
                  <th>V1 ventes</th>
                  <th>Departement</th>
                  <th>Derniere vente</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10}>Chargement...</td>
                  </tr>
                ) : filteredAgents.length ? (
                  filteredAgents.map((agent, index) => (
                    <tr key={agent.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="agent-stats-agent-cell">
                          <span
                            className="agent-stats-avatar"
                            style={{
                              background: avatarColors[index % avatarColors.length],
                            }}
                          >
                            {agent.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img alt="" src={agent.image} />
                            ) : (
                              initials(agent.name)
                            )}
                          </span>
                          <span>
                            <strong>{agent.name}</strong>
                            <small>{agent.email}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <strong>{agent.leadsCount}</strong>
                        <small>{agent.conversionRate}% convertis</small>
                      </td>
                      <td>
                        <strong>{agent.dossiersSigned}/{agent.dossiersCount}</strong>
                        <small>{agent.dossiersInstalled} poses</small>
                      </td>
                      <td>
                        <strong>{euro(agent.commissionsAmount)}</strong>
                        <small>{agent.commissionsCount} commissions</small>
                      </td>
                      <td>
                        <strong>{euro(agent.commissionsPaidAmount)}</strong>
                        <small>{euro(agent.commissionsPendingAmount)} attente</small>
                      </td>
                      <td>
                        <strong>{agent.nombreVentes}</strong>
                        <small>{agent.nombreFactures} factures</small>
                      </td>
                      <td>
                        <span className="agent-stats-team">
                          {agent.departmentName}
                        </span>
                      </td>
                      <td>
                        <span>{formatDate(agent.lastSaleAt)}</span>
                        {agent.lastReference ? (
                          <small>{agent.lastReference}</small>
                        ) : null}
                      </td>
                      <td>
                        <span className={`agent-stats-status ${agent.status}`}>
                          {agent.status === "actif" ? "Actif" : "Sans activite"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10}>Aucun agent trouve.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
