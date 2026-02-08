import { describe, it, expect } from "vitest";
import { calculateChecksum } from "../checksum";

describe("calculateChecksum", () => {
  it("returns a hex string", () => {
    const result = calculateChecksum("test");
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns consistent results for same input", () => {
    const a = calculateChecksum("hello world");
    const b = calculateChecksum("hello world");
    expect(a).toBe(b);
  });

  it("returns different results for different input", () => {
    const a = calculateChecksum("hello");
    const b = calculateChecksum("world");
    expect(a).not.toBe(b);
  });

  it("handles empty string", () => {
    const result = calculateChecksum("");
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });

  it("handles unicode content", () => {
    const result = calculateChecksum("Båtpleiebutikken ÆØÅ");
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });
});
