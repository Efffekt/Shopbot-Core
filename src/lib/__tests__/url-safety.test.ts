import { describe, it, expect } from "vitest";
import { isSafeUrl, isPrivateHost } from "../url-safety";

describe("isPrivateHost", () => {
  it("blocks localhost", () => {
    expect(isPrivateHost("localhost")).toBe(true);
  });

  it("blocks loopback IPs", () => {
    expect(isPrivateHost("127.0.0.1")).toBe(true);
    expect(isPrivateHost("127.0.0.2")).toBe(true);
  });

  it("blocks Class A private", () => {
    expect(isPrivateHost("10.0.0.1")).toBe(true);
    expect(isPrivateHost("10.255.255.255")).toBe(true);
  });

  it("blocks Class B private", () => {
    expect(isPrivateHost("172.16.0.1")).toBe(true);
    expect(isPrivateHost("172.31.255.255")).toBe(true);
  });

  it("does not block 172.15.x or 172.32.x", () => {
    expect(isPrivateHost("172.15.0.1")).toBe(false);
    expect(isPrivateHost("172.32.0.1")).toBe(false);
  });

  it("blocks Class C private", () => {
    expect(isPrivateHost("192.168.0.1")).toBe(true);
    expect(isPrivateHost("192.168.1.100")).toBe(true);
  });

  it("blocks link-local", () => {
    expect(isPrivateHost("169.254.1.1")).toBe(true);
  });

  it("blocks IPv6 loopback", () => {
    expect(isPrivateHost("::1")).toBe(true);
  });

  it("blocks IPv6 unique local and link-local", () => {
    expect(isPrivateHost("fc00::1")).toBe(true);
    expect(isPrivateHost("fe80::1")).toBe(true);
  });

  it("allows public IPs", () => {
    expect(isPrivateHost("8.8.8.8")).toBe(false);
    expect(isPrivateHost("1.1.1.1")).toBe(false);
    expect(isPrivateHost("93.184.216.34")).toBe(false);
  });

  it("allows public hostnames", () => {
    expect(isPrivateHost("example.com")).toBe(false);
    expect(isPrivateHost("google.com")).toBe(false);
  });
});

describe("isSafeUrl", () => {
  it("allows HTTPS URLs to public hosts", () => {
    expect(isSafeUrl("https://example.com")).toBe(true);
    expect(isSafeUrl("https://google.com/search?q=test")).toBe(true);
  });

  it("rejects HTTP URLs", () => {
    expect(isSafeUrl("http://example.com")).toBe(false);
  });

  it("rejects URLs to private hosts", () => {
    expect(isSafeUrl("https://localhost")).toBe(false);
    expect(isSafeUrl("https://127.0.0.1")).toBe(false);
    expect(isSafeUrl("https://10.0.0.1")).toBe(false);
    expect(isSafeUrl("https://192.168.1.1")).toBe(false);
  });

  it("rejects invalid URLs", () => {
    expect(isSafeUrl("not-a-url")).toBe(false);
    expect(isSafeUrl("")).toBe(false);
  });

  it("rejects file:// protocol", () => {
    expect(isSafeUrl("file:///etc/passwd")).toBe(false);
  });
});
