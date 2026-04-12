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
  fbc?: string; // click ID cookie
  fbp?: string; // browser ID cookie
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

/**
 * Track a Lead event (contact form submission).
 */
export async function trackLead(opts: {
  email?: string;
  name?: string;
  ip?: string;
  userAgent?: string;
  sourceUrl?: string;
  eventId?: string;
}): Promise<void> {
  const userData: FacebookUserData = {
    client_ip_address: opts.ip,
    client_user_agent: opts.userAgent,
  };

  if (opts.email) userData.em = await sha256(opts.email);
  if (opts.name) userData.fn = await sha256(opts.name.split(" ")[0]);

  await sendFacebookEvents([
    {
      event_name: "Lead",
      event_time: Math.floor(Date.now() / 1000),
      event_id: opts.eventId || generateEventId(),
      event_source_url: opts.sourceUrl,
      action_source: "website",
      user_data: userData,
    },
  ]);
}

/**
 * Track a PageView event (server-side, for dedup with pixel).
 */
export async function trackPageView(opts: {
  ip?: string;
  userAgent?: string;
  sourceUrl?: string;
  eventId?: string;
}): Promise<void> {
  await sendFacebookEvents([
    {
      event_name: "PageView",
      event_time: Math.floor(Date.now() / 1000),
      event_id: opts.eventId || generateEventId(),
      event_source_url: opts.sourceUrl,
      action_source: "website",
      user_data: {
        client_ip_address: opts.ip,
        client_user_agent: opts.userAgent,
      },
    },
  ]);
}
