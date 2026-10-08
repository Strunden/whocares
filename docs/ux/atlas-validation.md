# Atlas rebuild validation — 8 October 2026

## Preview

Run `python3 -m http.server 8765 --directory site` from the repository root, then open http://localhost:8765/. No installation or build is needed. Start at the illustrated picker or use `/#/relative` for Angehörige. `/#/worker/story/0` opens the care-workday story. Existing `browse.html` remains available, but atlas navigation no longer sends users into that different interface.

## Critique against the goal

This is a documented implementation critique and real-browser verification, not an independent participant study. The earlier version failed the mental-model and zoom gates. The rebuild addresses those failures; discovery comprehension and exact reference fidelity remain unvalidated.

| Gate | Hard failure condition | Revision / finding |
| --- | --- | --- |
| Venture-builder discovery | Cannot follow a need to existing responses, payer and a useful next question | Integrated records expose jobs, payer information where present, research decisions, sources and next questions. Related companies use explicit links/shared theme tags. All 403 published records are searchable; category-only records are included in territory collections. Missing payer/evidence remains visible. Participant discovery success still needs testing. |
| Mental model | ICP merely dims a generic map; unrelated navigation destroys context | Five illustrated entrances open distinct six-territory maps. Angehörige coordination is separate from hands-on family care. Problem/company reading stays in the atlas; closing restores camera. |
| Empathy and evidence trust | Fiction poses as testimony; one day defines a group; a product is treated as proof of a solved problem | Five explicitly fictional exemplary stories with linked research, interpretation labels and source limitations. Stories preserve choice and relationships. No invented quotes or outcomes. Existing research has not been independently refreshed. |
| Zoom and usability | Text balloons, overlaps, wheel selects content, dragging opens a record | HTML labels stay fixed while SVG territories and projected positions move. LOD thresholds are 155% and 270%; camera scale remains continuous. Collision handling, native buttons, keyboard map controls, search/list alternative, reduced-motion support. |
| Aesthetic fidelity | Dominant boxes/lines, competing headline, incoherent detail view | Illustrated entrances, soft organic territories, editorial type, small orientation header, integrated reading panel. Screenshots inspected at desktop and phone widths. Exact loneliness-story reference was unavailable in the cached conversation; this remains an unverified reference requirement. |

## Browser evidence

Tested in the real Codex in-app browser at 1280 × 800, intermediate widths and 393 × 852:

- All five entrances, distinct territory structures and linked stories load from the bundled published index.
- Six overview territory labels visible on phone; no horizontal page overflow.
- Typography stayed 22px at desktop overview, 195% and 305% zoom. Problems appeared at the first LOD boundary; company responses at the second. Problem and company labels remained 13px and 12px.
- Native wheel test changed scale continuously from 0.4629441624 to 0.5270707287. Translation changed from (271.9594,25) to (225.1343,-6.3053), preserving cursor location (610,251) in map coordinates. No reading panel opened.
- Native drag by (80,30) changed translation by exactly (80,30), with unchanged scale and no selection.
- Worker territory → lifting problem → Arjo → Back stayed on atlas routes. Source links were available. Closing restored the exact saved camera.
- Keyboard Enter opened a territory; Escape and close controls provide return paths.
- Scrolling the provider story moved map focus between relevant problems. Angehörige story links opened the existing hospital-discharge record. Returning preserved scrollTop 1448 exactly and kept its evidence disclosure expanded.
- Search listed 403 records, Show more increased the visible limit from 60 to 120, and an unmatched query displayed a clear empty state.
- No errors or warnings from the rebuilt atlas were captured. The tab retained one older warning from the previous `app.js` static-data fallback, dated before the rewrite.
- Phone layout uses two columns of territories and an integrated bottom reading panel. Physical touch/pinch and screen-reader use were not tested.

## Automated checks

`node --test tests/atlas-camera.test.mjs`: five passing tests cover arbitrary cursor anchors, bounds fitting, LOD boundaries, distinct map definitions with valid published themes, and valid story links/focus. JavaScript syntax and `git diff --check` pass.

## Remaining limits

The atlas is a research snapshot, not an exhaustive census of care needs or companies. Broad category membership is editorial and must not be mistaken for a verified product fit. Some records lack primary source evidence. Loading succeeds locally; the failure-state message exists but a network-failure browser scenario was not exercised. Browser checks do not establish venture-builder comprehension, accessibility conformance, or independent research validity. Exact reference scrollytelling fidelity and a participant study remain open.
