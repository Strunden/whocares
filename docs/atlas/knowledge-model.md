# Problem atlas knowledge model

## Authority and current state

The live Neon database is the single queryable authority for principles and graph records. `atlas.principles_versions` is append-only; `atlas.current_principles` selects the highest version for each key. Version 1 contains 12 principles and five alignment checks. The owner’s 8 October 2026 request and referenced conversation provide product provenance, not empirical evidence.

`WHOCARES_PRODUCT_NORTH_STAR.md` and `db/seeds/product-principles-v1.json` mirror version 1. Canonicalization recursively sorts JSON object keys, preserves array order, and encodes compact UTF-8 JSON. SHA-256: `1698c1ce402af9694166b15938d24fb9fb05c55e85a330b4e589b7dca5b2a8c2`.

## What is a problem space?

A bounded, revisable grouping of related human, operational or systemic frictions that impede valued outcomes. State who is affected, in which situations and settings, what is in/out of scope, how problems connect, what mechanisms are proposed, how people and institutions respond, and what remains unknown. Boundaries are editorial interpretations with provenance. Overlaps are allowed. A market category, diagnosis or collection of companies alone does not define a problem space.

## Database relations

| Relation | Purpose |
| --- | --- |
| `atlas.principles_versions` | Versioned product decisions; immutable existing versions |
| `atlas.current_principles` | Queryable latest version per policy key |
| `atlas.objects` | Typed graph nodes, scope, evidence status, confidence rationale, provenance and revision |
| `atlas.relationships` | Explicit typed connections with their own statement, confidence and provenance |
| `atlas.sources` | Evidence origin, publisher, kind, access date, scope and limitations |
| `atlas.evidence_links` | Claim/relationship to source, supporting/contradicting/context/origin stance, precise locator and review time |
| `atlas.legacy_records` | Lossless original idea row/document copies pending review |
| `atlas.import_batches` | Expected versus actual inventory and missing-artifact gaps |
| `atlas.migrations` | Applied schema/content versions and manifests |
| `atlas.write_log` | Every successful atlas table insert/update/delete, with before/after rows, actor, batch and transaction |

Object kinds: aspiration, stakeholder, problem_space, problem, daily_situation, lived_workaround, systemic_cause, institutional_response, solution, open_question. A solution can reference an existing `public.entries.id`; deletion is restricted. Existing companies are neither copied into a new taxonomy nor reclassified automatically.

Relationships: part_of, affects, aspires_to, arises_in, works_around, contributes_to, responds_to, addresses, raises_question, context_for, tension_with. The principal relations enforce endpoint kinds. Context and tensions allow cross-cutting connections. Relationships are assertions, not evidence of causation by their existence alone.

Confidence has a qualitative `basis` (not_assessed, single_source, corroborated, contested, not_applicable) and a required explanation. It describes the research basis, not opportunity attractiveness. No numeric opportunity scores are introduced.

Epistemic statuses distinguish documented, interpretation, candidate, hypothesis, illustrative, open_question, normative and reference. “Documented” requires a reviewed supporting source link, checked at transaction end. Product decisions and legacy analyst decisions cannot verify empirical claims. This guard checks record integrity; human claim-level review must still assess whether evidence actually supports a statement. A single provider page can document an offering without establishing the prevalence of a problem or solution effectiveness.

## First slice and limits

Participation in everyday life is an editorial problem space independent of company themes. It connects a broadly documented environmental-barrier problem, a candidate digital-contact problem, a WHO-described institutional response and Amara’s documented offering. The Amara-to-problem connection remains interpretation. Aspiration and family-help workaround are hypotheses; the family-call scenario is illustrative. Three open questions retain missing fieldwork, care-work/provider implications and independent outcomes. Five stakeholder nodes represent product inclusion, not empirical findings. Links for the professional, provider and innovator perspectives must be researched before claiming effects on them.

The 75 legacy ideas are copied intact to staging. Their historical conclusions remain intact in `public.entries`; none is promoted to a verified problem. The reported 48 domains / 384 candidate problems / 50 sources are registered as `pending_artifact`, with actual imported counts zero. No original artifact was located in available local project files, main/UX trees, available git history or database tables. Other remote branch contents, inaccessible chats or external archives may still hold it.

## Query examples

```sql
SELECT version, body FROM atlas.current_principles
WHERE key = 'who-cares-product';

SELECT o.id, o.kind, o.title, o.epistemic_status, o.confidence,
       s.locator, s.source_kind, e.stance, e.locator AS source_section, e.note
FROM atlas.objects o
LEFT JOIN atlas.evidence_links e ON e.object_id=o.id
LEFT JOIN atlas.sources s ON s.id=e.source_id
WHERE o.id='problem-environmental-barriers';

SELECT a.title AS response, r.epistemic_status, r.statement,
       b.title AS problem, a.entry_id
FROM atlas.relationships r
JOIN atlas.objects a ON a.id=r.from_id
JOIN atlas.objects b ON b.id=r.to_id
WHERE r.relation='responds_to';

SELECT id, expected_counts, actual_counts, state, note
FROM atlas.import_batches;

SELECT recorded_at, actor, batch_id, relation, operation,
       record_key, before_row, after_row
FROM atlas.write_log ORDER BY id;
```

## API and exports

Prepared read-only endpoints: `GET /api/principles` returns the current policy version/body/hash; `GET /api/atlas` returns graph objects, relationships, evidence links and source records, with statuses intact. The graph query runs as one database statement. Caps are 500 objects, 2,000 relationships and 5,000 evidence links; `truncated=true` warns when results are partial. Production-scale pagination is a follow-up before expanding beyond these limits. Internal logs and legacy snapshots are excluded.

These routes are committed but NOT deployed. Agents can query the database now. `site/data/atlas.json` is an actual database export for inspection, not the authority. `site/data/index.json` (431 entries) and `companies.json` (56 company records) are preserved legacy fallbacks; the live database has 652 entries. Neither supplies the new problem taxonomy. Existing UI still uses legacy themes pending an explicit implementation step.

## Change workflow

Set a batch ID with `SELECT set_config('atlas.batch_id','your-change-id',true)` inside a transaction. Preserve original sources, dates and statement scope. Stage imports losslessly, then map only reviewed content; never map a legacy theme automatically. Add reviewed evidence links before promoting an assertion to documented. Changes to graph objects/relationships increment revisions; before/after data is retained in the audit.

Test migrations on a database branch with original data before authorized live writes. Apply the three SQL files in order with a direct PostgreSQL connection, or use the corresponding statement arrays with the Neon transaction tool. The integrity migration flushes pending constraint triggers before altering tables, so all three can run in a single transaction. Check `atlas.migrations` first: CREATE statements deliberately fail on an already-applied migration instead of silently accepting schema drift. Never replay a seed against live data.

For a principles change, append a new version after reconciling user direction, regenerate its human-readable/JSON mirrors and compare the canonical hash with the database. Do not let multiple documents silently become competing authorities. Scripts under `scripts/` verify mirror and export integrity without exposing credentials.

## Next implementation checkpoint

Use this one space to replace theme-derived problem labels in a reviewable local preview. Keep all personas over the same graph. Add field evidence for aspirations, situations and actual workarounds; document incentives and reimbursement only with scoped sources. Recover and stage the earlier original research artifact. Review problem boundaries and candidate claims before scaling the map. Ask before production UI deployment.
