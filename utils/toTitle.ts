/**
 * Utility to convert an underscore-delimited string to title case.
 *
 * Example:
 *  - "EMPLOYMENT_STATUS" -> "Employment Status"
 *  - "on_leave" -> "On Leave"
 */
export function toTitle(input: string): string {
  if (!input) return "";
  return String(input)
    .replaceAll("_", " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
