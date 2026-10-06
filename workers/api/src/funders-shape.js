/** Turn funder query rows into the public JSON shape. No invented fields. */

export function parseSources(value) {
  let data = value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      data = JSON.parse(trimmed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(data)) return [];
  const out = [];
  data.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const url = String(item.url || "").trim();
    if (!/^https?:\/\//i.test(url)) return;
    const quote = typeof item.quote === "string" ? item.quote.replace(/\s+/g, " ").trim() : "";
    const source = { url };
    if (quote) source.quote = quote;
    out.push(source);
  });
  return out;
}

export function parseAmount(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function textOrNull(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

export function funderSummary(row) {
  const backed = Number(row && row.backed);
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    country: textOrNull(row.country),
    backed: Number.isFinite(backed) ? backed : 0,
  };
}

function linkFields(row, idKey, nameKey) {
  return {
    id: row[idKey],
    name: row[nameKey],
    relation: row.relation,
    round_label: textOrNull(row.round_label),
    amount_eur: parseAmount(row.amount_eur),
    date: textOrNull(row.date),
    sources: parseSources(row.sources),
  };
}

export function funderDetail(row, links) {
  if (!row) return null;
  const website = textOrNull(row.website);
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    country: textOrNull(row.country),
    website: website && /^https?:\/\//i.test(website) ? website : null,
    description: textOrNull(row.description),
    aum_or_programme_size: textOrNull(row.aum_or_programme_size),
    care_focus: textOrNull(row.care_focus),
    sources: parseSources(row.sources),
    backed: (links || []).map((link) => linkFields(link, "entry_id", "entry_name")),
  };
}

export function attachFunding(index, rows) {
  const byEntry = new Map();
  (rows || []).forEach((row) => {
    if (!row || !row.entry_id || !row.funder_id) return;
    const list = byEntry.get(row.entry_id) || [];
    list.push(linkFields(row, "funder_id", "funder_name"));
    byEntry.set(row.entry_id, list);
  });
  const entries = (index.entries || []).map((entry) => {
    const links = entry && byEntry.get(entry.id);
    if (!links || !links.length) return entry;
    return { ...entry, funded_by: links };
  });
  return { ...index, entries };
}
