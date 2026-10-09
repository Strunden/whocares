# Needs map integration

The approved map presentation is integrated into the existing app: large illustrations above concise copy, faint organic washes, full colour, no tile arrows or enclosing borders, and a dot grid that follows the camera. The original tagline, contextual subline and lower breadcrumbs are retained; zoom controls stay horizontal.

## Live data contract

The page still makes one uncached `/api/discovery` request through `atlas-loader.js`. It does not import the prototype's study JSON or a saved catalog. The migration supplies canonical metadata in `atlas.objects.scope.navigation`:

- Need: `role: "need"`, stable `view_id`, `title`, `summary`, reviewed local `image` path, `order`, `lenses`, `affected_lenses`.
- Situation: `role: "situation"`, optional stable `view_id`, `title`, `summary`, reviewed `image`, `order`, optional `remaining_question`.
- Named solution: optional `role: "solution"`, display `title` and `summary`. Actual assertion, cost, eligibility, provider, website and limitations remain in its source record.
- Situation → need: `context_for` with `provenance.navigation: true`.
- Solution/institutional response → situation: `responds_to` or `addresses` with `provenance.navigation: true`. The relationship statement explains contextual fit and limitations.

`atlas-needs.js` projects this graph without copying shared solutions or rewriting evidence. Only explicitly mapped needs/situations/solutions enter the map. Older catalog and research records remain searchable. Informal workarounds remain supporting research, not equivalent solution tiles.

A missing hierarchy fails visibly instead of falling back to legacy theme navigation. A situation with no linked offerings remains an empty map level explaining that research coverage is incomplete. Neither state establishes that no solutions exist. Need/situation images are required and must resolve to reviewed assets.

Existing `/all/g/<view_id>` links continue to work. Detail links retain `?within=<map path>` so reloading does not lose the surrounding situation. Zoom only magnifies; clicks change levels.

## Development and checks

Run the existing database-backed server with `DATABASE_URL` supplied privately and optional `PORT` (default 8788). The server is bound to loopback; no fixture routes are included. `node --test tests/*.test.mjs` checks navigation projection, media source boundaries, live-only loading and existing interaction logic.

This checkout is based on tracked local preview baseline `ec4279c`, which already includes the database discovery service and native pan fixes. Remote `ux/index-browse-v2` was still `560c53e` when inspected on 9 October 2026 and predates that service. Do not replace the loader with that older branch's static catalog reads when merging. Dirty sibling checkout files were not imported.

## Migration and current state — 9 October 2026

The migration was applied to live Neon branch `br-silent-mouse-b2g45sar` after verification on existing test branch `br-raspy-shadow-b2ldscd7`. Neon was at its branch limit, so no branch was deleted or reset. The full pre-change graph/review export remains locally at `../atlas-iteration/study/pre-hierarchy-neon-20261009.json`; it is a backup, not a website data source.

Run `scripts/migrations/20261009-needs-hierarchy.sql` followed by `20261009-needs-display-copy.sql` to reproduce the additive change. Both transactions tag audit writes; source and user/company records are retained. Replaying the first migration produced no duplicate writes. Live verification found 6 needs, 19 situations, 37 existing offerings linked through 58 contextual placements, and no dangling relationships. All 44 original graph assertions and all 652 original catalogue entries are preserved. The public discovery projection continues to apply its existing catalogue review filters; preservation does not mean that held records become public.

The 31 newly researched offerings have dated official sources in `docs/research/`; six earlier offerings retain their existing source dates. Provider descriptions verify offerings, not effectiveness or available capacity. Needs remain candidates where direct problem evidence is lacking. Twelve new situation illustrations and their exact briefs, service responses and visual reviews are retained in `docs/ux/illustration-generation/`. Illustration provenance is internal, not visible on map tiles.

The merged app runs locally at port 8793 against live Neon. GitHub Pages has not been deployed in this task. The configured public API `/api/discovery` returned 404 during verification; public deployment requires the existing API implementation in this branch to be deployed as well. Do not point a public browser at a database connection string or replace this with a bundled snapshot.

Validation: 78 frontend tests, 17 API tests, the database-only site check, migration constraints and replay, plus desktop browser checks of overview, drill-in, stable zoom, keyboard pan, contextual detail URLs and source access. Mobile remains outside this iteration. The locked Wrangler development dependency tree reports three related audit warnings through `sharp`/`miniflare`; dependencies were not upgraded as part of this design/data change.
