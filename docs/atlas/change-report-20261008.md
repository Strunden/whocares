# Who Cares realignment, 8 October 2026

## Applied live changes

Project `proud-sea-34268045`, database `neondb`, branch `br-silent-mouse-b2g45sar`. Added only schema `atlas`: nine tables, one current-principles view, evidence/revision/audit guards and query indexes. Three versioned SQL migrations were applied in one atomic transaction. No public table was altered and no pre-existing record was updated or deleted.

| New data | Rows |
| --- | ---: |
| Principles versions | 1 (12 principles, five alignment checks) |
| Atlas objects | 17 |
| Relationships | 13 |
| Sources | 3 |
| Evidence links | 14 |
| Lossless legacy idea snapshots | 75 |
| Import batch registers | 2 |
| Migration registers | 3 |
| Audited successful inserts | 128 |

The objects comprise five stakeholder inclusion nodes, one aspiration hypothesis, one interpreted problem space, one documented problem, one candidate problem, one illustrative situation, one hypothesized workaround, one documented broad systemic mechanism, one institutional response, one company solution and three open questions. Four objects and three relationships are documented with scoped supporting sources. No fieldwork, observed workaround, local causal effect or response outcome is invented.

The first problem space is Participation in everyday life. It is independent of company theme tags. Amara is linked through `solution-amara-home` to existing `company-amara`; its offering is documented, while its response-to-candidate-problem connection remains editorial interpretation. The existing company row is intact. Evidence sources include [WHO’s Ageing and health](https://www.who.int/news-room/fact-sheets/detail/ageing-and-health), the [Amara provider page](https://amara.app/), and user product direction; the last is explicitly not empirical evidence.

## Preservation and backup

Before and after fingerprints for all row content in `public.entries`, `public.evidence`, `public.funders` and `public.funding_links` match exactly. This includes the entire company documents, metadata and logos. Live inventory: 577 companies, 75 ideas, 2,908 evidence rows, 135 funders, 98 funding links. No application user table was found among the 11 public tables. Discovery inbox and queues were not targeted by migration SQL.

All 75 staged idea rows/documents match their live originals exactly. No historic killed/standing decisions became new problem validity labels. Existing numeric research-depth fields and analyst conclusions were preserved as historical company data; this change introduces no opportunity scores or judgments.

Pre-change backup: `atlas-realignment-backup-20261008`, `br-raspy-morning-b2xwxgu7`, parent LSN `0/58C43C8`, created 14:03:06 UTC (16:03:06 Berlin). It has no compute. Test branches: `br-empty-star-b2hpk36u` and `br-green-pine-b2ooz5ov`. These are retained for inspection and recovery; no production reset/restore was attempted.

## Validation

The initial attempt to combine separately tested migrations hit pending deferred trigger events before an ALTER TABLE. PostgreSQL rolled the transaction back. A subsequent query confirmed zero atlas tables. The integrity migration now flushes pending constraints before alterations. All three migrations were retested together on a fresh copy, followed by nine database integrity checks, then successfully applied live.

The integrity checks reject unbacked documented assertions, incomplete confidence, opportunity scores, principle rewrites, audit deletion, dangling references, invalid response endpoint kinds and product direction used to verify empirical claims. A ninth check confirms revision and before/after audit tracking. Each test runs in rolled-back subtransactions and leaves no persistent test data.

Twenty Node tests passed, including existing API contracts and atlas camera tests, plus new route CORS/error behavior and wire payload preservation. The exact new API graph SQL was executed against the live database: 17 objects, 13 relationships, 14 evidence links, three sources, `truncated=false`. Its output is exported to `site/data/atlas.json`. Principles JSON, human-readable mirror, SQL/statement arrays and graph evidence/reference integrity are checked by `node scripts/verify-atlas.mjs`.

Machine-readable before/after fingerprints, live counts and per-table audit batches are in `database-verification-20261008.json`. Live `atlas.write_log` retains actor, batch, transaction, record key and complete before/after rows for the 128 writes; `atlas.migrations` and repository SQL record DDL. No migration touched main or deployed a Worker or UI.

## Gaps and next steps

The earlier 48 domains / 384 candidates / 50 sources were not found in the available main/UX trees, local project files, available git history or database tables. Repository branches were enumerated, but every historical branch’s contents and inaccessible external archives were not exhaustively inspected. The exact reported inventory is recorded as pending, with actual imported counts zero. Recover the original artifact and stage it losslessly before reviewing claims and mapping identities.

Current production UI still derives problem labels from legacy themes. The new graph is available directly in the database and as a reviewable snapshot. Read-only `/api/principles` and `/api/atlas` routes are prepared on the foundation branch and are not deployed. Next: a local one-space UI using graph IDs across all persona lenses, followed by field evidence and explicit relationships for care work, provider constraints, incentives and reimbursement. Scale only after reviewing problem boundaries and research candidates. Obtain user approval before production UI deployment.

Agent discovery is provided through repository `AGENTS.md`, README and a supersession notice on the old design brief. Older chats have not been interrupted or messaged. They must load the updated instructions before continuing; adding instructions cannot guarantee an already-running chat has reread them.
