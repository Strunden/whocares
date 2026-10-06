/* Who Cares flat index.
   One list of published entries. Search and tag chips filter it.
   API_BASE /api/index, then data/index.json. */
(function () {
  const TAGS = [
    "Health and medicines",
    "Safety and falls",
    "Memory and dementia",
    "Loneliness and connection",
    "Daily life and getting around",
    "Home and housing",
    "Family caregivers",
    "Care staff and services",
    "Money and retirement",
    "End of life and inheritance"
  ];
  const GLYPH = {
    company: '<path d="M4 20V9l8-5 8 5v11"/><path d="M10 20v-5h4v5M9 11h.01M15 11h.01M9 14.5h.01M15 14.5h.01"/>',
    idea: '<path d="M9 18h6M10 21h4"/><path d="M12 3a5.5 5.5 0 0 1 3.6 9.6V16H8.4v-3.4A5.5 5.5 0 0 1 12 3z"/>',
    kill: '<circle cx="12" cy="12" r="8"/><path d="M9 9l6 6M15 9l-6 6"/>',
    link: '<path d="M14 5h5v5"/><path d="M10 14L19 5"/><path d="M17 13v6H5V7h6"/>',
    note: '<path d="M7 4h7l4 4v12H7V4z"/><path d="M14 4v4h4M9 12h6M9 16h4"/>'
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
      .replace(/\u2014/g, ", ")
      .replace(/\u2013/g, "-")
      .replace(/—/g, ", ")
      .replace(/–/g, "-");
  }
  function t(s) { return esc(nd(s)); }
  function cleanProse(s) {
    let v = nd(s).replace(/\b[\w.-]+\.md\b/gi, "");
    v = v.replace(/\b[PT]\d{2}(?:-H\d+)?\b/g, "");
    v = v.replace(/\s+/g, " ").replace(/\s+([,.;:])/g, "$1").trim();
    return v;
  }
  function isJunk(s) {
    const v = cleanProse(s).toLowerCase();
    if (!v) return true;
    if (v.replace(/\.+$/, "").trim() === "used by older adults") return true;
    if (/^it is a seniors\b/.test(v)) return true;
    return /not found|hypothetical|fetch fail|deep dive pending|http\s*404|domain for sale|see card|see theme|pickable-menu|thesis-cards|stressed, still|europe\/berlin/.test(v);
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
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPH[name] || GLYPH.idea}</svg>`;
  }
  function iconTile(kind) {
    return `<span class="ico ico-${kind}">${svgIcon(kind)}</span>`;
  }
  function isKilled(e) {
    return !!(e && (e.status === "killed" || e.kill_reason || e.why_dropped));
  }
  function isPublished(e) {
    return !!(e && e.published !== false);
  }
  function displayTitle(e) {
    const title = nd(e.title || "").trim();
    if (title) return title;
    const name = nd(e.name || "Untitled").trim();
    const prefixed = name.match(/^(?:P\d+|T\d+):\s*(.+)$/i);
    if (prefixed && prefixed[1]) return prefixed[1].trim();
    return name;
  }
  function displaySummary(e) {
    const s = cleanProse(e.summary || "");
    if (!s || isJunk(s)) return "";
    return s;
  }
  const COUNTRY_NAMES = {
    AE: "United Arab Emirates", AR: "Argentina", AT: "Austria", AU: "Australia",
    BE: "Belgium", BG: "Bulgaria", BR: "Brazil", CA: "Canada", CH: "Switzerland",
    CL: "Chile", CN: "China", CY: "Cyprus", CZ: "Czechia", DE: "Germany",
    DK: "Denmark", EE: "Estonia", ES: "Spain", FI: "Finland", FR: "France",
    GB: "United Kingdom", GR: "Greece", HK: "Hong Kong", HR: "Croatia",
    HU: "Hungary", IE: "Ireland", IL: "Israel", IN: "India", IS: "Iceland",
    IT: "Italy", JP: "Japan", KR: "South Korea", LT: "Lithuania", LU: "Luxembourg",
    LV: "Latvia", MT: "Malta", MX: "Mexico", NL: "Netherlands", NO: "Norway",
    NZ: "New Zealand", PL: "Poland", PT: "Portugal", RO: "Romania", SE: "Sweden",
    SG: "Singapore", SI: "Slovenia", SK: "Slovakia", US: "United States",
    ZA: "South Africa",
    UK: "United Kingdom",
    EU: "Europe"
  };
  const FUNDER_KINDS = {
    vc: "Venture fund",
    evergreen_or_listed: "Evergreen or listed",
    corporate_vc: "Corporate venture fund",
    angel_network: "Angel network",
    public_fund_of_funds: "Public fund of funds",
    public_direct: "Public fund",
    grant_programme: "Grant programme",
    payer_insurer: "Payer or insurer",
    foundation: "Foundation",
    other: "Other"
  };
  const RELATIONS = {
    equity_round: "Equity round",
    lead_investor: "Lead investor",
    grant: "Grant",
    reimbursement_listing: "Reimbursement listing",
    debt: "Debt",
    acquisition: "Acquisition"
  };
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function countryInfo(e) {
    if (!e || e.type !== "company" || !e.facts || typeof e.facts !== "object") return null;
    const fact = e.facts.country;
    if (!fact || typeof fact !== "object") return null;
    const code = String(fact.code || "").trim().toUpperCase();
    const name = COUNTRY_NAMES[code];
    if (!name || !safeUrl(fact.source)) return null;
    const emoji = String.fromCodePoint(...code.split("").map((ch) => 0x1F1E6 + ch.charCodeAt(0) - 65));
    return { code, name, source: safeUrl(fact.source), emoji };
  }
  function kindLabel(kind) {
    if (FUNDER_KINDS[kind]) return FUNDER_KINDS[kind];
    const words = String(kind || "").replace(/[_-]+/g, " ").trim();
    if (!words) return "";
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
  function countryLabel(code) {
    const key = String(code || "").trim().toUpperCase();
    if (!key) return "";
    return COUNTRY_NAMES[key] || key;
  }
  function relationLabel(relation) {
    return RELATIONS[relation] || "";
  }
  function formatDate(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    if (!match) return "";
    const month = MONTHS[Number(match[2]) - 1];
    if (!month) return "";
    return Number(match[3]) + " " + month + " " + match[1];
  }
  function formatEur(amount) {
    if (amount == null || amount === "") return "";
    const n = Number(amount);
    if (!Number.isFinite(n)) return "";
    const whole = Math.round(n * 100) === n * 100 && Math.round(n) === n;
    const formatted = whole
      ? Math.round(n).toLocaleString("en-GB")
      : n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return "€" + formatted;
  }
  function backedLabel(n) {
    const count = Number(n);
    const value = Number.isFinite(count) ? count : 0;
    return value === 1 ? "1 company" : value + " companies";
  }
  function flagMark(info) {
    if (!info) return "";
    return `<span class="flag" role="img" aria-label="${esc(info.name)}">${info.emoji}</span>`;
  }
  function entryTags(e) {
    return [e.tag, e.tag_secondary].filter(Boolean);
  }
  const CLOSED_STATES = { dissolved: 1, liquidation: 1, shut_down: 1, acquired_and_shut: 1 };
  function closedInfo(e) {
    const closed = e && e.closed;
    if (!closed || typeof closed !== "object" || !CLOSED_STATES[closed.state]) return null;
    const text = cleanProse(closed.text || "");
    const source = safeUrl(closed.source);
    if (!text || !source) return null;
    return { state: closed.state, text, source };
  }
  function closedPill() {
    return `<span class="closed-pill">Closed</span>`;
  }
  function logoSrc(e) {
    const logo = String(e && e.logo || "");
    if (!logo || isKilled(e) || e.type === "idea") return "";
    if (/^https?:\/\//i.test(logo)) return logo;
    if (logo.startsWith("/api/")) {
      const base = apiBase();
      return base ? base + logo : "";
    }
    return "";
  }
  function initialsOf(e) {
    const parts = displayTitle(e).replace(/&/g, " and ").split(/[^A-Za-z0-9]+/).filter(Boolean);
    if (!parts.length) return "";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  function initialsTile(e) {
    return `<span class="ico ico-initials">${t(initialsOf(e))}</span>`;
  }
  function rowIcon(e) {
    if (isKilled(e)) return iconTile("kill");
    if (e.type === "idea") return iconTile("idea");
    const src = logoSrc(e);
    if (src) return `<span class="ico ico-logo" data-initials="${esc(initialsOf(e))}"><img src="${esc(src)}" alt="" crossorigin="anonymous"></span>`;
    return iconTile("company");
  }
  function logoIsBlank(img) {
    try {
      const canvas = document.createElement("canvas");
      const size = 16;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      let n = 0;
      let sum = 0;
      let sum2 = 0;
      let white = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 20) continue;
        const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
        n += 1;
        sum += lum;
        sum2 += lum * lum;
        if (data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245) white += 1;
      }
      if (!n) return true;
      const mean = sum / n;
      const sd = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
      return sd < 12 || white / n > 0.9;
    } catch (err) {
      return false;
    }
  }
  function useInitials(img) {
    const slot = img.closest(".ico-logo");
    if (!slot || slot.dataset.replaced === "1") return;
    slot.dataset.replaced = "1";
    const tile = document.createElement("span");
    tile.className = "ico ico-initials";
    tile.textContent = slot.getAttribute("data-initials") || "";
    slot.replaceWith(tile);
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
  async function loadFunders() {
    const base = apiBase();
    if (!base) {
      fundersState = "error";
      return;
    }
    try {
      const res = await fetch(`${base}/api/funders`, { cache: "no-store" });
      if (!res.ok) throw new Error("funders");
      const data = await res.json();
      funders = Array.isArray(data.funders) ? data.funders : [];
      fundersState = "ready";
    } catch (err) {
      funders = [];
      fundersState = "error";
    }
    if (routeNow().view === "root") render("keep");
  }
  function ensureFunder(id) {
    if (Object.prototype.hasOwnProperty.call(funderDetails, id) || funderLoads[id]) return;
    funderLoads[id] = true;
    const base = apiBase();
    if (!base) {
      funderDetails[id] = { error: true };
      funderLoads[id] = false;
      return;
    }
    fetch(`${base}/api/funders/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("funder");
        return res.json();
      })
      .then((detail) => {
        funderDetails[id] = detail;
        funderLoads[id] = false;
        if (routeNow().view === "funder" && routeNow().id === id) render("keep");
      })
      .catch(() => {
        funderDetails[id] = { error: true };
        funderLoads[id] = false;
        if (routeNow().view === "funder" && routeNow().id === id) render("keep");
      });
  }

  function parseHash() {
    let raw = (location.hash || "#/").replace(/^#/, "");
    if (!raw) raw = "/";
    try { raw = decodeURIComponent(raw); } catch (err) { /* keep raw */ }
    if (!raw.startsWith("/")) raw = "/" + raw;
    const bits = raw.split("/").filter(Boolean);
    if (bits[0] === "f" && bits[1]) return { view: "funder", id: bits.slice(1).join("/") };
    const at = bits.indexOf("e");
    if (at >= 0 && bits[at + 1]) return { view: "entry", id: bits.slice(at + 1).join("/") };
    return { view: "root", id: "" };
  }
  function findEntry(entries, id) {
    return entries.find((e) => e.id === id) || null;
  }

  let indexData = null;
  let funders = [];
  let fundersState = "loading";
  const funderDetails = {};
  const funderLoads = {};
  let depth = 0;
  let query = "";
  let tagFilter = "";
  let listScroll = 0;

  const app = document.getElementById("app");
  const boot = document.getElementById("boot");
  const main = document.getElementById("main");
  const introEl = document.getElementById("intro");
  const crumbEl = document.getElementById("crumb");
  const backBtn = document.getElementById("back");
  const searchWrap = document.getElementById("search-wrap");
  const searchEl = document.getElementById("search");
  const tagsEl = document.getElementById("tags");
  const scroller = document.getElementById("scroller");
  const barTop = document.querySelector(".bar-top");

  function scrollPos() {
    return scroller ? scroller.scrollTop : window.scrollY;
  }
  function setScroll(y) {
    if (scroller) scroller.scrollTop = y || 0;
    else window.scrollTo(0, y || 0);
  }
  function countLabel(n) {
    if (n < 0) return "";
    return n === 1 ? "1 result" : n + " results";
  }

  function routeNow() { return parseHash(); }

  function go(path) {
    const next = path.startsWith("#") ? path : "#" + path;
    if ((location.hash || "#/") === next) return;
    if (routeNow().view === "root") listScroll = scrollPos();
    depth += 1;
    history.pushState({ wc: 1, depth }, "", next);
    render(routeNow().view === "entry" ? "top" : "restore");
  }
  function back() {
    if (routeNow().view === "root") return;
    if (depth > 0) {
      history.back();
      return;
    }
    history.replaceState({ wc: 1, depth: 0 }, "", "#/");
    render("restore");
  }

  function publishedEntries() {
    return (indexData.entries || []).filter(isPublished);
  }
  function sortRank(e) {
    if (isKilled(e)) return 2;
    if (e.type === "company") return 0;
    return 1;
  }
  function sortEntries(list) {
    return list.slice().sort((a, b) => {
      const ra = sortRank(a);
      const rb = sortRank(b);
      if (ra !== rb) return ra - rb;
      return displayTitle(a).localeCompare(displayTitle(b), undefined, { numeric: true, sensitivity: "base" });
    });
  }
  function matchesQuery(e, q) {
    if (!q) return true;
    const hay = nd([displayTitle(e), e.name, displaySummary(e), e.job].join(" ")).toLowerCase();
    return hay.includes(q);
  }
  function matchesTag(e) {
    if (!tagFilter) return true;
    if (tagFilter === "Closed") return !!closedInfo(e);
    return entryTags(e).indexOf(tagFilter) !== -1;
  }

  function rowButton(e) {
    const summary = displaySummary(e);
    const closed = closedInfo(e);
    return `<button type="button" class="row" data-go="/e/${esc(encodeURIComponent(e.id))}">
      ${rowIcon(e)}
      <span class="row-text"><span class="name">${t(displayTitle(e))}${flagMark(countryInfo(e))}${closed ? closedPill() : ""}</span>${summary ? `<span class="meta">${t(summary)}</span>` : ""}</span>
      ${chevron()}
    </button>`;
  }

  function sceneValue(e, key, top) {
    if (e[top]) return e[top];
    const scene = e.scene;
    if (scene && typeof scene === "object" && scene[key]) return scene[key];
    return "";
  }
  function canonicalUrl(u) {
    const trimmed = String(u || "").replace(/\s*\(accessed[^)]*\)\s*$/i, "").trim();
    const raw = safeUrl(trimmed);
    if (!raw) return "";
    try {
      const url = new URL(raw);
      url.hash = "";
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      const path = url.pathname.replace(/\/+$/, "");
      return url.protocol.toLowerCase() + "//" + host + path + url.search;
    } catch (err) {
      return "";
    }
  }
  function sourceLabel(url, note) {
    const title = cleanProse(note || "");
    if (title && !isJunk(title) && !/^https?:/i.test(title) && title.length <= 80 && !/\.md\b/i.test(title)) return title;
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch (err) {
      return "";
    }
  }
  function sourcesOf(e) {
    const list = e.deep_dive && Array.isArray(e.deep_dive.sources) ? e.deep_dive.sources : [];
    const urls = [];
    const seen = new Set();
    const home = canonicalUrl(e.website);
    function push(raw, note) {
      const key = canonicalUrl(raw);
      if (!key || seen.has(key) || (home && key === home)) return;
      seen.add(key);
      const label = sourceLabel(key, note);
      if (!label) return;
      urls.push({ url: key, label: label });
    }
    list.forEach((s) => push(s && s.url, s && s.note));
    const extra = e.deep_dive && Array.isArray(e.deep_dive.thesis_sources) ? e.deep_dive.thesis_sources : [];
    extra.forEach((item) => push(item, ""));
    return urls;
  }
  const JOB_STOP = new Set("a an the and or of to for with in on at by from that this it its is are be as their them they who into over per via your our can help helps people older care aging ageing".split(" "));

  function jobTokens(s) {
    return new Set(
      nd(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !JOB_STOP.has(w))
    );
  }

  function similarEntries(e) {
    if (!e || e.type !== "company" || !e.tag) return [];
    const mine = jobTokens(e.job || e.summary || "");
    if (!mine.size) return [];
    const scored = publishedEntries()
      .filter((other) => other && other.id !== e.id && other.tag === e.tag)
      .map((other) => {
        const theirs = jobTokens(other.job || other.summary || "");
        let overlap = 0;
        mine.forEach((word) => {
          if (theirs.has(word)) overlap += 1;
        });
        return { other, overlap };
      })
      .filter((item) => item.overlap >= 2);
    scored.sort((a, b) => b.overlap - a.overlap || displayTitle(a.other).localeCompare(displayTitle(b.other)));
    const picked = scored.slice(0, 5).map((item) => item.other);
    return picked.length >= 3 ? picked : [];
  }

  function factLink(url, label) {
    const href = safeUrl(url);
    if (!href) return "";
    return `<a href="${esc(href)}" target="_blank" rel="noopener">${t(label)}</a>`;
  }

  function sourceLink(url) {
    const href = safeUrl(url);
    if (!href) return "";
    return ` <a class="fact-src" href="${esc(href)}" target="_blank" rel="noopener">Source</a>`;
  }

  function plainFact(value) {
    const text = cleanProse(value);
    if (!text || isJunk(text) || /unknown/i.test(text)) return "";
    return text;
  }

  function factsCard(e) {
    if (!e || e.type !== "company" || !e.facts || typeof e.facts !== "object") return "";
    const facts = e.facts;
    const rows = [];
    const founded = facts.founded;
    if (founded && /^(19|20)\d{2}$/.test(String(founded.year || "")) && safeUrl(founded.source)) {
      rows.push(`<div class="kv"><p class="kicker">Founded</p><p>${t(String(founded.year))}${sourceLink(founded.source)}</p></div>`);
    }
    const hq = facts.hq;
    const city = hq ? plainFact(hq.city) : "";
    const origin = countryInfo(e);
    const flag = flagMark(origin);
    if (city && hq && safeUrl(hq.source)) {
      const links = [sourceLink(hq.source)];
      if (origin && origin.source !== safeUrl(hq.source)) links.push(sourceLink(origin.source));
      rows.push(`<div class="kv"><p class="kicker">Headquarters</p><p>${t(city)}${flag}${links.join("")}</p></div>`);
    } else if (origin) {
      rows.push(`<div class="kv"><p class="kicker">Headquarters</p><p>${t(origin.name)}${flag}${sourceLink(origin.source)}</p></div>`);
    }
    const founders = Array.isArray(facts.founders) ? facts.founders.filter((person) => person && plainFact(person.name) && safeUrl(person.source)) : [];
    if (founders.length) {
      const names = founders.map((person) => {
        const name = plainFact(person.name);
        const linkedin = safeUrl(person.linkedin);
        return linkedin ? factLink(linkedin, name) : t(name);
      }).join(", ");
      const sources = [];
      founders.forEach((person) => {
        const href = safeUrl(person.source);
        if (href && sources.indexOf(href) === -1) sources.push(href);
      });
      const directors = founders.every((person) => /managing director|geschäftsführer/i.test(person.role || ""));
      const peopleLabel = directors ? "Managing directors" : "Founders";
      rows.push(`<div class="kv"><p class="kicker">${peopleLabel}</p><p>${names}${sources.map(sourceLink).join("")}</p></div>`);
    }
    const funding = facts.funding && typeof facts.funding === "object" ? facts.funding : null;
    if (funding) {
      const bits = [];
      const total = funding.total;
      const totalAmount = total ? plainFact(total.amount) : "";
      if (totalAmount && safeUrl(total.source)) {
        const stated = /grant|round|series/i.test(totalAmount) ? t(totalAmount) : t(totalAmount) + " total";
        bits.push(stated + sourceLink(total.source));
      }
      const round = funding.last_round;
      const roundAmount = round ? plainFact(round.amount) : "";
      if (roundAmount && safeUrl(round.source)) {
        const when = plainFact(round.date);
        bits.push(`Last round ${t(roundAmount)}${when ? " in " + t(when) : ""}${sourceLink(round.source)}`);
      }
      if (bits.length) rows.push(`<div class="kv"><p class="kicker">Funding</p><p>${bits.join(". ")}</p></div>`);
    }
    const investors = Array.isArray(facts.investors) ? facts.investors.filter((item) => item && plainFact(item.name) && safeUrl(item.source)) : [];
    if (investors.length) {
      const names = investors.map((item) => t(plainFact(item.name))).join(", ");
      const sources = [];
      investors.forEach((item) => {
        const href = safeUrl(item.source);
        if (href && sources.indexOf(href) === -1) sources.push(href);
      });
      rows.push(`<div class="kv"><p class="kicker">Investors</p><p>${names}${sources.map(sourceLink).join("")}</p></div>`);
    }
    const model = facts.model;
    const modelText = model ? plainFact(model.text) : "";
    if (modelText && model && safeUrl(model.source)) {
      rows.push(`<div class="kv"><p class="kicker">Pricing</p><p>${t(modelText)}${sourceLink(model.source)}</p></div>`);
    }
    const apps = Array.isArray(facts.apps) ? facts.apps.filter((app) => app && plainFact(app.name) && safeUrl(app.url)) : [];
    if (apps.length) {
      const links = apps.map((app) => factLink(app.url, plainFact(app.name))).join(", ");
      rows.push(`<div class="kv"><p class="kicker">Apps</p><p>${links}</p></div>`);
    }
    if (!rows.length) return "";
    return `<div class="group">${rows.join("")}</div>`;
  }

  function sectionText(block) {
    if (!block) return "";
    if (typeof block === "string") return plainFact(block);
    return plainFact(block.text || "");
  }
  function quoteText(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }
  function sourceItems(raw) {
    const list = Array.isArray(raw) ? raw : [];
    const byUrl = new Map();
    list.forEach((item) => {
      const href = safeUrl(typeof item === "string" ? item : (item && item.url));
      if (!href) return;
      if (!byUrl.has(href)) byUrl.set(href, []);
      const quote = item && typeof item === "object" ? quoteText(item.quote) : "";
      const quotes = byUrl.get(href);
      if (quote && quotes.indexOf(quote) === -1) quotes.push(quote);
    });
    const out = [];
    byUrl.forEach((quotes, url) => out.push({ url, quotes }));
    return out;
  }
  function writeupSection(label, block) {
    const text = sectionText(block);
    if (!text) return null;
    return { label, text, sources: sourceItems(block && block.sources) };
  }
  function writeupApproved(e) {
    const qa = e && e.writeup_qa;
    return !!(qa && qa.pass === true);
  }
  function sectionHeading(key) {
    const known = {
      problem: "Problem",
      evidence: "Evidence",
      who_would_pay: "Who would pay",
      who_pays: "Who would pay",
      closest_companies: "Closest companies",
      closest_existing_companies: "Closest companies",
      closest: "Closest companies"
    };
    if (known[key]) return known[key];
    const words = String(key || "").replace(/[_-]+/g, " ").trim();
    if (!words) return "";
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
  function claimText(item) {
    if (item == null) return "";
    if (typeof item === "string") return plainFact(item);
    if (typeof item !== "object") return "";
    return plainFact(item.claim || item.text || item.difference || "");
  }
  function claimBlocks(value) {
    const list = Array.isArray(value) ? value : [value];
    return list.map((item) => {
      const text = claimText(item);
      if (!text) return null;
      const sources = sourceItems(item && typeof item === "object" ? item.sources : []);
      return { text, sources };
    }).filter(Boolean);
  }
  function proseOrItems(label, value) {
    const items = claimBlocks(value);
    if (!items.length || !label) return null;
    if (!Array.isArray(value) && items.length === 1) {
      return { kind: "prose", label, text: items[0].text, sources: items[0].sources };
    }
    return { kind: "items", label, items };
  }
  function publishedById(id) {
    const want = String(id || "").trim();
    if (!want) return null;
    return publishedEntries().find((entry) => entry.id === want || entry.id === "company-" + want) || null;
  }
  function publishedByName(name) {
    const want = nd(name || "").trim().toLowerCase();
    if (!want) return null;
    return publishedEntries().find((entry) => {
      return nd(entry.name || "").trim().toLowerCase() === want || nd(entry.title || "").trim().toLowerCase() === want;
    }) || null;
  }
  function closestCompany(item) {
    if (!item || typeof item !== "object") return null;
    const name = plainFact(item.name || item.title || "");
    if (!name) return null;
    const entry = publishedById(item.id || item.entry_id) || publishedByName(name);
    const note = plainFact(item.text || item.difference || item.claim || "");
    const shown = note && note.toLowerCase() !== name.toLowerCase() ? note : "";
    if (entry) {
      return { name, internal: "/e/" + encodeURIComponent(entry.id), note: shown };
    }
    const href = safeUrl(item.website || item.url);
    if (!href) return null;
    return { name, external: href, note: shown };
  }
  function closestBlock(value) {
    const list = Array.isArray(value) ? value : (value && typeof value === "object" ? [value] : []);
    const companies = list.map(closestCompany).filter(Boolean);
    if (!companies.length) return null;
    return { kind: "companies", label: "Closest companies", companies };
  }
  function ideaBlocks(writeup) {
    const blocks = [];
    const used = {};
    function mark(key) { used[key] = true; }
    ["problem", "evidence", "who_would_pay"].forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(writeup, key)) return;
      mark(key);
      const block = proseOrItems(sectionHeading(key), writeup[key]);
      if (block) blocks.push(block);
    });
    if (!used.who_would_pay && Object.prototype.hasOwnProperty.call(writeup, "who_pays")) {
      mark("who_pays");
      const block = proseOrItems("Who would pay", writeup.who_pays);
      if (block) blocks.push(block);
    }
    ["closest_companies", "closest_existing_companies", "closest"].forEach((key) => {
      if (used.closest || !Object.prototype.hasOwnProperty.call(writeup, key)) return;
      const block = closestBlock(writeup[key]);
      if (!block) return;
      mark(key);
      mark("closest");
      blocks.push(block);
    });
    Object.keys(writeup).forEach((key) => {
      if (used[key]) return;
      mark(key);
      const value = writeup[key];
      if (value == null || typeof value === "boolean" || typeof value === "number") return;
      const block = proseOrItems(sectionHeading(key), value);
      if (block) blocks.push(block);
    });
    return blocks;
  }
  function writeupBlocks(e) {
    if (!writeupApproved(e)) return [];
    const writeup = e && e.writeup && typeof e.writeup === "object" ? e.writeup : null;
    if (!writeup) return [];
    if (e.type === "idea") return ideaBlocks(writeup);
    const comps = Array.isArray(writeup.competitors) ? writeup.competitors : [];
    const compText = comps.map((item) => sectionText(item && item.difference ? { text: item.difference } : item)).filter(Boolean).slice(0, 3).join(" ");
    const compSources = comps.reduce((all, item) => all.concat((item && item.sources) || []), []);
    const competitorBlock = compText ? { text: compText, sources: compSources } : null;
    return [
      writeupSection("What it does", writeup.what_it_does),
      writeupSection("Competitors", competitorBlock),
      writeupSection("Who pays", writeup.who_pays),
      writeupSection("Traction", writeup.traction),
      writeupSection("Why it's interesting", writeup.why_interesting),
      writeupSection("Status", writeup.status)
    ].filter(Boolean);
  }
  function sourceCite(source) {
    const href = safeUrl(source && source.url);
    if (!href) return "";
    const link = `<a class="fact-src" href="${esc(href)}" target="_blank" rel="noopener">Source</a>`;
    const quotes = source.quotes || [];
    if (!quotes.length) return link;
    const lines = quotes.map((quote) => `<q>${esc(quote)}</q>`).join("");
    return `<span class="src-pair">${link} <details class="src-quote"><summary>quote</summary>${lines}</details></span>`;
  }
  function sourceRow(sources) {
    const cites = (sources || []).map(sourceCite).filter(Boolean).join(" ");
    return cites ? `<div class="src-row">${cites}</div>` : "";
  }
  function writeupCard(e) {
    const blocks = writeupBlocks(e);
    if (!blocks.length) return "";
    return `<div class="analysis">${blocks.map((block) => {
      if (block.kind === "items") {
        const body = block.items.map((item) => `<div class="claim"><p>${t(item.text)}</p>${sourceRow(item.sources)}</div>`).join("");
        return `<section><h2>${t(block.label)}</h2>${body}</section>`;
      }
      if (block.kind === "companies") {
        const body = block.companies.map((company) => {
          const name = t(company.name);
          const link = company.internal
            ? `<button type="button" class="co-link" data-go="${esc(company.internal)}">${name}</button>`
            : `<a class="co-link" href="${esc(company.external)}" target="_blank" rel="noopener">${name}</a>`;
          const note = company.note ? `<p>${t(company.note)}</p>` : "";
          return `<li>${link}${note}</li>`;
        }).join("");
        return `<section><h2>${t(block.label)}</h2><ul class="co-list">${body}</ul></section>`;
      }
      return `<section><h2>${t(block.label)}</h2><p>${t(block.text)}</p>${sourceRow(block.sources)}</section>`;
    }).join("")}</div>`;
  }

  function factUrl(fact) {
    if (!fact) return "";
    if (typeof fact === "string") return safeUrl(fact);
    if (typeof fact === "object") return safeUrl(fact.url || "");
    return "";
  }
  function profileHref(fact, hostSuffix, pathPart) {
    const href = factUrl(fact);
    if (!href) return "";
    try {
      const url = new URL(href);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      if (host !== hostSuffix && !host.endsWith("." + hostSuffix)) return "";
      if (url.pathname.toLowerCase().indexOf(pathPart) === -1) return "";
      return href;
    } catch (err) {
      return "";
    }
  }
  function externalRow(href, label) {
    let host = "";
    try { host = new URL(href).host.replace(/^www\./, ""); } catch (err) { host = ""; }
    return `<a class="row" href="${esc(href)}" target="_blank" rel="noopener">${iconTile("link")}<span class="row-text"><span class="name">${t(label)}</span><span class="meta">${t(host)}</span></span>${chevron()}</a>`;
  }
  function profileLinks(e) {
    const rows = [];
    const web = safeUrl(e.website);
    if (web) rows.push(externalRow(web, "Website"));
    const facts = e && e.facts && typeof e.facts === "object" ? e.facts : {};
    const linkedin = profileHref(facts.linkedin, "linkedin.com", "/company/");
    if (linkedin) rows.push(externalRow(linkedin, "LinkedIn"));
    const crunchbase = profileHref(facts.crunchbase, "crunchbase.com", "/organization/");
    if (crunchbase) rows.push(externalRow(crunchbase, "Crunchbase"));
    if (!rows.length) return "";
    return `<div class="group">${rows.join("")}</div>`;
  }

  function similarCard(e) {
    const rows = similarEntries(e);
    if (!rows.length) return "";
    return `<div class="group"><div class="pad"><p class="kicker">Similar in Who Cares</p></div>${rows.map(rowButton).join("")}</div>`;
  }

  function renderDetail(e) {
    if (!e || !isPublished(e)) return `<p class="empty">That item is not in the list.</p>`;
    const killed = isKilled(e);
    const kind = e.type === "idea" ? "Idea" : "Company";
    const origin = e.type === "company" ? countryInfo(e) : null;
    const country = origin ? origin.name : "";
    const headMeta = country ? kind + ", " + country : kind;
    const summary = displaySummary(e);
    const draft = e.type !== "idea" && e.writeup && typeof e.writeup === "object";
    const writeup = writeupBlocks(e);
    const fields = [];
    if (!writeup.length && !draft) {
      fields.push(
        ["Job", sceneValue(e, "job", "job")],
        ["Who sells", sceneValue(e, "seller", "who_sells")],
        ["Who pays", sceneValue(e, "payer", "who_pays")]
      );
    }
    const dropped = killed ? (e.why_dropped || e.kill_reason || "") : "";
    const card = fields.filter((pair) => pair[1] && !isJunk(pair[1])).map(([k, v]) => `<div class="kv"><p class="kicker">${t(k)}</p><p>${t(cleanProse(v))}</p></div>`).join("");
    const droppedCard = dropped && !isJunk(dropped)
      ? `<div class="group"><div class="kv"><p class="kicker">Why we dropped it</p><p>${t(cleanProse(dropped))}</p></div></div>`
      : "";
    const sources = sourcesOf(e);
    const closed = closedInfo(e);
    const closedLine = closed
      ? `<p class="closed-line">${closedPill()}<span>${t(closed.text)}</span>${sourceLink(closed.source)}</p>`
      : "";
    let html = `<article class="detail">
      <div class="detail-head">
        ${rowIcon(e)}
        <div>
          <h1>${t(displayTitle(e))}</h1>
          <p class="screen-meta">${t(headMeta)}</p>
          ${closedLine}
        </div>
      </div>
      ${summary ? `<p class="summary">${t(summary)}</p>` : ""}`;
    html += writeupCard(e);
    if (card) html += `<div class="group">${card}</div>`;
    html += fundedByCard(e);
    html += droppedCard;
    html += factsCard(e);
    html += similarCard(e);
    html += profileLinks(e);
    if (sources.length) {
      html += `<div class="group"><div class="pad"><p class="kicker">Sources</p><ul class="src-list">`;
      sources.forEach((s) => {
        html += `<li><a class="src-link" href="${esc(s.url)}" target="_blank" rel="noopener">${t(s.label)}</a></li>`;
      });
      html += `</ul></div></div>`;
    }
    html += `</article>`;
    return html;
  }

  function fundedByCard(e) {
    const links = e && Array.isArray(e.funded_by) ? e.funded_by : [];
    const rows = links.filter((link) => link && link.id && link.name);
    if (!rows.length) return "";
    const lines = rows.map((link) => {
      const bits = [`<button type="button" class="co-link" data-go="/f/${esc(encodeURIComponent(link.id))}">${t(link.name)}</button>`];
      const round = cleanProse(link.round_label || "");
      const date = formatDate(link.date);
      if (round) bits.push(t(round));
      if (date) bits.push(t(date));
      return `<p>${bits.join(", ")}</p>`;
    }).join("");
    return `<div class="group"><div class="kv"><p class="kicker">Funded by</p>${lines}</div></div>`;
  }
  function visibleFunders() {
    const q = query.trim().toLowerCase();
    return funders.filter((funder) => {
      if (!q) return true;
      const hay = [funder.name, kindLabel(funder.kind), countryLabel(funder.country)].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }
  function funderButton(funder) {
    const bits = [kindLabel(funder.kind), countryLabel(funder.country), backedLabel(funder.backed)].filter(Boolean);
    return `<button type="button" class="row" data-go="/f/${esc(encodeURIComponent(funder.id))}">
      <span class="row-text"><span class="name">${t(funder.name)}</span>${bits.length ? `<span class="meta">${t(bits.join(", "))}</span>` : ""}</span>
      ${chevron()}
    </button>`;
  }
  function funderMeta(item) {
    return [relationLabel(item.relation), cleanProse(item.round_label || ""), formatDate(item.date), formatEur(item.amount_eur)].filter(Boolean).join(", ");
  }
  function renderFunder(id) {
    if (!Object.prototype.hasOwnProperty.call(funderDetails, id)) {
      ensureFunder(id);
      const known = funders.find((funder) => funder.id === id);
      const name = known ? known.name : "";
      return `<article class="detail"><div class="detail-head"><div><h1>${name ? t(name) : "Funder"}</h1></div></div></article>`;
    }
    const detail = funderDetails[id];
    if (!detail) return `<p class="empty">That funder is not in the list.</p>`;
    if (detail.error) return `<p class="empty">The funder page could not be loaded.</p>`;
    const kind = kindLabel(detail.kind);
    const country = countryLabel(detail.country);
    const meta = [kind, country].filter(Boolean).join(", ");
    const size = detail.aum_or_programme_size
      ? `<div class="kv"><p class="kicker">Size</p><p>${t(detail.aum_or_programme_size)}</p>${sourceRow(detail.sources)}</div>`
      : "";
    const focus = detail.care_focus
      ? `<div class="kv"><p class="kicker">Care focus</p><p>${t(detail.care_focus)}</p></div>`
      : "";
    const facts = (size || focus) ? `<div class="group">${size}${focus}</div>` : "";
    const site = safeUrl(detail.website)
      ? `<div class="group">${externalRow(detail.website, "Website")}</div>`
      : "";
    const backed = Array.isArray(detail.backed) ? detail.backed : [];
    const companies = backed.length
      ? `<div class="group"><div class="pad"><p class="kicker">Companies</p></div>${backed.map((item) => {
          const metaLine = funderMeta(item);
          return `<div class="kv"><p><button type="button" class="co-link" data-go="/e/${esc(encodeURIComponent(item.id))}">${t(item.name)}</button></p>${metaLine ? `<p class="meta">${t(metaLine)}</p>` : ""}${sourceRow(item.sources)}</div>`;
        }).join("")}</div>`
      : "";
    const looseSources = !detail.aum_or_programme_size && detail.sources && detail.sources.length
      ? `<div class="group"><div class="kv"><p class="kicker">Sources</p>${sourceRow(detail.sources)}</div></div>`
      : "";
    return `<article class="detail">
      <div class="detail-head"><div>
        <h1>${t(detail.name)}</h1>
        ${meta ? `<p class="screen-meta">${t(meta)}</p>` : ""}
      </div></div>
      ${detail.description ? `<p class="summary">${t(detail.description)}</p>` : ""}
      ${facts}
      ${looseSources}
      ${site}
      ${companies}
    </article>`;
  }
  function visibleRows() {
    const q = query.trim().toLowerCase();
    return sortEntries(publishedEntries().filter((e) => matchesTag(e) && matchesQuery(e, q)));
  }
  function renderList() {
    const rows = visibleRows();
    if (!rows.length) return `<p class="empty">Nothing in this list matches.</p>`;
    return `<div class="group">${rows.map(rowButton).join("")}</div>`;
  }

  function renderTags(count) {
    if (!tagsEl) return;
    const root = routeNow().view === "root";
    tagsEl.hidden = !root;
    if (!root) {
      tagsEl.dataset.mode = "";
      return;
    }
    if (tagFilter) {
      const mode = "picked:" + tagFilter;
      if (tagsEl.dataset.mode === mode) {
        const node = tagsEl.querySelector(".tag-count");
        if (node) node.textContent = countLabel(count);
        return;
      }
      tagsEl.dataset.mode = mode;
      tagsEl.innerHTML = `<button type="button" class="chip chip-on" data-clear-tag>${t(tagFilter)}<span class="chip-x" aria-hidden="true">\u00d7</span><span class="sr">Clear filter</span></button><span class="tag-count">${t(countLabel(count))}</span>`;
      return;
    }
    if (tagsEl.dataset.mode === "all") return;
    const left = tagsEl.scrollLeft;
    tagsEl.dataset.mode = "all";
    tagsEl.innerHTML = ["Closed", "Funders"].concat(TAGS).map((label) => {
      return `<button type="button" class="chip" data-tag="${esc(label)}" aria-pressed="false">${t(label)}</button>`;
    }).join("");
    tagsEl.scrollLeft = left;
  }

  function render(scrollMode) {
    if (!indexData) return;
    const route = routeNow();
    const onRoot = route.view === "root";
    backBtn.hidden = onRoot;
    if (barTop) barTop.hidden = onRoot;
    searchWrap.hidden = !onRoot;
    if (searchEl && searchEl.value !== query) searchEl.value = query;
    const onFunder = route.view === "funder";
    const funderName = onFunder
      ? ((funderDetails[route.id] && funderDetails[route.id].name) || (funders.find((funder) => funder.id === route.id) || {}).name || "Funder")
      : "";
    crumbEl.innerHTML = onRoot
      ? ""
      : `<p class="crumb"><button type="button" data-go="/">Who Cares</button><span class="sep">/</span><span class="here">${t(onFunder ? funderName : displayTitle(findEntry(indexData.entries, route.id) || { title: "Entry" }))}</span></p>`;
    const funderRows = onRoot && tagFilter === "Funders" ? visibleFunders() : [];
    const rows = onRoot && tagFilter !== "Funders" ? visibleRows() : [];
    const shownCount = tagFilter === "Funders"
      ? (fundersState === "ready" ? funderRows.length : -1)
      : rows.length;
    renderTags(shownCount);
    let title = "Who Cares";
    let intro = "";
    let body = "";
    if (onRoot && tagFilter === "Funders") {
      intro = `<h1 class="home-title">Who Cares</h1><p class="lede">A public list of companies and ideas in ageing and care, including the ones we researched and dropped.</p>`;
      if (fundersState === "loading") body = `<p class="empty">Loading the list.</p>`;
      else if (fundersState === "error") body = `<p class="empty">The funder list could not be loaded.</p>`;
      else body = funderRows.length ? `<div class="group">${funderRows.map(funderButton).join("")}</div>` : `<p class="empty">Nothing in this list matches.</p>`;
    } else if (onRoot) {
      intro = `<h1 class="home-title">Who Cares</h1><p class="lede">A public list of companies and ideas in ageing and care, including the ones we researched and dropped.</p>`;
      body = rows.length ? `<div class="group">${rows.map(rowButton).join("")}</div>` : `<p class="empty">Nothing in this list matches.</p>`;
    } else if (onFunder) {
      title = funderName + " - Who Cares";
      body = renderFunder(route.id);
    } else {
      const entry = findEntry(indexData.entries, route.id);
      title = (entry ? displayTitle(entry) : "Entry") + " - Who Cares";
      body = renderDetail(entry);
    }
    document.title = title;
    if (introEl) introEl.innerHTML = intro;
    main.innerHTML = body;
    if (scrollMode === "top") setScroll(0);
    if (scrollMode === "restore") requestAnimationFrame(() => setScroll(listScroll || 0));
  }

  if (backBtn) backBtn.addEventListener("click", back);
  if (searchEl) {
    searchEl.addEventListener("input", () => {
      query = searchEl.value || "";
      render("keep");
    });
  }
  if (tagsEl) {
    tagsEl.addEventListener("click", (ev) => {
      if (ev.target.closest("[data-clear-tag]")) {
        tagFilter = "";
        render("top");
        return;
      }
      const chip = ev.target.closest("[data-tag]");
      if (!chip) return;
      const next = chip.getAttribute("data-tag");
      tagFilter = next;
      render("top");
    });
  }
  if (app) {
    app.addEventListener("load", (ev) => {
      const img = ev.target;
      if (!img || img.tagName !== "IMG" || !img.closest(".ico-logo")) return;
      if (logoIsBlank(img)) useInitials(img);
    }, true);
    app.addEventListener("error", (ev) => {
      const img = ev.target;
      if (!img || img.tagName !== "IMG" || !img.closest(".ico-logo")) return;
      useInitials(img);
    }, true);
    app.addEventListener("click", (ev) => {
      const dest = ev.target.closest("[data-go]");
      if (!dest) return;
      ev.preventDefault();
      go(dest.getAttribute("data-go"));
    });
  }
  window.addEventListener("popstate", () => {
    const stateDepth = history.state && typeof history.state.depth === "number" ? history.state.depth : 0;
    depth = stateDepth;
    render(routeNow().view === "root" ? "restore" : "top");
  });

  document.addEventListener("DOMContentLoaded", () => {
    if (!app) return;
    const hash = location.hash;
    if (!hash || hash === "#") history.replaceState({ wc: 1, depth: 0 }, "", "#/");
    else history.replaceState({ wc: 1, depth: 0 }, "", hash);
    loadIndex().then((data) => {
      indexData = data;
      if (boot) boot.hidden = true;
      render("keep");
      loadFunders();
    }).catch(() => {
      if (boot) boot.textContent = "We could not load the list. Try again in a moment.";
    });
  });
})();
