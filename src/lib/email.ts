import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger("email");

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@preik.ai";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "hei@preik.ai";
const DASHBOARD_BASE_URL = process.env.DASHBOARD_BASE_URL || "https://preik.ai/dashboard";
const APP_URL = process.env.SHOPIFY_APP_URL || "https://preik.ai";

/** Generate an unsubscribe URL with HMAC token */
export async function buildUnsubscribeUrl(tenantId: string): Promise<string> {
  const secret = process.env.CRON_SECRET || "fallback";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(tenantId));
  const token = Buffer.from(sig).toString("hex").slice(0, 16);
  return `${APP_URL}/api/email/unsubscribe?t=${encodeURIComponent(tenantId)}&k=${token}`;
}

function unsubFooter(url: string): string {
  return `<p style="margin-top: 32px; font-size: 11px; color: #aaa; text-align: center;">
    <a href="${url}" style="color: #aaa;">Meld deg av e-poster</a>
  </p>`;
}

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
            Logg inn på <a href="${DASHBOARD_BASE_URL}" style="color: #6C63FF;">dashbordet</a> for å administrere kreditter.
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
    const dashboardLink = `${DASHBOARD_BASE_URL}/${escapeHtml(data.tenantId)}`;

    await resend.emails.send({
      from: `Preik <${FROM_EMAIL}>`,
      to: data.contactEmail,
      subject: `Velkommen til Preik, ${data.tenantName}!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
          <h2>Velkommen til Preik!</h2>
          <p style="line-height: 1.6;">
            Hei! Vi er glade for å ha <strong>${escapeHtml(data.tenantName)}</strong> med oss.
            Chatboten din er klar — du kan være oppe og kjøre på under 5 minutter.
          </p>

          <div style="margin: 24px 0;">
            <a href="${dashboardLink}" style="display: inline-block; padding: 12px 28px; background: #C2410C; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Gå til dashbordet
            </a>
          </div>

          <p style="line-height: 1.6; font-weight: 600; margin-bottom: 8px;">Slik kommer du i gang:</p>
          <div style="margin: 0 0 24px 0; padding: 20px; background: #f8f8f8; border-radius: 8px;">
            <p style="margin: 0 0 12px 0;"><strong>1. Legg til domenet ditt</strong> — hvitelist domenet der chatboten skal vises</p>
            <p style="margin: 0 0 12px 0;"><strong>2. Last opp innhold</strong> — importer fra nettsiden din eller legg til tekst manuelt</p>
            <p style="margin: 0 0 12px 0;"><strong>3. Sett opp systemprompt</strong> — fortell chatboten hvordan den skal oppføre seg</p>
            <p style="margin: 0 0 12px 0;"><strong>4. Tilpass widgeten</strong> — velg farger og tekster som matcher merkevaren din</p>
            <p style="margin: 0;"><strong>5. Installer</strong> — kopier embed-koden eller koble til Shopify med ett klikk</p>
          </div>

          <p style="line-height: 1.6;">
            Dashbordet guider deg gjennom hvert steg med en sjekkliste. Vi har også
            satt opp fornuftige standardverdier, så widgeten fungerer med en gang — du kan finjustere etterpå.
          </p>

          <p style="line-height: 1.6; margin-top: 20px;">
            <strong>Trenger du hjelp?</strong> Bare svar på denne e-posten eller send oss en melding på
            <a href="mailto:hei@preik.ai" style="color: #C2410C;">hei@preik.ai</a>.
            Vi hjelper gjerne med oppsett, konfigurasjon, eller bare å komme i gang.
          </p>

          <p style="margin-top: 32px; font-size: 12px; color: #999;">
            Preik – AI som snakker ditt språk
          </p>
        </div>
      `,
    });
    log.info("Welcome email sent", { tenantId: data.tenantId, to: data.contactEmail });
  } catch (error) {
    log.error("Failed to send welcome email", { error: error as Error, tenantId: data.tenantId });
  }
}

// --- Onboarding nudge emails ---

interface NudgeEmailData {
  tenantName: string;
  contactEmail: string;
  tenantId: string;
  unsubUrl?: string;
}

/** Day 2: Widget not installed yet */
export async function sendNudgeInstallEmail(data: NudgeEmailData): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const dashboardLink = `${DASHBOARD_BASE_URL}/${escapeHtml(data.tenantId)}/integrasjon`;

  try {
    await resend.emails.send({
      from: `Preik <${FROM_EMAIL}>`,
      to: data.contactEmail,
      subject: `Du er nesten klar — ett steg gjenstår`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
          <h2>Hei ${escapeHtml(data.tenantName)}!</h2>
          <p style="line-height: 1.6;">
            Vi ser at chatboten din ikke er installert enda. Du er bare ett steg unna å ha den live!
          </p>
          <div style="margin: 24px 0;">
            <a href="${dashboardLink}" style="display: inline-block; padding: 12px 28px; background: #C2410C; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Installer widgeten nå
            </a>
          </div>
          <p style="line-height: 1.6;">
            Trenger du hjelp med installasjonen? Svar på denne e-posten — vi setter det opp for deg.
          </p>
          <p style="margin-top: 32px; font-size: 12px; color: #999;">Preik – AI som snakker ditt språk</p>
          ${data.unsubUrl ? unsubFooter(data.unsubUrl) : ""}
        </div>
      `,
    });
    log.info("Nudge install email sent", { tenantId: data.tenantId });
  } catch (error) {
    log.error("Failed to send nudge install email", { error: error as Error, tenantId: data.tenantId });
  }
}

/** Day 5: Widget installed but no conversations */
export async function sendNudgeTipsEmail(data: NudgeEmailData): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const dashboardLink = `${DASHBOARD_BASE_URL}/${escapeHtml(data.tenantId)}`;

  try {
    await resend.emails.send({
      from: `Preik <${FROM_EMAIL}>`,
      to: data.contactEmail,
      subject: `Widgeten din er live — slik får du mest ut av den`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
          <h2>Bra jobba!</h2>
          <p style="line-height: 1.6;">
            Widgeten til <strong>${escapeHtml(data.tenantName)}</strong> er installert. Her er noen tips for å få best mulig resultat:
          </p>
          <div style="margin: 16px 0; padding: 20px; background: #f8f8f8; border-radius: 8px;">
            <p style="margin: 0 0 12px 0;"><strong>Legg til mer innhold</strong> — jo mer kunnskap chatboten har, desto bedre svar gir den</p>
            <p style="margin: 0 0 12px 0;"><strong>Finjuster systemprompten</strong> — gi chatboten en tydelig rolle og retningslinjer</p>
            <p style="margin: 0;"><strong>Test selv</strong> — prøv å chatte med widgeten for å se hvordan den svarer</p>
          </div>
          <div style="margin: 24px 0;">
            <a href="${dashboardLink}" style="display: inline-block; padding: 12px 28px; background: #C2410C; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Gå til dashbordet
            </a>
          </div>
          <p style="margin-top: 32px; font-size: 12px; color: #999;">Preik – AI som snakker ditt språk</p>
          ${data.unsubUrl ? unsubFooter(data.unsubUrl) : ""}
        </div>
      `,
    });
    log.info("Nudge tips email sent", { tenantId: data.tenantId });
  } catch (error) {
    log.error("Failed to send nudge tips email", { error: error as Error, tenantId: data.tenantId });
  }
}

/** Day 12: Inactive — re-engagement */
export async function sendNudgeReengageEmail(data: NudgeEmailData): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: `Preik <${FROM_EMAIL}>`,
      to: data.contactEmail,
      subject: `Trenger du hjelp med oppsettet?`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
          <h2>Hei ${escapeHtml(data.tenantName)}!</h2>
          <p style="line-height: 1.6;">
            Vi ser at chatboten din ikke har kommet ordentlig i gang enda. Ingen stress — vi hjelper gjerne!
          </p>
          <p style="line-height: 1.6;">
            Svar på denne e-posten med en kort beskrivelse av hva du trenger hjelp med, så fikser vi det for deg.
            Vi kan sette opp alt fra innhold til systemprompt og installasjon.
          </p>
          <p style="line-height: 1.6; margin-top: 16px;">
            <a href="mailto:hei@preik.ai?subject=Trenger hjelp med ${escapeHtml(data.tenantName)}" style="color: #C2410C; font-weight: 600;">
              Svar her eller send e-post til hei@preik.ai
            </a>
          </p>
          <p style="margin-top: 32px; font-size: 12px; color: #999;">Preik – AI som snakker ditt språk</p>
          ${data.unsubUrl ? unsubFooter(data.unsubUrl) : ""}
        </div>
      `,
    });
    log.info("Nudge re-engage email sent", { tenantId: data.tenantId });
  } catch (error) {
    log.error("Failed to send nudge re-engage email", { error: error as Error, tenantId: data.tenantId });
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
