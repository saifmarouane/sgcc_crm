"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
  lastSaleAt: string | null;
  lastReference: string;
  status: "actif" | "sans-vente";
};

type AgentStatisticsPayload = {
  summary: {
    totalAgents: number;
    totalVentes: number;
    totalFactures: number;
    totalDepartments: number;
    moyenneVentesParAgent: number;
    agentsAvecVentes: number;
  };
  agents: AgentStatisticRow[];
};

const emptyPayload: AgentStatisticsPayload = {
  summary: {
    totalAgents: 0,
    totalVentes: 0,
    totalFactures: 0,
    totalDepartments: 0,
    moyenneVentesParAgent: 0,
    agentsAvecVentes: 0,
  },
  agents: [],
};

const avatarColors = [
  "#F5A623",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#EF4444",
  "#06B6D4",
  "#F97316",
  "#10B981",
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

export default function AgentStatisticsDashboard() {
  const [payload, setPayload] = useState<AgentStatisticsPayload>(emptyPayload);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const bestAgent = useMemo(() => payload.agents[0], [payload.agents]);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/statistiques-agents", {
        cache: "no-store",
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
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const statistics = [
    {
      icon: "AG",
      label: "Agents",
      value: payload.summary.totalAgents.toString(),
      sub: "Comptes role agent",
    },
    {
      icon: "VT",
      label: "Nombre de ventes",
      value: payload.summary.totalVentes.toString(),
      sub: "Total enregistre",
    },
    {
      icon: "FC",
      label: "Nombre de factures",
      value: payload.summary.totalFactures.toString(),
      sub: "Documents uploades",
    },
    {
      icon: "DP",
      label: "Departements",
      value: payload.summary.totalDepartments.toString(),
      sub: "Equipes disponibles",
    },
    {
      icon: "MV",
      label: "Moyenne ventes / agent",
      value: payload.summary.moyenneVentesParAgent.toString(),
      sub: "Performance moyenne",
    },
    {
      icon: "TOP",
      label: "Meilleur agent",
      value: bestAgent ? bestAgent.nombreVentes.toString() : "0",
      sub: bestAgent?.name ?? "Aucune vente",
      badge: bestAgent ? "Top" : undefined,
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
        <h1>Tableau de bord des agents</h1>
        <button
          className="agent-stats-refresh"
          disabled={loading}
          onClick={loadStatistics}
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
      </header>

      <div className="agent-stats-layout">
        <aside className="agent-stats-sidebar">
          <p className="agent-stats-section-title">Statistiques agents</p>

          {statistics.map((statistic) => (
            <article className="agent-stats-card" key={statistic.label}>
              <div className="agent-stats-icon">{statistic.icon}</div>
              <div>
                <h2>{statistic.label}</h2>
                <div className="agent-stats-value-row">
                  <strong>{statistic.value}</strong>
                  <span
                    className={`agent-stats-dot ${
                      statistic.value === "0" ? "danger" : ""
                    }`}
                  />
                </div>
                <p>
                  {statistic.sub}
                  {statistic.badge ? <span>{statistic.badge}</span> : null}
                </p>
              </div>
            </article>
          ))}
        </aside>

        <section className="agent-stats-main">
          {error ? <p className="agent-stats-error">{error}</p> : null}

          <div className="agent-stats-table-card">
            <div className="agent-stats-table-header">
              <h2>Agents, ventes et factures</h2>
              <div className="agent-stats-actions">
                <span>{payload.summary.agentsAvecVentes} agents avec ventes</span>
              </div>
            </div>

            <div className="agent-stats-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Agent</th>
                    <th>ID agent</th>
                    <th>Ventes</th>
                    <th>Factures</th>
                    <th>Departement</th>
                    <th>Telephone</th>
                    <th>Derniere vente</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9}>Chargement...</td>
                    </tr>
                  ) : payload.agents.length ? (
                    payload.agents.map((agent, index) => (
                      <tr key={agent.id}>
                        <td>{index + 1}</td>
                        <td>
                          <div className="agent-stats-agent-cell">
                            <span
                              className="agent-stats-avatar"
                              style={{
                                background:
                                  avatarColors[index % avatarColors.length],
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
                          <code>{agent.id}</code>
                        </td>
                        <td>
                          <strong>{agent.nombreVentes}</strong>
                        </td>
                        <td>{agent.nombreFactures}</td>
                        <td>
                          <span className="agent-stats-team">
                            {agent.departmentName}
                          </span>
                        </td>
                        <td>{agent.phone}</td>
                        <td>
                          <span>{formatDate(agent.lastSaleAt)}</span>
                          {agent.lastReference ? (
                            <small>{agent.lastReference}</small>
                          ) : null}
                        </td>
                        <td>
                          <span
                            className={`agent-stats-status ${agent.status}`}
                          >
                            {agent.status === "actif"
                              ? "Avec ventes"
                              : "Sans vente"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9}>Aucun agent trouve.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
