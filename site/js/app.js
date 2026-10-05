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
  const MORE_LABELS = {
    product: "Product",
    how_it_works: "How it works",
    user: "Who uses it",
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
    open_questions: "Open questions",
    note: "Note"
  };
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
  function knownCountry(e) {
    const original = nd(e.country || "");
    if (!original.trim()) return "";
    if (/index|page says|page shows|not named|not confirmed|not printed|not opened/i.test(original)) return "";
    let raw = original.split(";")[0].replace(/\s*\([^)]*\)/g, "").trim();
    raw = raw.replace(/\s*\/\s*EU\b.*/i, "").replace(/\s*\(focus\).*/i, "").trim();
    if (/global/i.test(raw) && /germany|\bDE\b/i.test(original)) return "Germany";
    if (/^united states\s*\/\s*canada$/i.test(raw)) return "United States and Canada";
    if (/^canada\s*\/\s*(us|usa)$/i.test(raw)) return "Canada and the United States";
    if (/\//.test(raw)) return "";
    if (!raw || /^global$/i.test(raw)) return "";
    return raw;
  }
  function entryTags(e) {
    return [e.tag, e.tag_secondary].filter(Boolean);
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
  function rowIcon(e) {
    if (isKilled(e)) return iconTile("kill");
    if (e.type === "idea") return iconTile("idea");
    const src = logoSrc(e);
    if (src) return `<span class="ico ico-logo"><img src="${esc(src)}" alt=""></span>`;
    return iconTile("company");
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

  function parseHash() {
    let raw = (location.hash || "#/").replace(/^#/, "");
    if (!raw) raw = "/";
    try { raw = decodeURIComponent(raw); } catch (err) { /* keep raw */ }
    if (!raw.startsWith("/")) raw = "/" + raw;
    const bits = raw.split("/").filter(Boolean);
    const at = bits.indexOf("e");
    if (at >= 0 && bits[at + 1]) return { view: "entry", id: bits.slice(at + 1).join("/") };
    return { view: "root", id: "" };
  }
  function findEntry(entries, id) {
    return entries.find((e) => e.id === id) || null;
  }

  let indexData = null;
  let depth = 0;
  let query = "";
  let tagFilter = "";
  let listScroll = 0;
  let moreOpen = false;

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
    return n === 1 ? "1 result" : n + " results";
  }

  function routeNow() { return parseHash(); }

  function go(path) {
    const next = path.startsWith("#") ? path : "#" + path;
    if ((location.hash || "#/") === next) return;
    if (routeNow().view === "root") listScroll = scrollPos();
    depth += 1;
    history.pushState({ wc: 1, depth }, "", next);
    moreOpen = false;
    render(routeNow().view === "entry" ? "top" : "restore");
  }
  function back() {
    if (routeNow().view === "root") return;
    if (depth > 0) {
      history.back();
      return;
    }
    history.replaceState({ wc: 1, depth: 0 }, "", "#/");
    moreOpen = false;
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
    return entryTags(e).indexOf(tagFilter) !== -1;
  }

  function rowButton(e) {
    const summary = displaySummary(e);
    return `<button type="button" class="row" data-go="/e/${esc(encodeURIComponent(e.id))}">
      ${rowIcon(e)}
      <span class="row-text"><span class="name">${t(displayTitle(e))}</span>${summary ? `<span class="meta">${t(summary)}</span>` : ""}</span>
      ${chevron()}
    </button>`;
  }

  function sceneValue(e, key, top) {
    if (e[top]) return e[top];
    const scene = e.scene;
    if (scene && typeof scene === "object" && scene[key]) return scene[key];
    return "";
  }
  function sourcesOf(e) {
    const list = e.deep_dive && Array.isArray(e.deep_dive.sources) ? e.deep_dive.sources : [];
    const urls = [];
    const seen = new Set();
    list.forEach((s) => {
      const url = safeUrl(s && s.url);
      if (!url || seen.has(url)) return;
      seen.add(url);
      urls.push({ url, note: s && s.note && !isJunk(s.note) ? cleanProse(s.note) : "" });
    });
    const extra = e.deep_dive && Array.isArray(e.deep_dive.thesis_sources) ? e.deep_dive.thesis_sources : [];
    extra.forEach((item) => {
      const url = safeUrl(item);
      if (!url || seen.has(url)) return;
      seen.add(url);
      urls.push({ url, note: "" });
    });
    return urls;
  }
  function moreHtml(e) {
    const blocks = [];
    const dive = e.deep_dive && typeof e.deep_dive === "object" ? e.deep_dive : null;
    if (dive) {
      Object.keys(MORE_LABELS).forEach((key) => {
        const val = dive[key];
        if (val == null || val === "" || Array.isArray(val)) return;
        const text = cleanProse(val);
        if (isJunk(text)) return;
        blocks.push(`<h2>${t(MORE_LABELS[key])}</h2><p>${t(text)}</p>`);
      });
      if (Array.isArray(dive.risks)) {
        const risks = dive.risks.map(cleanProse).filter((x) => x && !isJunk(x));
        if (risks.length) blocks.push(`<h2>Risks</h2><ul>${risks.map((item) => `<li>${t(item)}</li>`).join("")}</ul>`);
      }
      if (Array.isArray(dive.open_questions)) {
        const qs = dive.open_questions.map(cleanProse).filter((x) => x && !isJunk(x));
        if (qs.length) blocks.push(`<h2>Open questions</h2><ul>${qs.map((item) => `<li>${t(item)}</li>`).join("")}</ul>`);
      }
    }
    const related = (e.related || []).map((id) => findEntry(indexData.entries, id)).filter((r) => r && isPublished(r));
    if (related.length) {
      blocks.push(`<h2>Related</h2>` + related.map(rowButton).join(""));
    }
    return blocks.join("");
  }

  function renderDetail(e) {
    if (!e || !isPublished(e)) return `<p class="empty">That item is not in the list.</p>`;
    const killed = isKilled(e);
    const kind = e.type === "idea" ? "Idea" : "Company";
    const country = knownCountry(e);
    const headMeta = country ? kind + ", " + country : kind;
    const summary = displaySummary(e);
    const fields = [
      ["Job", sceneValue(e, "job", "job")],
      ["Who sells", sceneValue(e, "seller", "who_sells")],
      ["Who pays", sceneValue(e, "payer", "who_pays")],
      ["Why we dropped it", killed ? (e.why_dropped || e.kill_reason || "") : ""]
    ].filter((pair) => pair[1] && !isJunk(pair[1]));
    const card = fields.map(([k, v]) => `<div class="kv"><p class="kicker">${t(k)}</p><p>${t(cleanProse(v))}</p></div>`).join("");
    const web = safeUrl(e.website);
    let host = "";
    if (web) {
      try { host = new URL(web).host; } catch (err) { host = web; }
    }
    const sources = sourcesOf(e);
    const extra = moreHtml(e);
    let html = `<article class="detail">
      <div class="detail-head">
        ${rowIcon(e)}
        <div>
          <h1>${t(displayTitle(e))}</h1>
          <p class="screen-meta">${t(headMeta)}</p>
        </div>
      </div>
      ${summary ? `<p class="summary">${t(summary)}</p>` : ""}`;
    if (card) html += `<div class="group">${card}</div>`;
    if (web) {
      html += `<div class="group"><a class="row" href="${esc(web)}" target="_blank" rel="noopener">
        ${iconTile("link")}
        <span class="row-text"><span class="name">Website</span><span class="meta">${t(host)}</span></span>
        ${chevron()}
      </a></div>`;
    }
    if (sources.length) {
      html += `<div class="group"><div class="pad"><p class="kicker">Sources</p><ul class="src-list">`;
      sources.forEach((s) => {
        html += `<li><a class="src-link" href="${esc(s.url)}" target="_blank" rel="noopener">${t(s.url)}</a></li>`;
      });
      html += `</ul></div></div>`;
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
    tagsEl.innerHTML = TAGS.map((label) => {
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
    crumbEl.innerHTML = onRoot
      ? ""
      : `<p class="crumb"><button type="button" data-go="/">Who Cares</button><span class="sep">/</span><span class="here">${t(displayTitle(findEntry(indexData.entries, route.id) || { title: "Entry" }))}</span></p>`;
    const rows = onRoot ? visibleRows() : [];
    renderTags(rows.length);
    let title = "Who Cares";
    let intro = "";
    let body = "";
    if (onRoot) {
      intro = `<h1 class="home-title">Who Cares</h1><p class="lede">A public list of companies and ideas in ageing and care, including the ones we researched and dropped.</p>`;
      body = rows.length ? `<div class="group">${rows.map(rowButton).join("")}</div>` : `<p class="empty">Nothing in this list matches.</p>`;
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
    app.addEventListener("click", (ev) => {
      const more = ev.target.closest("[data-more]");
      if (more) {
        moreOpen = !moreOpen;
        const y = scrollPos();
        render("keep");
        setScroll(y);
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
    moreOpen = false;
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
    }).catch(() => {
      if (boot) boot.textContent = "We could not load the list. Try again in a moment.";
    });
  });
})();
