# Real-app critique loop — 8 October 2026

This iteration follows the user's updated direction: structured information surfaces on a pannable map with explicit reading levels and Prezi-style travel. These later instructions supersede the older organic/continuous-zoom presentation brief. Current live product principles were read again: v1, SHA256 1698c1ce402af9694166b15938d24fb9fb05c55e85a330b4e589b7dca5b2a8c2. No database records or principles were changed.

## Actual inputs

- Published legacy snapshot: 403 records, including 328 companies, 25 themes/parent themes and 50 thesis cards.
- Compact feed now retains existing logo paths, website, country/city, recorded buyer/user and source-link count. It does not invent absent buyer information or infer outcomes from sources.
- Read-only graph snapshot: 17 objects, 13 directed relationships, 3 sources and claim/relationship evidence links. One independently framed problem space is available. This is a first research slice, not comprehensive care coverage.
- Full company records continue loading on demand. Logos use the existing configured service; unavailable logos use initials. No synthetic brand assets are generated.

## Frozen independent critique gates

Orientation; meaningful information gained at each layer; actual record coverage; company identity; scope and provenance; user agency; spatial interaction; accessibility and scale. A separate critic reviewed the data contract and implementation. This is internal critique, not a venture-builder participant study.

## Iterations

| Failure | Implemented correction | Remaining limit |
| --- | --- | --- |
| Organic bubbles gave long text narrow, unpredictable shapes | Rectangular editorial records, restrained territory backgrounds, consistent title/summary/action areas | The spatial arrangement remains editorial, not semantic distance |
| Alphabetical range titles taught nothing | Direct records, alphabetical order, local text search, type filter and pages of six; all records remain reachable | Broad legacy collections still require discovery research |
| Overview was a menu of titles | Scope and named subtopics shown before entering | Legacy scope is framing, not independently validated taxonomy |
| Company cards lost identity and useful metadata | Existing logos, concrete offering, location and recorded buyer; stable initials fallback | Logo service is external; some records lack metadata |
| Hypotheses were incorrectly labelled themes | Actual thesis_card values handled; historical kill/standing decisions removed from headline status | Legacy text is preserved and explicitly framed as analyst material |
| Every item appeared to be equivalent evidence | Distinct problems, mechanisms, situations, workarounds, institutional responses, products and questions; status visible | Many graph records are hypotheses or illustrative |
| Causal connections could read backwards | Full source → relationship → target sentence with separate relationship evidence | An edge can remain interpretation or hypothesis |
| Graph product card dropped available linked-company metadata | Retain recorded identity/metadata through stable entry_id | Company metadata does not substantiate graph claims |
| Deep columns became narrow; actions clipped | Consistent cell proportions, at most three columns, fixed action area, bounded copy, less repeated header chrome | Full statements and scope still belong in reader |
| Phone camera inset clipped first card | Align the first card to a 16px margin; preserve panning to adjacent cards | Physical touch and screen-reader sessions untested |
| Search reran for each camera frame | Cache collection matches by group/query/type; page slicing stays bounded | Entire metadata snapshot still resides in memory |
| Naive graph join repeated full scans | Indexed source, object-evidence, relationship-evidence and adjacency maps | Arbitrary huge-graph layout is not validated by the legacy scale fixture |

## Information contract

1. Overview: type of collection, title, scope, named contents, entry action. The graph's problem space is visibly separate from legacy research collections.
2. Space/theme: actual problem or research record, specific statement, epistemic status, scope/basis where stored, routes into connected records and original sources. Current graph framing itself has a Scope & sources action.
3. Record collection: company logo/name/offering/location/recorded buyer; research hypothesis or typed graph entity uses its own identity and status. Direct item access; directory sorting is explicit and does not imply priority.
4. Reader: full claim, population/setting/geography, qualitative basis and rationale, source type/locator/date/limitations, directed related claims and evidence specific to those relationships. Historical analyst decisions remain available in legacy detail, not judgments of problem validity.

## Reproduce

Run `npm run build:atlas`, `npm run test:atlas`, then serve `site/` on port 8765. Open:

- `/#/provider/g/quality` — structured legacy research themes.
- `/#/provider/g/quality%2FT04` — actual company/hypothesis cards, logos, filtering and paging.
- `/#/provider/g/space-everyday-participation` — actual graph problem space and open questions.
- `/#/provider/g/space-everyday-participation%2Fproblem-environmental-barriers` — mechanism and institutional response.
- `/?stress=100000#/provider` — explicitly synthetic legacy-record scale fixture.

A new authorized graph export can be imported with `node scripts/import-atlas-graph.mjs /path/to/export.json`. The command validates stable identities and graph/evidence references, retains source fields, and never accesses the database. Supply objects, relationships, sources, evidence_links and snapshot metadata. Normal compact-index rebuilding preserves this graph snapshot.

## Product-alignment judgement

This is useful experimental UI over real records, not a completed atlas taxonomy. The imported problem space is independent of company themes and preserves authored boundaries and epistemic states. Bottom-up scenario and workaround are explicitly illustrative/hypothetical; WHO material supports a broad environmental mechanism, and Amara material supports an offering rather than an outcome. All lenses share these graph identities. No ranking or opportunity selection is introduced. The larger legacy collection remains clearly labelled and cannot stand in for independent problem research.

## Imagery and final content critique

- Independent visual critique confirmed readable company logos, offering/buyer separation and source actions. It caught an old payer verdict promoted into a collection header; headers now describe the real record mix and keep that assumption in Original research.
- Phone tests verified 393px document width with no horizontal page overflow, first card x=16px and width=357px, and source actions inside the card. Long graph mechanism text was tested; full wording remains available in its reader.
- Images use a reusable media contract: src, alt, kind, source, credit, checked. Record-supplied media takes precedence over the starter registry. Product imagery comes from a provider source, not generated fictional product depictions. The Amara product image was located on https://amara.app/ and its actual load verified in the browser. It is hotlinked, not copied into this repository. Existing generated family assets are labelled Illustration; they do not document fieldwork. Missing media is omitted; missing logos keep initials. Production media rights/source continuity still require normal asset management.
- Evidence status was moved above descriptions after imagery pushed it toward the reserved footer. This keeps illustrative/hypothetical status visible before truncated copy. Empty scope/basis values no longer consume card space; complete gaps remain explicit in the reader.
- Direct hash-route handling was added and browser-tested while traversing the graph.

## Verification result

19 automated tests cover real-data coverage, 100k synthetic legacy records, pagination/filtering, stable graph identity across all lenses, separately scoped claim/relationship sources, historical-status handling, real thesis-card typing, safe logo/media resolution and unchanged on-demand full records. Real-browser checks cover logos and sourced imagery loading, company reader, directed mechanism/source reader, fixed-scale panning, collection search, paging without camera changes, and desktop/393px phone layout. No console errors were observed in the tested flows. Actual image richness remains limited by the available sourced asset library, and arbitrary huge-graph layout, physical touch, screen readers and participant comprehension remain unvalidated.

The final real-browser scale run loaded 100,000 synthetic records plus the published data. Care admin contained 50,006 records across 8,335 pages. Searching 099998 returned the exact synthetic record; the DOM contained 173 elements. Keyboard panning moved x by +50px with scale fixed at 4.9966900953, and no console errors were captured. This validates bounded collection browsing, not comprehension of 100,000 real research claims.
