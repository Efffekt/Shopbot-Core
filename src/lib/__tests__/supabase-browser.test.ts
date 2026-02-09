import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateBrowserClient = vi.fn().mockReturnValue({ auth: {} });

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: (...args: unknown[]) => mockCreateBrowserClient(...args),
}));

describe("supabase-browser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set env vars that the module reads at import time
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = "anon-key-123";
  });

  it("creates browser client with env vars", async () => {
    const { createSupabaseBrowserClient } = await import("@/lib/supabase-browser");
    const client = createSupabaseBrowserClient();

    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "anon-key-123"
    );
    expect(client).toEqual({ auth: {} });
  });
});
