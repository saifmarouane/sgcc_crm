"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Lead = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address?: string;
  status: string;
  assigned_agent_id: string;
  desired_product?: string;
  first_contact_date?: string | null;
  notes?: string;
};

type EligibilityStatus = "eligible" | "non_eligible" | "incomplete";

type Eligibility = EligibilityForm & {
  id: string;
  lead_id: string;
  eligibility_status: EligibilityStatus;
  non_eligibility_reasons: string[];
  eligible_products: string[];
  required_documents: string[];
};

type ProspectDocument = {
  id: string;
  document_type: string;
  file_path: string;
  status: string;
  uploaded_at: string;
};

type ProspectNote = {
  id: string;
  note: string;
  user_id: string;
  createdAt: string;
};

type ProspectAppointment = {
  id: string;
  appointment_at: string;
  agent_id: string;
  status: string;
  comment: string;
};

type EligibilityForm = {
  housing_status: string;
  construction_age_status: string;
  house_surface_status: string;
  house_surface_value: string;
  heating_system: string;
  fiscal_household_size: string;
  rfr_amount: string;
  rfr_tranche: string;
  has_balloon_space: boolean;
  has_pac_space: boolean;
  has_roof_space: boolean;
  mpr_account_status: string;
  appointment_at: string;
  agent_note: string;
};

type UploadForm = {
  document_type: string;
  status: string;
};

type Props = {
  leads: Lead[];
  token: string;
  agentsById?: Map<string, { name?: string }>;
  readonly?: boolean;
  title?: string;
};

const emptyForm: EligibilityForm = {
  housing_status: "owner_occupant",
  construction_age_status: "more_than_15_years",
  house_surface_status: "between_50_and_350",
  house_surface_value: "",
  heating_system: "gas_boiler",
  fiscal_household_size: "1",
  rfr_amount: "",
  rfr_tranche: "blue",
  has_balloon_space: false,
  has_pac_space: false,
  has_roof_space: false,
  mpr_account_status: "unknown",
  appointment_at: "",
  agent_note: "",
};

const emptyUploadForm: UploadForm = {
  document_type: "avis_imposition",
  status: "received",
};

const documentLabels: Record<string, string> = {
  avis_imposition: "Avis d'imposition",
  taxe_habitation: "Taxe d'habitation",
  taxe_fonciere: "Taxe fonciere",
  piece_identite: "Piece d'identite / CNI",
  photo_chaudiere: "Photo chaudiere actuelle",
  photo_compteur_electrique: "Photo compteur electrique",
  photo_toit: "Photo du toit",
  justificatif_domicile: "Justificatif de domicile",
  bail_location: "Bail de location",
};

const statusLabels: Record<EligibilityStatus, string> = {
  eligible: "Eligible",
  non_eligible: "Non eligible",
  incomplete: "Incomplet",
};

export function MaPrimeRenovEligibilityPanel({
  agentsById,
  leads,
  readonly = false,
  title = "MaPrimeRenov / CEE",
  token,
}: Props) {
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [form, setForm] = useState<EligibilityForm>(emptyForm);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [documents, setDocuments] = useState<ProspectDocument[]>([]);
  const [notes, setNotes] = useState<ProspectNote[]>([]);
  const [appointments, setAppointments] = useState<ProspectAppointment[]>([]);
  const [uploadForm, setUploadForm] = useState<UploadForm>(emptyUploadForm);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? null;

  const filteredLeads = useMemo(() => {
    return [...leads].sort((first, second) =>
      `${first.first_name} ${first.last_name}`.localeCompare(
        `${second.first_name} ${second.last_name}`,
      ),
    );
  }, [leads]);

  const missingDocuments = useMemo(() => {
    const receivedTypes = new Set(
      documents
        .filter((document) => document.status === "received")
        .map((document) => document.document_type),
    );
    return (eligibility?.required_documents ?? []).filter(
      (documentType) => !receivedTypes.has(documentType),
    );
  }, [documents, eligibility]);

  useEffect(() => {
    if (!selectedLeadId && filteredLeads[0]) {
      setSelectedLeadId(filteredLeads[0].id);
    }
  }, [filteredLeads, selectedLeadId]);

  useEffect(() => {
    if (selectedLeadId) {
      loadLeadModule(selectedLeadId);
    }
  }, [selectedLeadId]);

  async function loadLeadModule(leadId: string) {
    if (!token) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [eligibilityResponse, documentsResponse, notesResponse, appointmentsResponse] =
        await Promise.all([
          fetch(`/api/leads/${leadId}/eligibility`, { headers }),
          fetch(`/api/leads/${leadId}/mpr-documents`, { headers }),
          fetch(`/api/leads/${leadId}/mpr-notes`, { headers }),
          fetch(`/api/leads/${leadId}/mpr-appointments`, { headers }),
        ]);

      const eligibilityPayload = await eligibilityResponse.json().catch(() => ({}));
      const documentsPayload = await documentsResponse.json().catch(() => ({}));
      const notesPayload = await notesResponse.json().catch(() => ({}));
      const appointmentsPayload = await appointmentsResponse.json().catch(() => ({}));

      for (const [response, payload, label] of [
        [eligibilityResponse, eligibilityPayload, "eligibilite"],
        [documentsResponse, documentsPayload, "documents"],
        [notesResponse, notesPayload, "notes"],
        [appointmentsResponse, appointmentsPayload, "rendez-vous"],
      ] as const) {
        if (!response.ok) {
          throw new Error(payload.error ?? `Chargement ${label} impossible.`);
        }
      }

      const nextEligibility = eligibilityPayload.eligibility ?? null;
      setEligibility(nextEligibility);
      setDocuments(documentsPayload.documents ?? []);
      setNotes(notesPayload.notes ?? []);
      setAppointments(appointmentsPayload.appointments ?? []);

      setForm(nextEligibility ? eligibilityToForm(nextEligibility) : emptyForm);
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function saveEligibility(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedLeadId || readonly) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/leads/${selectedLeadId}/eligibility`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(toEligibilityPayload(form)),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Sauvegarde eligibilite impossible.");
      }

      setEligibility(data.eligibility);
      setMessageType("success");
      setMessage("Questionnaire sauvegarde.");
      await loadLeadModule(selectedLeadId);
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Sauvegarde impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedLeadId || !documentFile || readonly) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const uploadedFile = await uploadFile(documentFile);
      const response = await fetch(`/api/leads/${selectedLeadId}/mpr-documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          document_type: uploadForm.document_type,
          file_path: uploadedFile.url,
          status: uploadForm.status,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Ajout document impossible.");
      }

      setDocumentFile(null);
      setUploadForm(emptyUploadForm);
      setMessageType("success");
      setMessage("Document ajoute.");
      await loadLeadModule(selectedLeadId);
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Upload impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "document");

    const response = await fetch("/api/uploads", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error ?? "Upload fichier impossible.");
    }

    return data.file as { url: string };
  }

  const resultPreview = getPreview(form);

  return (
    <section className="mpr-panel">
      <div className="mpr-header">
        <div>
          <p>Eligibility / MaPrimeRenov</p>
          <h2>{title}</h2>
        </div>
        <label>
          Prospect
          <select
            onChange={(event) => setSelectedLeadId(event.target.value)}
            value={selectedLeadId}
          >
            {filteredLeads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.first_name} {lead.last_name} - {lead.phone}
              </option>
            ))}
          </select>
        </label>
      </div>

      {message ? <p className={`mpr-message ${messageType}`}>{message}</p> : null}
      {loading ? <p className="mpr-muted">Chargement...</p> : null}

      {selectedLead ? (
        <div className="mpr-grid">
          <section className="mpr-card">
            <div className="mpr-card-header">
              <p>Fiche prospect</p>
              <EligibilityBadge status={eligibility?.eligibility_status} />
            </div>
            <strong>
              {selectedLead.first_name} {selectedLead.last_name}
            </strong>
            <span>{selectedLead.phone}</span>
            <span>{selectedLead.email || "-"}</span>
            <span>{selectedLead.address || "-"}</span>
            <span>
              Agent:{" "}
              {agentsById?.get(selectedLead.assigned_agent_id)?.name ??
                selectedLead.assigned_agent_id}
            </span>
          </section>

          <section className="mpr-card">
            <div className="mpr-card-header">
              <p>Resultat</p>
              <EligibilityBadge status={eligibility?.eligibility_status} />
            </div>
            <strong>
              {eligibility
                ? statusLabels[eligibility.eligibility_status]
                : "Non calcule"}
            </strong>
            <div className="mpr-tags">
              {(eligibility?.eligible_products ?? resultPreview.products).map(
                (product) => (
                  <span key={product}>{product}</span>
                ),
              )}
            </div>
            {(eligibility?.non_eligibility_reasons ?? resultPreview.reasons).length ? (
              <ul className="mpr-reasons">
                {(eligibility?.non_eligibility_reasons ?? resultPreview.reasons).map(
                  (reason) => (
                    <li key={reason}>{reason}</li>
                  ),
                )}
              </ul>
            ) : (
              <span className="mpr-muted">Aucun motif bloquant.</span>
            )}
          </section>
        </div>
      ) : (
        <p className="mpr-muted">Aucun prospect disponible.</p>
      )}

      {selectedLead ? (
        <form className="mpr-card mpr-questionnaire" onSubmit={saveEligibility}>
          <div className="mpr-card-header">
            <p>Questionnaire d'eligibilite</p>
            <span className="mpr-help">RFR sur avis d'imposition, case 9HI</span>
          </div>
          <div className="mpr-form-grid">
            <label>
              1. Statut logement
              <select
                disabled={readonly}
                onChange={(event) =>
                  setForm({ ...form, housing_status: event.target.value })
                }
                value={form.housing_status}
              >
                <option value="owner_occupant">Proprietaire occupant</option>
                <option value="owner_landlord">Proprietaire bailleur</option>
                <option value="tenant">Locataire</option>
              </select>
            </label>
            <label>
              2. Construction
              <select
                disabled={readonly}
                onChange={(event) =>
                  setForm({
                    ...form,
                    construction_age_status: event.target.value,
                  })
                }
                value={form.construction_age_status}
              >
                <option value="more_than_15_years">Plus de 15 ans</option>
                <option value="less_than_15_years">Moins de 15 ans</option>
              </select>
            </label>
            <label>
              3. Surface
              <select
                disabled={readonly}
                onChange={(event) =>
                  setForm({ ...form, house_surface_status: event.target.value })
                }
                value={form.house_surface_status}
              >
                <option value="between_50_and_350">Entre 50 et 350 m2</option>
                <option value="outside_range">Hors plage</option>
              </select>
            </label>
            <label>
              Surface m2
              <input
                disabled={readonly}
                min="0"
                onChange={(event) =>
                  setForm({ ...form, house_surface_value: event.target.value })
                }
                type="number"
                value={form.house_surface_value}
              />
            </label>
            <label>
              4. Chauffage actuel
              <select
                disabled={readonly}
                onChange={(event) =>
                  setForm({ ...form, heating_system: event.target.value })
                }
                value={form.heating_system}
              >
                <option value="oil_boiler">Chaudiere fioul</option>
                <option value="gas_boiler">Chaudiere gaz</option>
                <option value="wood_boiler">Chaudiere bois</option>
                <option value="pellet_boiler">Chaudiere granules</option>
                <option value="pac_before_2023">PAC installee avant 2023</option>
                <option value="other">Autre systeme</option>
              </select>
            </label>
            <label>
              5. Foyer fiscal
              <select
                disabled={readonly}
                onChange={(event) =>
                  setForm({ ...form, fiscal_household_size: event.target.value })
                }
                value={form.fiscal_household_size}
              >
                <option value="1">1 personne</option>
                <option value="2">2 personnes</option>
                <option value="3">3 personnes</option>
                <option value="4">4 personnes</option>
                <option value="5">5 personnes ou plus</option>
              </select>
            </label>
            <label>
              6. RFR annuel
              <input
                disabled={readonly}
                min="0"
                onChange={(event) =>
                  setForm({ ...form, rfr_amount: event.target.value })
                }
                type="number"
                value={form.rfr_amount}
              />
            </label>
            <label>
              Tranche RFR
              <select
                disabled={readonly}
                onChange={(event) =>
                  setForm({ ...form, rfr_tranche: event.target.value })
                }
                value={form.rfr_tranche}
              >
                <option value="blue">Bleue - tres modeste</option>
                <option value="yellow">Jaune - modeste</option>
                <option value="purple">Violette - intermediaire</option>
                <option value="above">Au-dessus</option>
              </select>
            </label>
            <fieldset className="mpr-fieldset">
              <legend>7. Espaces techniques</legend>
              <label>
                <input
                  checked={form.has_balloon_space}
                  disabled={readonly}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      has_balloon_space: event.target.checked,
                    })
                  }
                  type="checkbox"
                />
                1 m2 ballon
              </label>
              <label>
                <input
                  checked={form.has_pac_space}
                  disabled={readonly}
                  onChange={(event) =>
                    setForm({ ...form, has_pac_space: event.target.checked })
                  }
                  type="checkbox"
                />
                2 m2 PAC
              </label>
              <label>
                <input
                  checked={form.has_roof_space}
                  disabled={readonly}
                  onChange={(event) =>
                    setForm({ ...form, has_roof_space: event.target.checked })
                  }
                  type="checkbox"
                />
                8 a 10 m2 toiture SSC
              </label>
            </fieldset>
            <label>
              8. Compte MaPrimeRenov
              <select
                disabled={readonly}
                onChange={(event) =>
                  setForm({ ...form, mpr_account_status: event.target.value })
                }
                value={form.mpr_account_status}
              >
                <option value="active">Oui, compte actif</option>
                <option value="not_yet">Non, a creer</option>
                <option value="unknown">Je ne sais pas</option>
              </select>
            </label>
            <label>
              Date et heure RDV
              <input
                disabled={readonly}
                onChange={(event) =>
                  setForm({ ...form, appointment_at: event.target.value })
                }
                type="datetime-local"
                value={form.appointment_at}
              />
            </label>
            <label className="span-2">
              Observations / Notes agent
              <textarea
                disabled={readonly}
                onChange={(event) =>
                  setForm({ ...form, agent_note: event.target.value })
                }
                value={form.agent_note}
              />
            </label>
          </div>
          {!readonly ? (
            <button className="mpr-primary" disabled={loading} type="submit">
              Sauvegarder et calculer
            </button>
          ) : null}
        </form>
      ) : null}

      {selectedLead ? (
        <div className="mpr-grid">
          <section className="mpr-card">
            <div className="mpr-card-header">
              <p>Documents requis</p>
              <span>{missingDocuments.length} manquant(s)</span>
            </div>
            {(eligibility?.required_documents ?? []).length ? (
              <ul className="mpr-document-list">
                {(eligibility?.required_documents ?? []).map((documentType) => (
                  <li key={documentType}>
                    {documentLabels[documentType] ?? documentType}
                    <span>
                      {documents.some(
                        (document) =>
                          document.document_type === documentType &&
                          document.status === "received",
                      )
                        ? "recu"
                        : "non recu"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mpr-muted">Sauvegarder le questionnaire pour calculer la checklist.</p>
            )}
            {!readonly ? (
              <form className="mpr-upload" onSubmit={uploadDocument}>
                <select
                  onChange={(event) =>
                    setUploadForm({
                      ...uploadForm,
                      document_type: event.target.value,
                    })
                  }
                  value={uploadForm.document_type}
                >
                  {Object.entries(documentLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  onChange={(event) =>
                    setUploadForm({ ...uploadForm, status: event.target.value })
                  }
                  value={uploadForm.status}
                >
                  <option value="received">Recu</option>
                  <option value="missing">Non recu</option>
                </select>
                <input
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                  onChange={(event) =>
                    setDocumentFile(event.target.files?.[0] ?? null)
                  }
                  type="file"
                />
                <button disabled={!documentFile || loading} type="submit">
                  Ajouter
                </button>
              </form>
            ) : null}
            {documents.length ? (
              <div className="mpr-links">
                {documents.map((document) => (
                  <a
                    href={document.file_path}
                    key={document.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {documentLabels[document.document_type] ?? document.document_type}
                  </a>
                ))}
              </div>
            ) : null}
          </section>

          <section className="mpr-card">
            <div className="mpr-card-header">
              <p>Notes et rendez-vous</p>
            </div>
            <div className="mpr-stack">
              <strong>Rendez-vous</strong>
              {appointments.length ? (
                appointments.map((appointment) => (
                  <span key={appointment.id}>
                    {new Date(appointment.appointment_at).toLocaleString()} -{" "}
                    {appointment.status}
                  </span>
                ))
              ) : (
                <span className="mpr-muted">Aucun rendez-vous.</span>
              )}
              <strong>Notes</strong>
              {notes.length ? (
                notes.map((note) => (
                  <span key={note.id}>
                    {note.note} - {new Date(note.createdAt).toLocaleString()}
                  </span>
                ))
              ) : (
                <span className="mpr-muted">Aucune note.</span>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function EligibilityBadge({ status }: { status?: EligibilityStatus }) {
  const className = status ? `mpr-badge ${status}` : "mpr-badge incomplete";
  return <span className={className}>{status ? statusLabels[status] : "Non calcule"}</span>;
}

function eligibilityToForm(eligibility: Eligibility): EligibilityForm {
  return {
    housing_status: eligibility.housing_status,
    construction_age_status: eligibility.construction_age_status,
    house_surface_status: eligibility.house_surface_status,
    house_surface_value: String(eligibility.house_surface_value ?? ""),
    heating_system: eligibility.heating_system,
    fiscal_household_size: String(eligibility.fiscal_household_size),
    rfr_amount: String(eligibility.rfr_amount ?? ""),
    rfr_tranche: eligibility.rfr_tranche,
    has_balloon_space: eligibility.has_balloon_space,
    has_pac_space: eligibility.has_pac_space,
    has_roof_space: eligibility.has_roof_space,
    mpr_account_status: eligibility.mpr_account_status,
    appointment_at: "",
    agent_note: "",
  };
}

function toEligibilityPayload(form: EligibilityForm) {
  return {
    housing_status: form.housing_status,
    construction_age_status: form.construction_age_status,
    house_surface_status: form.house_surface_status,
    house_surface_value: form.house_surface_value
      ? Number(form.house_surface_value)
      : null,
    heating_system: form.heating_system,
    fiscal_household_size: Number(form.fiscal_household_size),
    rfr_amount: form.rfr_amount ? Number(form.rfr_amount) : null,
    rfr_tranche: form.rfr_tranche,
    has_balloon_space: form.has_balloon_space,
    has_pac_space: form.has_pac_space,
    has_roof_space: form.has_roof_space,
    mpr_account_status: form.mpr_account_status,
    appointment_at: form.appointment_at || null,
    agent_note: form.agent_note,
  };
}

function getPreview(form: EligibilityForm) {
  const reasons: string[] = [];
  const products: string[] = [];

  if (form.housing_status === "tenant") {
    reasons.push("Le prospect est locataire.");
  }

  if (form.construction_age_status === "less_than_15_years") {
    reasons.push("Le logement a moins de 15 ans.");
  }

  if (form.house_surface_status === "outside_range") {
    reasons.push("La surface n'est pas comprise entre 50 m2 et 350 m2.");
  }

  if (form.heating_system === "other") {
    reasons.push("Le systeme de chauffage actuel n'est pas eligible.");
  }

  if (form.rfr_tranche === "above") {
    reasons.push("Le revenu fiscal est au-dessus du plafond.");
  }

  if (form.has_pac_space) {
    products.push("PAC seule");
  }

  if (form.has_pac_space && form.has_balloon_space) {
    products.push("PAC + BS", "PAC + BE", "PAC + BT");
  }

  if (form.has_pac_space && form.has_roof_space) {
    products.push("PAC + SSC");
  }

  if (form.has_roof_space) {
    products.push("SSC seul");
  }

  if (!products.length) {
    reasons.push("Les informations techniques sont insuffisantes.");
  }

  return { reasons, products };
}
