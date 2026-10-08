# Atlas v2 validation, 8 October 2026

## Preview

From the repository root run `python3 -m http.server 8765 --directory site`, then open http://localhost:8765. No dependency installation or build is required. `browse.html` preserves the previous research index. Legacy home hash links to entries and funders redirect there.

## Hard critique rubric

Assess the product against these gates, separately from implementation correctness. These are agent review findings, not a claimed independent participant study.

| Gate | Failure condition | Findings and iteration |
| --- | --- | --- |
| Venture-builder discovery | Visitor cannot get from a need to incumbent responses and a next research question | Every territory offers a fieldwork question, linked problem decisions and actual companies. Killed ideas remain visible. Participant comprehension still needs validation. |
| Mental model | Territory size or lens implies a ranked market or separate dataset | Area/position disclaimer and lens interpretation notice; lenses dim but retain all territories. Dashed territory connections are editorial context, not quantified causal edges. |
| Evidence trust | Fiction is attributed as observation or research decision as proof of need resolution | Explicit fictional workflow notice; source-record links; incomplete company research flags. Corrected a story link that incorrectly connected documentation to benefits administration. No invented quotes or economics. |
| Usability | Pan triggers detail; wheel selects territory; keyboard or phone has no usable route | Real wheel and drag tests; keyboard Enter detail; direct territory navigation added after phone overview labels failed readability. Escape closes detail and restores focus. Native story dialog manages modal focus. |
| Aesthetic fidelity | Box-and-line graph dominates, chrome competes with landscape, labels collide | Soft translucent SVG territories and restrained editorial typography. Fixed desktop heading wrap and phone labels. Exact reference-image fidelity cannot be certified because cached conversation exposed no image. |

## Real-browser checks

Codex in-app browser, desktop 1280 × 720 and phone 393 × 852:

- Research landscape loaded from bundled index without build or external map dependencies.
- Wheel produced continuous 111% zoom, not preset views. Transform changed from `translate(154.2105 35) scale(0.6842105)` to `translate(101.0883 1.3559) scale(0.7622432)` around cursor (620, 420), whose map-local y is 330. Cursor world coordinate was preserved.
- Drag by (80, 30) changed translation by (80, 30), retained scale, and did not open a panel.
- Zoom-in controls revealed problem labels at 144%; Overview restored 100%.
- Keyboard Enter opened The work of care. Close restored territory focus.
- Phone Care worker lens and territory selector opened actual problem/company records. Lifting and transfers link loaded the existing entry with job and payer details.
- Five-scene workday dialog opened and closed on phone; illustrative notice and linked research visible.
- Atlas console: no warnings or errors. Existing index emitted its expected static fallback warning because no live API was served locally, then loaded successfully.
- Syntax and whitespace checks passed.

## Limits / follow-up validation

Touch pinch code supports two pointer IDs but was not tested on physical touch hardware. Browser zoom, drag, layout and keyboard checks are not a substitute for screen-reader testing or a venture-builder comprehension study. Existing research is a dated snapshot; no source claims were refreshed in this UI task. Some records lack public primary evidence and remain explicitly incomplete. This implementation does not rank opportunities.
