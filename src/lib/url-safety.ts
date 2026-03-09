/**
 * SSRF protection — reject URLs pointing to private/internal networks.
 */

const PRIVATE_IP_PATTERNS = [
  /^127\./, // loopback (127.0.0.1 – 127.255.255.255)
  /^10\./, // Class A private
  /^172\.(1[6-9]|2\d|3[01])\./, // Class B private
  /^192\.168\./, // Class C private
  /^169\.254\./, // link-local
  /^0\./, // current network (0.0.0.0/8)
  /^::1$/, // IPv6 loopback
  /^::$/, // IPv6 unspecified
  /^::ffff:127\./, // IPv6-mapped IPv4 loopback
  /^::ffff:10\./, // IPv6-mapped IPv4 Class A
  /^::ffff:172\.(1[6-9]|2\d|3[01])\./, // IPv6-mapped IPv4 Class B
  /^::ffff:192\.168\./, // IPv6-mapped IPv4 Class C
  /^::ffff:169\.254\./, // IPv6-mapped IPv4 link-local
  /^::ffff:0\./, // IPv6-mapped IPv4 current network
  /^fc00:/i, // IPv6 unique local
  /^fe80:/i, // IPv6 link-local
];

/**
 * Returns true if the hostname looks like a private/internal address.
 * Checks the hostname string directly — does NOT do DNS resolution
 * (Firecrawl handles the actual fetch, so DNS-based SSRF via rebinding
 * would need to be handled at the Firecrawl level).
 */
export function isPrivateHost(hostname: string): boolean {
  // Strip IPv6 brackets
  const clean = hostname.replace(/^\[|\]$/g, "").toLowerCase();

  // Block localhost and common aliases
  if (clean === "localhost" || clean === "0.0.0.0") return true;

  // Block hex/octal/decimal IP tricks (e.g. 0x7f000001, 2130706433, 0177.0.0.1)
  // These are alternative representations of 127.0.0.1 that bypass naive checks
  if (/^0x[0-9a-f]+$/i.test(clean) || /^[0-9]+$/.test(clean)) return true;
  if (/^0[0-7]/.test(clean)) return true; // Octal notation

  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(clean));
}

/**
 * Validate a URL is safe for server-side fetching:
 * - Must be HTTPS
 * - Must not point to private/internal IPs
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (isPrivateHost(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}
