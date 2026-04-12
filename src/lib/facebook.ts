import { createLogger } from "@/lib/logger";

const log = createLogger("facebook-capi");

const FB_PIXEL_ID = "969440352441804";
const FB_API_VERSION = "v21.0";
const FB_API_URL = `https://graph.facebook.com/${FB_API_VERSION}/${FB_PIXEL_ID}/events`;

// ── Types ────────────────────────────────────────────────────────

interface FacebookUserData {
  em?: string;                // SHA-256 hashed email
  ph?: string;                // SHA-256 hashed phone
  fn?: string;                // SHA-256 hashed first name
  ln?: string;                // SHA-256 hashed last name
  ct?: string;                // SHA-256 hashed city
  st?: string;                // SHA-256 hashed state
  zp?: string;                // SHA-256 hashed zip
  country?: string;           // SHA-256 hashed 2-char country code
  ge?: string;                // SHA-256 hashed gender
  db?: string;                // SHA-256 hashed date of birth
  client_ip_address?: string; // NOT hashed
  client_user_agent?: string; // NOT hashed — REQUIRED for website events
  fbc?: string;               // Facebook click ID cookie — NOT hashed
  fbp?: string;               // Facebook browser ID cookie — NOT hashed
  external_id?: string;       // External/CRM ID — NOT hashed
}

interface FacebookCustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  num_items?: number;
}

interface FacebookEvent {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url: string;           // REQUIRED for website events
  action_source: "website";
  user_data: FacebookUserData;
  custom_data?: FacebookCustomData;
  opt_out?: boolean;
  data_processing_options: string[];   // [] = no restrictions
  data_processing_options_country: number;
  data_processing_options_state: number;
}

// ── Hashing ──────────────────────────────────────────────────────

/**
 * SHA-256 hash for Facebook PII fields (lowercase, trimmed).
 */
async function sha256(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value.trim().toLowerCase());
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Public helpers ───────────────────────────────────────────────

/** Generate a unique event ID for deduplication between pixel and CAPI */
export function generateEventId(): string {
  return crypto.randomUUID();
}

/**
 * Extract fbc and fbp cookies from a cookie header string.
 * These are first-party cookies set by the Meta Pixel.
 */
export function extractFbCookies(cookieHeader: string | null): { fbc?: string; fbp?: string } {
  if (!cookieHeader) return {};
  const result: { fbc?: string; fbp?: string } = {};
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    const val = rest.join("=");
    if (key === "_fbc") result.fbc = val;
    if (key === "_fbp") result.fbp = val;
  }
  return result;
}

// ── Core sender ──────────────────────────────────────────────────

/** Build user_data with hashed PII + raw identifiers */
async function buildUserData(opts: UserDataOpts): Promise<FacebookUserData> {
  const data: FacebookUserData = {
    client_ip_address: opts.ip,
    client_user_agent: opts.userAgent,
    fbc: opts.fbc,
    fbp: opts.fbp,
    external_id: opts.externalId,
  };
  if (opts.email) data.em = await sha256(opts.email);
  if (opts.firstName) data.fn = await sha256(opts.firstName);
  if (opts.lastName) data.ln = await sha256(opts.lastName);
  if (opts.phone) data.ph = await sha256(opts.phone);
  if (opts.country) data.country = await sha256(opts.country);
  return data;
}

/**
 * Send one or more events to Facebook Conversions API.
 * Fails silently — tracking must never break the user flow.
 */
export async function sendFacebookEvents(events: FacebookEvent[]): Promise<void> {
  const accessToken = process.env.FB_CONVERSIONS_API_TOKEN;
  if (!accessToken) {
    log.debug("FB_CONVERSIONS_API_TOKEN not set, skipping CAPI");
    return;
  }

  const testEventCode = process.env.FB_TEST_EVENT_CODE;

  try {
    const payload: Record<string, unknown> = {
      data: events,
      access_token: accessToken,
    };
    if (testEventCode) {
      payload.test_event_code = testEventCode;
    }

    const res = await fetch(FB_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      log.warn("Facebook CAPI error", { status: res.status, body });
    }
  } catch (err) {
    log.warn("Facebook CAPI request failed", { error: err as Error });
  }
}

// ── Event builder ────────────────────────────────────────────────

interface UserDataOpts {
  ip?: string;
  userAgent?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  fbc?: string;
  fbp?: string;
  externalId?: string;
}

interface BaseOpts extends UserDataOpts {
  sourceUrl?: string;
  eventId?: string;
}

/** Build and send a single event with all required fields */
async function sendEvent(
  eventName: string,
  opts: BaseOpts & { customData?: FacebookCustomData },
): Promise<void> {
  const userData = await buildUserData(opts);
  await sendFacebookEvents([
    {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: opts.eventId || generateEventId(),
      event_source_url: opts.sourceUrl || "https://preik.ai",
      action_source: "website",
      user_data: userData,
      custom_data: opts.customData,
      data_processing_options: [],           // No LDU — Norway/EEA, not US
      data_processing_options_country: 0,
      data_processing_options_state: 0,
    },
  ]);
}

// ── Standard event functions ─────────────────────────────────────

/** Lead — someone submits info and may be contacted later */
export async function trackLead(opts: BaseOpts): Promise<void> {
  await sendEvent("Lead", opts);
}

/** Contact — a customer has been in contact (form, email, chat) */
export async function trackContact(opts: BaseOpts): Promise<void> {
  await sendEvent("Contact", opts);
}

/** CompleteRegistration — user confirmed email and signed up */
export async function trackCompleteRegistration(opts: BaseOpts): Promise<void> {
  await sendEvent("CompleteRegistration", opts);
}

/** InitiateCheckout — user started the payment flow */
export async function trackInitiateCheckout(opts: BaseOpts & {
  currency?: string;
  value?: number;
}): Promise<void> {
  await sendEvent("InitiateCheckout", {
    ...opts,
    customData: {
      currency: opts.currency || "NOK",
      value: opts.value,
    },
  });
}

/** AddPaymentInfo — payment details added during checkout */
export async function trackAddPaymentInfo(opts: BaseOpts): Promise<void> {
  await sendEvent("AddPaymentInfo", opts);
}

/** Subscribe — user started a paid subscription */
export async function trackSubscribe(opts: BaseOpts & {
  currency?: string;
  value?: number;
}): Promise<void> {
  await sendEvent("Subscribe", {
    ...opts,
    customData: {
      currency: opts.currency || "NOK",
      value: opts.value,
    },
  });
}

/** Purchase — a completed transaction */
export async function trackPurchase(opts: BaseOpts & {
  currency?: string;
  value?: number;
}): Promise<void> {
  await sendEvent("Purchase", {
    ...opts,
    customData: {
      currency: opts.currency || "NOK",
      value: opts.value,
    },
  });
}

/** CustomizeProduct — user customized their widget config */
export async function trackCustomizeProduct(opts: BaseOpts): Promise<void> {
  await sendEvent("CustomizeProduct", opts);
}

/** ViewContent — a key content page was visited */
export async function trackViewContent(opts: BaseOpts): Promise<void> {
  await sendEvent("ViewContent", opts);
}

/** PageView — generic page view (for dedup with pixel) */
export async function trackPageView(opts: BaseOpts): Promise<void> {
  await sendEvent("PageView", opts);
}
