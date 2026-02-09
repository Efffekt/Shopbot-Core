import { describe, it, expect, vi, beforeEach } from "vitest";

describe("admin-emails", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses comma-separated super admin emails", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPER_ADMIN_EMAILS", "Alice@Example.com, bob@test.no");
    vi.stubEnv("NEXT_PUBLIC_ADMIN_EMAILS", "");

    // Re-import to pick up new env
    vi.resetModules();
    const { SUPER_ADMIN_EMAILS } = await import("@/lib/admin-emails");

    expect(SUPER_ADMIN_EMAILS).toEqual(["alice@example.com", "bob@test.no"]);
  });

  it("returns empty array when env is undefined", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPER_ADMIN_EMAILS", "");
    vi.stubEnv("NEXT_PUBLIC_ADMIN_EMAILS", "");

    vi.resetModules();
    const { SUPER_ADMIN_EMAILS, ADMIN_EMAILS } = await import("@/lib/admin-emails");

    expect(SUPER_ADMIN_EMAILS).toEqual([]);
    expect(ADMIN_EMAILS).toEqual([]);
  });

  it("trims whitespace and lowercases emails", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPER_ADMIN_EMAILS", "  A@B.COM , ");
    vi.stubEnv("NEXT_PUBLIC_ADMIN_EMAILS", "");

    vi.resetModules();
    const { SUPER_ADMIN_EMAILS } = await import("@/lib/admin-emails");

    expect(SUPER_ADMIN_EMAILS).toEqual(["a@b.com"]);
  });

  it("filters empty entries from double commas", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPER_ADMIN_EMAILS", "a@b.com,,c@d.com,");
    vi.stubEnv("NEXT_PUBLIC_ADMIN_EMAILS", "");

    vi.resetModules();
    const { SUPER_ADMIN_EMAILS } = await import("@/lib/admin-emails");

    expect(SUPER_ADMIN_EMAILS).toEqual(["a@b.com", "c@d.com"]);
  });

  it("parses admin emails separately from super admin", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPER_ADMIN_EMAILS", "super@admin.com");
    vi.stubEnv("NEXT_PUBLIC_ADMIN_EMAILS", "regular@admin.com");

    vi.resetModules();
    const { SUPER_ADMIN_EMAILS, ADMIN_EMAILS } = await import("@/lib/admin-emails");

    expect(SUPER_ADMIN_EMAILS).toEqual(["super@admin.com"]);
    expect(ADMIN_EMAILS).toEqual(["regular@admin.com"]);
  });
});
