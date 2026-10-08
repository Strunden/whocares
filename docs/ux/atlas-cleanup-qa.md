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
