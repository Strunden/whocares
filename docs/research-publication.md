# Reviewed research in the existing atlas

The current index loads `site/data/atlas/graph.json`. Its graph records already support scoped findings, evidence status, sources, relationships and open questions. Add research to this graph rather than creating a second research interface or replacing the existing snapshot with a partial export.

Before merging, independently confirm the current `who-cares-product` principles hash from `atlas.current_principles`, as required by `AGENTS.md`. The hash in the incoming file is not its own authority. Research claims and graph relationships must have completed the applicable editorial review and database-branch checks. The merge script validates structure and provenance metadata; it does not independently establish that a claim is true.

## Required export

The approved export contains the deployed `objects`, `relationships`, `sources` and `evidence_links` arrays, with stable IDs and original epistemic status, scope, qualitative confidence and provenance. Object and relationship rows include their revision. Relationships and evidence may reference existing baseline rows. Optional `referenced_objects` identify reused objects without inserting or changing them.

Snapshot metadata includes:

```json
{
  "as_of": "2026-10-09T12:00:00Z",
  "origin": "WhoCares supervised research",
  "principle_sha256": "CURRENT_CANONICAL_SHA256",
  "review": {
    "status": "approved",
    "reviewed_by": "Named editorial reviewer",
    "reviewed_at": "2026-10-09T12:00:00Z",
    "principle_sha256": "CURRENT_CANONICAL_SHA256"
  }
}
```

These are metadata placeholders, not an approval assertion for any actual research.

## Merge and inspect

Run from the repository root, substituting the reviewed export and independently verified hash:

```sh
node scripts/merge-research-atlas.mjs \
  --base site/data/atlas/graph.json \
  --research /path/to/approved-research-atlas.json \
  --out /tmp/reviewed-atlas-merged.json \
  --principles-sha256 CURRENT_CANONICAL_SHA256

node --test tests/research-atlas-merge.test.mjs
```

The script makes no database requests. It preserves every existing row, accepts identical repeat imports, and rejects conflicting IDs, duplicate relationship identities, dangling references, truncated snapshots, policy mismatches and missing review metadata. Documented claims require reviewed supporting research evidence. An existing identity with changed content needs a separately reviewed revision process; this additive importer will not overwrite it.

Inspect the merged artifact and reported counts before using that artifact as the local `site/data/atlas/graph.json`. The existing whole-snapshot `import-atlas-graph.mjs` script must not receive a partial research export: it replaces the graph instead of merging it.

## Visibility in the index

- A `problem_space` creates a territory in the current graph map.
- Problems and subspaces appear through explicit `problem/problem_space --part_of--> problem_space` relationships. The deployed schema does not permit institutional responses to use this membership relation.
- Institutional responses and other contextual records can appear beside those problems through an explicit `record --context_for--> problem_space` relationship. The UI retains that relation and the record's actual kind.
- A space can expose open questions through `problem_space --raises_question--> open_question`.
- Existing stakeholder and response records keep their original IDs. Their connections require explicit scoped relationships.
- The current detail panel displays claim status, scope, qualitative research basis, source links, evidence locators, limitations and connected research. These labels must not imply that an editorial grouping is a documented causal finding.

Run `npm run test:atlas`, then inspect the actual index and its claim-detail panel. Existing company/user records and unrelated graph objects must remain present. A successful local merge is not a production database write or a UI deployment. Keep frontend work on the authorized working branch and follow the repository's deployment instructions.
