import { createLogger } from "@/lib/logger";

const log = createLogger("facebook-capi");

const FB_PIXEL_ID = "969440352441804";
const FB_API_VERSION = "v21.0";
const FB_API_URL = `https://graph.facebook.com/${FB_API_VERSION}/${FB_PIXEL_ID}/events`;

interface FacebookUserData {
  client_ip_address?: string;
  client_user_agent?: string;
  em?: string; // hashed email
  fn?: string; // hashed first name
  ln?: string; // hashed last name
  ph?: string; // hashed phone
}

interface FacebookEvent {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url?: string;
  action_source: "website";
  user_data: FacebookUserData;
  custom_data?: Record<string, unknown>;
}

/**
 * Hash a value with SHA-256 for Facebook (lowercase, trimmed).
 * Facebook requires PII fields to be SHA-256 hashed.
 */
async function sha256(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value.trim().toLowerCase());
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Generate a unique event ID for deduplication between pixel and CAPI */
export function generateEventId(): string {
  return crypto.randomUUID();
}

/** Build user_data with optional hashed PII fields */
async function buildUserData(opts: {
  ip?: string;
  userAgent?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<FacebookUserData> {
  const data: FacebookUserData = {
    client_ip_address: opts.ip,
    client_user_agent: opts.userAgent,
  };
  if (opts.email) data.em = await sha256(opts.email);
  if (opts.firstName) data.fn = await sha256(opts.firstName);
  if (opts.lastName) data.ln = await sha256(opts.lastName);
  if (opts.phone) data.ph = await sha256(opts.phone);
  return data;
}

/**
 * Send one or more events to Facebook Conversions API.
 * Fails silently — tracking should never break the user flow.
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

/** Helper to send a single event */
async function sendEvent(
  eventName: string,
  opts: {
    ip?: string;
    userAgent?: string;
    sourceUrl?: string;
    eventId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    customData?: Record<string, unknown>;
  },
): Promise<void> {
  const userData = await buildUserData(opts);
  await sendFacebookEvents([
    {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: opts.eventId || generateEventId(),
      event_source_url: opts.sourceUrl,
      action_source: "website",
      user_data: userData,
      custom_data: opts.customData,
    },
  ]);
}

// ── Standard events ──────────────────────────────────────────────

interface BaseOpts {
  ip?: string;
  userAgent?: string;
  sourceUrl?: string;
  eventId?: string;
}

/** Contact form submission — someone may be contacted later */
export async function trackLead(opts: BaseOpts & { email?: string; name?: string }): Promise<void> {
  await sendEvent("Lead", {
    ...opts,
    email: opts.email,
    firstName: opts.name?.split(" ")[0],
  });
}

/** Contact — a customer has been in contact (phone, email, chat, etc.) */
export async function trackContact(opts: BaseOpts & { email?: string; name?: string }): Promise<void> {
  await sendEvent("Contact", {
    ...opts,
    email: opts.email,
    firstName: opts.name?.split(" ")[0],
  });
}

/** CompleteRegistration — user confirmed their email and registered */
export async function trackCompleteRegistration(opts: BaseOpts & { email?: string }): Promise<void> {
  await sendEvent("CompleteRegistration", { ...opts, email: opts.email });
}

/** InitiateCheckout — user started the Stripe checkout flow */
export async function trackInitiateCheckout(opts: BaseOpts & {
  email?: string;
  currency?: string;
  value?: number;
}): Promise<void> {
  await sendEvent("InitiateCheckout", {
    ...opts,
    email: opts.email,
    customData: {
      currency: opts.currency || "NOK",
      value: opts.value ? String(opts.value) : undefined,
    },
  });
}

/** AddPaymentInfo — payment information was added during checkout */
export async function trackAddPaymentInfo(opts: BaseOpts & {
  email?: string;
  firstName?: string;
  lastName?: string;
}): Promise<void> {
  await sendEvent("AddPaymentInfo", { ...opts });
}

/** Subscribe — user started a paid subscription */
export async function trackSubscribe(opts: BaseOpts & {
  email?: string;
  currency?: string;
  value?: number;
}): Promise<void> {
  await sendEvent("Subscribe", {
    ...opts,
    email: opts.email,
    customData: {
      currency: opts.currency || "NOK",
      value: opts.value ? String(opts.value) : undefined,
    },
  });
}

/** Purchase — a transaction was completed */
export async function trackPurchase(opts: BaseOpts & {
  email?: string;
  currency?: string;
  value?: number;
}): Promise<void> {
  await sendEvent("Purchase", {
    ...opts,
    email: opts.email,
    customData: {
      currency: opts.currency || "NOK",
      value: opts.value ? String(opts.value) : undefined,
    },
  });
}

/** CustomizeProduct — user customized their widget */
export async function trackCustomizeProduct(opts: BaseOpts & { email?: string }): Promise<void> {
  await sendEvent("CustomizeProduct", { ...opts, email: opts.email });
}

/** ViewContent — a key content page was visited */
export async function trackViewContent(opts: BaseOpts): Promise<void> {
  await sendEvent("ViewContent", opts);
}

/** PageView — generic page view (for dedup with pixel) */
export async function trackPageView(opts: BaseOpts): Promise<void> {
  await sendEvent("PageView", opts);
}
