import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Resend
const mockSend = vi.fn().mockResolvedValue({ data: { id: "msg_1" }, error: null });

class MockResend {
  emails = { send: mockSend };
}

vi.mock("resend", () => ({
  Resend: MockResend,
}));

// Mock supabaseAdmin
const mockSelect = vi.fn();
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === "tenants") {
        return {
          select: () => ({
            eq: () => ({
              single: mockSelect,
            }),
          }),
          update: (data: unknown) => {
            mockUpdate(data);
            return { eq: vi.fn().mockResolvedValue({ error: null }) };
          },
        };
      }
      return { select: vi.fn(), insert: vi.fn() };
    },
  },
}));

describe("email module", () => {
  beforeEach(() => {
    mockSend.mockClear();
    mockSelect.mockClear();
    mockUpdate.mockClear();
    vi.stubEnv("RESEND_API_KEY", "re_test_123");
  });

  describe("sendContactNotification", () => {
    it("sends contact notification with escaped HTML", async () => {
      vi.resetModules();
      const { sendContactNotification } = await import("@/lib/email");

      await sendContactNotification({
        name: "Test <script>User",
        email: "test@example.com",
        company: "Acme",
        message: "Hello & goodbye",
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.to).toBe("hei@preik.ai");
      expect(call.subject).toContain("Test <script>User");
      // HTML body should have escaped characters
      expect(call.html).toContain("Test &lt;script&gt;User");
      expect(call.html).toContain("test@example.com");
      expect(call.html).toContain("Hello &amp; goodbye");
    });

    it("skips when RESEND_API_KEY is missing", async () => {
      vi.stubEnv("RESEND_API_KEY", "");
      vi.resetModules();
      const { sendContactNotification } = await import("@/lib/email");

      await sendContactNotification({
        name: "Test",
        email: "t@t.com",
        message: "Hi",
      });

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("sendCreditWarningIfNeeded", () => {
    it("sends 80% warning email", async () => {
      mockSelect.mockResolvedValue({
        data: {
          name: "TestShop",
          contact_email: "owner@shop.com",
          last_credit_warning: null,
          credits_used: 800,
          credit_limit: 1000,
        },
        error: null,
      });

      vi.resetModules();
      const { sendCreditWarningIfNeeded } = await import("@/lib/email");

      await sendCreditWarningIfNeeded("tenant-1", "80");

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.to).toBe("owner@shop.com");
      expect(call.subject).toContain("80%");
    });

    it("skips if same warning level already sent", async () => {
      mockSelect.mockResolvedValue({
        data: {
          name: "TestShop",
          contact_email: "owner@shop.com",
          last_credit_warning: "80",
          credits_used: 800,
          credit_limit: 1000,
        },
        error: null,
      });

      vi.resetModules();
      const { sendCreditWarningIfNeeded } = await import("@/lib/email");

      await sendCreditWarningIfNeeded("tenant-1", "80");

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("skips if no contact email", async () => {
      mockSelect.mockResolvedValue({
        data: {
          name: "NoEmail",
          contact_email: null,
          last_credit_warning: null,
          credits_used: 800,
          credit_limit: 1000,
        },
        error: null,
      });

      vi.resetModules();
      const { sendCreditWarningIfNeeded } = await import("@/lib/email");

      await sendCreditWarningIfNeeded("tenant-1", "80");

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("does not throw on send failure", async () => {
      mockSelect.mockResolvedValue({
        data: {
          name: "Shop",
          contact_email: "a@b.com",
          last_credit_warning: null,
          credits_used: 1000,
          credit_limit: 1000,
        },
        error: null,
      });
      mockSend.mockRejectedValue(new Error("Network error"));

      vi.resetModules();
      const { sendCreditWarningIfNeeded } = await import("@/lib/email");

      await expect(
        sendCreditWarningIfNeeded("tenant-1", "100")
      ).resolves.toBeUndefined();
    });
  });

  describe("sendWelcomeEmail", () => {
    it("sends welcome email with tenant info", async () => {
      vi.resetModules();
      const { sendWelcomeEmail } = await import("@/lib/email");

      await sendWelcomeEmail({
        tenantName: "My Shop",
        contactEmail: "owner@myshop.com",
        tenantId: "my-shop",
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.to).toBe("owner@myshop.com");
      expect(call.subject).toContain("My Shop");
      expect(call.html).toContain("my-shop");
    });
  });
});
