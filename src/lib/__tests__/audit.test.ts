import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabaseAdmin before importing
const mockInsert = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: () => ({ insert: mockInsert }),
  },
}));

import { logAudit } from "@/lib/audit";

describe("logAudit", () => {
  beforeEach(() => {
    mockInsert.mockClear();
    mockInsert.mockResolvedValue({ error: null });
  });

  it("inserts audit entry with all fields", async () => {
    await logAudit({
      actorEmail: "user@test.com",
      action: "create",
      entityType: "tenant",
      entityId: "t1",
      details: { name: "Test" },
    });

    expect(mockInsert).toHaveBeenCalledWith({
      actor_email: "user@test.com",
      action: "create",
      entity_type: "tenant",
      entity_id: "t1",
      details: { name: "Test" },
    });
  });

  it("defaults entityId to null and details to empty object", async () => {
    await logAudit({
      actorEmail: "admin@test.com",
      action: "delete",
      entityType: "user",
    });

    expect(mockInsert).toHaveBeenCalledWith({
      actor_email: "admin@test.com",
      action: "delete",
      entity_type: "user",
      entity_id: null,
      details: {},
    });
  });

  it("does not throw on database error", async () => {
    mockInsert.mockRejectedValue(new Error("DB down"));

    // Should not throw
    await expect(
      logAudit({
        actorEmail: "x@y.com",
        action: "test",
        entityType: "test",
      })
    ).resolves.toBeUndefined();
  });

  it("does not throw on insert returning error", async () => {
    mockInsert.mockResolvedValue({ error: { message: "constraint violation" } });

    await expect(
      logAudit({
        actorEmail: "x@y.com",
        action: "test",
        entityType: "test",
      })
    ).resolves.toBeUndefined();
  });
});
