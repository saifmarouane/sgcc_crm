"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AgentUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string;
  role: string;
  department_id: string;
};

type Department = {
  id: string;
  name: string;
};

type AgentVente = {
  id: string;
  user_id: string;
  document_id: string;
  reference: string;
  nombre_vente: number;
  saleInsertedAt: string;
  updatedAt: string;
};

type AgentView = "profile" | "sales";

export default function AgentPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<AgentView>("sales");
  const [token, setToken] = useState("");
  const [user, setUser] = useState<AgentUser | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [ventes, setVentes] = useState<AgentVente[]>([]);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    image: "",
    department_id: "",
  });
  const [facture, setFacture] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const departmentName = useMemo(() => {
    return (
      departments.find((department) => department.id === profile.department_id)
        ?.name ?? "Non assigne"
    );
  }, [departments, profile.department_id]);

  const totalVentes = ventes.reduce(
    (total, vente) => total + vente.nombre_vente,
    0,
  );

  useEffect(() => {
    const storedToken = localStorage.getItem("sgcc_token");

    if (!storedToken) {
      router.push("/login");
      return;
    }

    setToken(storedToken);
    loadAgentWorkspace(storedToken);
  }, [router]);

  async function loadAgentWorkspace(authToken = token) {
    if (!authToken) {
      return;
    }

    setLoading(true);
    const authHeaders = { Authorization: `Bearer ${authToken}` };

    try {
      const [meResponse, departmentsResponse, ventesResponse] =
        await Promise.all([
          fetch("/api/auth/me", { headers: authHeaders }),
          fetch("/api/departments", { headers: authHeaders }),
          fetch("/api/agent/ventes", { headers: authHeaders }),
        ]);

      const mePayload = await meResponse.json().catch(() => ({}));
      const departmentsPayload = await departmentsResponse
        .json()
        .catch(() => ({}));
      const ventesPayload = await ventesResponse.json().catch(() => ({}));

      if (!meResponse.ok || mePayload.user?.role !== "agent") {
        localStorage.removeItem("sgcc_token");
        router.push("/login");
        return;
      }

      if (!departmentsResponse.ok) {
        throw new Error(
          departmentsPayload.error ?? "Failed to load departments.",
        );
      }

      if (!ventesResponse.ok) {
        throw new Error(ventesPayload.error ?? "Failed to load sales.");
      }

      setUser(mePayload.user);
      setProfile({
        name: mePayload.user.name,
        email: mePayload.user.email,
        phone: mePayload.user.phone,
        image: mePayload.user.image,
        department_id: mePayload.user.department_id,
      });
      setDepartments(departmentsPayload.departments ?? []);
      setVentes(ventesPayload.ventes ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profile),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "Profile update failed.");
      return;
    }

    setUser(data.user);
    localStorage.setItem("sgcc_user", JSON.stringify(data.user));
    setMessage("Profile updated.");
  }

  async function insertVente(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/agent/ventes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ facture }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "Sale insert failed.");
      return;
    }

    setFacture("");
    setMessage(`Vente inseree. Reference: ${data.vente.reference}`);
    await loadAgentWorkspace();
  }

  function logout() {
    localStorage.removeItem("sgcc_token");
    localStorage.removeItem("sgcc_user");
    router.push("/login");
  }

  return (
    <main className="agent-dashboard">
      <aside className="agent-sidebar">
        <div className="agent-brand">
          <div className="agent-logo">SG</div>
          <div>
            <strong>SGCC Agents</strong>
            <span>Sales workspace</span>
          </div>
        </div>

        <div className="agent-user-mini">
          <div className="agent-avatar">
            {profile.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={profile.image} />
            ) : (
              profile.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <strong>{user?.name ?? "Agent"}</strong>
            <span>{departmentName}</span>
          </div>
        </div>

        <nav className="agent-nav" aria-label="Agent navigation">
          <button
            className={activeView === "profile" ? "active" : ""}
            onClick={() => setActiveView("profile")}
            type="button"
          >
            <span>Profile</span>
          </button>
          <button
            className={activeView === "sales" ? "active" : ""}
            onClick={() => setActiveView("sales")}
            type="button"
          >
            <span>Mes ventes</span>
          </button>
        </nav>

        <button className="agent-logout" onClick={logout} type="button">
          Logout
        </button>
      </aside>

      <section className="agent-main">
        <header className="agent-topbar">
          <div>
            <p>Bonjour</p>
            <h1>{user?.name ?? "Agent"}</h1>
          </div>
          <button
            className="agent-refresh"
            onClick={() => loadAgentWorkspace()}
            type="button"
          >
            Refresh
          </button>
        </header>

        {message ? <p className="agent-message">{message}</p> : null}

        <section className="agent-metrics">
          <div>
            <span>Total ventes</span>
            <strong>{totalVentes}</strong>
          </div>
          <div>
            <span>Factures</span>
            <strong>{ventes.length}</strong>
          </div>
          <div>
            <span>Departement</span>
            <strong>{departmentName}</strong>
          </div>
        </section>

        {activeView === "sales" ? (
          <section className="agent-content-grid">
            <form className="agent-card agent-sale-form" onSubmit={insertVente}>
              <div className="agent-card-header">
                <div>
                  <p>Nouvelle operation</p>
                  <h2>Inserer vente</h2>
                </div>
              </div>
              <label>
                Facture
                <input
                  value={facture}
                  onChange={(event) => setFacture(event.target.value)}
                  placeholder="facture-2026-001.pdf"
                  required
                />
              </label>
              <button className="agent-primary-button" type="submit">
                Enregistrer vente
              </button>
            </form>

            <section className="agent-card agent-sales-table-card">
              <div className="agent-card-header">
                <div>
                  <p>Historique</p>
                  <h2>Mes ventes</h2>
                </div>
              </div>
              <div className="agent-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Document</th>
                      <th>Nombre</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4}>Loading...</td>
                      </tr>
                    ) : ventes.length ? (
                      ventes.map((vente) => (
                        <tr key={vente.id}>
                          <td>
                            <strong>{vente.reference || "Reference"}</strong>
                          </td>
                          <td>{vente.document_id}</td>
                          <td>{vente.nombre_vente}</td>
                          <td>{new Date(vente.updatedAt).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4}>Aucune vente trouvee.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        ) : (
          <form className="agent-card agent-profile-card" onSubmit={updateProfile}>
            <div className="agent-card-header">
              <div>
                <p>Compte agent</p>
                <h2>Profile</h2>
              </div>
              <div className="agent-avatar large">
                {profile.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" src={profile.image} />
                ) : (
                  profile.name.slice(0, 2).toUpperCase()
                )}
              </div>
            </div>

            <div className="agent-form-grid">
              <label>
                Name
                <input
                  value={profile.name}
                  onChange={(event) =>
                    setProfile({ ...profile, name: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={profile.email}
                  onChange={(event) =>
                    setProfile({ ...profile, email: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Phone
                <input
                  value={profile.phone}
                  onChange={(event) =>
                    setProfile({ ...profile, phone: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Image URL
                <input
                  value={profile.image}
                  onChange={(event) =>
                    setProfile({ ...profile, image: event.target.value })
                  }
                />
              </label>
              <label className="span-2">
                Department
                <select
                  value={profile.department_id}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      department_id: event.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="agent-actions">
              <button className="agent-primary-button" type="submit">
                Save profile
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
