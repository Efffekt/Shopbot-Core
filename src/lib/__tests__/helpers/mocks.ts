/**
 * Shared mock factories for Vitest tests.
 *
 * Usage:
 *   import { mockUser, mockTenant } from "./helpers/mocks";
 */

// ─── User fixtures ────────────────────────────────────────────
export function mockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "test@example.com",
    email_confirmed_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

export function mockTenant(overrides: Record<string, unknown> = {}) {
  return {
    id: "test-tenant",
    name: "Test Tenant",
    credit_limit: 1000,
    credits_used: 0,
    billing_cycle_start: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// ─── NextRequest builder ──────────────────────────────────────
export function buildRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
) {
  const { method = "GET", body, headers = {} } = options;
  const init: RequestInit = {
    method,
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      ...headers,
    },
  };
  if (body) init.body = JSON.stringify(body);
  return new Request(url, init);
}
