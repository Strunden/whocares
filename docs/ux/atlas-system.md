# Spatial atlas implementation

## Current repair — 8 October 2026

This is a repaired browsing prototype, not the completed problem-first discovery architecture. See [the discovery contract](atlas-discovery-contract.md) for the reviewed direction and known legacy-taxonomy mismatch.

The previous fixed-screen-size implementation failed visual QA: zoom moved items apart without making their contents easier to read. Its passing tests encoded the wrong contract. The current version magnifies each complete item uniformly. Internal layout, wording, wrapping and disclosure remain fixed during local zoom. Explicit selection changes the reading level.

The user's latest simplification removes the story shortcut, global search/About controls, collection search/type filters, bottom navigation strip and minimap. Breadcrumbs carry perspective and enclosing groups. Plus/minus and Fit level control the current scene. Pagination appears only for collections with more than one page. Existing story/data records remain intact; removed shortcuts are not deleted research.

## One scene and one transform

- `atlas-layout.js` selects current siblings with `levelScene`. Overview items have a 350×220 base layout; topic/record items use 350×300. Mobile width is constrained. `projectUnit` applies one scale to the entire item. There is no independent outer frame.
- `frameLevel` fits the current sibling set/page. This is the minimum zoom. `levelZoomLimits` caps enlargement so a centred item fits the viewport. Root layout uses the overview aspect ratio, avoiding large artificial gaps between rows.
- `atlas-view.js` renders keyed elements. Shapes derive from stable IDs. Title, image, surface, content and actions share the same transform. Zoom does not replace copy. Company records retain logos, uncertainty and source access.
- `atlas.js` owns navigation, camera memory and exclusive gesture modes. Scroll/drag pans; pinch or Ctrl/Command-scroll zooms around the gesture anchor. Plus explicitly centres the nearest item while magnifying it; minus recovers the whole scene when it reaches fit. This button focus behavior is intentionally different from cursor-anchored gestures.
- `navigateTo` stores settled cameras and restores a bounded destination. Opening a reader settles pending travel before recording its return state. Same-breakpoint resizing reconciles scale; breakpoint changes rebuild layout. Paging refits the new page so stale bounds cannot reverse a subsequent zoom.
- Fit level reframes the current level without changing its route. Perspective/group breadcrumbs handle hierarchy travel. The grid moves with the camera. Keyboard arrows pan, plus/minus zoom and Backspace returns.

The rendered root labels Area and Topic consolidate the legacy prototype. They do not promote company categories into researched problem spaces. Legacy source status remains visible at topic/evidence level. The graph and original research were not changed by this repair.

## Data and scale

The published legacy index remains preserved. Compact metadata and lossless detail chunks load evidence on demand. Collection pages contain at most six records. Visible items are culled with their actual magnified bounds, with a defensive 90-item cap. A 100,000-record synthetic fixture tests coverage and bounded mounting, not database latency or comprehensive research quality.

The real researched graph contains one problem space, two problems and three sources. Its UI mapping requires the separate discovery contract. More polished legacy browsing does not supply missing problem research.

## QA evidence and remaining limits

29 automated tests pass: camera anchoring, gesture lock and actual handler wiring, coherent unit magnification, full sibling fit at 393/743/1280 widths, record coverage, provenance and synthetic scale.

Real browser checks captured multiple magnifications, entry/return, source reading, pagination, native drag and scroll. Final responsive checks use actual 393px and 743px embedded browser viewports, with keyboard-operated zoom controls. Requested viewport overrides sometimes did not apply to the intended tab; those captures are not treated as phone evidence. The explicitly sized frame captures supersede their misleading filenames.

The visual loop caught and corrected: spacing-only zoom, zooming empty row gutters, an unnecessarily tiny minimum zoom, excessive root row gaps, minimap/title overlap, stale scale bounds, competing toolbar/chrome and ambiguous Overview behavior. Fit level now stays within the selected collection. Final app-tab console inspection showed no errors.

Independent critique still rejects this as the finished discovery experience: the overview remains a contents page, enlarging an area does not explain a mechanism, legacy categories are not researched spaces, and some historical claim titles sound stronger than their evidence. The separate contract addresses these information-architecture failures; it has not been shipped as a completed graph UI. Physical pinch feel and screen-reader operation are not validated by screenshots or handler simulations.

## Required visual gate for future changes

Before claiming completion, capture actual browser stills at fit, intermediate and maximum magnification for perspective/landscape, space/topic and record views. Verify actual dimensions at 393, 743 and1280px. Inspect pixels for clipping, readable names, shape/content coherence, excessive whitespace, evidence status and source actions. Exercise descent, parent return, reader close, native pan, keyboard zoom and pagination. Have the independent critic assess what the visitor can understand, not just geometry. Record failures and recapture affected states after correction. Tests alone do not pass this gate.
