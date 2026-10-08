# Atlas cleanup QA — 8 October 2026

This pass implements the user's simplification walkthrough. The broader discovery-model/database redesign remains in `atlas-discovery-contract.md`; it is not represented as shipped.

## Interaction and presentation contract

- `People` returns to the illustrated overview. Breadcrumbs appear only after choosing a person; no perspective dropdown or repeated “Exploring as”. The current research breadcrumb opens that group's scope and sources; ancestors navigate back.
- Every map item is one pointer/keyboard/assistive target. There are no separate title links or repeated action footers. A restrained whole-item press response respects reduced motion.
- All item types share a translucent organic surface and reading order. Company logos preserve aspect ratio. Map previews omit type labels, evidence badges, counts and footer links at the user’s explicit request. Classification, uncertainty and evidence limitations remain in the reader.
- Layout is content-dependent, not zoom-dependent: company items are 210px high, short research 240px, dense research 300px at base scale. Headings get priority; descriptions use the remaining whole lines. Zoom magnifies the same content without changing its wording or wrapping.
- Detail entry starts at a readable scale. Phone views preserve an edge of the adjacent column. `Fit level` is an explicit overview, which can make dense collections too small to read.
- Pinching remains continuous within the current data level. Outside the scale bounds a rational rubber-band curve progressively resists movement, without a second hard cap. Release returns to the boundary; it does not change the research level. Cursor anchoring, interrupted returns, coincident fingers and reduced motion are covered by tests.

## Pattern references

- [Apple UIScrollView zoom bounce](https://developer.apple.com/documentation/uikit/uiscrollview/bounceszoom): zoom can exceed scaling bounds temporarily and return.
- [use-gesture rubberband documentation](https://use-gesture.netlify.app/docs/options/#rubberband) and [implementation](https://github.com/pmndrs/use-gesture/blob/main/packages/core/src/utils/maths.ts): nonlinear out-of-bounds resistance. Our implementation applies the rational curve in logarithmic scale, with an inverse so event frequency does not compound resistance. This is an adaptation, not a claim to reproduce Safari's private tuning.

## Verification

- 48 atlas tests passed, including actual input-handler wiring, rubber-band return/interruption, reversibility, event subdivision, zero/infinite factors, cursor anchoring, responsive entry and 100,000-record reachability.
- Real in-app browser: whole-item pointer and Enter activation, People return, group entry, parent scope/evidence reader, close/return, plain-scroll panning, extreme pan in all four directions without losing the collection, plus/minus and Fit level.
- Screenshots inspected at fit, intermediate and maximum magnification; desktop 1280px, and actual 393px/743px iframe viewports. Final artifacts live in the parent workspace `atlas-qa-after/`, including `final-cleanup-responsive.png` and `final-cleanup-overview.png`.
- Main-page browser console showed no errors during the final functioning build. QA also caught a stale media dependency after concurrent logo edits; its import URL was versioned and startup verified again. One MutationObserver error appeared in the browser's iframe QA harness, with no application source URL; the site contains no MutationObserver. It was not reproduced on the main page.
- Explicit browser pinch input immediately preempts pan inertia; rejected inertia does not prolong the zoom lock. Level transitions interpolate the selected focal point on a straight screen path. Pan bounds use the current scene and actual visible items, including sparse grid corners. These have regression coverage.
- Native trackpad pinch feel was not directly reproduced by the available browser control interface. The attempted modifier-scroll produced plain panning. Gesture wiring and animation were tested through the actual source handlers with controlled clocks; this is not claimed as a physical trackpad test.

## Independent critique and fixes

The critic inspected screenshots and rejected microscopic phone entry, truncated headings with unused space, oversized company surfaces, and lack of a neighboring-column cue. All four were revised and inspected again. The architect found and we fixed recovery-button pointer handling, elastic-return cancellation around reader close/resize, assistive activation, key-repeat interruption and zero-separation NaN.

## Remaining product issues

- Dense research titles and summaries need reviewed editorial presentation fields; this pass does not rewrite or strengthen evidence claims.
- The uptake-survey record classified as an institutional response needs a data-model review.
- Adjacent records still do not explain their relationships well. The planned problem-discovery model remains necessary.
- Some logos are small website icons, not full brand wordmarks. Their source proportions are preserved; an approved logo asset library remains future work.

## Follow-up: centre-reachable panning and tile alignment (build centre-pan-31)

The earlier bounds were too restrictive: keeping a small group inside the viewport stopped edge items reaching the centre. Resting pan bounds now use the extreme item centres. Movement beyond them follows a rational rubber-band curve, returning after release or 180ms of wheel inactivity. Raw gesture displacement is preserved, so subdivisions and reversals do not compound resistance. A frozen range includes the gesture's initial camera to avoid jumping after an anchored zoom. Sparse-gap recovery happens at release, allowing travel between items. Nothing changes evidence, graph membership, text disclosure or the selected research level; the change supports user-directed inspection of the existing graph.

The return controller handles both scale and translation. Independent architecture/critic review caught tap interruption, additional touch contacts, pan during zoom return, and saving transient overscroll during navigation. These were fixed and covered by actual-controller regressions. New zoom retains its anchor; intentional navigation saves a resting pan position.

Overview text and portraits are vertically centred within each organic tile, with symmetric padding and no zoom-dependent layout changes. Browser measurements confirmed zero centre offset for both text blocks and portraits on all five tiles.

Validation: 58 tests pass in the current combined workspace. New coverage verifies every page item can reach the exact centre at 393/743/1280px and minimum/intermediate/maximum scale; resistance, reversal, interrupted return, no first-delta scale change, and pan-to-pinch handover. Real browser drag and wheel interactions confirmed the first edge item's settled centre at (640,389), matching the map centre exactly, plus opposite boundaries and higher magnification. Visual stills inspected at desktop and 393/743px iframe sizes. No main-page console errors. Physical trackpad pinch remains outside the browser tool's direct input capabilities.

Follow-up proof images in the parent workspace `atlas-qa-after/`: `pan-boundary-settled.png`, `pan-opposite-corner.png`, `centre-pan-responsive.png`, `vertically-centred-overview.png`, `centred-tiles-responsive.png`, and `centred-tiles-zoomed.png`. Earlier images document earlier iterations, not this final build.

## Follow-up: immediate edge reversal and shared alignment (build elastic-pan-33)

The previous pan curve accumulated hidden outward displacement. After substantial trackpad inertia, an inward delta barely moved the display, producing the reported apparent stall. Pan now consumes inward displacement directly in screen pixels; outward movement retains progressive resistance. Reversing across the valid range remains continuous and resists at the opposite edge. Interrupted returns retain the regular pan boundary instead of legitimising overscroll. A return from far outside that curve, possible after anchored framing, holds its existing position for outward input, permits immediate inward travel, and resumes settlement on release; it cannot jump inward through an invalid inverse.

Vertical centring was previously scoped only to people. It now belongs to the shared `.node-copy` layout with symmetric padding, natural-height record summaries and centred illustrations. Provider areas, research groups and company records use the same rule. Description capacity is calculated from the fixed tile's available layout space, preserving zoom-independent content.

Validation: 62 tests passed. Regressions include heavy outward inertia followed by a two-pixel reversal, diagonal and reduced-motion input, reversing across both boundaries, repeated interrupted returns, and far-outside anchored framing. Real browser wheel input changed x from 594.701px to 569.101px on the first 25.6px reverse scroll. All nine provider text/art centres and five company content centres were measured at zero offset (floating point tolerance). Visually inspected provider/research/company stills and 393/743px responsive views, with no visible clipping and no main-page console errors. Independent review found the out-of-range inverse case above; its fix was reviewed and approved. Native physical trackpad feel is still not claimed as directly tested.

Proof: `shared-centred-provider.png`, `shared-centred-research.png`, `shared-centred-companies.png`, `shared-centred-responsive.png`, `elastic-pan-overshoot.png`, and `elastic-pan-settled.png` in the parent workspace `atlas-qa-after/`.

## Follow-up: browser-owned trackpad pan (build native-pan-35)

The earlier custom edge animation still guessed release using 180ms inactivity. DOM wheel events mix direct manipulation with momentum and do not expose the native gesture phases needed to reproduce finger-down hold and release. The user's timing complaint was therefore not resolved by adjusting the resistance curve. Native trackpad panning now uses a real overflow scrollport with `overscroll-behavior:contain`; the browser owns its momentum and supported edge affordance. Ordinary wheel pan is not prevented, does not call `panMap`, and never schedules the custom pan return. The previously accepted zoom curve is unchanged. Explicit pointer dragging/touch recognition retains its existing path with known pointer release; this change is specifically to trackpad/wheel pan.

Sources: [WebKit issue150020](https://bugs.webkit.org/show_bug.cgi?id=150020) describes the inability to distinguish fingers-on-trackpad from momentum and correctly time elastic release. [CSS Overscroll Behavior](https://drafts.csswg.org/css-overscroll/#overscroll-behavior-properties) explains that `contain` prevents scroll chaining while preserving supported native overscroll feedback. Native feedback varies with the browser/platform; this is not a guarantee of identical rubber-band visuals on every host.

The map content and dot grid share an explicit-size scroll surface. Programmatic camera commits (zoom, navigation, resize) set its dimensions and offsets. Native scroll callbacks only read offsets, update the camera and render at a fixed content origin; they never write offsets back. Small scenes remain mounted to avoid compositor/culling flashes. Large unpaged scenes still window by viewport before the90-item budget, preserving later-item reachability. An interrupted custom zoom/pan return is resolved once before native input takes over, avoiding a competing animation and invalid zoom scale.

Validation: 74 tests passed in the combined workspace. New tests assert no scroll-offset writes on native scroll, stable content origin, zoom/resize mapping, no artificial single-item travel, >90-node reachability, unprevented ordinary wheel input, zero writes for fractional camera positions, first-pinch handover, and interrupted zoom return→native pan. Real browser checks covered both horizontal limits, small immediate reversal, plus/fit controls, clicking a record after scrolling, and closing the reader to restore the map. No main-page console errors. Independent architecture and critic reviews found the interrupted-zoom and large-scene issues; both were fixed with regressions. Still images: `native-pan-zoomed.png` and `native-pan-final.png` in the parent `atlas-qa-after/` folder. These verify layout and interaction plumbing, not fingers-resting-on-trackpad timing, which the automation interface cannot reproduce.

## Follow-up: one shared elastic camera (build shared-elastic-37)

Native edge feedback was absent in the user's browser. At their request, pan now uses the same elastic response and return controller as the accepted zoom interaction. A shared rational resistance function operates on log scale for zoom and viewport-relative pixels for pan. Pan permits immediate inward reversal without repaying hidden outward travel. Both use the established 180ms wheel-idle and 240ms return policy. This is custom feedback; DOM wheel input still cannot expose exact finger-contact phases.

The entire map now moves under one parent camera transform. Tiles retain fixed positions, dimensions and content during movement; their individual layout styles remain unchanged. The native scroll surface and adapter have been removed. Independent critique identified focus-induced scrolling: Tab onto a partly visible lower tile changed native scrollTop to195px independently of the camera. The map now uses overflow:clip. Repeating that browser interaction leaves both native offsets at zero.

Validation: all71 tests pass in an isolated snapshot containing only this change and the existing branch contents. New coverage verifies normalised pan/zoom resistance equivalence and parent-transform geometry versus screen hit bounds. Existing tests cover immediate reversal, interruptions, pan-to-pinch handover, sparse scenes, centre reachability, reduced motion and large-scene item reachability. Architect review found no blocker. Browser checks and visual stills cover root, provider, research detail, zoom, edge movement, record opening/closing after pan, and keyboard focus. Physical trackpad release timing is not claimed as directly tested.

Proof images in the parent atlas-qa-after directory: shared-elastic-edge.png, shared-elastic-detail.png, shared-elastic-final.png. The final screenshot shows the fixed keyboard-focus path. During final QA another chat changed the shared workspace data loader, making localhost:8765 unable to load research. Its work was preserved; the isolated reviewed preview runs at localhost:8776. No database or evidence changes belong to this camera revision.
