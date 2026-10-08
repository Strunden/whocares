# Exclusive pan and zoom — 2026-10-08

The user's latest instruction is decisive: pan and zoom must be separate gestures, and zoom must not alter text or revealed content. This supersedes both the pan-only prototype and the subsequently proposed automatic outward level threshold. Live principles v1 were reread (SHA256 1698c1ce402af9694166b15938d24fb9fb05c55e85a330b4e589b7dca5b2a8c2). No database or canonical principles changed.

## Research and decision

Official product documentation supports explicit input semantics:

- [FigJam](https://help.figma.com/hc/en-us/articles/1500004414582-Pan-and-zoom-in-FigJam): scroll or drag pans; Shift-scroll pans horizontally; pinch and Ctrl/Command-scroll zoom; buttons provide zoom increments.
- [Miro](https://help.miro.com/hc/en-us/articles/360017731053-Using-Miro-with-a-mouse-trackpad-or-touchscreen): trackpad two-finger slide pans and pinch zooms. Mouse and trackpad have distinct settings; using mouse mode with a trackpad makes two-finger sliding zoom instead.
- [tldraw](https://tldraw.dev/sdk-features/camera): supports explicit wheel behavior and input preferences rather than requiring one universal mapping.
- [MDN wheel events](https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event): trackpad zoom can arrive as wheel events with ctrlKey true; wheel deltas have pixel, line and page units.

We adopt the FigJam / trackpad convention. Removed the unreliable per-event horizontal/vertical delta comparison that switched modes during diagonal scrolling. Removed simultaneous pinch-centroid translation. The exact 180ms transaction window and touch thresholds below are implementation choices to validate on hardware, not published universal UX constants or proof of user validation.

## Interaction contract

- Plain scroll, drag and arrow keys pan. Shift-scroll pans horizontally. Pinch or Ctrl/⌘ + scroll zooms. Plus/minus zoom at the viewport centre.
- Wheel mode and zoom anchor lock at gesture start until a 180ms idle gap. Events requesting another mode during that transaction are ignored, including plain-scroll tails after a pinch. Mouse dragging suppresses wheel input.
- Touch waits through small/ambiguous movement, then locks to translation or finger separation. A stationary-finger pinch resolves after a 60ms ambiguity window. Zoom keeps the initial centroid anchored without adding translation. Pan never changes scale. The mode persists until all fingers lift; lifting/replacing one finger cannot unlock it, and adding a second finger to an established pan preserves pan.
- Local scale spans the readable entry scale to 2.4×, or 3× at overview. Reaching either boundary clamps the camera; it never changes level, record type, content or disclosure. Minus disables at the minimum. Click groups to enter; breadcrumbs/Backspace return; Overview resets to readable entry framing.
- Unit dimensions and text wrapping are fixed, independent of local magnification. Culling, keyboard inertness and counts use actual displayed bounds. Zoom moves the world and card centres. Pan bounds are applied only during pan, so they cannot introduce extra drift into cursor-anchored zoom.
- Parent camera memory restores position and magnification. Reader closing restores the map. Level travel ignores in-flight wheel/pointer input; reduced motion skips animation.

## Critique and verification

Independent code review caught wheel/input switching, touch ambiguity for anchored pinches, reclassification after replacing one finger, and the possibility of changing an established pan into pinch. Corrected these paths. Follow-up review also caught a missing branch brace that blocked two-pointer input; tests now exercise the actual event-handler wiring in an isolated Node harness, including pinch, finger replacement, established pan and mixed wheel sequences. Earlier browser testing caught a 27.5px parent-return shift from the collection toolbar resize; viewport memory is now recorded after rendering.

Automated checks cover cursor anchoring, inverse zoom, mixed wheel sequences and fixed anchors, ambiguous and anchored touch traces, persistent mode decisions, invariant reading surfaces, graph integrity and 100,000-record hierarchy.28 tests pass.

Real in-app browser, 1280×720: native vertical scroll moved y by 72px with scale exactly unchanged (4.996690095259587). Two zoom-button activations raised scale to 7.195233737173805 while dala.care remained 350×290px with 21px title text, identical complete card text and the same services/T13 reading level. Dragging, keyboard zoom, exact ancestor camera restoration and source-reader return were also exercised. No console errors observed.

Responsive browser checks use 393×852. Phone cards remain within viewport width and their source controls remain in the reading surface. Physical two-finger touch/trackpad hardware and screen-reader testing are still required; native wheel/drag, button/keyboard tests and mathematical gesture traces do not replace that testing.

## Product-alignment limits

Magnification supports spatial inspection without altering evidence or graph membership. Problem definitions, lived/systemic evidence distinctions and uncertainty labels remain intact. No opportunity ranks or artificial claims are added. The legacy retrieval taxonomy and small research-graph slice retain the coverage limitations documented in atlas-real-data-critique.md. Functional checks and independent code critique are not venture-builder user validation.

## Try it

Serve site locally; open /#/relative and enter Finding care. Scroll diagonally: only the position should move. Pinch or hold Ctrl/⌘ while scrolling: only magnification should change around its fixed anchor. Use + and − to check the same bounds. Text, wrapping and card contents must stay identical. Clicking Care admin changes the data level; the Finding care breadcrumb restores the previous view. Repeated zoom-out at the minimum must never navigate upward.

The later scene refactor and current verification supersede the historical surface measurements above; see [the current system contract](atlas-system.md).
