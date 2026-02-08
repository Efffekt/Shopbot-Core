/**
 * SSRF protection — reject URLs pointing to private/internal networks.
 */

const PRIVATE_IP_PATTERNS = [
  /^127\./, // loopback
  /^10\./, // Class A private
  /^172\.(1[6-9]|2\d|3[01])\./, // Class B private
  /^192\.168\./, // Class C private
  /^169\.254\./, // link-local
  /^0\./, // current network
  /^::1$/, // IPv6 loopback
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
  const clean = hostname.replace(/^\[|\]$/g, "");

  if (clean === "localhost") return true;

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
