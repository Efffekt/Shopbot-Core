// Structured JSON logger for Vercel log drain
// Zero dependencies — outputs JSON to stdout/stderr

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const threshold =
  LEVELS[
    (process.env.LOG_LEVEL as LogLevel) ??
      (process.env.NODE_ENV === "production" ? "info" : "debug")
  ] ?? LEVELS.info;

interface LogEntry {
  level: LogLevel;
  message: string;
  route?: string;
  timestamp: string;
  [key: string]: unknown;
}

function emit(level: LogLevel, route: string | undefined, message: string, context?: Record<string, unknown>) {
  if (LEVELS[level] < threshold) return;

  const entry: LogEntry = {
    level,
    message,
    ...(route && { route }),
    timestamp: new Date().toISOString(),
    ...context,
  };

  const line = JSON.stringify(entry);
  if (level === "error" || level === "warn") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export interface Logger {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: unknown) => void;
}

export function createLogger(route: string): Logger {
  return {
    debug: (msg, ctx) => emit("debug", route, msg, ctx),
    info: (msg, ctx) => emit("info", route, msg, ctx),
    warn: (msg, ctx) => emit("warn", route, msg, ctx),
    error: (msg, ctx) => {
      // Normalize context: accept Error, Record, or unknown
      let normalized: Record<string, unknown> | undefined;
      if (ctx instanceof Error) {
        normalized = { error: ctx.message, stack: ctx.stack };
      } else if (ctx && typeof ctx === "object" && !Array.isArray(ctx)) {
        normalized = ctx as Record<string, unknown>;
        for (const [k, v] of Object.entries(normalized)) {
          if (v instanceof Error) {
            normalized[k] = { message: v.message, stack: v.stack };
          }
        }
      } else if (ctx !== undefined) {
        normalized = { error: String(ctx) };
      }
      emit("error", route, msg, normalized);
    },
  };
}

export const logger = createLogger("app");
