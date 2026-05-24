"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type UserRole = "admin" | "manager" | "agent";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string;
  role: UserRole;
  department_id: string;
  createdAt: string;
  updatedAt: string;
};

type NombreVente = {
  id: string;
  user_id: string;
  document_id: string;
  reference: string;
  nombre_vente: number;
  saleInsertedAt: string;
  updatedAt: string;
};

type Department = {
  id: string;
  name: string;
};

type UserForm = {
  name: string;
  email: string;
  phone: string;
  image: string;
  role: UserRole;
  department_id: string;
  password: string;
};

const emptyUserForm: UserForm = {
  name: "",
  email: "",
  phone: "",
  image: "",
  role: "agent",
  department_id: "",
  password: "",
};

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [activeTab, setActiveTab] = useState<
    "users" | "departments" | "sales"
  >("users");
  const [users, setUsers] = useState<User[]>([]);
  const [ventes, setVentes] = useState<NombreVente[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentName, setDepartmentName] = useState("");
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const userById = useMemo(() => {
    return new Map(users.map((user) => [user.id, user]));
  }, [users]);

  const totalVentes = ventes.reduce(
    (total, vente) => total + vente.nombre_vente,
    0,
  );

  const agents = users.filter((user) => user.role === "agent");
  const agentCount = agents.length;

  async function loadData(authToken = token) {
    if (!authToken) {
      return;
    }

    setLoading(true);
    setMessage("");
    const authHeaders = { Authorization: `Bearer ${authToken}` };

    try {
      const [usersResponse, ventesResponse] = await Promise.all([
        fetch("/api/users", { headers: authHeaders }),
        fetch("/api/nombre-ventes", { headers: authHeaders }),
      ]);
      const departmentsResponse = await fetch("/api/departments", {
        headers: authHeaders,
      });

      const usersPayload = await usersResponse.json();
      const ventesPayload = await ventesResponse.json();
      const departmentsPayload = await departmentsResponse.json();

      if (!usersResponse.ok) {
        throw new Error(usersPayload.error ?? "Failed to load users.");
      }

      if (!ventesResponse.ok) {
        throw new Error(ventesPayload.error ?? "Failed to load sales.");
      }

      if (!departmentsResponse.ok) {
        throw new Error(
          departmentsPayload.error ?? "Failed to load departments.",
        );
      }

      setUsers(usersPayload.users ?? []);
      setVentes(ventesPayload.nombre_ventes ?? []);
      setDepartments(departmentsPayload.departments ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }

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

        if (!response.ok || data.user?.role !== "admin") {
          router.push(data.user?.role === "agent" ? "/agent" : "/login");
          return;
        }

        setToken(storedToken);
        await loadData(storedToken);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const payload = {
      name: userForm.name,
      email: userForm.email,
      phone: userForm.phone,
      image: userForm.image,
      role: userForm.role,
      department_id: userForm.department_id,
      ...(editingUserId ? {} : { password: userForm.password }),
    };

    const response = await fetch(
      editingUserId ? `/api/users/${editingUserId}` : "/api/users",
      {
        method: editingUserId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "User save failed.");
      return;
    }

    setUserForm(emptyUserForm);
    setEditingUserId(null);
    setMessage(editingUserId ? "User updated." : "User created.");
    await loadData();
  }

  function editUser(user: User) {
    setEditingUserId(user.id);
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      image: user.image,
      role: user.role,
      department_id: user.department_id,
      password: "",
    });
    setActiveTab("users");
  }

  function logout() {
    localStorage.removeItem("sgcc_token");
    localStorage.removeItem("sgcc_user");
    router.push("/login");
  }

  async function createDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/departments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: departmentName }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "Department create failed.");
      return;
    }

    setDepartmentName("");
    setMessage("Department created.");
    await loadData();
  }

  async function deleteDepartment(id: string) {
    const response = await fetch(`/api/departments/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(data.error ?? "Department delete failed.");
      return;
    }

    setMessage("Department deleted.");
    await loadData();
  }

  async function deleteUser(id: string) {
    const response = await fetch(`/api/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(data.error ?? "User delete failed.");
      return;
    }

    setMessage("User deleted.");
    await loadData();
  }

  async function deleteSale(id: string) {
    const response = await fetch(`/api/nombre-ventes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(data.error ?? "Sale delete failed.");
      return;
    }

    setMessage("Sale counter deleted.");
    await loadData();
  }

  return (
    <main className="admin-dashboard-v2">
      <aside className="admin-v2-sidebar">
        <div className="admin-v2-brand">
          <div className="admin-v2-logo">SG</div>
          <div>
            <strong>SGCC Agents</strong>
            <span>Command Center</span>
          </div>
        </div>

        <div className="admin-v2-sidebar-card">
          <span>Session</span>
          <strong>Administrator</strong>
          <small>Full access enabled</small>
        </div>

        <nav className="admin-v2-nav" aria-label="Admin navigation">
          <button
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
            type="button"
          >
            <span className="admin-v2-nav-dot" />
            Gestion agents
          </button>
          <button
            className={activeTab === "departments" ? "active" : ""}
            onClick={() => setActiveTab("departments")}
            type="button"
          >
            <span className="admin-v2-nav-dot" />
            Departments
          </button>
          <button
            className={activeTab === "sales" ? "active" : ""}
            onClick={() => setActiveTab("sales")}
            type="button"
          >
            <span className="admin-v2-nav-dot" />
            Ventes
          </button>
        </nav>

        <button className="admin-v2-logout" onClick={logout} type="button">
          Logout
        </button>
      </aside>

      <section className="admin-v2-main">
        <header className="admin-v2-topbar">
          <div>
            <p>Console admin</p>
          <h1>Gestion des agents</h1>
          </div>
          <div className="admin-v2-topbar-tools">
            <div className="admin-v2-search">
              <span>Search</span>
              <strong>Global overview</strong>
            </div>
          <button
            className="admin-v2-refresh"
            onClick={() => loadData()}
            type="button"
          >
            Refresh
          </button>
          </div>
        </header>

        <section className="admin-v2-hero">
          <div>
            <p>Operations dashboard</p>
            <h2>Agents, departments et ventes centralises</h2>
            <span>
              Controle les agents, surveille les ventes et garde les structures
              d'equipes propres depuis une seule interface.
            </span>
          </div>
          <div className="admin-v2-hero-panel">
            <span>System status</span>
            <strong>Operational</strong>
          </div>
        </section>

        <section className="admin-v2-metrics">
          <div>
            <span>Agents</span>
            <strong>{agentCount}</strong>
            <small>{agentCount} agents actifs</small>
          </div>
          <div>
            <span>Departments</span>
            <strong>{departments.length}</strong>
            <small>Structure organisation</small>
          </div>
          <div>
            <span>Total ventes</span>
            <strong>{totalVentes}</strong>
            <small>{ventes.length} factures suivies</small>
          </div>
        </section>

        {message ? <p className="admin-v2-message">{message}</p> : null}

        {activeTab === "users" ? (
          <section className="admin-v2-content-grid">
            <form className="admin-v2-card admin-v2-form-card" onSubmit={saveUser}>
              <div className="admin-v2-card-header">
                <div>
                  <p>Access control</p>
                  <h2>{editingUserId ? "Modifier agent" : "Ajouter agent"}</h2>
                </div>
              </div>
              <div className="admin-v2-form-grid">
              <label>
                Name
                <input
                  value={userForm.name}
                  onChange={(event) =>
                    setUserForm({ ...userForm, name: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(event) =>
                    setUserForm({ ...userForm, email: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Phone
                <input
                  value={userForm.phone}
                  onChange={(event) =>
                    setUserForm({ ...userForm, phone: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Image URL
                <input
                  value={userForm.image}
                  onChange={(event) =>
                    setUserForm({ ...userForm, image: event.target.value })
                  }
                />
              </label>
              <label>
                Role
                <select
                  value={userForm.role}
                  onChange={(event) =>
                    setUserForm({
                      ...userForm,
                      role: event.target.value as UserRole,
                    })
                  }
                >
                  <option value="agent">agent</option>
                  <option value="manager">manager</option>
                  <option value="admin">admin</option>
                </select>
              </label>
              <label>
                Department
                <select
                  value={userForm.department_id}
                  onChange={(event) =>
                    setUserForm({
                      ...userForm,
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
              {!editingUserId ? (
                <label className="span-2">
                  Password
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(event) =>
                      setUserForm({
                        ...userForm,
                        password: event.target.value,
                      })
                    }
                    minLength={8}
                    required
                  />
                </label>
              ) : null}
            </div>
            <div className="admin-v2-actions">
              {editingUserId ? (
                <button
                  className="admin-v2-secondary"
                  onClick={() => {
                    setEditingUserId(null);
                    setUserForm(emptyUserForm);
                  }}
                  type="button"
                >
                  Cancel
                </button>
              ) : null}
              <button className="admin-v2-primary" type="submit">
                {editingUserId ? "Save agent" : "Create agent"}
              </button>
            </div>
          </form>

            <section className="admin-v2-card admin-v2-table-card">
              <div className="admin-v2-card-header">
                <div>
                  <p>Directory</p>
                  <h2>Agents</h2>
                </div>
              </div>
              <div className="admin-v2-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5}>Loading...</td>
                    </tr>
                  ) : agents.length ? (
                    agents.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-cell">
                            <div className="admin-v2-avatar">
                              {user.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img alt="" src={user.image} />
                              ) : (
                                user.name.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <strong>{user.name}</strong>
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>{user.role}</td>
                        <td>
                          {departments.find(
                            (department) => department.id === user.department_id,
                          )?.name ?? user.department_id}
                        </td>
                        <td>{user.phone}</td>
                        <td>
                          <div className="admin-v2-row-actions">
                            <button onClick={() => editUser(user)} type="button">
                              Edit
                            </button>
                            <button
                              className="admin-v2-danger"
                              onClick={() => deleteUser(user.id)}
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>No agents found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
        ) : null}

        {activeTab === "departments" ? (
          <section className="admin-v2-content-grid">
            <section className="admin-v2-card admin-v2-form-card">
              <div className="admin-v2-card-header">
                <div>
                  <p>Organisation</p>
                  <h2>Ajouter department</h2>
                </div>
              </div>
              <form className="admin-v2-inline-form" onSubmit={createDepartment}>
                <input
                  value={departmentName}
                  onChange={(event) => setDepartmentName(event.target.value)}
                  placeholder="Sales"
                  required
                />
                <button className="admin-v2-primary" type="submit">
                  Add
                </button>
              </form>
            </section>

            <section className="admin-v2-card admin-v2-table-card">
              <div className="admin-v2-card-header">
                <div>
                  <p>References</p>
                  <h2>Departments</h2>
                </div>
              </div>
              <div className="admin-v2-department-list">
                {departments.length ? (
                  departments.map((department) => (
                    <div key={department.id}>
                      <span>{department.name}</span>
                      <button
                        className="admin-v2-danger"
                        onClick={() => deleteDepartment(department.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="muted-line">No departments found.</p>
                )}
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === "sales" ? (
          <section className="admin-v2-card">
            <div className="admin-v2-card-header">
              <div>
                <p>Monitoring</p>
                <h2>Ventes</h2>
              </div>
            </div>
            <div className="admin-v2-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Reference</th>
                    <th>Document</th>
                    <th>Nombre</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5}>Loading...</td>
                    </tr>
                  ) : ventes.length ? (
                    ventes.map((vente) => {
                      const user = userById.get(vente.user_id);

                      return (
                        <tr key={vente.id}>
                          <td>
                            <strong>{user?.name ?? "Unknown user"}</strong>
                            <span className="muted-line">{vente.user_id}</span>
                          </td>
                          <td>{vente.reference || "-"}</td>
                          <td>{vente.document_id}</td>
                          <td>
                            <strong>{vente.nombre_vente}</strong>
                          </td>
                          <td>{new Date(vente.updatedAt).toLocaleString()}</td>
                          <td>
                            <button
                              className="admin-v2-danger"
                              onClick={() => deleteSale(vente.id)}
                              type="button"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6}>No sales found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
