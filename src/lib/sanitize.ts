import DOMPurify from "isomorphic-dompurify";

/** Strip all HTML/script from user-supplied strings. */
export function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] }).trim();
}