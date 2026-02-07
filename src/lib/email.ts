import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger("email");

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@preik.ai";
const ADMIN_EMAIL = "hei@preik.ai";

// Lazy init — won't crash if key is missing in dev
let resendClient: Resend | null = null;
function getResend(): Resend | null {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    log.warn("RESEND_API_KEY not set — emails disabled");
    return null;
  }
  resendClient = new Resend(apiKey);
  return resendClient;
}

// --- Contact form notification ---

interface ContactNotification {
  name: string;
  email: string;
  company?: string;
  message: string;
}

export async function sendContactNotification(data: ContactNotification): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: `Preik <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `Ny kontaktforespørsel fra ${data.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a2e;">Ny kontaktforespørsel</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 100px;">Navn:</td>
              <td style="padding: 8px 0; color: #1a1a2e; font-weight: 500;">${escapeHtml(data.name)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">E-post:</td>
              <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(data.email)}" style="color: #6C63FF;">${escapeHtml(data.email)}</a></td>
            </tr>
            ${data.company ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">Bedrift:</td>
              <td style="padding: 8px 0; color: #1a1a2e;">${escapeHtml(data.company)}</td>
            </tr>
            ` : ""}
          </table>
          <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
            <p style="margin: 0; color: #666; font-size: 13px; margin-bottom: 8px;">Melding:</p>
            <p style="margin: 0; color: #1a1a2e; white-space: pre-wrap;">${escapeHtml(data.message)}</p>
          </div>
          <p style="margin-top: 24px; font-size: 12px; color: #999;">Sendt fra kontaktskjemaet på preik.ai</p>
        </div>
      `,
    });
    log.info("Contact notification sent", { to: ADMIN_EMAIL, from: data.email });
  } catch (error) {
    log.error("Failed to send contact notification", { error: error as Error });
  }
}

// --- Credit warning emails ---

export async function sendCreditWarningIfNeeded(
  tenantId: string,
  level: "80" | "100"
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  try {
    // Fetch tenant info
    const { data: tenant, error } = await supabaseAdmin
      .from("tenants")
      .select("name, contact_email, last_credit_warning, credits_used, credit_limit")
      .eq("id", tenantId)
      .single();

    if (error || !tenant) {
      log.error("Failed to fetch tenant for credit warning", { tenantId, error });
      return;
    }

    // Don't spam — skip if we already sent this level or higher
    if (tenant.last_credit_warning) {
      const alreadySent = parseInt(tenant.last_credit_warning, 10);
      if (alreadySent >= parseInt(level, 10)) return;
    }

    const to = tenant.contact_email;
    if (!to) {
      log.warn("No contact_email for tenant, skipping credit warning", { tenantId });
      return;
    }

    const isLimit = level === "100";
    const subject = isLimit
      ? `Kredittgrensen er nådd – ${tenant.name}`
      : `80% av kredittene er brukt – ${tenant.name}`;

    const headline = isLimit
      ? "Kredittgrensen er nådd"
      : "80% av kredittene er brukt";

    const body = isLimit
      ? `Chatboten for <strong>${escapeHtml(tenant.name)}</strong> har brukt alle ${tenant.credit_limit} kreditter denne perioden. Chatboten vil ikke svare på nye meldinger før kredittene nullstilles eller grensen økes.`
      : `Chatboten for <strong>${escapeHtml(tenant.name)}</strong> har brukt ${tenant.credits_used} av ${tenant.credit_limit} kreditter (80%). Vurder å øke grensen for å unngå at chatboten stopper.`;

    await resend.emails.send({
      from: `Preik <${FROM_EMAIL}>`,
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${isLimit ? "#dc2626" : "#d97706"};">${headline}</h2>
          <p style="color: #1a1a2e; line-height: 1.6;">${body}</p>
          <div style="margin-top: 24px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>Brukt:</strong> ${tenant.credits_used} / ${tenant.credit_limit} kreditter
            </p>
          </div>
          <p style="margin-top: 24px; font-size: 13px; color: #666;">
            Logg inn på <a href="https://preik.ai/dashboard" style="color: #6C63FF;">dashbordet</a> for å administrere kreditter.
          </p>
          <p style="margin-top: 24px; font-size: 12px; color: #999;">Preik – AI-chatbot for nettbutikker</p>
        </div>
      `,
    });

    // Update last_credit_warning so we don't send again
    await supabaseAdmin
      .from("tenants")
      .update({ last_credit_warning: level })
      .eq("id", tenantId);

    log.info("Credit warning email sent", { tenantId, level, to });
  } catch (error) {
    log.error("Failed to send credit warning email", { error: error as Error, tenantId, level });
  }
}

// --- Welcome email ---

interface WelcomeEmailData {
  tenantName: string;
  contactEmail: string;
  tenantId: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: `Preik <${FROM_EMAIL}>`,
      to: data.contactEmail,
      subject: `Velkommen til Preik, ${data.tenantName}!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a2e;">Velkommen til Preik! 🎉</h2>
          <p style="color: #1a1a2e; line-height: 1.6;">
            Hei! Vi er glade for å ha <strong>${escapeHtml(data.tenantName)}</strong> med oss.
          </p>
          <p style="color: #1a1a2e; line-height: 1.6;">
            Din AI-chatbot er nå klar til å konfigureres. Her er de neste stegene:
          </p>
          <div style="margin: 24px 0; padding: 20px; background: #f5f5f5; border-radius: 8px;">
            <p style="margin: 0 0 12px 0; color: #1a1a2e;"><strong>1.</strong> Logg inn på <a href="https://preik.ai/dashboard/${escapeHtml(data.tenantId)}" style="color: #6C63FF;">dashbordet</a></p>
            <p style="margin: 0 0 12px 0; color: #1a1a2e;"><strong>2.</strong> Legg til innhold i kunnskapsbasen (skriv tekst eller importer fra nettside)</p>
            <p style="margin: 0 0 12px 0; color: #1a1a2e;"><strong>3.</strong> Tilpass chatbotens systemprompt</p>
            <p style="margin: 0; color: #1a1a2e;"><strong>4.</strong> Kopier embed-koden og legg den inn på nettsiden din</p>
          </div>
          <p style="color: #1a1a2e; line-height: 1.6;">
            Har du spørsmål? Svar på denne e-posten eller kontakt oss på
            <a href="mailto:hei@preik.ai" style="color: #6C63FF;">hei@preik.ai</a>.
          </p>
          <p style="margin-top: 24px; font-size: 12px; color: #999;">Preik – AI-chatbot for nettbutikker</p>
        </div>
      `,
    });
    log.info("Welcome email sent", { tenantId: data.tenantId, to: data.contactEmail });
  } catch (error) {
    log.error("Failed to send welcome email", { error: error as Error, tenantId: data.tenantId });
  }
}

// --- HTML escaping ---

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
