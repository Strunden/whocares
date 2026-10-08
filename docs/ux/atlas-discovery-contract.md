# Atlas discovery contract

Status: broader read-model proposal, with an implemented internal slice on 8 October 2026. Presentation/media and reversible catalog dispositions are tested on an isolated Neon branch and exported to the local index. No public deployment or primary migration. See [the cleanup record](catalog-cleanup-20261008.md) and [display criteria](information-and-display-contract.md).

## Authority and scope

This contract implements the current `who-cares-product` principles, version 1, SHA-256 `1698c1ce402af9694166b15938d24fb9fb05c55e85a330b4e589b7dca5b2a8c2`, alongside the reviewed [product vision](../PRODUCT_VISION.md), [problem-space brief](../PROBLEM_ATLAS.md), [knowledge model](../KNOWLEDGE_MODEL.md), [UX principles](../UX_PRINCIPLES.md) and [research standards](../RESEARCH_STANDARDS.md). It is a reviewable implementation proposal, not a new principle version or a completed data migration.

The user is a venture builder developing an accurate mental model and a useful next research question. The people represented in the map are its subjects. Their perspectives must help explain aspirations, situations, frictions, mechanisms and institutional responses without suggesting an investment verdict.

The existing graph model supports this first-slice proposal; its sparse coverage is not an adequate completed atlas. Preserve its objects, relationships, sources, evidence links, stable IDs, provenance and audit history. Add a small publication layer and scoped queries; do not rebuild the graph around interface containers or company categories.

The live inventory verified during this task is **17 objects, 13 relationships, 3 sources, 1 problem space, 2 problems and 75 staged legacy records**. This is a first research slice. Legacy records are not validated problems, and the missing historical 48-space / 384-candidate / 50-source material has not been recovered by this work. Counts describe coverage, not completeness or opportunity size.

## Four reading levels

Perspective is a lens applied across these levels, not a fifth ontology depth. An illustrated perspective entry can remain part of the spatial interface, but choosing it sets `lens_stakeholder_id`; it must not create a second problem taxonomy.

| Level | User question | Required display | Selection action |
| --- | --- | --- | --- |
| 1. Landscape | What major frictions shape this landscape, and whose lives or work do they affect? | Problem-space name, short explanation, why it matters, affected stakeholder paths, editorial/evidence status, named and explained cross-space connections, and coverage gaps | Enter a problem space |
| 2. Problem space | What happens here, within what boundaries, and how do its problems relate? | Scope/inclusions/exclusions; specific problems with plain-language obstacle, affected people and status; relevant cross-space connections and unanswered questions | Enter a problem |
| 3. Problem | Who encounters what obstacle, when, why might it persist, and what is already attempted? | Scoped statement; situations, aspirations, mechanisms, workarounds, institutional/commercial responses, tensions and unknowns; each connection's own status and explanation | Inspect a connected context object, assertion or source |
| 4. Context and evidence | What supports this assertion, what does it actually establish, and what remains uncertain? | Complete selected assertion; source/section/date/scope/limitations; support versus contradiction; relationship provenance; relevant company record or explicitly illustrative situation | Follow a sourced connection or return to the preserved problem context |

Level 4 is a document/context reading surface, not another compulsory category folder. Users can inspect an assertion's evidence from any level. A problem may belong to several spaces; breadcrumbs retain the actual traversal path instead of assigning a false unique parent.

Each level answers a distinct question. It uses a consistent information anatomy: identity, explanation, people/scope, epistemic status, evidence access and next action. Appropriate illustration and company logos support recognition. Missing content is visible rather than replaced by generic promotional copy.

The current interaction contract uses explicit selection for changing reading levels and local pan/zoom within a level. Camera changes do not alter the selected level, text content or evidence disclosure. The spatial interface and accessible list consume the same read response and stable IDs. Navigation geometry is a view concern, never a database assertion or an encoding of market size.

The newest user instructions remove story entry, search/filter bars, About, bottom links and minimap from the map shell. An accessible equivalent reading mode is a separate route/design requirement, not permission to restore those controls. Explicit descent and stable local zoom follow the latest user direction; this document does not silently rewrite database principles.

## Existing graph joins

Use the deployed relation directions, not inferred similarity between titles or company tags:

| Read facet | Join |
| --- | --- |
| Landscape spaces | `objects.kind='problem_space'`; top-level spaces have no outgoing `part_of` edge to another space |
| Space members | `relationships.to_id=space.id AND relation='part_of'`; join `from_id` to problems or subspaces |
| Affected people | `problem --affects--> stakeholder` |
| Situations | `problem --arises_in--> daily_situation` |
| Mechanisms | `systemic_cause --contributes_to--> problem`; further cause links remain explicitly scoped |
| Workarounds | `lived_workaround --works_around--> problem` |
| Responses | `solution/institutional_response --responds_to/addresses--> problem` |
| Aspirations | `stakeholder --aspires_to--> aspiration`; show as stakeholder context unless a separate explicit connection establishes relevance to this problem |
| Questions | Selected object `--raises_question--> open_question` |
| Cross-connections | Explicit `context_for` or `tension_with` edges, retaining direction, statement and epistemic status |
| Company detail | `solution.entry_id -> public.entries.id`; the existing company is a response record, not a taxonomy parent |
| Evidence | `evidence_links.object_id=object.id` or `relationship_id=relationship.id`, joined to `sources` by `source_id` |

Nested spaces are permitted by the foundation. If they occur, label them as subspaces at the space level; do not invent extra named levels or silently flatten their scope. Multiple `part_of` memberships are valid. A future migration should reject cycles in `part_of`, without rejecting legitimate cycles in other graph relations.

Do not copy object evidence onto a relationship. A provider page can support an offering description while the claimed response-to-problem relationship remains interpretation. A reviewed citation is not an automatic finding of effectiveness.

## Lens relevance and explainability

All lenses return the same object IDs and assertions. Lens relevance is a disclosed graph path, not a hidden score. A space may be relevant through `problem --part_of--> space` plus `problem --affects--> selected stakeholder`. Return both edge IDs, their directions, statements and epistemic statuses. A candidate or hypothesized link must not be presented as documented stakeholder impact.

Default landscape browsing retains visibility of the wider graph. Where a selected perspective lacks a researched path, distinguish **connection not yet researched** from **not relevant**. Offer the wider landscape without inventing a lens-specific narrative. Do not imply every aspiration of an affected stakeholder explains every linked problem.

The UI includes Angehörige who organise care without necessarily providing it. The foundation currently has older-adult, family-caregiver, professional-caregiver, provider and sustainable-innovator stakeholder records. These are not a one-to-one mapping to the UI choices. Review/add a distinct organising-relative stakeholder and its researched connections; do not repurpose the innovator record or equate relatives with hands-on carers. Stakeholder inclusion can be normative product scope while empirical effects remain unresearched.

## Scoped read response

Proposed endpoint: `GET /api/atlas/browse?level=landscape|space|problem|context&id=...&lens=...&cursor=...`. `id` is required except at landscape level. Validate the selected object kind for the requested level. The actual path is supplied/retained by navigation state and validated against returned graph edges; it is not inferred from an arbitrary first parent.

Every response contains:

```text
schema_version, principles_version, principles_sha256, snapshot_id
level, selected_object_id, lens_stakeholder_id
selected: identity, statement, scope, epistemic_status, confidence, revision
presentation: display_title, orientation_summary, why_it_matters, review_state
items[]: stable object identity + presentation + status + asset bindings
connections[]: id, from_id, to_id, relation, statement, status, confidence, revision
inclusion_paths[]: object_id, ordered relationship IDs, explanation, path status
facets: situations, aspirations, causes, workarounds, responses, questions, tensions
evidence_summary: reviewed support, contradiction, context and unreviewed counts
coverage: known gaps, omitted/unpublished items, completeness scope
next_cursor, has_more
```

Evidence detail additionally includes evidence-link ID, stance, review date, exact locator, note, source title/publisher/type, source URL, publication/access dates, geographic/methodological scope and limitations. Generated asset metadata is never included in evidence counts.

Use bounded queries for the selected object's neighbors and evidence. Return separately paginated facets where necessary. Use stable keyset ordering such as normalized title plus object ID; do not rank by presumed venture value. Preserve a snapshot identifier across pages. Reject/restart stale cursors when the underlying snapshot changes, rather than silently dropping or duplicating entries.

The current foundation whole-graph query caps objects at 500, relationships at 2,000 and evidence links at 5,000. It is useful for the first-slice export, not a scalable browse index. `truncated` must remain explicit while that endpoint exists. Never infer missing relationships from a truncated response.

## Missing-data behavior

- No reviewed display copy: use the object's stored title/statement/status, visibly identified as an unreviewed display fallback. Do not generate stronger claims or suppress the underlying uncertainty.
- No scope: state the missing geography, setting or population; never fill these from a lens label.
- No evidence: show that supporting research has not been attached. Keep candidate, hypothesis, interpretation and illustrative labels.
- No observed situation/workaround: show the gap. Existing illustrative scenes and hypothesized workarounds can appear only with their explicit status.
- No lens path: preserve the object in wider browsing and state the relevance gap; do not fabricate an `affects` edge.
- No mapped response: say no response is mapped in this research slice, not that no response exists.
- No approved image: use a neutral typographic/symbol fallback with no fabricated company logo. Absence of artwork must never make a record unreachable.
- A future search/list mode must treat zero matches as a query result, not an empty domain. Search and filters are deliberately absent from the current map shell.
- Legacy records: retain an explicitly named legacy research route. Do not place them among validated problems without reviewed mapping and preserved provenance.

## Additive display-copy proposal

Propose `atlas.object_presentations`; preserve `atlas.objects` as assertion authority.

| Field | Requirement |
| --- | --- |
| `id` | Text primary key |
| `object_id` | Required FK to `atlas.objects`, delete restricted |
| `locale` | Required, initial default `en`; unique with `object_id` |
| `display_title` | Required nonempty short title, preserving claim meaning |
| `orientation_summary` | Required concise explanation |
| `why_it_matters` | Optional scoped explanation; absent when unsupported |
| `review_state` | `draft`, `reviewed` or `retired` |
| `reviewed_by`, `reviewed_at` | Required for reviewed copy |
| `review_basis_sha256` | Required 64-character hex fingerprint for reviewed copy |
| `provenance` | Required JSON object describing authorship and derivation |
| `revision`, `created_at`, `updated_at` | Same revision/audit conventions as existing graph |

Start with one shared presentation per object/locale. Do not duplicate claims into five persona-specific text sets. Explain perspective relevance through graph paths.

Display copy is a reviewed restatement of the object's assertion. New substantive claims must be represented and sourced in the graph before being added to the copy. The review fingerprint includes canonical object content/revision and the exact evidence links, relationships and source records relied on. Store the dependency IDs and revision/checksum manifest in provenance. Sources currently have no revision field, so checking only `objects.revision` cannot detect all stale copy. The export/read-model builder recomputes this fingerprint; mismatches yield a stale review state and the conservative fallback. This freshness mechanism must be implemented before a reviewed badge is shown.

Publication review and epistemic status remain independent: a reviewed research candidate is still a candidate. Reuse audit/revision triggers, set `atlas.batch_id` within every write transaction and require review metadata through constraints. No live table is added by this document.

## Asset registry and object bindings

Follow the [illustration engine contract](../ILLUSTRATION_ENGINE.md) and its [API](../../workers/illustrations/API.md). The approved recipe is `sparse-wash-v2`, with reference library `sketch-color-v1`. The service returns a generated candidate, provenance and advisory review; human inspection remains necessary. Never expose service credentials or make its loopback API part of public browsing.

Propose `atlas.assets` with these fields:

| Field | Requirement |
| --- | --- |
| `id` | Stable primary key |
| `storage_uri` | Required immutable persistent object URI/key or versioned site asset path; not a temporary local API URL |
| `sha256`, `mime`, `width`, `height`, `byte_size` | Required integrity/type metadata; valid hex checksum and positive dimensions/size |
| `asset_version` | Positive immutable content version; replacements receive a new version/key |
| `media_kind` | `illustration`, `company_logo`, `product_image` or `document_image` |
| `origin_kind` | `generated`, `sourced` or `uploaded`; generated media must be illustration |
| `source_url`, `credit`, `rights_note` | Source/attribution metadata where applicable; unknown rights remain visible for review |
| `generator_result_id` | Original service result ID where applicable, retained for recovery |
| `generation_metadata` | Scene, template, model/provider, style/prompt/reference versions, settings, usage and advisory review; no credentials |
| `review_state` | `pending_human_review`, `approved`, `rejected` or `retired` |
| `reviewed_by`, `reviewed_at`, `review_note` | Required approval identity/time; record corrections or limits |
| `provenance`, `revision`, timestamps | Required authorship/import history and audit support |

Store bytes in persistent asset storage; PostgreSQL stores identity, URI, checksum and metadata. The generator's protected `/v1/images/:id/image` URL and ignored `.local/` runtime directory are not production asset storage. Promotion copies approved bytes to a versioned site path or object store, verifies checksum, and registers the persistent URI. A browser-facing URL is resolved from that URI by the read service/export. Keep internal-only metadata out of public responses.

Propose `atlas.object_assets`:

- `id`, required `object_id` and `asset_id` FKs with restricted deletion.
- `role`: `portrait`, `overview`, `situation`, `response` or `supporting`.
- Optional `lens_stakeholder_id`, constrained to an actual stakeholder object.
- Required contextual `alt_text`, optional caption and `is_primary` boolean.
- Binding `review_state`, reviewer/time, provenance, revision and timestamps.
- At most one approved primary binding per object/role/lens, treating null lens as the shared default. Use partial unique indexes for shared and lens-specific bindings.

An image can serve several objects, and an object can have several images. A lens-specific primary overrides the shared primary for that role only. Referenced asset and binding must both be approved before display. Content-specific assets are optional; generic approved illustrations can be reused through explicit bindings without baking layout into image files.

Generated origin always produces an **illustrative** caption in the read model. An image's approval is aesthetic/content suitability, never research verification. No asset approval creates an `evidence_link`, increments evidence counts or promotes an object/relationship status. A sourced document image can accompany a genuine source record, but its scholarly claim still travels through `atlas.sources` and `atlas.evidence_links`.

## First-slice walkthrough

1. **Landscape:** show `space-everyday-participation`, “Participation in everyday life”, as an editorial problem-space boundary, alongside a clear first-slice coverage statement. Do not manufacture a complete landscape of legacy categories. The older-adult lens can explain the path through `problem-environmental-barriers` and its explicit `affects` relationship.
2. **Space:** show two distinct problems. `problem-environmental-barriers` is a broadly documented, single-source global claim. `problem-digital-family-contact` is a candidate question with geography/population/setting not established. Display their differing statuses before entry. Retain the space's open research questions about lived needs, care-work implications and outcomes.
3. **Problem:** entering digital family contact shows `situation-family-call` as illustrative and `workaround-family-assistance` as hypothesized. The family-caregiver effect is itself a hypothesis. `solution-amara-home` appears as a documented provider-described offering connected through an interpretive response link. It is not proof of effectiveness against loneliness. Entering environmental barriers instead reveals the WHO-grounded mechanism and institutional response, with broad scope limits.
4. **Context/evidence:** opening Amara exposes the provider source and its exact claim scope; opening its response edge exposes the weaker interpretive connection separately. Opening the environmental problem exposes the WHO source section and the absence of a local prevalence/causal estimate. Returning preserves the problem and traversal path. A care-worker/provider lens exposes the unresolved relevance question rather than inventing impact evidence.

This walkthrough uses existing IDs and assertions. Illustrations remain independently replaceable assets. It requires editorial copy review and a scoped read response, not a replacement ontology.

## Acceptance criteria

1. Before opening a space, a visitor can explain one friction, whom it affects and a meaningful cross-space connection, or identify that connection as an explicit research gap. All four levels answer their specified user question using the same graph IDs. Changing lens never duplicates or changes a problem assertion.
2. Every space-to-problem membership and displayed causal/response connection identifies a stored relationship. Relevance explanations expose the path and each edge's status.
3. The first slice returns exactly its two problems beneath the one space; legacy records are not silently promoted or presented as complete research coverage.
4. A visitor can distinguish the documented environmental claim, candidate contact problem, illustrative family-call scene, hypothesized workaround and interpretive Amara connection before opening sources.
5. Claim and relationship evidence are inspected separately. Provider descriptions do not acquire outcome claims; generated assets never count as evidence.
6. Angehörige organising care remain distinguishable from hands-on family caregivers. An unresearched lens path produces an explicit gap and access to wider research.
7. Approved display copy becomes stale when any declared review dependency changes. A stale/missing presentation uses the conservative stored-assertion fallback.
8. Every displayed asset has a retrievable persistent URI, matching checksum, version, provenance, alt text and approved asset/binding review. Missing or rejected artwork leaves the record usable.
9. Pagination returns every matching item without duplicates within a stable snapshot; stale cursors and partial coverage are explicit. No fixed whole-graph cap silently defines the landscape.
10. Multiple parents preserve the actual breadcrumb path. `part_of` cycles are rejected by the proposed integrity migration; ordinary graph crosslinks remain allowed.
11. The map and accessible list expose the same items, evidence states and source access. Local zoom does not switch reading level or change displayed copy; opening evidence and returning preserves location.
12. No rank, numeric attractiveness score, company count or territory area implies venture priority. The experience leaves the visitor with a specific research question they chose.
13. An independent critic reviews orientation, discovery, mechanism, perspective, evidence, agency, interaction and visual fidelity against this fixture. Functional tests alone do not constitute user validation; record what a venture builder can explain and what false confidence remains.

## Safe implementation sequence

First implement the scoped read response against the existing first slice and a reviewable local fixture. Review display copy, missing-data states and the four-level walkthrough. Then prepare additive migrations for presentations/assets/bindings and any `part_of` cycle guard. Test them on a Neon branch with a backup and a batch ID, checking audit records, constraint failures, cursor behavior and source preservation. Measure the existing whole-graph deferred evidence validators before expanding imports; their current per-row global scans may become expensive.

Do not replay foundation seeds, overwrite live research, deploy the UI or migrate production merely because this proposal exists. The concrete proposed migration and data changes remain a separate reviewable action. This deliverable changed no database schema or records.
