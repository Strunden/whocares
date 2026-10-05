/* Who Cares drill-in index.
   Hierarchy (shallowest that fits the real index):
   Root lists life stage (P01-P07) and theme (T01-T18). Those codes are the
   themes[] tags. Labels come from idea_kind parent_theme / theme cards.
   Altitude is not a field. A type step (company / idea / kill) is skipped
   because the largest theme is 15 entries.
   Tap replaces the list. Back walks up. API_BASE /api/index, then JSON. */
(function () {
  const STATUS = {
    deep_dive_done: "Researched",
    deep_dive_pending: "Not fully researched",
    new_this_scan: "Just added",
    open: "Not decided yet",
    stressed: "Tested, still open",
    standing: "Kept on the list",
    killed: "Dropped",
    parked: "Set aside"
  };
  const STATUS_GLOSS = {
    deep_dive_done: "We wrote up what it does.",
    deep_dive_pending: "We have a short note, not a full write-up.",
    new_this_scan: "Added in the latest pass.",
    open: "We have not decided yet.",
    stressed: "We tested the idea and it is still open.",
    standing: "We kept it on the list.",
    killed: "We researched it and dropped it.",
    parked: "Set aside for now."
  };
  const GLYPH = {
    life: '<path d="M5 19V11M12 19V5M19 19v-6"/>',
    theme: '<path d="M4 8h9l7 7-7 7H4V8z"/><circle cx="8.5" cy="13" r="1.1" fill="currentColor" stroke="none"/>',
    company: '<path d="M4 20V9l8-5 8 5v11"/><path d="M10 20v-5h4v5M9 11h.01M15 11h.01M9 14.5h.01M15 14.5h.01"/>',
    idea: '<path d="M9 18h6M10 21h4"/><path d="M12 3a5.5 5.5 0 0 1 3.6 9.6V16H8.4v-3.4A5.5 5.5 0 0 1 12 3z"/>',
    kill: '<circle cx="12" cy="12" r="8"/><path d="M9 9l6 6M15 9l-6 6"/>',
    link: '<path d="M14 5h5v5"/><path d="M10 14L19 5"/><path d="M17 13v6H5V7h6"/>',
    note: '<path d="M7 4h7l4 4v12H7V4z"/><path d="M14 4v4h4M9 12h6M9 16h4"/>',
    researched: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    dropped: '<circle cx="12" cy="12" r="8"/><path d="M9 9l6 6M15 9l-6 6"/>',
    considering: '<path d="M7 4h7l4 4v12H7V4z"/><path d="M14 4v4h4"/>',
    open: '<circle cx="12" cy="12" r="7"/>',
    parked: '<path d="M9 6v12M15 6v12"/>',
    pending: '<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/>',
    stressed: '<circle cx="12" cy="12" r="8"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
    fresh: '<path d="M12 6v12M6 12h12"/>'
  };
  const STATUS_ICON = {
    killed: "dropped",
    standing: "considering",
    open: "open",
    parked: "parked",
    deep_dive_done: "researched",
    deep_dive_pending: "pending",
    stressed: "stressed",
    new_this_scan: "fresh"
  };
  const MORE_LABELS = {
    product: "Product",
    how_it_works: "How it works",
    user: "User",
    buyer: "Who buys",
    payer: "Who pays",
    business_model: "How it makes money",
    traction: "Traction",
    funding: "Funding",
    team: "Team",
    competitors: "Competitors",
    regulatory: "Rules and payment",
    thesis: "Our read",
    risks: "Risks",
    relevance: "Why it matters here",
    open_questions: "Open questions"
  };

  function dataUrl() {
    const path = location.pathname;
    if (path.includes("/companies/") || path.includes("/entry.html")) return "../data/index.json";
    return "data/index.json";
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function nd(s) {
    return String(s == null ? "" : s)
      .replace(/\u2014/g, " - ")
      .replace(/\u2013/g, "-")
      .replace(/—/g, " - ")
      .replace(/–/g, "-");
  }
  function t(s) { return esc(nd(s)); }
  function clip(s, n) {
    const v = nd(s).replace(/\s+/g, " ").trim();
    if (v.length <= n) return v;
    return v.slice(0, n - 1).trim() + "...";
  }
  function joinMeta(parts) {
    return parts.filter(Boolean).join(" · ");
  }
  function statusLabel(s) {
    if (!s) return "";
    return STATUS[s] || String(s).replace(/_/g, " ");
  }
  function typeLabel(e) {
    return e && e.type === "idea" ? "Idea" : "Company";
  }
  function safeUrl(u) {
    const s = String(u || "").trim();
    if (/^https?:\/\//i.test(s)) return s;
    return "";
  }
  function chevron() {
    return '<svg class="chev" viewBox="0 0 12 20" width="10" height="18" aria-hidden="true"><path d="M2 2 L10 10 L2 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function svgIcon(name) {
    const body = GLYPH[name] || GLYPH.idea;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }
  function iconTile(kind) {
    const key = GLYPH[kind] ? kind : "idea";
    return `<span class="ico ico-${key}">${svgIcon(key)}</span>`;
  }
  function statusMark(status) {
    const key = STATUS_ICON[status];
    if (!key) return "";
    return `<span class="mark mark-${key}">${svgIcon(key)}</span>`;
  }
  function isKilled(e) {
    return !!(e && (e.status === "killed" || e.kill_reason));
  }
  function entryKind(e) {
    if (isKilled(e)) return "kill";
    if (e.idea_kind === "parent_theme") return "life";
    if (e.idea_kind === "theme") return "theme";
    if (e.type === "idea") return "idea";
    return "company";
  }
  function roleWord(e) {
    if (e.idea_kind === "parent_theme") return "Life stage";
    if (e.idea_kind === "theme") return "Theme";
    if (e.type === "idea") return "Idea";
    return "Company";
  }
  function rolePhrase(e) {
    const word = roleWord(e);
    return isKilled(e) ? "Dropped " + word.toLowerCase() : word;
  }
  function displayName(e) {
    const name = nd(e.name || "Untitled").trim();
    const prefixed = name.match(/^(?:P\d+|T\d+):\s*(.+)$/i);
    if (prefixed && prefixed[1]) return prefixed[1].trim();
    if (/^[PT]\d+-H\d+$/i.test(name)) {
      const human = nd(e.summary || e.claim || "").replace(/\s+/g, " ").trim();
      if (human) return human;
    }
    return name;
  }
  function codeOf(e) {
    const name = nd(e.name || "").trim();
    const fromName = name.match(/^([PT]\d+(?:-H\d+)?)/i);
    if (fromName && (e.type === "idea" || e.idea_kind)) return fromName[1].toUpperCase();
    return "";
  }
  function placeLabel(e) {
    const raw = nd(e.country || "").trim();
    if (!raw) return "";
    return raw.split(/\s+\(|\s*;/)[0].trim();
  }
  function callLabel(value) {
    const key = String(value || "").toLowerCase();
    if (key === "kill") return "Dropped";
    if (key === "continue") return "Kept on the list";
    if (key === "park") return "Set aside";
    return nd(value);
  }
  function kindLabel(value) {
    const key = String(value || "");
    if (key === "parent_theme") return "Life stage";
    if (key === "theme") return "Theme";
    if (key === "thesis_card") return "Idea";
    if (key === "manual") return "Note";
    return nd(value);
  }

  function apiBase() {
    const cfg = window.WHOCARES_CONFIG || {};
    const raw = cfg.API_BASE != null ? cfg.API_BASE : cfg.apiBase;
    if (typeof raw !== "string") return "";
    return raw.trim().replace(/\/+$/, "");
  }

  async function loadStaticIndex() {
    const res = await fetch(dataUrl(), { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load data/index.json");
    return res.json();
  }

  async function loadIndex() {
    const base = apiBase();
    if (base) {
      try {
        const res = await fetch(`${base}/api/index`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.entries)) return data;
        }
      } catch (err) {
        console.warn("Live index unavailable, using data/index.json");
      }
    }
    return loadStaticIndex();
  }

  function themeCards(entries) {
    const map = new Map();
    entries.forEach((e) => {
      if (e.idea_kind !== "theme" && e.idea_kind !== "parent_theme") return;
      const code = (e.themes || [])[0];
      if (code && !map.has(code)) map.set(code, e);
    });
    return map;
  }

  function themeTitle(code, card) {
    if (!card) return code;
    let title = nd(card.name || code);
    const prefix = code + ":";
    if (title.slice(0, prefix.length).toLowerCase() === prefix.toLowerCase()) {
      title = title.slice(prefix.length).trim();
    }
    return title || code;
  }

  function codeRank(code) {
    const m = /^([A-Za-z]+)(\d+)$/.exec(code || "");
    if (!m) return [9, 0, code || ""];
    const letter = m[1].toUpperCase();
    const group = letter === "P" ? 0 : letter === "T" ? 1 : 2;
    return [group, Number(m[2]), letter];
  }

  function entriesFor(all, code) {
    const seen = new Set();
    const out = [];
    all.forEach((e) => {
      if (!(e.themes || []).includes(code) || seen.has(e.id)) return;
      seen.add(e.id);
      out.push(e);
    });
    out.sort((a, b) => {
      const ta = a.type === "company" ? 0 : 1;
      const tb = b.type === "company" ? 0 : 1;
      if (ta !== tb) return ta - tb;
      return nd(a.name).localeCompare(nd(b.name), undefined, { numeric: true, sensitivity: "base" });
    });
    return out;
  }

  function buildBuckets(entries) {
    const cards = themeCards(entries);
    const codes = new Set(cards.keys());
    entries.forEach((e) => (e.themes || []).forEach((c) => codes.add(c)));
    const buckets = [...codes].map((code) => {
      const card = cards.get(code) || null;
      const kids = entriesFor(entries, code);
      return {
        code,
        title: themeTitle(code, card),
        summary: card ? (card.summary || "") : "",
        status: card ? (card.status || "") : "",
        kind: card ? card.idea_kind : "",
        count: kids.length,
        group: /^P\d+$/i.test(code) ? "life" : /^T\d+$/i.test(code) ? "theme" : "other"
      };
    });
    buckets.sort((a, b) => {
      const ra = codeRank(a.code);
      const rb = codeRank(b.code);
      return ra[0] - rb[0] || ra[1] - rb[1] || String(ra[2]).localeCompare(String(rb[2]));
    });
    return buckets;
  }

  function parseHash() {
    let raw = (location.hash || "#/").replace(/^#/, "");
    if (!raw) raw = "/";
    try { raw = decodeURIComponent(raw); } catch (err) { /* keep raw */ }
    if (!raw.startsWith("/")) raw = "/" + raw;
    const bits = raw.split("/").filter(Boolean);
    if (bits[0] === "t" && bits[1]) {
      const code = bits[1];
      if (bits[2] === "e" && bits[3]) return { view: "entry", code, id: bits.slice(3).join("/") };
      return { view: "theme", code, id: "" };
    }
    if (bits[0] === "e" && bits[1]) return { view: "entry", code: "", id: bits.slice(1).join("/") };
    return { view: "root", code: "", id: "" };
  }

  function findEntry(entries, id) {
    return entries.find((e) => e.id === id) || null;
  }

  function primaryCode(e) {
    return (e && e.themes && e.themes[0]) || "";
  }

  function parentPath(route, entries) {
    if (route.view === "root") return "";
    if (route.view === "theme") return "/";
    const entry = findEntry(entries, route.id);
    const code = route.code || primaryCode(entry);
    if (code) return "/t/" + encodeURIComponent(code);
    return "/";
  }

  function entryHay(e) {
    return nd([e.name, e.summary, e.claim, e.kill_reason, e.country, e.status, typeLabel(e)].join(" ")).toLowerCase();
  }

  function bucketHay(b) {
    return nd([b.code, b.title, b.summary, b.status].join(" ")).toLowerCase();
  }

  let indexData = null;
  let depth = 0;
  let query = "";
  let moreOpen = false;

  const app = document.getElementById("app");
  const boot = document.getElementById("boot");
  const main = document.getElementById("main");
  const introEl = document.getElementById("intro");
  const crumbEl = document.getElementById("crumb");
  const backBtn = document.getElementById("back");
  const searchWrap = document.getElementById("search-wrap");
  const searchEl = document.getElementById("search");

  function routeNow() {
    return parseHash();
  }

  function go(path) {
    const next = path.startsWith("#") ? path : "#" + path;
    if ((location.hash || "#/") === next) return;
    depth += 1;
    history.pushState({ wc: 1, depth }, "", next);
    query = "";
    if (searchEl) searchEl.value = "";
    moreOpen = false;
    render(true);
  }

  function back() {
    const route = routeNow();
    if (route.view === "root") return;
    if (depth > 0) {
      history.back();
      return;
    }
    const parent = parentPath(route, (indexData && indexData.entries) || []);
    history.replaceState({ wc: 1, depth: 0 }, "", "#" + (parent || "/"));
    query = "";
    if (searchEl) searchEl.value = "";
    moreOpen = false;
    render(true);
  }

  function countsOf(entries) {
    let companies = 0;
    let ideas = 0;
    let killed = 0;
    entries.forEach((e) => {
      if (e.type === "company") companies += 1;
      else ideas += 1;
      if (e.status === "killed" || e.kill_reason) killed += 1;
    });
    return { total: entries.length, companies, ideas, killed };
  }

  function rowButton(path, name, meta, opts) {
    const kind = (opts && opts.kind) || "idea";
    const kill = !!(opts && opts.kill);
    const status = opts && opts.status;
    const mark = kind === "kill" ? "" : statusMark(status);
    return `<button type="button" class="row" data-go="${esc(path)}">
      ${iconTile(kind)}
      <span class="row-text"><span class="name">${t(name)}</span><span class="meta${kill ? " kill" : ""}">${t(meta)}</span></span>
      ${mark}
      ${chevron()}
    </button>`;
  }

  function entryMeta(e) {
    const killed = isKilled(e);
    const code = codeOf(e);
    if (killed) {
      const reason = clip(e.kill_reason || "", 72);
      return { text: joinMeta([rolePhrase(e), reason, code]), kill: true };
    }
    return {
      text: joinMeta([rolePhrase(e), placeLabel(e), statusLabel(e.status), code]),
      kill: false
    };
  }

  function entryPath(route, e) {
    if (route.view === "theme" && route.code) {
      return "/t/" + encodeURIComponent(route.code) + "/e/" + encodeURIComponent(e.id);
    }
    return "/e/" + encodeURIComponent(e.id);
  }

  function renderBuckets(entries, buckets, q) {
    const nq = q.trim().toLowerCase();
    let shown = buckets;
    let entryHits = [];
    if (nq) {
      shown = buckets.filter((b) => bucketHay(b).includes(nq));
      const shownCodes = new Set(shown.map((b) => b.code));
      entryHits = entries.filter((e) => {
        if (e.idea_kind === "theme" || e.idea_kind === "parent_theme") {
          const code = (e.themes || [])[0];
          if (code && shownCodes.has(code)) return false;
        }
        return entryHay(e).includes(nq);
      });
    }
    const groups = [
      ["life", "Life stage", "Big moments in later life."],
      ["theme", "Theme", "Problems in ageing and care."],
      ["other", "Other", "Items that do not sit in a life stage or theme."]
    ];
    let html = "";
    groups.forEach(([key, label, hint]) => {
      const rows = shown.filter((b) => b.group === key);
      if (!rows.length) return;
      html += `<h2 class="section-label">${t(label)}</h2><p class="section-hint">${t(hint)}</p><div class="group">`;
      rows.forEach((b) => {
        const killed = b.status === "killed";
        const kindWord = b.group === "life" ? "Life stage" : b.group === "theme" ? "Theme" : "Group";
        const meta = killed
          ? joinMeta([kindWord, "Researched and dropped", clip(b.summary, 64), b.code])
          : joinMeta([
            kindWord,
            b.count + (b.count === 1 ? " entry" : " entries"),
            statusLabel(b.status),
            b.code
          ]);
        html += rowButton("/t/" + encodeURIComponent(b.code), b.title, meta, {
          kind: b.group === "life" ? "life" : "theme",
          kill: killed,
          status: b.status
        });
      });
      html += "</div>";
    });
    if (entryHits.length) {
      html += `<h2 class="section-label">Matches</h2><p class="section-hint">Names and notes that match your search.</p><div class="group">`;
      entryHits.forEach((e) => {
        const meta = entryMeta(e);
        html += rowButton("/e/" + encodeURIComponent(e.id), displayName(e), meta.text, {
          kind: entryKind(e),
          kill: meta.kill,
          status: e.status
        });
      });
      html += "</div>";
    }
    if (!html) html = `<p class="empty">Nothing in this list matches.</p>`;
    return html;
  }

  function renderThemeList(route, entries, bucket) {
    const kids = entriesFor(entries, route.code);
    const nq = query.trim().toLowerCase();
    const rows = nq ? kids.filter((e) => entryHay(e).includes(nq)) : kids;
    if (!rows.length) return `<p class="empty">Nothing in this list matches.</p>`;
    let html = `<div class="group">`;
    rows.forEach((e) => {
      const meta = entryMeta(e);
      html += rowButton(entryPath(route, e), displayName(e), meta.text, {
        kind: entryKind(e),
        kill: meta.kill,
        status: e.status
      });
    });
    html += "</div>";
    if (nq) {
      html = `<p class="screen-meta">${rows.length} of ${kids.length} match</p>` + html;
    }
    return html;
  }

  function sceneBlocks(scene) {
    if (!scene || typeof scene === "string") {
      return scene ? `<div class="kv"><p class="kicker">Job</p><p>${t(scene)}</p></div>` : "";
    }
    const bits = [
      ["Job", scene.job],
      ["Who sells", scene.seller],
      ["Who pays", scene.payer]
    ].filter((pair) => pair[1]);
    if (!bits.length) return "";
    return bits.map(([k, v]) => `<div class="kv"><p class="kicker">${t(k)}</p><p>${t(v)}</p></div>`).join("");
  }

  function sourcesOf(e) {
    const list = e.deep_dive && Array.isArray(e.deep_dive.sources) ? e.deep_dive.sources : [];
    return list;
  }

  function moreHtml(e) {
    const blocks = [];
    const dive = e.deep_dive || null;
    if (dive && typeof dive === "object") {
      Object.keys(MORE_LABELS).forEach((key) => {
        const val = dive[key];
        if (val == null || val === "") return;
        if (Array.isArray(val)) {
          if (!val.length) return;
          blocks.push(`<h2>${t(MORE_LABELS[key])}</h2><ul>${val.map((item) => `<li>${t(item)}</li>`).join("")}</ul>`);
          return;
        }
        let heading = MORE_LABELS[key];
        if (key === "thesis" && dive.thesis_label) heading += ". " + (String(dive.thesis_label).toLowerCase() === "interpreted" ? "This is our read, not a quote from the company." : nd(dive.thesis_label));
        blocks.push(`<h2>${t(heading)}</h2><p>${t(val)}</p>`);
      });
      if (Array.isArray(dive.thesis_sources) && dive.thesis_sources.length) {
        blocks.push(`<h2>What that read is based on</h2><ul>${dive.thesis_sources.map((item) => `<li>${t(item)}</li>`).join("")}</ul>`);
      }
      const sources = sourcesOf(e);
      if (sources.length) {
        blocks.push(`<h2>Sources</h2><ul>${sources.map((s) => {
          const url = safeUrl(s && s.url);
          const link = url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${t(url)}</a>` : t(s && s.url);
          const note = s && s.note ? " - " + t(s.note) : "";
          const accessed = s && s.accessed ? " (accessed " + t(s.accessed) + ")" : "";
          return `<li>${link}${note}${accessed}</li>`;
        }).join("")}</ul>`);
      }
    }
    if (e.claim && e.claim !== e.summary) blocks.push(`<h2>The question</h2><p>${t(e.claim)}</p>`);
    if (e.expert_role) blocks.push(`<h2>Who should pressure-test it</h2><p>${t(e.expert_role)}</p>`);
    if (e.killer_experiment) blocks.push(`<h2>The test that would drop it</h2><p>${t(e.killer_experiment)}</p>`);
    if (e.menu_disposition) blocks.push(`<h2>Our call</h2><p>${t(callLabel(e.menu_disposition))}</p>`);
    if (e.status_raw) blocks.push(`<h2>Note</h2><p>${t(e.status_raw)}</p>`);
    if (e.source_scan) blocks.push(`<h2>Where we found it</h2><p>${t(e.source_scan)}</p>`);
    if (e.idea_kind) blocks.push(`<h2>What this is</h2><p>${t(kindLabel(e.idea_kind))}</p>`);
    const related = (e.related || []).map((id) => findEntry(indexData.entries, id)).filter(Boolean);
    if (related.length) {
      blocks.push(`<h2>Related</h2>` + related.map((r) => {
        const meta = entryMeta(r);
        return rowButton("/e/" + encodeURIComponent(r.id), displayName(r), meta.text, {
          kind: entryKind(r),
          kill: meta.kill,
          status: r.status
        });
      }).join(""));
    }
    return blocks.join("");
  }

  function renderDetail(route, entries) {
    const e = findEntry(entries, route.id);
    if (!e) return `<p class="empty">That item is not in the list.</p>`;
    const killed = isKilled(e);
    const place = [placeLabel(e), e.city].filter(Boolean).join(", ");
    const gloss = STATUS_GLOSS[e.status] || (killed ? STATUS_GLOSS.killed : "");
    const headMeta = joinMeta([rolePhrase(e) + (gloss ? ". " + gloss : ""), place, codeOf(e)]);
    const shownName = displayName(e);
    const summaryRaw = e.summary || e.claim || "";
    const sameAsTitle = nd(summaryRaw).trim() === nd(shownName).trim();
    const sameAsKill = e.kill_reason && nd(summaryRaw).trim() === nd(e.kill_reason).trim();
    const summary = (sameAsTitle || sameAsKill) ? "" : summaryRaw;
    const scene = sceneBlocks(e.scene);
    const web = safeUrl(e.website);
    let host = "";
    if (web) {
      try { host = new URL(web).host; } catch (err) { host = web; }
    }
    const sources = sourcesOf(e);
    const first = sources[0];
    const firstUrl = first ? safeUrl(first.url) : "";
    const extra = moreHtml(e);
    let html = `<article class="detail">
      <div class="detail-head">
        ${iconTile(entryKind(e))}
        <div>
          <h1>${t(shownName)}</h1>
          <p class="screen-meta${killed ? " kill" : ""}">${t(headMeta)}</p>
        </div>
      </div>
      ${summary ? `<p class="summary">${t(summary)}</p>` : ""}`;
    if (scene) html += `<div class="group">${scene}</div>`;
    if (web) {
      html += `<div class="group"><a class="row" href="${esc(web)}" target="_blank" rel="noopener">
        ${iconTile("link")}
        <span class="row-text"><span class="name">Website</span><span class="meta">${t(host)}</span></span>
        ${chevron()}
      </a></div>`;
    }
    if (killed) {
      html += `<div class="group killbox"><div class="pad">
        <p class="kicker">Why we killed it</p>
        <p class="killtext">${t(e.kill_reason || "We researched it and dropped it.")}</p>
        ${e.kill_source ? `<p class="meta">Where we wrote that down: ${t(e.kill_source)}</p>` : ""}
      </div></div>`;
    }
    if (sources.length || e.source_scan) {
      html += `<div class="group"><div class="pad"><p class="kicker">Sources</p>`;
      if (sources.length) {
        html += `<p>${sources.length} ${sources.length === 1 ? "source" : "sources"}</p>`;
        if (firstUrl) html += `<a class="src-link" href="${esc(firstUrl)}" target="_blank" rel="noopener">${t(first.url)}</a>`;
        else if (first && first.url) html += `<p>${t(first.url)}</p>`;
        if (first && first.note) html += `<p class="meta">${t(first.note)}</p>`;
      } else {
        html += `<p>${t(e.source_scan)}</p>`;
      }
      html += `</div></div>`;
    }
    if (extra) {
      html += `<div class="group">
        <button type="button" class="row more" data-more aria-expanded="${moreOpen ? "true" : "false"}">
          ${iconTile("note")}
          <span class="row-text"><span class="name">${moreOpen ? "Hide the full note" : "Read the full note"}</span></span>
          ${chevron()}
        </button>
        ${moreOpen ? `<div class="more-panel">${extra}</div>` : ""}
      </div>`;
    }
    html += `</article>`;
    return html;
  }

  function crumbHtml(route, entries) {
    if (route.view === "root") {
      return `<p class="crumb home"><span class="here">Who Cares</span></p>`;
    }
    const parts = [{ label: "Who Cares", path: "/" }];
    let code = route.code;
    if (route.view === "entry" && !code) {
      const entry = findEntry(entries, route.id);
      code = primaryCode(entry);
    }
    if (code) {
      const cards = themeCards(entries);
      parts.push({
        label: themeTitle(code, cards.get(code) || null),
        path: "/t/" + encodeURIComponent(code)
      });
    }
    if (route.view === "entry") {
      const entry = findEntry(entries, route.id);
      const label = entry ? displayName(entry) : "Entry";
      parts.push({ label: label.length > 36 ? clip(label, 32) : label, path: "" });
    }
    const last = parts.length - 1;
    return `<p class="crumb">${parts.map((p, i) => {
      const sep = i === 0 ? "" : `<span class="sep">/</span>`;
      if (i === last || !p.path) return sep + `<span class="here">${t(p.label)}</span>`;
      return sep + `<button type="button" data-go="${esc(p.path)}">${t(p.label)}</button>`;
    }).join("")}</p>`;
  }

  function render(scroll) {
    if (!indexData) return;
    const entries = indexData.entries || [];
    const route = routeNow();
    const buckets = buildBuckets(entries);
    const bucket = buckets.find((b) => b.code === route.code) || null;

    backBtn.hidden = route.view === "root";
    searchWrap.hidden = route.view === "entry";
    crumbEl.innerHTML = crumbHtml(route, entries);

    let title = "Who Cares";
    let intro = "";
    let body = "";
    if (route.view === "root") {
      const c = countsOf(entries);
      intro = `<div class="intro">
        <p class="lede">A public list of companies and ideas in ageing and care, including the ones we researched and dropped.</p>
        <p class="counts">${c.total} in the list · ${c.companies} companies · ${c.ideas} ideas · ${c.killed} dropped</p>
      </div>`;
      body = renderBuckets(entries, buckets, query);
    } else if (route.view === "theme") {
      if (!bucket) {
        title = "Who Cares";
        body = `<p class="empty">That item is not in the list.</p>`;
      } else {
        title = bucket.title + " - Who Cares";
        const killed = bucket.status === "killed";
        const level = bucket.group === "life" ? "Life stage" : "Theme";
        const themeMeta = joinMeta([
          level,
          bucket.count + (bucket.count === 1 ? " entry" : " entries"),
          killed ? "Researched and dropped" : statusLabel(bucket.status),
          bucket.code
        ]);
        const reason = killed ? clip(bucket.summary, 160) : "";
        intro = "";
        body = `<div class="screen-head">
            ${iconTile(bucket.group === "life" ? "life" : "theme")}
            <div>
              <h1 class="screen-title">${t(bucket.title)}</h1>
              <p class="screen-meta${killed ? " kill" : ""}">${t(themeMeta)}</p>
            </div>
            ${statusMark(bucket.status)}
          </div>
          ${reason ? `<p class="screen-reason">${t(reason)}</p>` : ""}`
          + renderThemeList(route, entries);
      }
    } else {
      const entry = findEntry(entries, route.id);
      title = (entry ? nd(entry.name) : "Entry") + " - Who Cares";
      body = renderDetail(route, entries);
    }
    document.title = title;
    if (introEl) introEl.innerHTML = intro;
    main.innerHTML = body;
    if (scroll) window.scrollTo(0, 0);
  }

  if (backBtn) backBtn.addEventListener("click", back);
  if (searchEl) {
    searchEl.addEventListener("input", () => {
      query = searchEl.value || "";
      render(false);
    });
  }
  if (app) {
    app.addEventListener("click", (ev) => {
      const more = ev.target.closest("[data-more]");
      if (more) {
        moreOpen = !moreOpen;
        render(false);
        return;
      }
      const dest = ev.target.closest("[data-go]");
      if (!dest) return;
      ev.preventDefault();
      go(dest.getAttribute("data-go"));
    });
  }
  window.addEventListener("popstate", () => {
    const stateDepth = history.state && typeof history.state.depth === "number" ? history.state.depth : 0;
    depth = stateDepth;
    query = "";
    if (searchEl) searchEl.value = "";
    moreOpen = false;
    render(true);
  });

  document.addEventListener("DOMContentLoaded", () => {
    if (!app) return;
    const hash = location.hash;
    if (!hash || hash === "#") history.replaceState({ wc: 1, depth: 0 }, "", "#/");
    else history.replaceState({ wc: 1, depth: 0 }, "", hash);
    loadIndex().then((data) => {
      indexData = data;
      if (boot) boot.hidden = true;
      render(false);
    }).catch(() => {
      if (boot) boot.textContent = "We could not load the list. Try again in a moment.";
    });
  });
})();
