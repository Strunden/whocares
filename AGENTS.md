# Who Cares product and data authority

Before research, data changes, design or implementation, read the current principles:

```sql
SELECT key, version, body, canonical_sha256
FROM atlas.current_principles WHERE key = 'who-cares-product';
```

Project `proud-sea-34268045`, database `neondb`. The live branch is `br-silent-mouse-b2g45sar`. Use authorized read access; never print credentials. The live database principles are authoritative. If database access is unavailable, read the versioned repository mirror and state that it is a snapshot:

- [Product north star](https://github.com/Strunden/whocares/blob/data/problem-atlas-foundation/WHOCARES_PRODUCT_NORTH_STAR.md)
- [Knowledge model and query contract](https://github.com/Strunden/whocares/blob/data/problem-atlas-foundation/docs/atlas/knowledge-model.md)
- Local files when present: `WHOCARES_PRODUCT_NORTH_STAR.md`, `db/seeds/product-principles-v1.json`, `docs/atlas/knowledge-model.md`. A sibling `whocares-knowledge/` checkout may contain the foundation branch.

Read principles again when their version changes. Do not independently rewrite the mirror: append a reviewed database version and regenerate the mirror with its canonical hash. Disclose stale mirrors.


## Shared implementation specifications

In addition to the database principles, read the applicable **reviewed implementation briefs** before proposing taxonomy, design or data changes:

- [Product vision and venture-builder jobs](docs/PRODUCT_VISION.md)
- [Problem-space definitions and research process](docs/PROBLEM_ATLAS.md)
- [Graph objects, evidence and data contracts](docs/KNOWLEDGE_MODEL.md)
- [Map-first semantic zoom, lenses and storytelling](docs/UX_PRINCIPLES.md)
- [Research and publication standards](docs/RESEARCH_STANDARDS.md)

These briefs explain how to implement the canonical database principles. They are **not independent policy authorities**. For conflicts, check `atlas.current_principles`, compare its version/hash with the [canonical repository mirror](https://github.com/Strunden/whocares/blob/data/problem-atlas-foundation/WHOCARES_PRODUCT_NORTH_STAR.md), and reconcile openly before making changes.

Before shipping an atlas UI, perform a product-alignment review of the problem-space definition, bottom-up/top-down evidence, horizontal comprehension, semantic zoom and user agency. A passing functional test is not a substitute for this review.

## Required product rules

- Evidence-backed problem discovery and market intelligence for venture builders: discovery, causal understanding, self-directed hypothesis formation. No opportunity scores, AI attractiveness rankings or venture judgments.
- A Life Worth Living includes every affected stakeholder, including older adults, family/professional caregivers, providers and financially sustainable innovators. It is an ethical north star, not a forced navigation taxonomy.
- Define problem spaces independently of company themes: bounded, revisable groups of human, operational or systemic frictions, with stakeholders, situations, mechanisms, responses and evidence gaps. Company records document responses, never determine the problem taxonomy.
- All persona lenses operate on ONE graph. Keep stable identities. Map-centric continuous semantic zoom builds a horizontal mental model and vertical documentary-story deep dives; use translucent organic territories and sparse chrome.
- Distinguish aspirations, situations and lived workarounds from systems, incentives, reimbursement and care provision. Hypothesized workarounds and illustrative stories are not field observations.
- Keep documented claims, interpretations, candidates, hypotheses and unknowns visibly distinct. Supporting evidence is scoped; a provider's offering is not independent outcome evidence. Do not turn historical killed/standing statuses into problem validity.
- The earlier 48 domains, 384 candidate problems and 50 sources remain pending until original artifacts are accessible. Do not manufacture their contents or claim they were migrated.

## Working rules

Use `ux/index-browse-v2` or a separate branch; never edit or push main. Do not deploy the production UI without user approval. Preserve existing company/user records, sources and provenance. Test database migrations on a Neon branch; keep a pre-change backup and migration files. Never reset or restore live data autonomously.

The `atlas` schema is additive. Set `atlas.batch_id` within each write transaction; triggers audit graph writes and increment object/relationship revisions. Never bypass the audit or evidence checks. Stage legacy research losslessly in `atlas.legacy_records` before reviewing or mapping it.

Before implementation, explain how the proposed problem space, evidence, graph relationships and zoom experience satisfy the alignment checks in the north star. The old theme-based maps and design brief do not override these principles.

## Current atlas navigation contract — 9 October 2026

Read the [hierarchy and indexing skill](.agents/skills/whocares-hierarchy/SKILL.md) before authoring or changing navigation. The whole visible atlas uses **needs → specific situations → existing solutions**; lived workarounds and historical groupings remain supporting research, not solution tiles. Click drills into the next level; pan/zoom magnifies stable content, superseding earlier zoom-threshold content changes in the implementation briefs.

The database graph is canonical: `scope.navigation.role` identifies `need`, `situation` and `solution`; deliberately flagged `context_for` links run situation → need and `responds_to` links run solution → situation, with `provenance.navigation = true`. `site/js/atlas-needs.js` projects this graph. Do not introduce a local prototype JSON dependency for production navigation or silently promote candidate evidence during reorganisation. This display/source contract does not alter the principle authority or write/deployment rules above.
