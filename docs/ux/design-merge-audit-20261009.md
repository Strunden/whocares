# Design merge audit — 9 October 2026

Review of the local build at port 8793 against the user's decisions. This is a findings log, not a replacement design brief. No public deployment or database mutation was performed in this correction.

## Corrected locally

- Removed the unagreed “Scope & evidence” map control, its listeners and unused styles. Evidence remains accessible in records and via the current breadcrumb.
- Removed the duplicate map heading and introductory block following the user’s explicit correction. Subsequent user refinement: the brand’s tagline appears only at the root; within branches short database-authored breadcrumbs replace it. There is no root “All needs” row.
- Removed the residual image brightness filter. Desaturation was already absent. The faint organic backing and paper compositing remain.
- Repaired the root test command, which pointed at a deleted test location. It now runs the existing frontend and API suites together: 95 passing tests.

## Open findings, in priority order

1. **The solution layer is visually unfinished.** The live discovery response contains 37 mapped offerings, only three with a resolvable logo reference, zero with product/service imagery, and zero reviewed media rows. This checks configured media, not whether the three logo URLs successfully load. The care-home solution map visibly renders text-only items. This fails the requested authentic logos/product shots and no image-less items requirement. Research authentic provider assets and attach them to the existing identities; do not generate substitute logos or reuse unrelated portraits.
2. **Research-process wording leaks into browsing copy.** AOK-Pflegenavigator says “No successful search or booking was tested.” compass says “No resolution of family disagreement or placement outcome established.” These express limits of our research, not a concise description of the offering's relevant access or service boundary. Preserve those qualifications in evidence details while making map copy useful for comparison. Do not convert unverified outcomes into claims of provider failure.
3. **The reading panel still resembles a database report.** The inspected Pflegestützpunkte Berlin record repeats scope, research rationale, source caveats, relationship assertions and old editorial titles. Evidence is available, but the hierarchy and repetition obscure what a venture builder wants to compare. Lead with offering, fit, access/cost/geography and relevant limits; keep source methods and repeated relationship evidence behind deliberate inspection. Do not delete evidence or silently change claim status.
4. **The merge changed header controls beyond the tile/grid work.** “Search” and “How to explore” text buttons remain. They differ from the supplied compact icon reference. They were not explicitly individually prohibited, but should not have been presented as simply preserving the original shell. No further header redesign was made during this audit.
5. **Perspective and adjacent-branch exploration are incomplete.** Lens metadata remains in the graph, but the current UI always hides the perspective control; old lens URLs are not a discoverable interaction. There is also no concise map-level adjacent-need route beyond returning through breadcrumbs or following verbose record relationships. Do not reintroduce the rejected dropdown merely to fill this gap.
6. **The illustration composition is uneven.** Care-home situations have noticeably smaller central scenes than the approved respite reference, with more unused paper around them. Removing the brightness workaround also exposes pale rectangular image backgrounds in these scenes, contrary to the seamless-edge requirement. File existence and a valid image path are not sufficient visual acceptance checks. Review actual subject scale, distinction between situations, older-adult age cues and feathered edges at the rendered size.
7. **A unified visible tree is not a complete reindexing of all research.** Six needs and nineteen situations use the new navigation contract; preserved historical catalogue and research records remain searchable outside it. Claims that the entire existing dataset has been reorganised would overstate the completed work.

8. **Source presentation contains a misclassification.** The care-home need’s Verbraucherzentrale consumer-guidance source appears as “provider claim” with the generic “Provider-described offering” caveat. That is inappropriate for this source and need record. The record still labels the need as a research candidate; fixing the source type must not promote it to a validated need.

## Preserved and checked

The care-home need opens a situation map, then an existing-solution map, then a source-backed record. The current breadcrumb still opens evidence after removing the extra button. Large need/situation illustrations, subtle organic backing, the moving dot grid, brand subline, breadcrumbs, horizontal zoom controls, and absence of per-item arrows remain. Zoom retains current-level content. No generated-illustration provenance caption was observed.

Validation: 95 existing tests and the database-only build guard pass. Browser inspection covered care-home need, solution level, record and the corrected map. This was not an exhaustive visual review of every illustration or every source; mobile remains excluded. Public deployment is separate from this local correction.
