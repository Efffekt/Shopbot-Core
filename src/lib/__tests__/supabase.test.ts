import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock createClient before importing
const mockCreateClient = vi.fn().mockReturnValue({ from: vi.fn() });
vi.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

describe("supabase (admin client)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");

    await expect(async () => {
      vi.resetModules();
      await import("@/lib/supabase");
    }).rejects.toThrow("Missing NEXT_PUBLIC_SUPABASE_URL");
  });

  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    await expect(async () => {
      vi.resetModules();
      await import("@/lib/supabase");
    }).rejects.toThrow("Missing SUPABASE_SERVICE_ROLE_KEY");
  });

  it("creates admin client with correct config when env vars are set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key-123");

    vi.resetModules();
    await import("@/lib/supabase");

    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "service-role-key-123",
      expect.objectContaining({
        auth: { autoRefreshToken: false, persistSession: false },
      })
    );
  });
});
