import { describe, it, expect } from "vitest";
import { safeParseInt } from "@/lib/params";

describe("safeParseInt", () => {
  it("parses valid integers", () => {
    expect(safeParseInt("5", 1, 100)).toBe(5);
    expect(safeParseInt("100", 1, 100)).toBe(100);
  });

  it("returns default for null", () => {
    expect(safeParseInt(null, 30, 365)).toBe(30);
  });

  it("returns default for NaN input", () => {
    expect(safeParseInt("abc", 30, 365)).toBe(30);
    expect(safeParseInt("", 30, 365)).toBe(30);
    expect(safeParseInt("NaN", 1, 100)).toBe(1);
  });

  it("clamps to max", () => {
    expect(safeParseInt("999999", 30, 365)).toBe(365);
  });

  it("returns default for zero or negative", () => {
    expect(safeParseInt("0", 1, 100)).toBe(1);
    expect(safeParseInt("-5", 1, 100)).toBe(1);
  });

  it("handles edge case of max=1", () => {
    expect(safeParseInt("1", 1, 1)).toBe(1);
    expect(safeParseInt("5", 1, 1)).toBe(1);
  });
});
