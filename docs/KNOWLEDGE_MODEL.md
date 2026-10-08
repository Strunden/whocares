# Who Cares: knowledge-model contract

> **Database authority:** `atlas.current_principles` and actual Neon schema. This is a developer-facing guide, not a migration or alternative policy source. The authoritative schema documentation is [docs/atlas/knowledge-model.md](https://github.com/Strunden/whocares/blob/data/problem-atlas-foundation/docs/atlas/knowledge-model.md). Verify the deployed schema before writing.

## Principle

**Do not derive the problem taxonomy from `site/data/index.json`, company records, or legacy theme tags.** These are legacy research material and can be linked as responses when evidence warrants. Keep their data and decisions intact.

## Graph object kinds

The additive `atlas.objects` model uses:
- `aspiration`: stakeholder-valued outcome or meaningful freedom, scoped to source/context.
- `stakeholder`: affected actor, including formal and informal roles.
- `problem_space`: explanatory grouping, with editorial scope/boundaries.
- `problem`: specific recurring obstacle or failure in context.
- `daily_situation`: concrete setting, workday moment, transition or task.
- `lived_workaround`: evidenced adaptation or compensatory practice; distinguish hypothetical from observed.
- `systemic_cause`: hypothesized or supported institutional, workflow, environmental or economic mechanism.
- `institutional_response`: public, nonprofit, clinical, provider or other organized intervention.
- `solution`: product/service/intervention, optionally linked to existing `public.entries`.
- `open_question`: explicit uncertainty or next research question.

Relationships live in `atlas.relationships` and need their own provenance: `part_of`, `affects`, `aspires_to`, `arises_in`, `works_around`, `contributes_to`, `responds_to`, `addresses`, `raises_question`, `context_for`, `tension_with`. A relation is a research assertion, not automatically proven causation.

## Evidence is a first-class entity

- `atlas.sources`: publisher/creator, type, locator, access date, geographic and methodological scope, limitations.
- `atlas.evidence_links`: specific object or relationship, stance (supporting, contradicting, context, origin), claim-level location and review status.
- `epistemic_status`: distinguish documented / interpretation / candidate / hypothesis / illustrative / open_question / normative / reference.
- `confidence`: qualitative **research-basis** and justification, **never venture attractiveness**.

Use reliable original evidence for strong factual claims. Provider sites can verify that a service is offered, **not** its outcomes. Workday fiction cannot become evidence through repetition.

## Authoritative operational contracts

- Product principles: `SELECT key, version, body, canonical_sha256 FROM atlas.current_principles WHERE key='who-cares-product';`
- Schema/migrations, audit and object query examples: linked authoritative knowledge-model document.
- Read-only APIs described there: `/api/principles` and `/api/atlas` are **prepared but may not be deployed**; do not assume production availability.
- `site/data/atlas.json` where present is a snapshot, not the live database.
- Previous 48/384/50 source artifacts remain pending unless accessible and verified; don't claim migration.
- Preserve audit writes with batch IDs, immutable historical records and revision/provenance links.
- Never run destructive live migrations, overwrite main, or deploy production without explicit authority.

## UI mapping contract

1. Overview territories are explanatory map views over `problem_space` objects, not authoritative companies or product clusters.
2. Continuous zoom reveals semantically richer child objects, relationships, context and sourced scenes; a new label appearing must correspond to a real graph record or explicitly illustrative editorial view.
3. Persona lenses filter/emphasize existing relationships, without replacing entity identities.
4. Deep dives weave scenes, problem records, competing explanations, workarounds, existing responses and evidence; gaps must remain visible.
5. Show why a space matters **and to whom** before asking the visitor to choose one.
6. Never order spaces or candidate ventures by AI-generated investment grades.

## Before changing data

Inspect current `atlas` tables and principle version; establish a change batch, stage any legacy imports losslessly, verify source-level support, write on a test branch first, check audit and row integrity, and report exact updates. Branch `ux/index-browse-v2` is for experimental interface work; coordinate with concurrent `data/problem-atlas-foundation` changes.
