/** Decode one path segment. Malformed escapes return null so the caller can answer 404. */
export function decodeSlug(raw) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}
