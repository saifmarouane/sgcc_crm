import nodemailer from "nodemailer";

type MailMessage = {
  to: string;
  cc?: string[];
  subject: string;
  text: string;
  html: string;
};

type AppointmentMailInput = {
  to: string;
  cc?: string[];
  clientName: string;
  appointmentDate: Date;
  product: string;
  address: string;
  agentName?: string;
};

const defaultTimeZone = "Europe/Paris";

export class MailService {
  private readonly config = readMailConfig();

  async sendAppointmentPlanned(input: AppointmentMailInput): Promise<boolean> {
    if (!this.config || !hasValidRecipient(input.to)) {
      return false;
    }

    const appointmentLabel = formatAppointmentDate(input.appointmentDate);
    const subject = `Confirmation de votre rendez-vous SGCC - ${appointmentLabel}`;
    const clientName = input.clientName || "Madame, Monsieur";
    const product = input.product || "votre projet";
    const address = input.address || "adresse a confirmer";

    return this.send({
      to: input.to,
      cc: input.cc?.filter(isEmail),
      subject,
      text: [
        `Bonjour ${clientName},`,
        "",
        `Votre rendez-vous SGCC est planifie le ${appointmentLabel}.`,
        `Projet: ${product}.`,
        `Adresse: ${address}.`,
        input.agentName ? `Agent: ${input.agentName}.` : "",
        "",
        "Si ce creneau ne vous convient pas, merci de nous contacter pour le modifier.",
        "",
        "Cordialement,",
        "L'equipe SGCC",
      ]
        .filter(Boolean)
        .join("\n"),
      html: buildAppointmentHtml({
        clientName,
        appointmentLabel,
        product,
        address,
        agentName: input.agentName,
      }),
    });
  }

  private async send(message: MailMessage): Promise<boolean> {
    if (!this.config) {
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.user,
        pass: this.config.pass,
      },
    });

    await transporter.sendMail({
      from: this.config.from,
      to: message.to,
      cc: message.cc,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    return true;
  }
}

function readMailConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const fromEmail = process.env.EMAIL_FROM?.trim() || user;

  if (!host || !user || !pass || !fromEmail) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const fromName = process.env.EMAIL_FROM_NAME?.trim() || "SGCC";

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure: process.env.SMTP_SECURE === "true",
    user,
    pass,
    from: `"${fromName.replaceAll('"', "'")}" <${fromEmail}>`,
  };
}

function formatAppointmentDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: process.env.EMAIL_TIME_ZONE || defaultTimeZone,
  }).format(date);
}

function buildAppointmentHtml({
  clientName,
  appointmentLabel,
  product,
  address,
  agentName,
}: {
  clientName: string;
  appointmentLabel: string;
  product: string;
  address: string;
  agentName?: string;
}) {
  return `
    <div style="margin:0;padding:0;background:#f6f8fb;font-family:Arial,sans-serif;color:#172033;">
      <div style="max-width:640px;margin:0 auto;padding:28px 18px;">
        <div style="background:#ffffff;border:1px solid #e8edf3;border-radius:12px;overflow:hidden;">
          <div style="padding:22px 24px;background:#0f4c81;color:#ffffff;">
            <h1 style="margin:0;font-size:22px;line-height:1.3;">Rendez-vous confirme</h1>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 16px;">Bonjour ${escapeHtml(clientName)},</p>
            <p style="margin:0 0 18px;">
              Votre rendez-vous SGCC est planifie. Voici les informations du rendez-vous:
            </p>
            <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
              <tr>
                <td style="padding:10px;border-bottom:1px solid #edf2f7;font-weight:700;">Date</td>
                <td style="padding:10px;border-bottom:1px solid #edf2f7;">${escapeHtml(appointmentLabel)}</td>
              </tr>
              <tr>
                <td style="padding:10px;border-bottom:1px solid #edf2f7;font-weight:700;">Projet</td>
                <td style="padding:10px;border-bottom:1px solid #edf2f7;">${escapeHtml(product)}</td>
              </tr>
              <tr>
                <td style="padding:10px;border-bottom:1px solid #edf2f7;font-weight:700;">Adresse</td>
                <td style="padding:10px;border-bottom:1px solid #edf2f7;">${escapeHtml(address)}</td>
              </tr>
              ${
                agentName
                  ? `<tr><td style="padding:10px;font-weight:700;">Agent</td><td style="padding:10px;">${escapeHtml(agentName)}</td></tr>`
                  : ""
              }
            </table>
            <p style="margin:0 0 16px;">
              Si ce creneau ne vous convient pas, merci de nous contacter pour le modifier.
            </p>
            <p style="margin:0;">Cordialement,<br />L'equipe SGCC</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hasValidRecipient(recipients: string): boolean {
  return recipients
    .split(",")
    .map((recipient) => recipient.trim())
    .some(isEmail);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
