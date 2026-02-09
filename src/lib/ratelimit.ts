/**
 * Rate limiter backed by Upstash Redis.
 * Persists across deploys and works across all serverless instances.
 * Falls back to in-memory if UPSTASH env vars are not set (dev mode).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs?: number;
}

// --- Upstash-backed limiters (one per config shape) ---

const limiters = new Map<string, Ratelimit>();

function getUpstashLimiter(prefix: string, config: RateLimitConfig): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const key = `${prefix}:${config.maxRequests}:${config.windowMs}`;
  let limiter = limiters.get(key);
  if (limiter) return limiter;

  const redis = new Redis({ url, token });
  const windowSec = Math.ceil(config.windowMs / 1000);

  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.maxRequests, `${windowSec} s`),
    prefix: `rl:${prefix}`,
  });

  limiters.set(key, limiter);
  return limiter;
}

// --- In-memory fallback (dev only) ---

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

function checkMemoryRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();

  // Cleanup old entries periodically
  if (memoryStore.size > 1000) {
    for (const [key, entry] of memoryStore.entries()) {
      if (entry.resetAt < now) memoryStore.delete(key);
    }
  }

  let entry = memoryStore.get(identifier);

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + config.windowMs };
    memoryStore.set(identifier, entry);
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: entry.resetAt };
  }

  entry.count += 1;

  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterMs: entry.resetAt - now,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// --- Public API (same surface as before) ---

/**
 * Check if a request should be rate limited.
 * Uses Upstash Redis when configured, falls back to in-memory for dev.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const prefix = identifier.split(":")[0] || "default";
  const upstash = getUpstashLimiter(prefix, config);

  if (!upstash) {
    // Fallback to in-memory (dev or missing env vars)
    return checkMemoryRateLimit(identifier, config);
  }

  try {
    const result = await upstash.limit(identifier);

    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
      ...(!result.success && { retryAfterMs: result.reset - Date.now() }),
    };
  } catch {
    // Fail closed: if Redis is unreachable, deny the request
    return {
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + config.windowMs,
      retryAfterMs: 60_000,
    };
  }
}

/**
 * Default rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Chat API: 30 requests per minute per session/IP
  chat: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
  },
  // Chat IP-level: 60 requests per minute per IP (catches sessionId spoofing)
  chatIp: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
  },
  // Ingest API: 5 requests per hour (admin only, but extra protection)
  ingest: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Scrape API: 3 requests per hour
  scrape: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Contact form: 5 submissions per hour per IP
  contact: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Admin panel: 60 requests per minute per user
  admin: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
  },
  // Widget config: 60 requests per minute per IP
  widgetConfig: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

/**
 * Extract client IP from request headers.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");
  return forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
}

/**
 * Extract client identifier from request headers.
 * Prefers sessionId, falls back to IP address.
 */
export function getClientIdentifier(
  sessionId: string | undefined,
  headers: Headers
): string {
  if (sessionId) {
    return `session:${sessionId}`;
  }

  return `ip:${getClientIp(headers)}`;
}
