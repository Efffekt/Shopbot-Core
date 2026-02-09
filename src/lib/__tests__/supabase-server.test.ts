import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
const mockCreateServerClient = vi.fn();
const mockCookieStore = {
  getAll: vi.fn().mockReturnValue([]),
  set: vi.fn(),
};

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookieStore),
}));

describe("supabase-server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY", "anon-key-123");
  });

  describe("createSupabaseServerClient", () => {
    it("creates server client with correct URL and key", async () => {
      const mockClient = { auth: { getUser: vi.fn() } };
      mockCreateServerClient.mockReturnValue(mockClient);

      const { createSupabaseServerClient } = await import("@/lib/supabase-server");
      const client = await createSupabaseServerClient();

      expect(mockCreateServerClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "anon-key-123",
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        })
      );
      expect(client).toBe(mockClient);
    });

    it("passes cookie store getAll through", async () => {
      const testCookies = [{ name: "sb-token", value: "abc123" }];
      mockCookieStore.getAll.mockReturnValue(testCookies);

      mockCreateServerClient.mockImplementation((_url: string, _key: string, opts: { cookies: { getAll: () => unknown } }) => {
        const cookies = opts.cookies.getAll();
        expect(cookies).toEqual(testCookies);
        return { auth: { getUser: vi.fn() } };
      });

      const { createSupabaseServerClient } = await import("@/lib/supabase-server");
      await createSupabaseServerClient();
    });
  });

  describe("getUser", () => {
    it("returns user from auth.getUser()", async () => {
      const fakeUser = { id: "u1", email: "test@test.com" };
      mockCreateServerClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: fakeUser } }),
        },
      });

      const { getUser } = await import("@/lib/supabase-server");
      const user = await getUser();
      expect(user).toEqual(fakeUser);
    });

    it("returns null when no user is logged in", async () => {
      mockCreateServerClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      });

      const { getUser } = await import("@/lib/supabase-server");
      const user = await getUser();
      expect(user).toBeNull();
    });
  });

  describe("getSession", () => {
    it("returns session from auth.getSession()", async () => {
      const fakeSession = { access_token: "tok", user: { id: "u1" } };
      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: fakeSession } }),
        },
      });

      const { getSession } = await import("@/lib/supabase-server");
      const session = await getSession();
      expect(session).toEqual(fakeSession);
    });

    it("returns null when no session exists", async () => {
      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        },
      });

      const { getSession } = await import("@/lib/supabase-server");
      const session = await getSession();
      expect(session).toBeNull();
    });
  });
});
