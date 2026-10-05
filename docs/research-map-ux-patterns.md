# Research-map UX patterns (Who Cares)

Written: 5 Oct 2026 Europe/Berlin. Evidence from pages and posts opened for the Who Cares brief revision. No em dashes. Companion to `WHO-CARES-DESIGN-BRIEF.md`.

## Core mantra

Overview first, zoom and filter, then details on demand (Shneiderman; OWID topic redesign). One index feeds map, list, and detail.

## Pattern table

| Pattern | Seen in | Who Cares application |
| --- | --- | --- |
| View switch: map / list / detail, same filters | OWID Grapher; CNCF landscape; PitchBook maps | Map browse + cards/table + entry page stay synced |
| Layered dark surfaces, one accent | Linear UI redesign | Charcoal ladder; single cyan; dark default |
| Glanceable density + negative space | Apple Health | Counts and chips first; prose on demand |
| Orientation always on | Prezi Overview; ZUI studies (overview preferred) | Breadcrumb / altitude strip; optional minimap |
| Non-zoom fallback | Bederson ZUI critique; HealthTech DB | Filterable card list on phone |
| Problem / job labels | AgeTech Journal map | Scene job/seller/payer on cards |
| Curation over logo soup | MAD 2025 cut to ~1150 | Chips, not wallpaper |
| New + changelog | MAD New badges; HealthTech freezes; OWID archive | new-since filter; home changelog |
| Kill / failure visible | Failory; CB post-mortems | Killed ideas stay with reasons |
| Hover facts, click profile | CB Insights presentation mode | Quick peek + deep dive |
| Active filters + counts + reset | Market map UIs generally | Show N/N; clear chips |
| Cite + access date | OWID; AgeTech Journal cite widget | Source honesty culture |
| Command / prompt bar | Arc command bar; Linear command | Bottom "Ask the map" |
| Nomination with review | TAAFT; AgeTechX submit; CNCF PR | Stub nominate if empty shelf |

## What failed for Who Cares already

- Cream / Source Serif docs skin on Pages: reads as a paper, not a product.
- Image-gen "Apple Health x Linear" mockups: Fabian rejected as bad design; stop using as visual SoT.
- Wide multi-column tables on phone: unusable; use stacked cards.
- Tiny map dots: need real hit targets.

## Agent tool note (locked ownership)

Fabian locked this split on 5 Oct 2026. **Claude Design** is the primary design agent: visual system, screens, and polish, exported as zip/HTML to `design/handoff/YYYY-MM-DD/`. **Grok Bot / Cursor** implement that handoff into `site/` exactly and wire real `index.json` / Neon / Workers. Forbidden there: redesign, a new palette, or "improving" visuals. Ranked tools: Claude Design, then Mobbin/Refero for references, then the coding agent for wire-only work after handoff. Image-gen is banned as source of truth. Figma is optional later. Lovable is an optional parallel for React exploration on Free + GitHub sync, not the primary path for static Pages. Patterns, tokens, anti-goals, and the success checklist in the design brief stay binding.

## Sources touched

OWID entry redesign and Grapher docs (search/fetch); Linear redesign posts and design-md summaries; Apple HIG principles and Health viz case notes; Prezi structure docs; Bederson ZUI overview paper notes; CNCF landscape2 / BENCHMARK.md; AgeTech Journal live map; MAD FirstMark; HealthTech Signal methodology; PitchBook / CB Insights market map product pages; Mobbin MCP and Refero skill READMEs; Figma MCP guides (optional path); Lovable browser-testing and Snapfeed-style agent eyes patterns.
