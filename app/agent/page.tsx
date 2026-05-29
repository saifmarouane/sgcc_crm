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
  document?: {
    id: string;
    document_file: string;
  } | null;
  documents?: Array<{
    id: string;
    document_file: string;
  }>;
  reference: string;
  motif: string;
  nombre_vente: number;
  saleInsertedAt: string;
  updatedAt: string;
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

type AgentView = "profile" | "sales" | "leads" | "dossiers" | "commissions";

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
  first_contact_date: "",
  notes: "",
};

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

function toProfileForm(user: AgentUser) {
  return {
    name: user.name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    image: user.image ?? "",
    department_id: user.department_id ?? "",
  };
}

export default function AgentPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<AgentView>("sales");
  const [token, setToken] = useState("");
  const [user, setUser] = useState<AgentUser | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [ventes, setVentes] = useState<AgentVente[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [leadForm, setLeadForm] = useState<LeadForm>(emptyLeadForm);
  const [convertLeadForm, setConvertLeadForm] =
    useState<ConvertLeadForm>(emptyConvertLeadForm);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    image: "",
    department_id: "",
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [factureFiles, setFactureFiles] = useState<File[]>([]);
  const [saleMotif, setSaleMotif] = useState("");
  const [extraFactureFilesBySale, setExtraFactureFilesBySale] = useState<
    Record<string, File[]>
  >({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [actionLoading, setActionLoading] = useState("");
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
  const isBusy = loading || Boolean(actionLoading);

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
      const [
        meResponse,
        departmentsResponse,
        ventesResponse,
        leadsResponse,
        dossiersResponse,
        commissionsResponse,
        dashboardResponse,
      ] =
        await Promise.all([
          fetch("/api/auth/me", { headers: authHeaders }),
          fetch("/api/departments", { headers: authHeaders }),
          fetch("/api/agent/ventes", { headers: authHeaders }),
          fetch("/api/leads", { headers: authHeaders }),
          fetch("/api/dossiers", { headers: authHeaders }),
          fetch("/api/commissions", { headers: authHeaders }),
          fetch("/api/dashboard", { headers: authHeaders }),
        ]);

      const mePayload = await meResponse.json().catch(() => ({}));
      const departmentsPayload = await departmentsResponse
        .json()
        .catch(() => ({}));
      const ventesPayload = await ventesResponse.json().catch(() => ({}));
      const leadsPayload = await leadsResponse.json().catch(() => ({}));
      const dossiersPayload = await dossiersResponse.json().catch(() => ({}));
      const commissionsPayload = await commissionsResponse.json().catch(() => ({}));
      const dashboardPayload = await dashboardResponse.json().catch(() => ({}));

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

      if (!leadsResponse.ok) {
        throw new Error(leadsPayload.error ?? "Failed to load leads.");
      }

      if (!dossiersResponse.ok) {
        throw new Error(dossiersPayload.error ?? "Failed to load dossiers.");
      }

      if (!commissionsResponse.ok) {
        throw new Error(
          commissionsPayload.error ?? "Failed to load commissions.",
        );
      }

      if (!dashboardResponse.ok) {
        throw new Error(dashboardPayload.error ?? "Failed to load dashboard.");
      }

      setUser(mePayload.user);
      setProfile(toProfileForm(mePayload.user));
      setDepartments(departmentsPayload.departments ?? []);
      setVentes(ventesPayload.ventes ?? []);
      setLeads(leadsPayload.leads ?? []);
      setDossiers(dossiersPayload.dossiers ?? []);
      setCommissions(commissionsPayload.commissions ?? []);
      setDashboard(dashboardPayload.dashboard ?? null);
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setActionLoading("profile");
    let nextProfile = profile;

    try {
      if (profileImageFile) {
        const uploadedFile = await uploadFile(profileImageFile, "profile");
        nextProfile = { ...profile, image: uploadedFile.url };
        setProfile(nextProfile);
      }

      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(nextProfile),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.error ?? "Profile update failed.");
        return;
      }

      setUser(data.user);
      setProfile(toProfileForm(data.user));
      setProfileImageFile(null);
      localStorage.setItem("sgcc_user", JSON.stringify(data.user));
      setMessageType("success");
      setMessage("Profile updated successfully.");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Profile update failed.");
    } finally {
      setActionLoading("");
    }
  }

  async function insertVente(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setActionLoading("sale");

    if (!factureFiles.length) {
      setMessageType("error");
      setMessage("Veuillez uploader au moins un document.");
      setActionLoading("");
      return;
    }

    try {
      setMessageType("success");
      setMessage("Upload des documents en cours...");
      const uploadedFiles = await Promise.all(
        factureFiles.map((file) => uploadFile(file, "document")),
      );
      setMessage("Documents uploades. Enregistrement de la vente...");

      const response = await fetch("/api/agent/ventes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          factures: uploadedFiles.map((file) => file.url),
          motif: saleMotif,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessageType("error");
        setMessage(
          `Documents uploades, mais vente non enregistree: ${
            data.error ?? "Sale insert failed."
          }`,
        );
        return;
      }

      setFactureFiles([]);
      setSaleMotif("");
      setMessageType("success");
      setMessage(`Vente inseree avec succes. Reference: ${data.vente.reference}`);
      const createdVente = data.vente?.nombre_vente as AgentVente | undefined;

      if (createdVente) {
        setVentes((currentVentes) => [
          {
            ...createdVente,
            document: data.vente.documents?.[0] ?? null,
            documents: data.vente.documents ?? [],
          },
          ...currentVentes,
        ]);
      }
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Sale insert failed.");
    } finally {
      setActionLoading("");
    }
  }

  async function createLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setActionLoading("lead");

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

      setLeadForm(emptyLeadForm);
      setLeads((currentLeads) => [data.lead, ...currentLeads]);
      setMessageType("success");
      setMessage("Lead cree avec succes.");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Lead create failed.");
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
    setMessageType("success");
    setMessage("Complete les informations de conversion dans le panneau Lead vers dossier.");
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
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error ? error.message : "Lead conversion failed.",
      );
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
      await loadAgentWorkspace();
      setMessageType("success");
      setMessage("Statut dossier mis a jour.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Dossier status update failed.",
      );
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

  async function addDocumentsToSale(venteId: string) {
    const files = extraFactureFilesBySale[venteId] ?? [];
    setMessage("");
    setActionLoading(`add-documents-${venteId}`);

    if (!files.length) {
      setMessageType("error");
      setMessage("Veuillez selectionner au moins un document.");
      setActionLoading("");
      return;
    }

    try {
      setMessageType("success");
      setMessage("Upload des documents en cours...");
      const uploadedFiles = await Promise.all(
        files.map((file) => uploadFile(file, "document")),
      );
      setMessage("Documents uploades. Association a la vente...");

      const response = await fetch("/api/agent/ventes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vente_id: venteId,
          factures: uploadedFiles.map((file) => file.url),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessageType("error");
        setMessage(
          `Documents uploades, mais non associes a la vente: ${
            data.error ?? "Document insert failed."
          }`,
        );
        return;
      }

      setExtraFactureFilesBySale((currentFiles) => {
        const nextFiles = { ...currentFiles };
        delete nextFiles[venteId];
        return nextFiles;
      });
      setVentes((currentVentes) =>
        currentVentes.map((vente) =>
          vente.id === venteId
            ? {
                ...vente,
                ...data.vente,
                document: data.vente.documents?.[0] ?? vente.document ?? null,
                documents: [
                  ...(vente.documents ?? []),
                  ...(data.documents ?? []),
                ],
              }
            : vente,
        ),
      );
      setMessageType("success");
      setMessage("Documents ajoutes a la vente.");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Document insert failed.");
    } finally {
      setActionLoading("");
    }
  }

  async function uploadFile(file: File, type: "profile" | "document") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const response = await fetch("/api/uploads", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error ?? `Upload failed for ${file.name}.`);
    }

    return data.file as { url: string; originalName: string };
  }

  function logout() {
    localStorage.removeItem("sgcc_token");
    localStorage.removeItem("sgcc_user");
    router.push("/login");
  }

  function addFactureFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    const selectedFiles = Array.from(files);

    setFactureFiles((currentFiles) => [
      ...currentFiles,
      ...selectedFiles,
    ]);
  }

  function removeFactureInput(index: number) {
    setFactureFiles((currentFiles) =>
      currentFiles.filter((_file, currentIndex) => currentIndex !== index),
    );
  }

  function addExtraFactureFiles(venteId: string, files: FileList | null) {
    if (!files?.length) {
      return;
    }

    const selectedFiles = Array.from(files);

    setExtraFactureFilesBySale((currentFiles) => ({
      ...currentFiles,
      [venteId]: [
        ...(currentFiles[venteId] ?? []),
        ...selectedFiles,
      ],
    }));
  }

  function removeExtraFactureFile(venteId: string, index: number) {
    setExtraFactureFilesBySale((currentFiles) => ({
      ...currentFiles,
      [venteId]: (currentFiles[venteId] ?? []).filter(
        (_file, currentIndex) => currentIndex !== index,
      ),
    }));
  }

  return (
    <main className="agent-dashboard">
      {isBusy ? (
        <div className="page-loading-overlay" aria-live="polite" role="status">
          <span className="loading-spinner" />
          <span>
            {loading
              ? "Chargement de l'espace agent..."
              : actionLoading === "sale"
                ? "Enregistrement de la vente..."
                : "Traitement de l'action..."}
          </span>
        </div>
      ) : null}

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
            className={activeView === "leads" ? "active" : ""}
            onClick={() => setActiveView("leads")}
            type="button"
          >
            <span>Mes leads</span>
          </button>
          <button
            className={activeView === "dossiers" ? "active" : ""}
            onClick={() => setActiveView("dossiers")}
            type="button"
          >
            <span>Mes dossiers</span>
          </button>
          <button
            className={activeView === "commissions" ? "active" : ""}
            onClick={() => setActiveView("commissions")}
            type="button"
          >
            <span>Mes commissions</span>
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
        </header>

        {message ? (
          <p className={`agent-message ${messageType}`}>{message}</p>
        ) : null}

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
          <div>
            <span>Leads</span>
            <strong>{dashboard?.kpi.total_leads ?? leads.length}</strong>
          </div>
          <div>
            <span>Dossiers</span>
            <strong>{dashboard?.kpi.total_dossiers ?? dossiers.length}</strong>
          </div>
          <div>
            <span>Commissions</span>
            <strong>{dashboard?.kpi.commissions_amount ?? 0}</strong>
          </div>
          <div>
            <span>Signes</span>
            <strong>{dashboard?.kpi.dossiers_signed ?? 0}</strong>
          </div>
          <div>
            <span>Acompte attente</span>
            <strong>{dashboard?.kpi.pending_deposit_amount ?? 0}</strong>
          </div>
        </section>

        {activeView === "commissions" ? (
          <section className="agent-card agent-sales-table-card">
            <div className="agent-card-header">
              <div>
                <p>Calcul automatique</p>
                <h2>Mes commissions</h2>
              </div>
              <button
                className="agent-secondary-button"
                disabled={actionLoading === "export-mes-commissions.csv"}
                onClick={() =>
                  downloadReport(
                    "/api/reports/export/commissions",
                    "mes-commissions.csv",
                  )
                }
                type="button"
              >
                Export CSV
              </button>
            </div>
            <div className="agent-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Dossier</th>
                    <th>Total</th>
                    <th>Acompte</th>
                    <th>Solde</th>
                    <th>Statut</th>
                    <th>Calcul</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6}>Loading...</td>
                    </tr>
                  ) : commissions.length ? (
                    commissions.map((commission) => (
                      <tr key={commission.id}>
                        <td>{commission.dossier_id.slice(-8)}</td>
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
                          {new Date(commission.calculated_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>Aucune commission calculee.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : activeView === "dossiers" ? (
          <section className="agent-card agent-sales-table-card">
            <div className="agent-card-header">
              <div>
                <p>Workflow commercial</p>
                <h2>Mes dossiers</h2>
              </div>
              <button
                className="agent-secondary-button"
                disabled={actionLoading === "export-mes-dossiers.csv"}
                onClick={() =>
                  downloadReport(
                    "/api/reports/export/dossiers",
                    "mes-dossiers.csv",
                  )
                }
                type="button"
              >
                Export CSV
              </button>
            </div>
            <div className="agent-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Dossier</th>
                    <th>Produit</th>
                    <th>Statut</th>
                    <th>Source</th>
                    <th>RDV</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6}>Loading...</td>
                    </tr>
                  ) : dossiers.length ? (
                    dossiers.map((dossier) => {
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
                            {dossier.appointment_date
                              ? new Date(dossier.appointment_date).toLocaleString()
                              : "-"}
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
                      <td colSpan={6}>Aucun dossier trouve.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : activeView === "leads" ? (
          <section className="agent-content-grid">
            <div className="agent-form-stack">
            <form className="agent-card agent-sale-form" onSubmit={createLead}>
              <div className="agent-card-header">
                <div>
                  <p>Prospection</p>
                  <h2>Nouveau lead</h2>
                </div>
              </div>
              <div className="agent-form-grid">
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
                    className="agent-textarea"
                    onChange={(event) =>
                      setLeadForm({ ...leadForm, notes: event.target.value })
                    }
                    value={leadForm.notes}
                  />
                </label>
              </div>
              <button
                className="agent-primary-button"
                disabled={actionLoading === "lead"}
                type="submit"
              >
                {actionLoading === "lead" ? "Creation..." : "Creer lead"}
              </button>
            </form>
            {convertLeadForm.lead_id ? (
              <form className="agent-card agent-sale-form" onSubmit={convertLead}>
                <div className="agent-card-header">
                  <div>
                    <p>Conversion</p>
                    <h2>Lead vers dossier</h2>
                  </div>
                  <button
                    className="agent-secondary-button"
                    onClick={() => setConvertLeadForm(emptyConvertLeadForm)}
                    type="button"
                  >
                    Fermer
                  </button>
                </div>
                <div className="agent-form-grid">
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
                      className="agent-textarea"
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
                <button
                  className="agent-primary-button"
                  disabled={actionLoading === "convert-lead"}
                  type="submit"
                >
                  {actionLoading === "convert-lead"
                    ? "Conversion..."
                    : "Creer dossier"}
                </button>
              </form>
            ) : null}
            </div>

            <section className="agent-card agent-sales-table-card">
              <div className="agent-card-header">
                <div>
                  <p>Pipeline</p>
                  <h2>Mes leads</h2>
                </div>
              </div>
              <div className="agent-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Lead</th>
                      <th>Source</th>
                      <th>Statut</th>
                      <th>Produit</th>
                      <th>Contact</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6}>Loading...</td>
                      </tr>
                    ) : leads.length ? (
                      leads.map((lead) => (
                        <tr key={lead.id}>
                          <td>
                            <strong>
                              {lead.first_name} {lead.last_name}
                            </strong>
                            <span className="muted-line">{lead.address || "-"}</span>
                          </td>
                          <td>{lead.source}</td>
                          <td>{lead.status}</td>
                          <td>{lead.desired_product || "-"}</td>
                          <td>
                            <strong>{lead.phone}</strong>
                            <span className="muted-line">{lead.email || "-"}</span>
                          </td>
                          <td>
                            {lead.converted_dossier_id ? (
                              <span className="muted-line">Dossier cree</span>
                            ) : (
                              <button
                                className="agent-secondary-button"
                                onClick={() => startLeadConversion(lead)}
                                type="button"
                              >
                                Convertir
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6}>Aucun lead trouve.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        ) : activeView === "sales" ? (
          <section className="agent-content-grid">
            <form className="agent-card agent-sale-form" onSubmit={insertVente}>
              <div className="agent-card-header">
                <div>
                  <p>Nouvelle operation</p>
                  <h2>Inserer vente</h2>
                </div>
              </div>
              <div className="agent-documents-builder">
                <label>
                  Motif
                  <textarea
                    className="agent-textarea"
                    onChange={(event) => setSaleMotif(event.target.value)}
                    placeholder="Optionnel: nouvelle vente, renouvellement, demande client..."
                    value={saleMotif}
                  />
                </label>
                <div className="agent-document-input-row">
                  <label>
                    Documents
                    <input
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                      multiple
                      onChange={(event) => {
                        addFactureFiles(event.target.files);
                        event.target.value = "";
                      }}
                      required={!factureFiles.length}
                      type="file"
                    />
                  </label>
                </div>
                {factureFiles.length ? (
                  <div className="agent-selected-document-list">
                    {factureFiles.map((file, index) => (
                      <div
                        className="agent-document-input-row"
                        key={`${file.name}-${index}`}
                      >
                        <p className="agent-file-hint">
                          Document {index + 1}: {file.name}
                        </p>
                        <button
                          className="agent-remove-document"
                          onClick={() => removeFactureInput(index)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <button
                className="agent-primary-button"
                disabled={actionLoading === "sale"}
                type="submit"
              >
                {actionLoading === "sale" ? (
                  <span className="button-loading-label">
                    <span className="button-spinner" />
                    Enregistrement...
                  </span>
                ) : (
                  "Enregistrer vente"
                )}
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
                      <th>Motif</th>
                      <th>Document</th>
                      <th>Nombre</th>
                      <th>Date</th>
                      <th>Ajouter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6}>Loading...</td>
                      </tr>
                    ) : ventes.length ? (
                      ventes.map((vente) => {
                        const extraFiles = extraFactureFilesBySale[vente.id] ?? [];

                        return (
                          <tr key={vente.id}>
                            <td>
                              <strong>{vente.reference || "Reference"}</strong>
                            </td>
                            <td>{vente.motif || "-"}</td>
                            <td>
                              {vente.documents?.length ? (
                                <div className="agent-document-list">
                                  {vente.documents.map((document, index) => (
                                    <a
                                      className="agent-document-link"
                                      href={document.document_file}
                                      key={document.id}
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      Doc {index + 1}
                                    </a>
                                  ))}
                                </div>
                              ) : vente.document?.document_file ? (
                                <a
                                  className="agent-document-link"
                                  href={vente.document.document_file}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  Visualiser
                                </a>
                              ) : (
                                vente.document_id
                              )}
                            </td>
                            <td>{vente.nombre_vente}</td>
                            <td>{new Date(vente.updatedAt).toLocaleString()}</td>
                            <td>
                              <div className="agent-add-documents">
                                <label
                                  className="agent-plus-upload"
                                  title="Ajouter des documents"
                                >
                                  <span aria-hidden="true">+</span>
                                  <input
                                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                                    multiple
                                    onChange={(event) => {
                                      addExtraFactureFiles(vente.id, event.target.files);
                                      event.target.value = "";
                                    }}
                                    type="file"
                                  />
                                </label>
                                {extraFiles.length ? (
                                  <div className="agent-extra-file-list">
                                    {extraFiles.map((file, index) => (
                                      <span key={`${file.name}-${index}`}>
                                        {file.name}
                                        <button
                                          onClick={() =>
                                            removeExtraFactureFile(vente.id, index)
                                          }
                                          type="button"
                                        >
                                          x
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
                                <button
                                  className="agent-secondary-button"
                                  disabled={
                                    actionLoading ===
                                      `add-documents-${vente.id}` ||
                                    !extraFiles.length
                                  }
                                  onClick={() => addDocumentsToSale(vente.id)}
                                  type="button"
                                >
                                  {actionLoading === `add-documents-${vente.id}`
                                    ? "Ajout..."
                                    : "Ajouter"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6}>Aucune vente trouvee.</td>
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
                Image profile
                <input
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(event) =>
                    setProfileImageFile(event.target.files?.[0] ?? null)
                  }
                  type="file"
                />
              </label>
              {profileImageFile ? (
                <p className="agent-file-hint span-2">
                  {profileImageFile.name}
                </p>
              ) : null}
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
              <button
                className="agent-primary-button"
                disabled={actionLoading === "profile"}
                type="submit"
              >
                {actionLoading === "profile" ? (
                  <span className="button-loading-label">
                    <span className="button-spinner" />
                    Saving...
                  </span>
                ) : (
                  "Save profile"
                )}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
