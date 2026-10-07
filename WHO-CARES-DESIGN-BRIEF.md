# Who Cares design brief

**Status:** Ownership locked 5 Oct 2026 Europe/Berlin (Fabian). Claude Design owns the visual system, screens, and polish. Grok Bot / Cursor implement the dated handoff into `site/` exactly. Research-map UX patterns, tokens, anti-goals, and the success checklist from the same-day revision stay in force. Image-gen stays banned as source of truth.  
**Audience for this file:** Claude Design first, then Grok Bot / Cursor for wire-only implementation. Not a Figma-to-human handoff checklist. Not permission for the coding agent to redesign.  
**Product:** Who Cares is a research tool and conversation starter for AgeTechX, care operators, founders, and payers. Live map of ageing tech: companies, ideas, and what we killed. It is not the venture.

**Glossary:** **Kill** = an idea we researched and deliberately dropped, with a short reason still shown so people learn what failed and why. Kills stay in the index (muted status), not deleted.

No em dashes in copy or UI strings.

---

## 1. Ownership (locked)

Fabian locked this split. Do not reopen it inside a design or implementation pass.

1. **Claude Design** owns the visual system, screens, and polish. It is the primary design agent.
2. **Handoff:** export zip/HTML into `design/handoff/YYYY-MM-DD/`. That dated export is the visual source of truth for implementation.
3. **Grok Bot / Cursor** implement the handoff into `site/` exactly and wire real `index.json` / Neon / Workers. Forbidden: redesign, a new palette, or "improving" the visuals.
4. **Lovable** is optional and parallel: React exploration on the Free plan with GitHub sync. It is not primary for the static Pages site.

Patterns, tokens, anti-goals, and the success checklist in this brief stay binding for every agent. Claude Design designs them. Grok Bot / Cursor do not reinterpret them.

### Preferred loop

1. Claude Design locks references: this brief, `docs/research-map-ux-patterns.md`, and 3 to 5 real shipped screens from Mobbin or Refero.
2. Claude Design produces the visual system, screens, and polish, then exports zip/HTML into `design/handoff/YYYY-MM-DD/`.
3. Grok Bot / Cursor implement that export into `site/` exactly (`site/css`, `site/js`, HTML). Wire real `site/data/index.json`. When live, wire Neon and Workers (`GET /api/index`, same schema). Do not redesign, invent a palette, or "improve" visuals.
4. Serve locally. Capture desktop and phone (393) screenshots of home, map/index, and one company deep dive. Score against section 9 for fidelity to the handoff and for data truth. Visual misses go back to Claude Design. Wiring bugs stay with Grok Bot / Cursor. Repeat the handoff cycle as needed (max 3 visual loops per run unless told otherwise).
5. Keep `site/data/index.json` real. Never invent companies or figures.
6. If Lovable is used, keep it beside this loop for React exploration on Free + GitHub sync. It does not replace Claude Design and it does not own the static Pages tree.

### Best tools (ranked)

| Rank | Tool | Use for |
| --- | --- | --- |
| 1 | Claude Design | Primary design agent. Visual system, screens, polish. Export zip/HTML to `design/handoff/YYYY-MM-DD/`. |
| 2 | Mobbin and/or Refero | Real shipped screens and flows. References before chrome is invented. |
| 3 | Grok Bot / Cursor | Wire-only after handoff. Implement the export into `site/` exactly. Wire real `index.json`, Neon, and Workers. |
| 4 | This brief + `docs/research-map-ux-patterns.md` | Constraints: patterns, tokens, anti-goals, success checklist. |
| 5 | Figma (optional, later) | Only if Fabian wants round-trip tokens or documentation. Not required to ship. Not a gate. |

Lovable is not in this ranking. It stays an optional parallel for React exploration, not a substitute for rank 1 or rank 3 on static Pages.

### Explicitly weak / banned as source of truth

- **Image-gen mockups** (Midjourney, DALL-E, Ideogram, "make it look like the PNG"): banned as source of truth. Rejected once already. They lack real components, states, responsive behavior, accessibility, and readable UI text. Mood exploration only, never acceptance criteria.
- **Cream paper + Source Serif research-docs skin** currently on Pages: wrong for product UI.
- **Coding-agent restyle:** Grok Bot / Cursor must not redesign, pick a new palette, or "improve" visuals while wiring `site/`.
- **Lovable as the primary path for static Pages:** optional React exploration only.
- **Waiting for a designer to draw Figma first:** still the wrong gate. Claude Design is the primary design agent. Figma is optional later.

---

## 2. Audience and trust test

Someone standing at an AgeTechX reception with a phone, glare possible. Earn trust in about 10 seconds.

In 10 seconds they should understand:

1. This is a living research map of ageing tech (companies + ideas + kills).
2. Companies and ideas are different things.
3. They can search or filter without reading a methodology essay.

---

## 3. UX north star (research-backed)

**Feeling:** Apple Health calm glance + Linear dark console density + Our World in Data overview-zoom-filter-details.

**Information-seeking mantra (OWID / Shneiderman):** overview first, zoom and filter, then details on demand. Same index feeds every view.

**Not:** SaaS marketing site, VC deck, logo-wall chaos, purple AI gradients, smiling-senior stock, Prezi bubble wallpaper from image-gen.

---

## 4. Steal these patterns (evidence)

### Our World in Data

- Topic/overview → interactive explorer → methods and sources.
- Same dataset as chart **or** map **or** table; switch views without losing filters.
- Sources visible; cite with access date; freeze snapshots when citing.
- Search returns useful previews, not only titles.

### Linear

- Dark layered surfaces via fill + quiet border (not heavy drop shadows).
- One accent color for focus and primary actions only.
- High information density that still feels calm through spacing discipline.
- Side panel / split for meta; command-style prompt for "go to X".
- Light and dark from a tiny token set (base, accent, contrast).

### Apple Health / HIG

- Stay out of the way. Hierarchy by grouping and type, not decoration.
- Extreme data-ink: glanceable chips and counts; details on demand.
- Negative space as structure. Limited semantic color.
- Preserve context across zoom levels (breadcrumbs, consistent chrome).

### Quiet landscape maps (CNCF landscape2, MAD FirstMark, HealthTech Signal, AgeTech Journal)

- One structured index → category/theme view + list/table + detail.
- Aggressive curation for legibility (MAD cut logos; we prefer chips over logo soup).
- "New since" badges; changelog strip.
- Problem / job labels (AgeTech Journal: "Short-staffed on shifts") not only industry tags.
- Crowding / white-space callouts on a theme leaf when known.
- Nomination / submit path with human review (stub OK if non-persisting).

### Prezi / zoomable UI research (use carefully)

- Nested altitude is useful: altitude → theme → scene → entry → deep dive.
- Continuous zoom is optional sugar. Orientation is mandatory.
- Always keep a breadcrumb (or compact altitude strip). Minimap optional if the breadcrumb + back is clear.
- Always ship a non-zoom fallback: filterable list/cards. Bederson: tree/list often beats pure ZUI for compare tasks.
- Reject decorative floating bubble graphs that do not encode real hierarchy from the index.

### Arc (chrome, not content)

- Content first; chrome collapses.
- Command bar for jump/search (maps to our bottom prompt).
- Sparse, keyboard-friendly navigation.

### PitchBook / CB Insights market maps (interaction only)

- Hover: quick facts. Click: persistent detail (panel or page).
- Active filter chips, result counts, one-click reset.
- Map and table stay synchronized.

---

## 5. Product information architecture

Single index: `site/data/index.json` (or `/api/index` when live). Schema stays.

### Views (must stay in sync)

1. **Home / overview:** what Who Cares is, live counts, standing board summary, path into map.
2. **Map / browse:** theme-organized landscape of companies (solid) and ideas (dashed). Not a logo wallpaper.
3. **Index / list:** filterable stacked cards on phone; denser table or multi-column cards on desktop.
4. **Entry deep dive:** company or idea template; sources; scene (job / seller / payer); status; related.
5. **Sources / mechanism:** short, honest methodology (not the home hero).

### Zoom bands (semantic, not theatrical)

1. Altitude (life stage)
2. Theme
3. Scene (job, seller, payer)
4. Company or idea card
5. Deep dive

Reader must always know which band they are in.

### Filters that matter

Type (company / idea / both), theme, country, status, search, new-since. Show "N shown / N total". Empty states explain themselves. Clean display labels (no internal notes like "Czechia (index); page says…").

### Bottom prompt bar

Type or dictate a problem or idea. Browse shelf of matches from the index. If empty, nominate gap (clearly non-persisting stub unless wired to real tools). No fake screenshot-to-index that invents companies.

---

## 6. Visual system

### Mode

- **Dark default** on desktop (charcoal / near-black ladder).
- **Light mode required** for bright event rooms / glare. Same cyan accent. Toggle persistent.

### Color

- Surfaces: Linear-like ladder (canvas → panel → elevated → menu). Depth from fill + 1px border.
- **One cyan accent** only (not teal docs green, not purple AI).
- Status: soft diamonds or quiet chips for standing / killed / pending / open / parked. Not noisy badges.
- Companies: solid chips / nodes. Ideas: dashed stroke or dashed accent. Never confuse the two.

### Type

- Product UI: confident sans (system or Inter-class). Not Source Serif as body for the product shell.
- Serif allowed only inside long sourced quotes or print-like deep-dive prose if needed, sparingly.
- Clear type scale: display / title / body / meta / overline.

### Density and motion

- Dense-but-light data. Calm white space between clusters.
- Motion: short, ease-out, orientation-preserving. No parade of zoom fireworks.
- Hit targets on phone ≥ ~44px for map nodes and primary controls.

### Mobile (393)

- Compact nav (no 2 to 4 line wrap eating the viewport).
- Stacked cards instead of wide HTML tables.
- Map nodes tappable.
- Bottom prompt reachable with thumb.

---

## 7. Content and data rules (hard)

- Real index only. No sample or invented companies.
- Do not strip schema fields. Preserve filters and entry pages.
- Every factual claim cites a source; else `not found` / `not published` / `not verified`.
- Titles and chrome say **Who Cares**, not "AgeTech continuum" / "AgeTech Atlas".
- Outside-facing home: reduce internal jargon (T-IDs can appear on standing board and deep dives).
- Kill reasons stay visible for killed ideas. Do not scrub learning.

---

## 8. Anti-goals

- SaaS marketing landers and feature grids as the home.
- VC deck aesthetic; logo-wall chaos.
- Purple AI gradients; neon biohacking.
- Smiling-senior stock photography.
- Cream paper blog/docs look; Source Serif as the product UI.
- Image-gen bubble maps or "Apple Health × Linear" fake screenshots as acceptance.
- Traditional "wait for Figma, then implement" gate.
- Invented data to fill empty shelves.

---

## 9. Deliverables and success checklist

Claude Design owns how these look. Grok Bot / Cursor ship them in `site/` by implementing `design/handoff/YYYY-MM-DD/` exactly, then wiring real data. The checklist is the product bar. It is not permission to redesign.

### Ship in code

- [ ] Design tokens (dark + light) in CSS variables
- [ ] Type scale
- [ ] Home overview that passes the 10-second trust test
- [ ] Map browse + list/cards + filters synchronized to one index
- [ ] Entry deep-dive template (company and idea)
- [ ] Empty, loading, and zero-result states
- [ ] Bottom prompt bar (search shelf; nominate stub OK)
- [ ] Breadcrumb / altitude strip on drill-down
- [ ] Phone 393 layout without horizontal table scroll
- [ ] Desktop dark default + light toggle

### Pass when

1. Dark default + light toggle match the token ladder and single cyan accent.
2. Home feels like a product map (hierarchy from real themes), not a research paper or a generated poster.
3. Companies/ideas browse + filter + detail work against the real index.
4. Named company findable in under 10 seconds (search or filter).
5. Phone viewport readable; map targets tappable; cards not wide tables.
6. Screenshots attached for home, map, and one deep dive (desktop + phone).

---

## 10. How this work is split

1. **Written brief with hard anti-goals** (this file) plus `docs/research-map-ux-patterns.md`. Patterns, tokens, anti-goals, and the success checklist stay binding.
2. **Real UI references** via Mobbin / Refero, not invented aesthetics.
3. **Claude Design** owns the visual system, screens, and polish. Primary design agent.
4. **Handoff folder:** export zip/HTML into `design/handoff/YYYY-MM-DD/`. That export is what implementation must match.
5. **Grok Bot / Cursor** implement the handoff into `site/` exactly and wire real `index.json` / Neon / Workers. No redesign, no new palette, no visual "improvements".
6. **Eyes in the loop:** screenshots after implementation check fidelity to the handoff and to section 9. They are not a license to restyle.
7. **Data truth wall:** real `index.json`; refuse to invent rows to make the map look full.
8. **Image-gen banned as source of truth.** Mood exploration only, never the acceptance artifact.
9. **Lovable** is optional and parallel: React exploration on Free + GitHub sync. Not primary for static Pages.
10. **Figma** is optional later, for token round-trip or documentation, if Fabian asks. Not required to ship. Not a gate.

Prefer: brief → Mobbin/Refero refs → Claude Design → `design/handoff/YYYY-MM-DD/` → Grok Bot / Cursor wire-only into `site/`.

---

## 11. Data pointer

Canonical seed and static export: `site/data/index.json`. Live shape when Neon is wired: `GET /api/index` (same schema). Pattern notes: `docs/research-map-ux-patterns.md`.
