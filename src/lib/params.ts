/**
 * Safely parse a query parameter as a positive integer with bounds.
 * Returns `defaultVal` if the value is missing, NaN, or out of bounds.
 */
export function safeParseInt(
  value: string | null,
  defaultVal: number,
  max: number
): number {
  const parsed = parseInt(value || String(defaultVal), 10);
  if (Number.isNaN(parsed) || parsed < 1) return defaultVal;
  return Math.min(parsed, max);
}
