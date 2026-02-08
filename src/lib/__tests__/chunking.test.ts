import { describe, it, expect } from "vitest";
import { splitIntoChunks } from "../chunking";

describe("splitIntoChunks", () => {
  it("returns empty array for empty text", () => {
    expect(splitIntoChunks("")).toEqual([]);
    expect(splitIntoChunks("   ")).toEqual([]);
  });

  it("returns single chunk for short text", () => {
    const result = splitIntoChunks("Hello world");
    expect(result).toEqual(["Hello world"]);
  });

  it("splits on double newlines (paragraphs)", () => {
    const text = "Paragraph one.\n\nParagraph two.\n\nParagraph three.";
    const result = splitIntoChunks(text, 30);
    expect(result.length).toBeGreaterThan(1);
    expect(result[0]).toContain("Paragraph one");
  });

  it("respects chunk size limit", () => {
    const text = Array(50).fill("Word").join(" ");
    const result = splitIntoChunks(text, 50);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(50);
    }
  });

  it("handles very long paragraphs by word splitting", () => {
    const longParagraph = Array(200).fill("longword").join(" ");
    const result = splitIntoChunks(longParagraph, 100);
    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(100);
    }
  });

  it("combines small paragraphs into one chunk", () => {
    const text = "A.\n\nB.\n\nC.";
    const result = splitIntoChunks(text, 1000);
    expect(result).toEqual(["A.\n\nB.\n\nC."]);
  });

  it("does not produce empty chunks", () => {
    const text = "Hello\n\n\n\n\n\nWorld";
    const result = splitIntoChunks(text);
    for (const chunk of result) {
      expect(chunk.length).toBeGreaterThan(0);
    }
  });
});
