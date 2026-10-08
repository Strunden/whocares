# Who Cares

Evidence-backed problem discovery and market intelligence for venture builders.
Read `AGENTS.md` and the reviewed product briefs before changing research or design.

The map reads `/api/discovery`; the company list reads `/api/index`. Both use the
same reviewed Neon projection through the Cloudflare Worker. The discovery response
contains the catalog, graph, presentation copy and eligible media from one database
statement, with a shared revision. There is no bundled catalog, file fallback,
local-storage database or offline mode. An unavailable API produces an explicit
unavailable state. New research appears after reviewed database publication and a
page reload, without regenerating files or redeploying the website.

Run `npm run test:atlas` and `npm run build:atlas`. API tests live under `workers/api`.
See `docs/ux/canonical-data-service.md` for release order and remaining migration work.
