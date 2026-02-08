import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLogger } from "../logger";

describe("createLogger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a logger with all methods", () => {
    const log = createLogger("test-route");
    expect(typeof log.debug).toBe("function");
    expect(typeof log.info).toBe("function");
    expect(typeof log.warn).toBe("function");
    expect(typeof log.error).toBe("function");
  });

  it("error() outputs JSON to stderr", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = createLogger("test-route");
    log.error("Something failed");

    expect(spy).toHaveBeenCalledOnce();
    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(output.level).toBe("error");
    expect(output.message).toBe("Something failed");
    expect(output.route).toBe("test-route");
    expect(output.timestamp).toBeTruthy();
  });

  it("info() outputs JSON to stdout", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const log = createLogger("test-route");
    log.info("Processing", { count: 5 });

    expect(spy).toHaveBeenCalledOnce();
    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(output.level).toBe("info");
    expect(output.message).toBe("Processing");
    expect(output.count).toBe(5);
  });

  it("error() handles Error objects in context", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = createLogger("test");
    log.error("Failed", new Error("test error"));

    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(output.error).toBe("test error");
    expect(output.stack).toBeTruthy();
  });

  it("error() handles unknown types", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = createLogger("test");
    log.error("Failed", "string error");

    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(output.error).toBe("string error");
  });

  it("error() handles Record context with nested Errors", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = createLogger("test");
    log.error("Failed", { err: new Error("nested") });

    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(output.err).toEqual({ message: "nested", stack: expect.any(String) });
  });
});
