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

type LeadStatus =
  | "NOUVEAU"
  | "QUALIFIE"
  | "NON_QUALIFIE"
  | "CONVERTI"
  | "PERDU";

type Lead = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string;
  source: "CALL" | "REGIES";
  desired_product: string;
  approx_surface: string;
  sector: string;
  status: LeadStatus;
  assigned_agent_id: string;
  converted_dossier_id: string;
  first_contact_date: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
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

type LeadForm = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string;
  source: "CALL" | "REGIES";
  desired_product: string;
  approx_surface: string;
  sector: string;
  status: LeadStatus;
  assigned_agent_id: string;
  first_contact_date: string;
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
  createdAt: string;
  updatedAt: string;
};

type DossierStatus =
  | "NOUVEAU"
  | "QUALIFIE"
  | "RDV_PLANIFIE"
  | "DEVIS_ENVOYE"
  | "SIGNE_ACOMPTE_A_VALIDER"
  | "ACOMPTE_VALIDE"
  | "DEPOT_MPR"
  | "POSE_SOLDE_A_VALIDER"
  | "SOLDE_VALIDE"
  | "ARCHIVE"
  | "ANNULE"
  | "PERDU";

type ConvertLeadForm = {
  lead_id: string;
  product: string;
  color: string;
  sector: string;
  surface_range: string;
  appointment_date: string;
  notes: string;
};

type CommissionRule = {
  id: string;
  product: string;
  color: string;
  sector: string;
  surface_range: string;
  source_type: "CALL" | "REGIES";
  total_amount: number;
  deposit_amount: number;
  balance_amount: number;
  version: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  createdAt: string;
  updatedAt: string;
};

type CommissionRuleForm = {
  product: string;
  color: string;
  sector: string;
  surface_range: string;
  source_type: "CALL" | "REGIES";
  total_amount: string;
  deposit_amount: string;
  balance_amount: string;
  version: string;
  starts_at: string;
  ends_at: string;
};

type Commission = {
  id: string;
  dossier_id: string;
  agent_id: string;
  commission_rule_id: string;
  total_amount: number;
  deposit_amount: number;
  balance_amount: number;
  deposit_status: string;
  balance_status: string;
  global_status: string;
  calculated_at: string;
  validated_by_id: string;
};

type DashboardPayload = {
  scope: "agent" | "team" | "global";
  kpi: {
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

const emptyLeadForm: LeadForm = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  address: "",
  source: "CALL",
  desired_product: "",
  approx_surface: "",
  sector: "",
  status: "NOUVEAU",
  assigned_agent_id: "",
  first_contact_date: "",
  notes: "",
};

const leadStatuses: LeadStatus[] = [
  "NOUVEAU",
  "QUALIFIE",
  "NON_QUALIFIE",
  "CONVERTI",
  "PERDU",
];

const productOptions = ["PAC/SSC", "PAC/BTD", "PAC DUO", "PAC/BS", "SSC", "PAC/BE"];
const sectorOptions = ["H1", "H2", "H3"];
const colorOptions = ["BLEU", "JAUNE", "VIOLET"];
const surfaceRangeOptions = ["<70", "70-89", "90-109", "110-130", ">130"];
const nextDossierStatuses: Partial<Record<DossierStatus, DossierStatus[]>> = {
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

const emptyConvertLeadForm: ConvertLeadForm = {
  lead_id: "",
  product: "",
  color: "BLEU",
  sector: "",
  surface_range: "70-89",
  appointment_date: "",
  notes: "",
};

const emptyCommissionRuleForm: CommissionRuleForm = {
  product: "",
  color: "BLEU",
  sector: "H1",
  surface_range: "70-89",
  source_type: "CALL",
  total_amount: "",
  deposit_amount: "",
  balance_amount: "",
  version: "1",
  starts_at: "",
  ends_at: "",
};

function toUserForm(user: User): UserForm {
  return {
    name: user.name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    image: user.image ?? "",
    role: user.role ?? "agent",
    department_id: user.department_id ?? "",
    password: "",
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "users"
    | "departments"
    | "sales"
    | "leads"
    | "dossiers"
    | "commissionRules"
    | "commissions"
  >("dashboard");
  const [users, setUsers] = useState<User[]>([]);
  const [ventes, setVentes] = useState<NombreVente[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentName, setDepartmentName] = useState("");
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [leadForm, setLeadForm] = useState<LeadForm>(emptyLeadForm);
  const [convertLeadForm, setConvertLeadForm] =
    useState<ConvertLeadForm>(emptyConvertLeadForm);
  const [commissionRuleForm, setCommissionRuleForm] =
    useState<CommissionRuleForm>(emptyCommissionRuleForm);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [actionLoading, setActionLoading] = useState("");
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
  const isBusy = loading || Boolean(actionLoading);
  const activeTabTitle = {
    dashboard: "Dashboard",
    users: "Gestion des agents",
    leads: "Leads",
    dossiers: "Dossiers",
    commissionRules: "Grille commissions",
    commissions: "Commissions",
    departments: "Departments",
    sales: "Ventes",
  }[activeTab];
  const dashboardKpi = dashboard?.kpi;
  const leadConversionRate = dashboardKpi?.total_leads
    ? Math.round((dashboardKpi.leads_converted / dashboardKpi.total_leads) * 100)
    : 0;
  const dossierSignatureRate = dashboardKpi?.total_dossiers
    ? Math.round((dashboardKpi.dossiers_signed / dashboardKpi.total_dossiers) * 100)
    : 0;
  const commissionPaidRate = dashboardKpi?.commissions_amount
    ? Math.round((dashboardKpi.paid_amount / dashboardKpi.commissions_amount) * 100)
    : 0;
  const dossierStatusRows = [
    "NOUVEAU",
    "QUALIFIE",
    "RDV_PLANIFIE",
    "DEVIS_ENVOYE",
    "SIGNE_ACOMPTE_A_VALIDER",
    "ACOMPTE_VALIDE",
    "POSE_SOLDE_A_VALIDER",
  ].map((status) => ({
    label: status,
    value: dossiers.filter((dossier) => dossier.status === status).length,
  }));
  const maxDossierStatusCount = Math.max(
    1,
    ...dossierStatusRows.map((row) => row.value),
  );
  const dashboardChartRows = [
    {
      label: "Conversion leads",
      value: leadConversionRate,
      detail: `${dashboardKpi?.leads_converted ?? 0}/${dashboardKpi?.total_leads ?? leads.length}`,
    },
    {
      label: "Dossiers signes",
      value: dossierSignatureRate,
      detail: `${dashboardKpi?.dossiers_signed ?? 0}/${dashboardKpi?.total_dossiers ?? dossiers.length}`,
    },
    {
      label: "Commissions payees",
      value: commissionPaidRate,
      detail: `${dashboardKpi?.paid_amount ?? 0}/${dashboardKpi?.commissions_amount ?? 0} EUR`,
    },
  ];
  const agentPerformanceRows = agents
    .map((agent) => {
      const agentLeads = leads.filter((lead) => lead.assigned_agent_id === agent.id);
      const agentDossiers = dossiers.filter(
        (dossier) => dossier.assigned_agent_id === agent.id,
      );
      const agentCommissions = commissions.filter(
        (commission) => commission.agent_id === agent.id,
      );
      const commissionAmount = agentCommissions.reduce(
        (total, commission) => total + commission.total_amount,
        0,
      );
      const signedDossiers = agentDossiers.filter((dossier) =>
        [
          "SIGNE_ACOMPTE_A_VALIDER",
          "ACOMPTE_VALIDE",
          "DEPOT_MPR",
          "POSE_SOLDE_A_VALIDER",
          "SOLDE_VALIDE",
          "ARCHIVE",
        ].includes(dossier.status),
      ).length;

      return {
        id: agent.id,
        name: agent.name,
        leads: agentLeads.length,
        converted: agentLeads.filter((lead) => lead.status === "CONVERTI").length,
        dossiers: agentDossiers.length,
        signedDossiers,
        commissionAmount,
      };
    })
    .sort((firstAgent, secondAgent) => {
      if (secondAgent.commissionAmount !== firstAgent.commissionAmount) {
        return secondAgent.commissionAmount - firstAgent.commissionAmount;
      }

      return secondAgent.signedDossiers - firstAgent.signedDossiers;
    })
    .slice(0, 6);
  const maxAgentCommissionAmount = Math.max(
    1,
    ...agentPerformanceRows.map((agent) => agent.commissionAmount),
  );
  const sourceRows = ["CALL", "REGIES"].map((source) => ({
    label: source,
    leads: leads.filter((lead) => lead.source === source).length,
    dossiers: dossiers.filter((dossier) => dossier.source_type === source).length,
  }));
  const maxSourceCount = Math.max(
    1,
    ...sourceRows.flatMap((row) => [row.leads, row.dossiers]),
  );

  async function loadData(authToken = token) {
    if (!authToken) {
      return;
    }

    setLoading(true);
    setMessage("");
    const authHeaders = { Authorization: `Bearer ${authToken}` };

    try {
      const [
        usersResponse,
        ventesResponse,
        departmentsResponse,
        leadsResponse,
        dossiersResponse,
        commissionRulesResponse,
        commissionsResponse,
        dashboardResponse,
      ] = await Promise.all([
        fetch("/api/users", { headers: authHeaders }),
        fetch("/api/nombre-ventes", { headers: authHeaders }),
        fetch("/api/departments", { headers: authHeaders }),
        fetch("/api/leads", { headers: authHeaders }),
        fetch("/api/dossiers", { headers: authHeaders }),
        fetch("/api/commission-rules", { headers: authHeaders }),
        fetch("/api/commissions", { headers: authHeaders }),
        fetch("/api/dashboard", { headers: authHeaders }),
      ]);

      const usersPayload = await usersResponse.json();
      const ventesPayload = await ventesResponse.json();
      const departmentsPayload = await departmentsResponse.json();
      const leadsPayload = await leadsResponse.json();
      const dossiersPayload = await dossiersResponse.json();
      const commissionRulesPayload = await commissionRulesResponse.json();
      const commissionsPayload = await commissionsResponse.json();
      const dashboardPayload = await dashboardResponse.json();

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

      if (!leadsResponse.ok) {
        throw new Error(leadsPayload.error ?? "Failed to load leads.");
      }

      if (!dossiersResponse.ok) {
        throw new Error(dossiersPayload.error ?? "Failed to load dossiers.");
      }

      if (!commissionRulesResponse.ok) {
        throw new Error(
          commissionRulesPayload.error ?? "Failed to load commission rules.",
        );
      }

      if (!commissionsResponse.ok) {
        throw new Error(
          commissionsPayload.error ?? "Failed to load commissions.",
        );
      }

      if (!dashboardResponse.ok) {
        throw new Error(dashboardPayload.error ?? "Failed to load dashboard.");
      }

      setUsers(usersPayload.users ?? []);
      setVentes(ventesPayload.nombre_ventes ?? []);
      setDepartments(departmentsPayload.departments ?? []);
      setLeads(leadsPayload.leads ?? []);
      setDossiers(dossiersPayload.dossiers ?? []);
      setCommissionRules(commissionRulesPayload.commission_rules ?? []);
      setCommissions(commissionsPayload.commissions ?? []);
      setDashboard(dashboardPayload.dashboard ?? null);
    } catch (error) {
      setMessageType("error");
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
    setActionLoading("save-user");

    try {
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
        setMessageType("error");
        setMessage(data.error ?? "User save failed.");
        return;
      }

      const savedUser = data.user as User | undefined;

      if (savedUser) {
        setUsers((currentUsers) =>
          editingUserId
            ? currentUsers.map((user) =>
                user.id === savedUser.id ? savedUser : user,
              )
            : [savedUser, ...currentUsers],
        );
      }

      setUserForm(emptyUserForm);
      setEditingUserId(null);
      setProfileUser(savedUser ?? null);
      setMessageType("success");
      setMessage(editingUserId ? "Agent updated successfully." : "Agent created successfully.");
    } finally {
      setActionLoading("");
    }
  }

  async function fetchUserById(id: string) {
    const response = await fetch(`/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error ?? "User load failed.");
    }

    return data.user as User;
  }

  async function showUserProfile(user: User) {
    setMessage("");
    setActionLoading(`show-user-${user.id}`);

    try {
      const freshUser = await fetchUserById(user.id);
      setProfileUser(freshUser);
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === freshUser.id ? freshUser : currentUser,
        ),
      );
      setActiveTab("users");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "User load failed.");
    } finally {
      setActionLoading("");
    }
  }

  async function editUser(user: User) {
    setMessage("");
    setActionLoading(`edit-user-${user.id}`);

    try {
      const freshUser = await fetchUserById(user.id);
      setEditingUserId(freshUser.id);
      setUserForm(toUserForm(freshUser));
      setProfileUser(freshUser);
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === freshUser.id ? freshUser : currentUser,
        ),
      );
      setActiveTab("users");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "User load failed.");
    } finally {
      setActionLoading("");
    }
  }

  function logout() {
    localStorage.removeItem("sgcc_token");
    localStorage.removeItem("sgcc_user");
    router.push("/login");
  }

  async function createDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setActionLoading("create-department");

    try {
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
        setMessageType("error");
        setMessage(data.error ?? "Department create failed.");
        return;
      }

      const createdDepartment = data.department as Department | undefined;

      if (createdDepartment) {
        setDepartments((currentDepartments) => [
          createdDepartment,
          ...currentDepartments,
        ]);
      }

      setDepartmentName("");
      setMessageType("success");
      setMessage("Department created successfully.");
    } finally {
      setActionLoading("");
    }
  }

  async function deleteDepartment(id: string) {
    setActionLoading(`delete-department-${id}`);

    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMessageType("error");
        setMessage(data.error ?? "Department delete failed.");
        return;
      }

      setMessageType("success");
      setMessage("Department deleted successfully.");
      setDepartments((currentDepartments) =>
        currentDepartments.filter((department) => department.id !== id),
      );
    } finally {
      setActionLoading("");
    }
  }

  async function deleteUser(id: string) {
    setActionLoading(`delete-user-${id}`);

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMessageType("error");
        setMessage(data.error ?? "User delete failed.");
        return;
      }

      setMessageType("success");
      setMessage("Agent deleted successfully.");
      setUsers((currentUsers) => currentUsers.filter((user) => user.id !== id));
    } finally {
      setActionLoading("");
    }
  }

  async function deleteSale(id: string) {
    setActionLoading(`delete-sale-${id}`);

    try {
      const response = await fetch(`/api/nombre-ventes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMessageType("error");
        setMessage(data.error ?? "Sale delete failed.");
        return;
      }

      setMessageType("success");
      setMessage("Sale deleted successfully.");
      setVentes((currentVentes) =>
        currentVentes.filter((vente) => vente.id !== id),
      );
    } finally {
      setActionLoading("");
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
        body: JSON.stringify({
          ...leadForm,
          first_contact_date: leadForm.first_contact_date || null,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.error ?? "Lead create failed.");
        return;
      }

      setLeads((currentLeads) => [data.lead, ...currentLeads]);
      setLeadForm(emptyLeadForm);
      setMessageType("success");
      setMessage("Lead cree avec succes.");
    } finally {
      setActionLoading("");
    }
  }

  function startLeadConversion(lead: Lead) {
    setConvertLeadForm({
      lead_id: lead.id,
      product: lead.desired_product,
      color: "BLEU",
      sector: lead.sector,
      surface_range: "70-89",
      appointment_date: "",
      notes: lead.notes,
    });
    setMessage("");
  }

  async function convertLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setActionLoading("convert-lead");

    try {
      const response = await fetch(
        `/api/leads/${convertLeadForm.lead_id}/convert`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            product: convertLeadForm.product,
            color: convertLeadForm.color,
            sector: convertLeadForm.sector,
            surface_range: convertLeadForm.surface_range,
            appointment_date: convertLeadForm.appointment_date || null,
            notes: convertLeadForm.notes,
          }),
        },
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.error ?? "Lead conversion failed.");
        return;
      }

      setDossiers((currentDossiers) => [data.dossier, ...currentDossiers]);
      setLeads((currentLeads) =>
        currentLeads.map((lead) =>
          lead.id === convertLeadForm.lead_id
            ? {
                ...lead,
                status: "CONVERTI",
                converted_dossier_id: data.dossier.id,
              }
            : lead,
        ),
      );
      setConvertLeadForm(emptyConvertLeadForm);
      setMessageType("success");
      setMessage("Lead converti en dossier avec succes.");
    } finally {
      setActionLoading("");
    }
  }

  async function changeDossierStatus(id: string, status: DossierStatus) {
    setMessage("");
    setActionLoading(`dossier-status-${id}`);

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

      setDossiers((currentDossiers) =>
        currentDossiers.map((dossier) =>
          dossier.id === id ? data.dossier : dossier,
        ),
      );
      await loadData();
      setMessageType("success");
      setMessage("Statut dossier mis a jour.");
    } finally {
      setActionLoading("");
    }
  }

  async function createCommissionRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setActionLoading("create-commission-rule");

    try {
      const response = await fetch("/api/commission-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product: commissionRuleForm.product,
          color: commissionRuleForm.color,
          sector: commissionRuleForm.sector,
          surface_range: commissionRuleForm.surface_range,
          source_type: commissionRuleForm.source_type,
          total_amount: Number(commissionRuleForm.total_amount),
          deposit_amount: Number(commissionRuleForm.deposit_amount),
          balance_amount: Number(commissionRuleForm.balance_amount),
          version: Number(commissionRuleForm.version),
          starts_at: commissionRuleForm.starts_at || null,
          ends_at: commissionRuleForm.ends_at || null,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.error ?? "Commission rule create failed.");
        return;
      }

      setCommissionRules((currentRules) => [
        data.commission_rule,
        ...currentRules,
      ]);
      setCommissionRuleForm(emptyCommissionRuleForm);
      setMessageType("success");
      setMessage("Regle de commission creee avec succes.");
    } finally {
      setActionLoading("");
    }
  }

  async function deactivateCommissionRule(id: string) {
    setMessage("");
    setActionLoading(`deactivate-rule-${id}`);

    try {
      const response = await fetch(`/api/commission-rules/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.error ?? "Commission rule deactivate failed.");
        return;
      }

      setCommissionRules((currentRules) =>
        currentRules.map((rule) =>
          rule.id === id ? data.commission_rule : rule,
        ),
      );
      setMessageType("success");
      setMessage("Regle de commission desactivee.");
    } finally {
      setActionLoading("");
    }
  }

  async function runCommissionAction(id: string, action: string) {
    setMessage("");
    setActionLoading(`commission-${action}-${id}`);

    try {
      const response = await fetch(`/api/commissions/${id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.error ?? "Commission update failed.");
        return;
      }

      setCommissions((currentCommissions) =>
        currentCommissions.map((commission) =>
          commission.id === id ? data.commission : commission,
        ),
      );
      setMessageType("success");
      setMessage("Commission mise a jour.");
    } finally {
      setActionLoading("");
    }
  }

  async function downloadReport(path: string, filename: string) {
    setMessage("");
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
      setMessageType("success");
      setMessage("Export genere avec succes.");
    } finally {
      setActionLoading("");
    }
  }

  return (
    <main className="admin-dashboard-v2">
      {isBusy ? (
        <div className="page-loading-overlay" aria-live="polite" role="status">
          <span className="loading-spinner" />
          <span>
            {loading
              ? "Chargement des donnees..."
              : "Traitement de l'action..."}
          </span>
        </div>
      ) : null}

      <aside className="admin-v2-sidebar">
        <div className="admin-v2-brand">
          {/* image logo path  public\uploads\images\logo.png */}
          {/* <div className="admin-v2-logo" style={{ backgroundImage: `url(/uploads/images/logo.png)` }}></div> */}
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
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
            type="button"
          >
            <span className="admin-v2-nav-dot" />
            Dashboard
          </button>
          <button
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
            type="button"
          >
            <span className="admin-v2-nav-dot" />
            Gestion agents
          </button>
          <button
            className={activeTab === "leads" ? "active" : ""}
            onClick={() => setActiveTab("leads")}
            type="button"
          >
            <span className="admin-v2-nav-dot" />
            Leads
          </button>
          <button
            className={activeTab === "dossiers" ? "active" : ""}
            onClick={() => setActiveTab("dossiers")}
            type="button"
          >
            <span className="admin-v2-nav-dot" />
            Dossiers
          </button>
          <button
            className={activeTab === "commissionRules" ? "active" : ""}
            onClick={() => setActiveTab("commissionRules")}
            type="button"
          >
            <span className="admin-v2-nav-dot" />
            Grille commissions
          </button>
          <button
            className={activeTab === "commissions" ? "active" : ""}
            onClick={() => setActiveTab("commissions")}
            type="button"
          >
            <span className="admin-v2-nav-dot" />
            Commissions
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
            <h1>{activeTabTitle}</h1>
          </div>
          <div className="admin-v2-topbar-tools">
            <div className="admin-v2-search">
              <span>Search</span>
              <strong>Global overview</strong>
            </div>
          <button
            className="admin-v2-refresh"
            onClick={() => loadData()}
            disabled={loading}
            type="button"
          >
            {loading ? (
              <span className="button-loading-label">
                <span className="button-spinner" />
                Refreshing...
              </span>
            ) : (
              "Refresh"
            )}
          </button>
          </div>
        </header>

        {message ? (
          <p className={`admin-v2-message ${messageType}`}>{message}</p>
        ) : null}

        {activeTab === "dashboard" ? (
          <>
            <section className="admin-v2-hero">
              <div>
                <p>Operations dashboard</p>
                <h2>Vue globale CRM, performance et commissions</h2>
                <span>
                  Les KPIs admin sont centralises ici pour garder les autres
                  modules concentres sur leurs actions metier.
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
              <div>
                <span>Leads</span>
                <strong>{dashboardKpi?.total_leads ?? leads.length}</strong>
                <small>{dashboardKpi?.leads_converted ?? 0} convertis</small>
              </div>
              <div>
                <span>Dossiers</span>
                <strong>{dashboardKpi?.total_dossiers ?? dossiers.length}</strong>
                <small>{dashboardKpi?.dossiers_signed ?? 0} signes</small>
              </div>
              <div>
                <span>Regles commission</span>
                <strong>{commissionRules.length}</strong>
                <small>Grille tarifaire active/archivee</small>
              </div>
              <div>
                <span>Commissions</span>
                <strong>{dashboardKpi?.commissions_amount ?? 0}</strong>
                <small>
                  {dashboardKpi?.total_commissions ?? commissions.length} calculees
                </small>
              </div>
              <div>
                <span>En attente</span>
                <strong>{dashboardKpi?.pending_deposit_amount ?? 0}</strong>
                <small>Acomptes a valider</small>
              </div>
              <div>
                <span>Dossiers +30j</span>
                <strong>{dashboardKpi?.dossiers_pending_over_30_days ?? 0}</strong>
                <small>Sans cloture recente</small>
              </div>
            </section>

            <section className="admin-v2-dashboard-grid">
              <section className="admin-v2-card admin-v2-chart-card">
                <div className="admin-v2-card-header">
                  <div>
                    <p>Performance</p>
                    <h2>Taux principaux</h2>
                  </div>
                </div>
                <div className="admin-v2-bar-list">
                  {dashboardChartRows.map((row) => (
                    <div className="admin-v2-bar-row" key={row.label}>
                      <div>
                        <strong>{row.label}</strong>
                        <span>{row.detail}</span>
                      </div>
                      <div className="admin-v2-bar-track">
                        <span style={{ width: `${Math.min(row.value, 100)}%` }} />
                      </div>
                      <b>{row.value}%</b>
                    </div>
                  ))}
                </div>
              </section>

              <section className="admin-v2-card admin-v2-chart-card">
                <div className="admin-v2-card-header">
                  <div>
                    <p>Pipeline</p>
                    <h2>Dossiers par statut</h2>
                  </div>
                </div>
                <div className="admin-v2-status-chart">
                  {dossierStatusRows.map((row) => (
                    <div className="admin-v2-status-row" key={row.label}>
                      <span>{row.label}</span>
                      <div>
                        <i
                          style={{
                            width: `${Math.max(
                              4,
                              (row.value / maxDossierStatusCount) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section className="admin-v2-card admin-v2-chart-card">
                <div className="admin-v2-card-header">
                  <div>
                    <p>Agents</p>
                    <h2>Top performance</h2>
                  </div>
                  <button
                    className="admin-v2-secondary"
                    onClick={() => router.push("/statistiques-agents")}
                    type="button"
                  >
                    Detail agents
                  </button>
                </div>
                <div className="admin-v2-bar-list">
                  {agentPerformanceRows.length ? (
                    agentPerformanceRows.map((agent) => (
                      <div className="admin-v2-bar-row" key={agent.id}>
                        <div>
                          <strong>{agent.name}</strong>
                          <span>
                            {agent.leads} leads · {agent.signedDossiers} signes
                          </span>
                        </div>
                        <div className="admin-v2-bar-track">
                          <span
                            style={{
                              width: `${Math.max(
                                4,
                                (agent.commissionAmount /
                                  maxAgentCommissionAmount) *
                                  100,
                              )}%`,
                            }}
                          />
                        </div>
                        <b>{agent.commissionAmount} EUR</b>
                      </div>
                    ))
                  ) : (
                    <p className="muted-line">Aucune performance agent.</p>
                  )}
                </div>
              </section>

              <section className="admin-v2-card admin-v2-chart-card">
                <div className="admin-v2-card-header">
                  <div>
                    <p>Acquisition</p>
                    <h2>CALL vs REGIES</h2>
                  </div>
                </div>
                <div className="admin-v2-source-chart">
                  {sourceRows.map((row) => (
                    <div key={row.label}>
                      <strong>{row.label}</strong>
                      <span>
                        <i
                          style={{
                            height: `${Math.max(
                              8,
                              (row.leads / maxSourceCount) * 100,
                            )}%`,
                          }}
                        />
                        <b>
                          Leads
                          <small>{row.leads}</small>
                        </b>
                      </span>
                      <span>
                        <i
                          style={{
                            height: `${Math.max(
                              8,
                              (row.dossiers / maxSourceCount) * 100,
                            )}%`,
                          }}
                        />
                        <b>
                          Dossiers
                          <small>{row.dossiers}</small>
                        </b>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </section>
          </>
        ) : null}

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
                  disabled={actionLoading === "save-user"}
                  onClick={() => {
                    setEditingUserId(null);
                    setUserForm(emptyUserForm);
                  }}
                  type="button"
                >
                  Cancel
                </button>
              ) : null}
              <button
                className="admin-v2-primary"
                disabled={actionLoading === "save-user"}
                type="submit"
              >
                {actionLoading === "save-user" ? (
                  <span className="button-loading-label">
                    <span className="button-spinner" />
                    Saving...
                  </span>
                ) : editingUserId ? (
                  "Save agent"
                ) : (
                  "Create agent"
                )}
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
	                            <button
                                  disabled={actionLoading === `show-user-${user.id}`}
                                  onClick={() => showUserProfile(user)}
                                  type="button"
                                >
	                              {actionLoading === `show-user-${user.id}`
                                  ? "Loading..."
                                  : "Profil"}
	                            </button>
	                            <button
                                  disabled={actionLoading === `edit-user-${user.id}`}
                                  onClick={() => editUser(user)}
                                  type="button"
                                >
	                              Edit
	                            </button>
                            <button
                              className="admin-v2-danger"
                              disabled={actionLoading === `delete-user-${user.id}`}
                              onClick={() => deleteUser(user.id)}
                              type="button"
                            >
                              {actionLoading === `delete-user-${user.id}` ? (
                                <span className="button-loading-label">
                                  <span className="button-spinner" />
                                  Deleting...
                                </span>
                              ) : (
                                "Delete"
                              )}
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
            {profileUser ? (
              <section className="admin-v2-card admin-v2-profile-card">
                <div className="admin-v2-card-header">
                  <div>
                    <p>Profil agent</p>
                    <h2>{profileUser.name}</h2>
                  </div>
                  <button
                    className="admin-v2-secondary"
                    onClick={() => setProfileUser(null)}
                    type="button"
                  >
                    Fermer
                  </button>
                </div>
                <div className="admin-v2-profile-row">
                  <div className="admin-v2-avatar admin-v2-avatar-large">
                    {profileUser.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" src={profileUser.image} />
                    ) : (
                      profileUser.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="admin-v2-profile-grid">
                    <div>
                      <span>Nom</span>
                      <strong>{profileUser.name}</strong>
                    </div>
                    <div>
                      <span>Email</span>
                      <strong>{profileUser.email}</strong>
                    </div>
                    <div>
                      <span>Telephone</span>
                      <strong>{profileUser.phone}</strong>
                    </div>
                    <div>
                      <span>Role</span>
                      <strong>{profileUser.role}</strong>
                    </div>
                    <div>
                      <span>Departement</span>
                      <strong>
                        {departments.find(
                          (department) =>
                            department.id === profileUser.department_id,
                        )?.name ?? profileUser.department_id}
                      </strong>
                    </div>
                    <div>
                      <span>Derniere mise a jour</span>
                      <strong>
                        {new Date(profileUser.updatedAt).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
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
                <button
                  className="admin-v2-primary"
                  disabled={actionLoading === "create-department"}
                  type="submit"
                >
                  {actionLoading === "create-department" ? (
                    <span className="button-loading-label">
                      <span className="button-spinner" />
                      Adding...
                    </span>
                  ) : (
                    "Add"
                  )}
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
                        disabled={actionLoading === `delete-department-${department.id}`}
                        onClick={() => deleteDepartment(department.id)}
                        type="button"
                      >
                        {actionLoading ===
                        `delete-department-${department.id}` ? (
                          <span className="button-loading-label">
                            <span className="button-spinner" />
                            Deleting...
                          </span>
                        ) : (
                          "Delete"
                        )}
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

        {activeTab === "leads" ? (
          <section className="admin-v2-content-grid">
            <div className="admin-v2-form-stack">
            <form className="admin-v2-card admin-v2-form-card" onSubmit={createLead}>
              <div className="admin-v2-card-header">
                <div>
                  <p>Prospection</p>
                  <h2>Nouveau lead</h2>
                </div>
              </div>
              <div className="admin-v2-form-grid">
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
                  Email
                  <input
                    onChange={(event) =>
                      setLeadForm({ ...leadForm, email: event.target.value })
                    }
                    type="email"
                    value={leadForm.email}
                  />
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
                    <option value="">Selectionner agent</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
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
                  Surface approx.
                  <input
                    onChange={(event) =>
                      setLeadForm({
                        ...leadForm,
                        approx_surface: event.target.value,
                      })
                    }
                    value={leadForm.approx_surface}
                  />
                </label>
                <label>
                  Statut
                  <select
                    onChange={(event) =>
                      setLeadForm({
                        ...leadForm,
                        status: event.target.value as LeadStatus,
                      })
                    }
                    value={leadForm.status}
                  >
                    {leadStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Date premier contact
                  <input
                    onChange={(event) =>
                      setLeadForm({
                        ...leadForm,
                        first_contact_date: event.target.value,
                      })
                    }
                    type="date"
                    value={leadForm.first_contact_date}
                  />
                </label>
                <label>
                  Adresse
                  <input
                    onChange={(event) =>
                      setLeadForm({ ...leadForm, address: event.target.value })
                    }
                    value={leadForm.address}
                  />
                </label>
                <label className="span-2">
                  Notes
                  <textarea
                    onChange={(event) =>
                      setLeadForm({ ...leadForm, notes: event.target.value })
                    }
                    value={leadForm.notes}
                  />
                </label>
              </div>
              <div className="admin-v2-actions">
                <button
                  className="admin-v2-primary"
                  disabled={actionLoading === "create-lead"}
                  type="submit"
                >
                  {actionLoading === "create-lead" ? "Creation..." : "Creer lead"}
                </button>
              </div>
            </form>
            {convertLeadForm.lead_id ? (
              <form className="admin-v2-card admin-v2-form-card" onSubmit={convertLead}>
                <div className="admin-v2-card-header">
                  <div>
                    <p>Conversion</p>
                    <h2>Lead vers dossier</h2>
                  </div>
                  <button
                    className="admin-v2-secondary"
                    onClick={() => setConvertLeadForm(emptyConvertLeadForm)}
                    type="button"
                  >
                    Fermer
                  </button>
                </div>
                <div className="admin-v2-form-grid">
                  <label>
                    Produit
                    <select
                      onChange={(event) =>
                        setConvertLeadForm({
                          ...convertLeadForm,
                          product: event.target.value,
                        })
                      }
                      required
                      value={convertLeadForm.product}
                    >
                      <option value="">Selectionner</option>
                      {productOptions.map((product) => (
                        <option key={product} value={product}>
                          {product}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Couleur
                    <select
                      onChange={(event) =>
                        setConvertLeadForm({
                          ...convertLeadForm,
                          color: event.target.value,
                        })
                      }
                      required
                      value={convertLeadForm.color}
                    >
                      {colorOptions.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Secteur
                    <select
                      onChange={(event) =>
                        setConvertLeadForm({
                          ...convertLeadForm,
                          sector: event.target.value,
                        })
                      }
                      required
                      value={convertLeadForm.sector}
                    >
                      <option value="">Selectionner</option>
                      {sectorOptions.map((sector) => (
                        <option key={sector} value={sector}>
                          {sector}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Surface
                    <select
                      onChange={(event) =>
                        setConvertLeadForm({
                          ...convertLeadForm,
                          surface_range: event.target.value,
                        })
                      }
                      required
                      value={convertLeadForm.surface_range}
                    >
                      {surfaceRangeOptions.map((surfaceRange) => (
                        <option key={surfaceRange} value={surfaceRange}>
                          {surfaceRange}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="span-2">
                    Date RDV
                    <input
                      onChange={(event) =>
                        setConvertLeadForm({
                          ...convertLeadForm,
                          appointment_date: event.target.value,
                        })
                      }
                      type="datetime-local"
                      value={convertLeadForm.appointment_date}
                    />
                  </label>
                  <label className="span-2">
                    Notes
                    <textarea
                      onChange={(event) =>
                        setConvertLeadForm({
                          ...convertLeadForm,
                          notes: event.target.value,
                        })
                      }
                      value={convertLeadForm.notes}
                    />
                  </label>
                </div>
                <div className="admin-v2-actions">
                  <button
                    className="admin-v2-primary"
                    disabled={actionLoading === "convert-lead"}
                    type="submit"
                  >
                    {actionLoading === "convert-lead"
                      ? "Conversion..."
                      : "Creer dossier"}
                  </button>
                </div>
              </form>
            ) : null}
            </div>

            <section className="admin-v2-card admin-v2-table-card">
              <div className="admin-v2-card-header">
                <div>
                  <p>Pipeline</p>
                  <h2>Leads</h2>
                </div>
              </div>
              <div className="admin-v2-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Lead</th>
                      <th>Source</th>
                      <th>Statut</th>
                      <th>Agent</th>
                      <th>Produit</th>
                      <th>Contact</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7}>Loading...</td>
                      </tr>
                    ) : leads.length ? (
                      leads.map((lead) => {
                        const agent = userById.get(lead.assigned_agent_id);

                        return (
                          <tr key={lead.id}>
                            <td>
                              <strong>
                                {lead.first_name} {lead.last_name}
                              </strong>
                              <span className="muted-line">{lead.address || "-"}</span>
                            </td>
                            <td>{lead.source}</td>
                            <td>{lead.status}</td>
                            <td>{agent?.name ?? lead.assigned_agent_id}</td>
                            <td>{lead.desired_product || "-"}</td>
                            <td>
                              <strong>{lead.phone}</strong>
                              <span className="muted-line">{lead.email || "-"}</span>
                            </td>
                            <td>
                              {lead.converted_dossier_id ? (
                                <span className="muted-line">
                                  Dossier cree
                                </span>
                              ) : (
                                <button
                                  className="admin-v2-secondary"
                                  onClick={() => startLeadConversion(lead)}
                                  type="button"
                                >
                                  Convertir
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7}>Aucun lead trouve.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === "dossiers" ? (
          <section className="admin-v2-card">
            <div className="admin-v2-card-header">
              <div>
                <p>Workflow commercial</p>
                <h2>Dossiers</h2>
              </div>
              <button
                className="admin-v2-secondary"
                disabled={actionLoading === "export-dossiers.csv"}
                onClick={() =>
                  downloadReport("/api/reports/export/dossiers", "dossiers.csv")
                }
                type="button"
              >
                Export CSV
              </button>
            </div>
            <div className="admin-v2-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Dossier</th>
                    <th>Agent</th>
                    <th>Produit</th>
                    <th>Statut</th>
                    <th>Source</th>
                    <th>Dates</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7}>Loading...</td>
                    </tr>
                  ) : dossiers.length ? (
                    dossiers.map((dossier) => {
                      const agent = userById.get(dossier.assigned_agent_id);
                      const nextStatuses =
                        nextDossierStatuses[dossier.status as DossierStatus] ?? [];

                      return (
                        <tr key={dossier.id}>
                          <td>
                            <strong>{dossier.id.slice(-8)}</strong>
                            <span className="muted-line">
                              Lead {dossier.lead_id.slice(-8)}
                            </span>
                          </td>
                          <td>{agent?.name ?? dossier.assigned_agent_id}</td>
                          <td>
                            <strong>{dossier.product}</strong>
                            <span className="muted-line">
                              {dossier.color} · {dossier.sector} ·{" "}
                              {dossier.surface_range}
                            </span>
                          </td>
                          <td>{dossier.status}</td>
                          <td>{dossier.source_type}</td>
                          <td>
                            <span className="muted-line">
                              RDV{" "}
                              {dossier.appointment_date
                                ? new Date(
                                    dossier.appointment_date,
                                  ).toLocaleString()
                                : "-"}
                            </span>
                          </td>
                          <td>
                            {nextStatuses.length ? (
                              <select
                                disabled={
                                  actionLoading ===
                                  `dossier-status-${dossier.id}`
                                }
                                onChange={(event) => {
                                  const value = event.target.value;
                                  event.target.value = "";

                                  if (value) {
                                    changeDossierStatus(
                                      dossier.id,
                                      value as DossierStatus,
                                    );
                                  }
                                }}
                                value=""
                              >
                                <option value="">Changer statut</option>
                                {nextStatuses.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="muted-line">Final</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7}>Aucun dossier trouve.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {activeTab === "commissionRules" ? (
          <section className="admin-v2-content-grid">
            <form
              className="admin-v2-card admin-v2-form-card"
              onSubmit={createCommissionRule}
            >
              <div className="admin-v2-card-header">
                <div>
                  <p>Grille tarifaire</p>
                  <h2>Nouvelle regle</h2>
                </div>
              </div>
              <div className="admin-v2-form-grid">
                <label>
                  Produit
                  <select
                    onChange={(event) =>
                      setCommissionRuleForm({
                        ...commissionRuleForm,
                        product: event.target.value,
                      })
                    }
                    required
                    value={commissionRuleForm.product}
                  >
                    <option value="">Selectionner</option>
                    {productOptions.map((product) => (
                      <option key={product} value={product}>
                        {product}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Couleur
                  <select
                    onChange={(event) =>
                      setCommissionRuleForm({
                        ...commissionRuleForm,
                        color: event.target.value,
                      })
                    }
                    value={commissionRuleForm.color}
                  >
                    {colorOptions.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Secteur
                  <select
                    onChange={(event) =>
                      setCommissionRuleForm({
                        ...commissionRuleForm,
                        sector: event.target.value,
                      })
                    }
                    value={commissionRuleForm.sector}
                  >
                    {sectorOptions.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Surface
                  <select
                    onChange={(event) =>
                      setCommissionRuleForm({
                        ...commissionRuleForm,
                        surface_range: event.target.value,
                      })
                    }
                    value={commissionRuleForm.surface_range}
                  >
                    {surfaceRangeOptions.map((surfaceRange) => (
                      <option key={surfaceRange} value={surfaceRange}>
                        {surfaceRange}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Type
                  <select
                    onChange={(event) =>
                      setCommissionRuleForm({
                        ...commissionRuleForm,
                        source_type: event.target.value as "CALL" | "REGIES",
                      })
                    }
                    value={commissionRuleForm.source_type}
                  >
                    <option value="CALL">CALL</option>
                    <option value="REGIES">REGIES</option>
                  </select>
                </label>
                <label>
                  Version
                  <input
                    min="1"
                    onChange={(event) =>
                      setCommissionRuleForm({
                        ...commissionRuleForm,
                        version: event.target.value,
                      })
                    }
                    required
                    type="number"
                    value={commissionRuleForm.version}
                  />
                </label>
                <label>
                  Total
                  <input
                    min="0"
                    onChange={(event) =>
                      setCommissionRuleForm({
                        ...commissionRuleForm,
                        total_amount: event.target.value,
                      })
                    }
                    required
                    type="number"
                    value={commissionRuleForm.total_amount}
                  />
                </label>
                <label>
                  Acompte
                  <input
                    min="0"
                    onChange={(event) =>
                      setCommissionRuleForm({
                        ...commissionRuleForm,
                        deposit_amount: event.target.value,
                      })
                    }
                    required
                    type="number"
                    value={commissionRuleForm.deposit_amount}
                  />
                </label>
                <label>
                  Solde
                  <input
                    min="0"
                    onChange={(event) =>
                      setCommissionRuleForm({
                        ...commissionRuleForm,
                        balance_amount: event.target.value,
                      })
                    }
                    required
                    type="number"
                    value={commissionRuleForm.balance_amount}
                  />
                </label>
                <label>
                  Debut
                  <input
                    onChange={(event) =>
                      setCommissionRuleForm({
                        ...commissionRuleForm,
                        starts_at: event.target.value,
                      })
                    }
                    type="date"
                    value={commissionRuleForm.starts_at}
                  />
                </label>
                <label>
                  Fin
                  <input
                    onChange={(event) =>
                      setCommissionRuleForm({
                        ...commissionRuleForm,
                        ends_at: event.target.value,
                      })
                    }
                    type="date"
                    value={commissionRuleForm.ends_at}
                  />
                </label>
              </div>
              <div className="admin-v2-actions">
                <button
                  className="admin-v2-primary"
                  disabled={actionLoading === "create-commission-rule"}
                  type="submit"
                >
                  {actionLoading === "create-commission-rule"
                    ? "Creation..."
                    : "Creer regle"}
                </button>
              </div>
            </form>

            <section className="admin-v2-card admin-v2-table-card">
              <div className="admin-v2-card-header">
                <div>
                  <p>Regles</p>
                  <h2>Grille commissions</h2>
                </div>
              </div>
              <div className="admin-v2-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Combinaison</th>
                      <th>Type</th>
                      <th>Montants</th>
                      <th>Version</th>
                      <th>Statut</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6}>Loading...</td>
                      </tr>
                    ) : commissionRules.length ? (
                      commissionRules.map((rule) => (
                        <tr key={rule.id}>
                          <td>
                            <strong>{rule.product}</strong>
                            <span className="muted-line">
                              {rule.color} · {rule.sector} ·{" "}
                              {rule.surface_range}
                            </span>
                          </td>
                          <td>{rule.source_type}</td>
                          <td>
                            <strong>{rule.total_amount} EUR</strong>
                            <span className="muted-line">
                              Acompte {rule.deposit_amount} · Solde{" "}
                              {rule.balance_amount}
                            </span>
                          </td>
                          <td>v{rule.version}</td>
                          <td>{rule.is_active ? "ACTIVE" : "INACTIVE"}</td>
                          <td>
                            {rule.is_active ? (
                              <button
                                className="admin-v2-danger"
                                disabled={
                                  actionLoading ===
                                  `deactivate-rule-${rule.id}`
                                }
                                onClick={() => deactivateCommissionRule(rule.id)}
                                type="button"
                              >
                                Desactiver
                              </button>
                            ) : (
                              <span className="muted-line">Archivee</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6}>Aucune regle trouvee.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === "commissions" ? (
          <section className="admin-v2-card">
            <div className="admin-v2-card-header">
              <div>
                <p>Calcul automatique</p>
                <h2>Commissions</h2>
              </div>
              <button
                className="admin-v2-secondary"
                disabled={actionLoading === "export-commissions.csv"}
                onClick={() =>
                  downloadReport(
                    "/api/reports/export/commissions",
                    "commissions.csv",
                  )
                }
                type="button"
              >
                Export CSV
              </button>
            </div>
            <div className="admin-v2-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Dossier</th>
                    <th>Agent</th>
                    <th>Total</th>
                    <th>Acompte</th>
                    <th>Solde</th>
                    <th>Statut</th>
                    <th>Calcul</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8}>Loading...</td>
                    </tr>
                  ) : commissions.length ? (
                    commissions.map((commission) => {
                      const agent = userById.get(commission.agent_id);

                      return (
                        <tr key={commission.id}>
                          <td>{commission.dossier_id.slice(-8)}</td>
                          <td>{agent?.name ?? commission.agent_id}</td>
                          <td>
                            <strong>{commission.total_amount} EUR</strong>
                          </td>
                          <td>
                            {commission.deposit_amount} EUR
                            <span className="muted-line">
                              {commission.deposit_status}
                            </span>
                          </td>
                          <td>
                            {commission.balance_amount} EUR
                            <span className="muted-line">
                              {commission.balance_status}
                            </span>
                          </td>
                          <td>{commission.global_status}</td>
                          <td>
                            {new Date(
                              commission.calculated_at,
                            ).toLocaleString()}
                          </td>
                          <td>
                            <div className="admin-v2-row-actions">
                              {commission.deposit_status ===
                              "ACOMPTE_EN_ATTENTE" ? (
                                <button
                                  disabled={
                                    actionLoading ===
                                    `commission-validate-deposit-${commission.id}`
                                  }
                                  onClick={() =>
                                    runCommissionAction(
                                      commission.id,
                                      "validate-deposit",
                                    )
                                  }
                                  type="button"
                                >
                                  Valider acompte
                                </button>
                              ) : null}
                              {commission.deposit_status ===
                              "ACOMPTE_VALIDE" ? (
                                <button
                                  disabled={
                                    actionLoading ===
                                    `commission-mark-deposit-paid-${commission.id}`
                                  }
                                  onClick={() =>
                                    runCommissionAction(
                                      commission.id,
                                      "mark-deposit-paid",
                                    )
                                  }
                                  type="button"
                                >
                                  Acompte paye
                                </button>
                              ) : null}
                              {commission.balance_status ===
                              "SOLDE_EN_ATTENTE" ? (
                                <button
                                  disabled={
                                    actionLoading ===
                                    `commission-validate-balance-${commission.id}`
                                  }
                                  onClick={() =>
                                    runCommissionAction(
                                      commission.id,
                                      "validate-balance",
                                    )
                                  }
                                  type="button"
                                >
                                  Valider solde
                                </button>
                              ) : null}
                              {commission.balance_status === "SOLDE_VALIDE" ? (
                                <button
                                  disabled={
                                    actionLoading ===
                                    `commission-mark-balance-paid-${commission.id}`
                                  }
                                  onClick={() =>
                                    runCommissionAction(
                                      commission.id,
                                      "mark-balance-paid",
                                    )
                                  }
                                  type="button"
                                >
                                  Solde paye
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8}>Aucune commission calculee.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                              disabled={actionLoading === `delete-sale-${vente.id}`}
                              onClick={() => deleteSale(vente.id)}
                              type="button"
                            >
                              {actionLoading === `delete-sale-${vente.id}` ? (
                                <span className="button-loading-label">
                                  <span className="button-spinner" />
                                  Deleting...
                                </span>
                              ) : (
                                "Delete"
                              )}
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
