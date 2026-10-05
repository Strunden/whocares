# Who Cares design brief

**Status:** Revised 5 Oct 2026 Europe/Berlin after research-map UX review and rejection of image-gen mockups as source of truth.  
**Audience for this file:** An autonomous design agent that edits `site/` directly. Not a Figma-to-human handoff checklist.  
**Product:** Who Cares is a research tool and conversation starter for AgeTechX, care operators, founders, and payers. Live map of ageing tech: companies, ideas, and what we killed. It is not the venture.

No em dashes in copy or UI strings.

---

## 1. Job of the design agent

Ship a calm, trustworthy research-map product UI in code (`site/css`, `site/js`, HTML). Iterate against live screenshots (desktop + phone 393) until the success criteria pass. Do not wait for a human Figma pass. Do not treat AI image mockups as the visual source of truth.

### Preferred agent loop

1. Lock references (this brief + 3 to 5 real shipped screens from Mobbin or Refero).
2. Implement tokens, chrome, map, cards, detail, empty/loading in `site/`.
3. Serve locally; capture desktop and phone screenshots of home, map/index, one company deep dive.
4. Score against the checklist in section 9. Fix the top failures. Repeat (max 3 loops per run unless told otherwise).
5. Keep `site/data/index.json` real. Never invent companies or figures.

### Best tools for this loop (ranked)

| Rank | Tool | Use for |
| --- | --- | --- |
| 1 | Cursor (or equivalent) coding agent with browser / screenshot feedback | Implement CSS/HTML/JS; see the real UI; fix drift |
| 2 | Mobbin MCP and/or Refero MCP (or skill) | Real shipped screens and flows before inventing chrome |
| 3 | Local static server + phone viewport (393) captures | Acceptance evidence |
| 4 | This brief + `docs/research-map-ux-patterns.md` | Constraints and patterns |
| 5 | Optional later: Figma MCP | Only if Fabian wants round-trip tokens or documentation. Not required to ship. Not a gate. |

### Explicitly weak / banned as source of truth

- **Image-gen mockups** (Midjourney, DALL-E, Ideogram, "make it look like the PNG"): rejected once already. They lack real components, states, responsive behavior, accessibility, and readable UI text. Mood exploration only, never acceptance criteria.
- **Cream paper + Source Serif research-docs skin** currently on Pages: wrong for product UI.
- **Waiting for a designer to draw Figma first**: wrong operating model. Agent ships code.

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

## 10. How to feed this agent (setup that works)

Successful autonomous design setups share the same spine:

1. **Written brief with hard anti-goals** (this file).
2. **Real UI references** via Mobbin MCP / Refero (research-first skill), not invented aesthetics.
3. **Code as canvas:** agent edits the live `site/` tree.
4. **Eyes in the loop:** browser screenshots or structured UI diffs after each pass.
5. **Data truth wall:** real `index.json`; refuse to invent rows to make the map look full.
6. **Reject image-gen-as-truth:** optional mood only; never the acceptance artifact.

Figma MCP is useful when a design system already lives in Figma and you want Code Connect / variables round-trip. It is **not** the required path for Who Cares today. Prefer: brief → refs → code → screenshot critique → code.

---

## 11. Data pointer

Canonical seed and static export: `site/data/index.json`. Live shape when Neon is wired: `GET /api/index` (same schema). Pattern notes: `docs/research-map-ux-patterns.md`.
