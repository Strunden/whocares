# Who Cares API

Cloudflare Worker in front of Neon Postgres. `GET /api/index` returns `schema_version`, `generated`, `title`, `changelog`, `counts`, and `entries` (the `document` column, ordered by `position`). When `logo_bytes` is present, each entry's `logo` is set to `/api/logo/<id>`. `GET /api/logo/<id>` returns that PNG with a one-day cache. `GET /api/health` checks the database. CORS allows `https://strunden.github.io`.

Adding a company is one insert into `entries`, including `document` and optional `logo_bytes`. No site rebuild and no Worker deploy. See `site/README.md` for the statement. The static `site/data/index.json` file is only the outage fallback.

The Worker reads whatever is in the database. An empty database returns meta plus `"entries": []`. It does not invent companies.

## Connection

Prefer the `HYPERDRIVE` binding (direct Neon host, not the pooler). If that binding is absent, the Worker uses the `DATABASE_URL` secret. Queries use the Postgres wire protocol over `cloudflare:sockets`.

`DATABASE_URL` must be a Postgres URI for Neon project `proud-sea-34268045`, branch `br-silent-mouse-b2g45sar`, database `neondb`, with `sslmode=require`. Set it with Wrangler. Do not commit the value.

```bash
cd workers/api
npx wrangler secret put DATABASE_URL
npx wrangler deploy
```

Account: `7900f10c4e99776ebbab5e336b8bfa98`.
