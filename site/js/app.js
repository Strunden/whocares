/* Who Cares drill-in index.
   Hierarchy (shallowest that fits the real index):
   Root lists life stage (P01-P07) and theme (T01-T18). Those codes are the
   themes[] tags. Labels come from idea_kind parent_theme / theme cards.
   Altitude is not a field. A type step (company / idea / kill) is skipped
   because the largest theme is 15 entries.
   Tap replaces the list. Back walks up. API_BASE /api/index, then JSON. */
(function () {
  const STATUS = {
    deep_dive_done: "Deep dive",
    deep_dive_pending: "Pending",
    new_this_scan: "New",
    open: "Open",
    stressed: "Stressed",
    standing: "Standing",
    killed: "Killed",
    parked: "Parked"
  };
  const MORE_LABELS = {
    product: "Product",
    how_it_works: "How it works",
    user: "User",
    buyer: "Buyer",
    payer: "Payer",
    business_model: "Business model",
    traction: "Traction",
    funding: "Funding",
    team: "Team",
    competitors: "Competitors",
    regulatory: "Regulatory",
    thesis: "Thesis",
    risks: "Risks",
    relevance: "Relevance",
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

  function rowButton(path, name, meta, kill) {
    return `<button type="button" class="row" data-go="${esc(path)}">
      <span class="row-text"><span class="name">${t(name)}</span><span class="meta${kill ? " kill" : ""}">${t(meta)}</span></span>
      ${chevron()}
    </button>`;
  }

  function entryMeta(e) {
    const killed = e.status === "killed" || !!e.kill_reason;
    if (killed) {
      const reason = clip(e.kill_reason || "Killed", 88);
      return { text: joinMeta([typeLabel(e), "Killed", reason === "Killed" ? "" : reason]), kill: true };
    }
    const place = joinMeta([e.country, e.city].filter(Boolean).length ? [e.country] : []);
    return {
      text: joinMeta([typeLabel(e), place || "", statusLabel(e.status)]),
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
      ["life", "Life stage"],
      ["theme", "Theme"],
      ["other", "Other"]
    ];
    let html = "";
    groups.forEach(([key, label]) => {
      const rows = shown.filter((b) => b.group === key);
      if (!rows.length) return;
      html += `<h2 class="section-label">${t(label)}</h2><div class="group">`;
      rows.forEach((b) => {
        const killed = b.status === "killed";
        const meta = killed
          ? joinMeta([b.code, "Killed", clip(b.summary, 72)])
          : joinMeta([
            b.code,
            b.count + (b.count === 1 ? " entry" : " entries"),
            statusLabel(b.status)
          ]);
        html += rowButton("/t/" + encodeURIComponent(b.code), b.title, meta, killed);
      });
      html += "</div>";
    });
    if (entryHits.length) {
      html += `<h2 class="section-label">Entries</h2><div class="group">`;
      entryHits.forEach((e) => {
        const meta = entryMeta(e);
        html += rowButton("/e/" + encodeURIComponent(e.id), e.name, meta.text, meta.kill);
      });
      html += "</div>";
    }
    if (!html) html = `<p class="empty">Nothing matches.</p>`;
    return html;
  }

  function renderThemeList(route, entries, bucket) {
    const kids = entriesFor(entries, route.code);
    const nq = query.trim().toLowerCase();
    const rows = nq ? kids.filter((e) => entryHay(e).includes(nq)) : kids;
    if (!rows.length) return `<p class="empty">Nothing matches.</p>`;
    let html = `<div class="group">`;
    rows.forEach((e) => {
      const meta = entryMeta(e);
      html += rowButton(entryPath(route, e), e.name, meta.text, meta.kill);
    });
    html += "</div>";
    if (nq) {
      html = `<p class="screen-meta">${rows.length} of ${kids.length}</p>` + html;
    }
    return html;
  }

  function sceneBlocks(scene) {
    if (!scene || typeof scene === "string") {
      return scene ? `<div class="kv"><p class="kicker">Scene</p><p>${t(scene)}</p></div>` : "";
    }
    const bits = [
      ["Job", scene.job],
      ["Seller", scene.seller],
      ["Payer", scene.payer]
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
        if (key === "thesis" && dive.thesis_label) heading += " (" + nd(dive.thesis_label) + ")";
        blocks.push(`<h2>${t(heading)}</h2><p>${t(val)}</p>`);
      });
      if (Array.isArray(dive.thesis_sources) && dive.thesis_sources.length) {
        blocks.push(`<h2>Thesis sources</h2><ul>${dive.thesis_sources.map((item) => `<li>${t(item)}</li>`).join("")}</ul>`);
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
    if (e.claim && e.claim !== e.summary) blocks.push(`<h2>Claim</h2><p>${t(e.claim)}</p>`);
    if (e.expert_role) blocks.push(`<h2>Expert role</h2><p>${t(e.expert_role)}</p>`);
    if (e.killer_experiment) blocks.push(`<h2>Killer experiment</h2><p>${t(e.killer_experiment)}</p>`);
    if (e.menu_disposition) blocks.push(`<h2>Menu</h2><p>${t(e.menu_disposition)}</p>`);
    if (e.status_raw) blocks.push(`<h2>Status note</h2><p>${t(e.status_raw)}</p>`);
    if (e.source_scan) blocks.push(`<h2>Source scan</h2><p>${t(e.source_scan)}</p>`);
    if (e.idea_kind) blocks.push(`<h2>Kind</h2><p>${t(e.idea_kind)}</p>`);
    const related = (e.related || []).map((id) => findEntry(indexData.entries, id)).filter(Boolean);
    if (related.length) {
      blocks.push(`<h2>Related</h2>` + related.map((r) => {
        const meta = entryMeta(r);
        return `<p><button type="button" class="row" data-go="${esc("/e/" + encodeURIComponent(r.id))}"><span class="row-text"><span class="name">${t(r.name)}</span><span class="meta${meta.kill ? " kill" : ""}">${t(meta.text)}</span></span>${chevron()}</button></p>`;
      }).join(""));
    }
    return blocks.join("");
  }

  function renderDetail(route, entries) {
    const e = findEntry(entries, route.id);
    if (!e) return `<p class="empty">Not in the index.</p>`;
    const killed = e.status === "killed" || !!e.kill_reason;
    const place = [e.country, e.city].filter(Boolean).join(", ");
    const headMeta = killed
      ? joinMeta([typeLabel(e), "Killed", place])
      : joinMeta([typeLabel(e), statusLabel(e.status), place]);
    const summaryRaw = e.summary || e.claim || "";
    const summary = (e.kill_reason && nd(summaryRaw).trim() === nd(e.kill_reason).trim()) ? "" : summaryRaw;
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
      <h1>${t(e.name)}</h1>
      <p class="screen-meta">${t(headMeta)}</p>
      ${summary ? `<p class="summary">${t(summary)}</p>` : ""}`;
    if (scene) html += `<div class="group">${scene}</div>`;
    if (web) {
      html += `<div class="group"><a class="row" href="${esc(web)}" target="_blank" rel="noopener">
        <span class="row-text"><span class="name">Website</span><span class="meta">${t(host)}</span></span>
        ${chevron()}
      </a></div>`;
    }
    if (killed) {
      html += `<div class="group killbox"><div class="pad">
        <p class="kicker">Kill reason</p>
        <p class="killtext">${t(e.kill_reason || "Killed")}</p>
        ${e.kill_source ? `<p class="meta">Kill source: ${t(e.kill_source)}</p>` : ""}
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
          <span class="row-text"><span class="name">${moreOpen ? "Less" : "More"}</span></span>
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
      parts.push({
        label: code,
        path: "/t/" + encodeURIComponent(code)
      });
    }
    if (route.view === "entry") {
      const entry = findEntry(entries, route.id);
      parts.push({ label: entry ? nd(entry.name) : "Entry", path: "" });
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
        <p class="lede">Companies, ideas, and kills in ageing tech.</p>
        <p class="counts">${c.total} entries · ${c.companies} companies · ${c.ideas} ideas · ${c.killed} killed</p>
      </div>`;
      body = renderBuckets(entries, buckets, query);
    } else if (route.view === "theme") {
      if (!bucket) {
        title = "Who Cares";
        body = `<p class="empty">Not in the index.</p>`;
      } else {
        title = bucket.title + " - Who Cares";
        const killed = bucket.status === "killed";
        const themeMeta = killed
          ? joinMeta([bucket.code, bucket.count + (bucket.count === 1 ? " entry" : " entries"), "Killed"])
          : joinMeta([bucket.code, bucket.count + (bucket.count === 1 ? " entry" : " entries"), statusLabel(bucket.status)]);
        intro = "";
        body = `<h1 class="screen-title">${t(bucket.title)}</h1>
          <p class="screen-meta${killed ? " kill" : ""}">${t(themeMeta)}</p>`
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
      if (boot) boot.textContent = "The index could not be loaded.";
    });
  });
})();
