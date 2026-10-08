# Spatial index validation — 8 October 2026

## Preview and checks

Run `npm run build:atlas`, then `python3 -m http.server 8765 --directory site`. Open http://localhost:8765/#/relative. Choose Finding care, then Care admin. Breadcrumbs should read Angehörige / Finding care / Care admin. Drag/scroll pans, and must not change the level, text size or revealed content.

Run `npm run test:atlas` for eleven tests. A local-only browser scale test is available at http://localhost:8765/?stress=100000#/relative. It clearly labels 100,000 synthetic records as test data; it does not alter source research. Search for Synthetic service 099999 or open a theme and keep entering its alphabetical groups.

## Browser verification

Real Codex in-app browser, desktop and 393 × 852 phone viewport:

- All five illustrated entrances use independently generated PNG assets. Phone layout was visually inspected; no whole-page horizontal overflow was observed.
- Finding care opens its question and four data-backed groups directly in the spatial reading surface. Care admin opens six research records. The initial display shows a subset, with an explicit “groups in view” cue.
- Scroll panning changed camera translation while retaining scale 1.0676252518, group services and 22px title typography. Fixed reading-level membership is also tested in the pure layout module.
- Keyboard Enter entered a territory. Breadcrumbs, up-level and overview controls provide explicit return routes.
- dala.care opened its full job, payer, buyer, risks and source link from the on-demand detail file. Closing restored the exact saved camera and breadcrumb path.
- An isolated test server deliberately failed the first evidence chunk with HTTP 503. The reader showed an explicit failure and Retry loading evidence. Retry loaded the full record and source link successfully.
- The workday story retained reading-panel focus while its companion map followed the scene. Closing returned to overview. All story references and persona-map coverage pass automated checks.
- Changing from phone to desktop preserved the current Finding care group.
- The browser loaded 100,000 synthetic records plus 403 published records: 287,372 hierarchy nodes, seven mounted overview tiles and 176 total DOM elements. An eight-level route reached individual records with four map tiles and 169 DOM elements. Searching the final synthetic record returned one result. No browser console errors were recorded during these checks.
- Automated construction of a separate 100,000-record fixture took roughly 0.2 seconds in this environment. All records were reachable; sampled reading levels mounted at most six tiles. This is a local result, not a universal performance guarantee.
- The compact real-data discovery payload is 208,200 bytes versus 1,179,665 bytes for the original index. Full records remain lossless in seven on-demand chunks. Original illustration PNGs total about 6.7 MB and load lazily.

## Hard critique and iteration

This is an implementation critique backed by browser checks, not an independent participant study.

| Gate | Failure identified | Change / remaining judgement |
| --- | --- | --- |
| Mental model | Continuous zoom changed text/content at hard-to-find positions | Replaced with click-to-enter levels and explicit breadcrumbs. Pan leaves the reading level unchanged. |
| Discovery | Selected sample nodes concealed much of the research | Every published record is reachable in every perspective; uncovered records have a wider-research route. Search and paginated lists supplement spatial browsing. Alphabetical fallback is useful for retrieval, but does not discover new semantic relationships. |
| Orientation | Deep paths became a long line of indistinguishable labels | Intermediate ancestors collapse into a menu. Range crumbs show record counts. Current level and in-view group counts remain visible. |
| Scalability | Fixed nodes and full dossier payloads did not scale | Recursive data layout, bounded view rendering, compact index and on-demand full records. 100k synthetic test passed. Browser-resident metadata remains a finite-memory limit. |
| Usability | Resizing shifted the view; returning from sources could lose position | Preserved current group on breakpoint changes and exact camera on reader close. Phone/keyboard checks passed. Physical touch and screen-reader sessions remain untested. |
| Evidence trust | Broad categories could be mistaken for verified relevance | Separate theme and broader-category collections, explicit status and provenance, no efficacy inference. Existing analyst language is retained as research, not independently validated. |
| Aesthetic fidelity | SVG substitutes lost the preferred human illustration quality | Five separate reference-style painted assets now replace them. The layout is generated, not a frozen visual. The first library is intentionally small; repeated portraits and large original PNGs remain limitations. |

## Remaining validation

Test discovery comprehension with venture builders, physical touch navigation and a screen reader. The original loneliness scroll-story URL remains unavailable in the retrieved cached conversation, so exact reference fidelity cannot be claimed. Research claims were not refreshed in this UI task.

## Spatial continuity regression and correction

The prior fixed-level build failed the spatial-model gate: its group-only pan clamp pinned content when it fit the viewport, and replacing the visible canvas with cards obscured geographic context. Corrected by world-bound pan limits, retained parent/neighbor contours, world-positioned headings, a viewport minimap and Prezi-style camera travel. Fixed reading levels and breadcrumbs remain.

Real browser checks on the corrected build:
- In Delivering care, a drag of (−80, −60) changed translation by exactly (−80, −60), retaining scale 1.0676252518 and the delivery reading level.
- Clicking Lifting and transfers activated the camera transition and arrived at delivery/T01. Its parent region and the neighbouring Incontinence care region stayed spatially present.
- Returning through the Delivering care breadcrumb restored the exact parent camera.
- At 393 × 852 the settled view retained its territory heading, illustration, research summary, evidence action and minimap with no whole-page horizontal overflow.
- Two regression tests cover free panning when a group fits the viewport and retaining neighbours at unchanged world coordinates. All eleven tests pass.

Remaining critique: the recursive layout still uses regular allocation cells to avoid overlapping data. The organic contours and camera navigation preserve spatial orientation, but this is not a validated model of semantic distance. Participant comprehension and physical touch testing remain open.
