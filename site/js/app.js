/* AgeTech continuum dynamic site - loads data/index.json at runtime */
(function () {
  const DATA_URL = new URL("../data/index.json", document.currentScript ? document.currentScript.src : window.location.href);
  // When script is in /js/, data is /data/; when page is /companies/entry.html, fix below
  function dataUrl() {
    const path = location.pathname;
    if (path.includes("/companies/") || path.includes("/entry.html")) return "../data/index.json";
    return "data/index.json";
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function nd(s) {
    return String(s == null ? "" : s).replace(/\u2014/g, " - ").replace(/\u2013/g, "-").replace(/—/g, " - ").replace(/–/g, "-");
  }
  function t(s) { return esc(nd(s)); }

  function statusChip(e) {
    const s = e.status || "";
    const cls = {
      deep_dive_done: "deep", deep_dive_pending: "pending", new_this_scan: "continue",
      open: "pending", stressed: "continue", standing: "continue", killed: "kill", parked: "park"
    }[s] || "park";
    return `<span class="chip ${cls}">${esc(s.replace(/_/g, " "))}</span>`;
  }

  function typeChip(e) {
    return e.type === "idea"
      ? `<span class="chip idea">idea</span>`
      : `<span class="chip deep">company</span>`;
  }

  function entryHref(e) {
    const base = location.pathname.includes("/companies/") ? "" : "companies/";
    return `${base}entry.html?id=${encodeURIComponent(e.id)}`;
  }

  function sceneText(scene) {
    if (!scene) return "";
    if (typeof scene === "string") return scene;
    return [scene.job, scene.seller, scene.payer].filter(Boolean).join(" · ");
  }

  async function loadIndex() {
    const res = await fetch(dataUrl(), { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load data/index.json");
    return res.json();
  }

  function filterEntries(entries, opts) {
    const type = opts.type || "both"; // companies | ideas | both
    const since = opts.since || "";
    const theme = opts.theme || "";
    const country = opts.country || "";
    const status = opts.status || "";
    const q = (opts.q || "").toLowerCase();
    return entries.filter((e) => {
      if (type === "companies" && e.type !== "company") return false;
      if (type === "ideas" && e.type !== "idea") return false;
      if (since && (e.added_date || "") < since) return false;
      if (theme && !(e.themes || []).includes(theme)) return false;
      if (country && !(e.country || "").includes(country)) return false;
      if (status && e.status !== status) return false;
      if (q) {
        const hay = [e.name, e.summary, e.claim, e.country, sceneText(e.scene), ...(e.themes || [])]
          .join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  /* ---- Home: changelog + counts ---- */
  async function renderHome() {
    const root = document.getElementById("home-dynamic");
    if (!root) return;
    const data = await loadIndex();
    const c = data.counts || {};
    root.innerHTML = `
      <div class="grid">
        <div class="card"><h3>Index live from data</h3>
          <p><strong>${c.total || 0}</strong> entries ·
          <strong>${c.companies || 0}</strong> companies ·
          <strong>${c.ideas || 0}</strong> ideas</p>
          <p class="muted">${c.deep_dive_done || 0} deep dive done · ${c.deep_dive_pending || 0} pending ·
          ideas standing ${c.ideas_standing || 0} / open ${c.ideas_open || 0} / killed ${c.ideas_killed || 0} / parked ${c.ideas_parked || 0}</p>
          <p><a href="companies.html">Open map and index</a></p>
        </div>
        <div class="card" id="changelog-panel"><h3>Changelog / latest additions</h3>
          <ul class="compact">
            ${(data.changelog || []).slice().reverse().map(x =>
              `<li><strong>${t(x.date)}</strong> - ${t(x.text)}</li>`).join("") || "<li class='muted'>none</li>"}
          </ul>
        </div>
      </div>`;
  }

  /* ---- Map + table ---- */
  function paintMap(canvas, entries) {
    if (!canvas) return;
    const w = canvas.clientWidth || 900;
    const h = 420;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#e2ddd4";
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    // Cluster by primary theme
    const themes = {};
    entries.forEach((e) => {
      const th = (e.themes && e.themes[0]) || (e.type === "idea" ? "other" : "untagged");
      (themes[th] = themes[th] || []).push(e);
    });
    const keys = Object.keys(themes).sort();
    const cols = Math.max(1, Math.ceil(Math.sqrt(keys.length)));
    const rows = Math.ceil(keys.length / cols);
    const pad = 16;
    const cellW = (w - pad * 2) / cols;
    const cellH = (h - pad * 2) / rows;

    keys.forEach((th, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x0 = pad + col * cellW, y0 = pad + row * cellH;
      ctx.fillStyle = "#f7f5f0";
      ctx.fillRect(x0 + 4, y0 + 4, cellW - 8, cellH - 8);
      ctx.fillStyle = "#5a5a5a";
      ctx.font = "600 12px system-ui";
      ctx.fillText(th, x0 + 12, y0 + 22);
      const list = themes[th];
      const maxN = Math.min(list.length, 18);
      for (let j = 0; j < maxN; j++) {
        const e = list[j];
        const nx = x0 + 14 + (j % 6) * ((cellW - 24) / 6);
        const ny = y0 + 40 + Math.floor(j / 6) * 28;
        const r = 9;
        ctx.beginPath();
        if (e.type === "idea") {
          ctx.setLineDash([3, 2]);
          ctx.strokeStyle = "#8b3a2a";
          ctx.fillStyle = "rgba(139,58,42,0.12)";
          ctx.rect(nx - r, ny - r, r * 2, r * 2);
          ctx.fill(); ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.setLineDash([]);
          ctx.fillStyle = e.status === "deep_dive_done" ? "#0b5f4a" : "#3d8b74";
          ctx.beginPath();
          ctx.arc(nx, ny, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (list.length > maxN) {
        ctx.fillStyle = "#5a5a5a";
        ctx.font = "11px system-ui";
        ctx.fillText("+" + (list.length - maxN), x0 + 12, y0 + cellH - 12);
      }
    });

    // legend
    ctx.setLineDash([]);
    ctx.fillStyle = "#0b5f4a"; ctx.beginPath(); ctx.arc(20, h - 18, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1a1a1a"; ctx.font = "12px system-ui"; ctx.fillText("company", 32, h - 14);
    ctx.setLineDash([3, 2]); ctx.strokeStyle = "#8b3a2a"; ctx.strokeRect(100, h - 24, 12, 12); ctx.setLineDash([]);
    ctx.fillText("idea (dashed)", 118, h - 14);
  }

  async function renderIndexPage() {
    const tableBody = document.getElementById("entry-rows");
    const canvas = document.getElementById("landscape-map");
    if (!tableBody && !canvas) return;
    const data = await loadIndex();
    const all = data.entries || [];

    // populate filter options
    const themes = [...new Set(all.flatMap((e) => e.themes || []))].sort();
    const countries = [...new Set(all.map((e) => e.country).filter(Boolean))].sort();
    const statuses = [...new Set(all.map((e) => e.status).filter(Boolean))].sort();
    const fill = (id, opts) => {
      const el = document.getElementById(id);
      if (!el) return;
      opts.forEach((o) => {
        const opt = document.createElement("option");
        opt.value = o; opt.textContent = o;
        el.appendChild(opt);
      });
    };
    fill("f-theme", themes);
    fill("f-country", countries);
    fill("f-status", statuses);

    function apply() {
      const opts = {
        type: (document.getElementById("f-type") || {}).value || "both",
        since: (document.getElementById("f-since") || {}).value || "",
        theme: (document.getElementById("f-theme") || {}).value || "",
        country: (document.getElementById("f-country") || {}).value || "",
        status: (document.getElementById("f-status") || {}).value || "",
        q: (document.getElementById("f-search") || {}).value || "",
      };
      const filtered = filterEntries(all, opts);
      const countEl = document.getElementById("filter-count");
      if (countEl) countEl.textContent = `${filtered.length} shown / ${all.length} total`;
      paintMap(canvas, filtered);
      if (tableBody) {
        tableBody.innerHTML = filtered
          .slice()
          .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type.localeCompare(b.type)))
          .map((e) => {
            const rowCls = e.type === "idea" ? "row-idea" : "row-company";
            return `<tr class="${rowCls}" data-id="${esc(e.id)}">
              <td><a href="${entryHref(e)}">${t(e.name)}</a><br>${typeChip(e)} ${statusChip(e)}</td>
              <td>${t(e.country || "")}</td>
              <td>${(e.themes || []).map((th) => `<span class="chip">${esc(th)}</span>`).join("")}</td>
              <td>${t(sceneText(e.scene)).slice(0, 140)}</td>
              <td class="muted">${t(e.added_date)} · ${t(e.source_scan).slice(0, 60)}</td>
            </tr>`;
          })
          .join("");
      }
    }

    ["f-type", "f-since", "f-theme", "f-country", "f-status", "f-search"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", apply);
    });
    window.addEventListener("resize", () => apply());
    apply();
  }

  /* ---- Entry deep dive / idea page ---- */
  async function renderEntryPage() {
    const root = document.getElementById("entry-root");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("id");
    if (!id) {
      root.innerHTML = `<p class="muted">Missing ?id=</p>`;
      return;
    }
    const data = await loadIndex();
    const e = (data.entries || []).find((x) => x.id === id);
    if (!e) {
      root.innerHTML = `<p>Entry not found: <code>${t(id)}</code></p>`;
      return;
    }
    document.title = `${nd(e.name)} - AgeTech continuum`;
    const related = (e.related || [])
      .map((rid) => (data.entries || []).find((x) => x.id === rid))
      .filter(Boolean);

    let body = "";
    if (e.type === "company") {
      const d = e.deep_dive || {};
      const sec = (title, html) => `<section class="section card"><h3>${esc(title)}</h3>${html}</section>`;
      const p = (x) => `<p>${t(x || "not found")}</p>`;
      const ul = (arr) =>
        Array.isArray(arr) && arr.length
          ? `<ul class="compact">${arr.map((i) => `<li>${t(i)}</li>`).join("")}</ul>`
          : `<p class="muted">not found</p>`;
      body = `
        ${e.status === "deep_dive_pending" ? `<div class="banner">Short profile. Full analyst deep dive pending.</div>` : ""}
        ${sec("One-line summary", p(e.summary))}
        ${sec("Product and how it works", p(d.product) + "<h4>How it works</h4>" + p(d.how_it_works))}
        ${sec("Customer / user, buyer, payer (scene)",
          `<p><strong>User:</strong> ${t(d.user)}</p>
           <p><strong>Buyer / seller:</strong> ${t(d.buyer || (e.scene && e.scene.seller))}</p>
           <p><strong>Payer:</strong> ${t(d.payer || (e.scene && e.scene.payer))}</p>
           <p><strong>Scene job:</strong> ${t(e.scene && e.scene.job)}</p>`)}
        ${sec("Business model and pricing", p(d.business_model))}
        ${sec("Traction signals", p(d.traction))}
        ${sec("Funding, investors, team / founders", p(d.funding) + "<h4>Team</h4>" + p(d.team))}
        ${sec("Competitors and positioning", p(d.competitors))}
        ${sec("Regulatory / reimbursement path", p(d.regulatory))}
        ${sec(`Our product thesis (${d.thesis_label || "interpreted"})`, p(d.thesis) + "<h4>Thesis sources</h4>" + ul(d.thesis_sources))}
        ${sec("Risks and likely kill points", ul(d.risks))}
        ${sec("Relevance to standing theses", p(d.relevance))}
        ${sec("Open questions", ul(d.open_questions))}
        ${sec("Sources", `<ul class="compact">${(d.sources || []).map((s) => {
          const u = s.url || "";
          const link = String(u).startsWith("http")
            ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a>`
            : t(u);
          return `<li>${link} - ${t(s.note)} (accessed ${t(s.accessed)})</li>`;
        }).join("")}</ul>`)}
      `;
    } else {
      const sec = (title, html) => `<section class="section card"><h3>${esc(title)}</h3>${html}</section>`;
      body = `
        <div class="banner idea-banner">Hypothetical idea (thesis card or theme). Not a company. Dashed style on the map.</div>
        ${sec("Claim / summary", `<p>${t(e.claim || e.summary)}</p>`)}
        ${sec("Status", `<p>${statusChip(e)}</p>
          ${e.kill_reason ? `<p><strong>Kill reason:</strong> ${t(e.kill_reason)}</p>` : ""}
          ${e.kill_source ? `<p><strong>Kill source:</strong> ${t(e.kill_source)}</p>` : ""}
          ${e.status_raw ? `<p class="muted">Raw: ${t(e.status_raw)}</p>` : ""}
          ${e.menu_disposition ? `<p class="muted">Menu disposition: ${t(e.menu_disposition)}</p>` : ""}`)}
        ${sec("Scene", `<p>${t(sceneText(e.scene))}</p>`)}
        ${e.expert_role ? sec("Expert role to stress", `<p>${t(e.expert_role)}</p>`) : ""}
        ${e.killer_experiment ? sec("Killer experiment", `<p>${t(e.killer_experiment)}</p>`) : ""}
        ${sec("Source scan", `<p>${t(e.source_scan)} · added ${t(e.added_date)}</p>`)}
      `;
    }

    const relatedHtml = related.length
      ? `<section class="section card"><h3>Related</h3><ul class="compact">${related
          .map((r) => `<li>${typeChip(r)} <a href="entry.html?id=${encodeURIComponent(r.id)}">${t(r.name)}</a> ${statusChip(r)}</li>`)
          .join("")}</ul></section>`
      : "";

    const web = e.website && String(e.website).startsWith("http")
      ? `<a href="${esc(e.website)}" target="_blank" rel="noopener">${esc(e.website)}</a>`
      : t(e.website || "n/a");

    root.innerHTML = `
      <p class="meta"><a href="../companies.html">Index</a> / ${t(e.name)}</p>
      <h1>${t(e.name)}</h1>
      <p>${typeChip(e)} ${statusChip(e)} ${(e.themes || []).map((th) => `<span class="chip">${esc(th)}</span>`).join("")}</p>
      <p class="muted">${t(e.country)}${e.city ? " · " + t(e.city) : ""} · Website: ${web}<br>
      Source scan: ${t(e.source_scan)} · Added: ${t(e.added_date)}</p>
      ${body}
      ${relatedHtml}
    `;
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderHome().catch(console.error);
    renderIndexPage().catch(console.error);
    renderEntryPage().catch(console.error);
  });
})();
