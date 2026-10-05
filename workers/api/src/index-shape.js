/** Build the site/data/index.json document from database rows. */

export function isoDate(value) {
  if (value == null || value === "") return null;
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

export function asEntry(document) {
  if (document == null) return null;
  if (typeof document === "string") {
    try {
      return JSON.parse(document);
    } catch {
      return null;
    }
  }
  if (typeof document === "object") return document;
  return null;
}

export function countsFor(entries) {
  const counts = {
    total: entries.length,
    companies: 0,
    ideas: 0,
    deep_dive_done: 0,
    deep_dive_pending: 0,
    ideas_standing: 0,
    ideas_open: 0,
    ideas_killed: 0,
    ideas_parked: 0,
  };
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    if (entry.type === "company") counts.companies += 1;
    else if (entry.type === "idea") counts.ideas += 1;
    if (entry.status === "deep_dive_done") counts.deep_dive_done += 1;
    else if (entry.status === "deep_dive_pending") counts.deep_dive_pending += 1;
    else if (entry.status === "standing") counts.ideas_standing += 1;
    else if (entry.status === "open") counts.ideas_open += 1;
    else if (entry.status === "killed") counts.ideas_killed += 1;
    else if (entry.status === "parked") counts.ideas_parked += 1;
  }
  return counts;
}

export function buildIndex(meta, changelog, documents) {
  const entries = (documents || []).map(asEntry).filter(Boolean);
  const row = meta || {};
  return {
    schema_version: row.schema_version ?? 1,
    generated: row.generated == null ? null : isoDate(row.generated),
    title: row.title || "Who Cares",
    changelog: (changelog || []).map((item) => ({
      date: isoDate(item.date ?? item.entry_date),
      text: item.text,
    })),
    counts: countsFor(entries),
    entries,
  };
}
