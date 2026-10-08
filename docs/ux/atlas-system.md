# Data-driven spatial index

## Interaction contract

The user's latest direction combines explicit reading levels and Prezi-style travel with bounded local zoom. Scroll, drag or use arrow keys to pan. Pinch or Ctrl/⌘ + scroll zooms; Shift-scroll pans horizontally. Each gesture locks to pan or zoom. Plus/minus magnify locally and stop at the limits; zoom never changes the data level. Text, card dimensions and revealed content remain fixed. Click a group to enter; breadcrumbs/Backspace go up and restore saved cameras. Overview resets to fit. The dot grid and territories share the camera. Full evidence opens in the integrated reader and closing it restores the view. Reduced-motion preferences skip level travel. See [interaction research and verification](atlas-bounded-zoom.md).

## Data, hierarchy and rendering

- Canonical research remains `site/data/index.json`. `npm run build:atlas` extracts published metadata into a compact discovery index and lossless detail chunks of at most 64 records. Hash-named chunks load on demand when a full record is opened. The Pages build and export command run this generator. No main-branch deployment was performed in this task.
- Persona definitions describe editorial territories and theme membership. They do not supply per-record coordinates or a finished page layout.
- The hierarchy indexes actual themes first. Category-only records appear in clearly labelled broader collections; they do not become asserted product-problem links. Records outside a perspective's territory coverage remain reachable in The wider research.
- Collections recursively divide into at most six alphabetical groups, then records. Alphabetical grouping is a neutral retrieval fallback, not inferred similarity or opportunity ranking. Richer research relationships can replace this fallback when available.
- Layout recursively allocates bounds from child counts. No record needs a manually placed coordinate or an illustration. Current-level viewport intersection determines which DOM tiles mount. The view has a defensive cap of 90 mounted tiles; tested levels use far fewer.
- The five original illustrations live in a semantic asset registry with fallback selection. Adding records requires rebuilding data, not generating art or hand-building pages.

## Known boundaries

This is a scalable static-snapshot architecture, not an infinitely sized remote database browser. Compact metadata and hierarchy are still resident in browser memory. Full text/source payloads are fetched in chunks. The 100,000-record benchmark uses short synthetic records and establishes navigation/rendering behaviour, not the network or memory cost of 100,000 full real-world dossiers. Truly larger collections need a server-side metadata/search index or metadata shards. Asset derivatives and a larger scene vocabulary remain useful follow-up work.

## Spatial continuity correction

Reading levels must not become separate card-grid pages. The territory heading and guiding question are attached to world coordinates, not a fixed page header. Pan limits use the whole world, not the active group: even a group smaller than the viewport must move freely. Parent camera positions are remembered. Neighbouring regions remain navigable context without opening automatically.
