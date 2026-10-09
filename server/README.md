# Private index preview

Install the existing API dependencies with `npm ci --prefix workers/api`, then run:

```sh
node --env-file=/absolute/path/to/owner-only-preview-credentials.env server/dev.mjs
```

The external file supplies `DATABASE_URL` for the authorized internal branch. Never commit it.
Open http://127.0.0.1:8788/. The preview uses the same `queryDiscovery` as the deployed API, serving catalog, graph, presentations and eligible media in one database result. No local catalog or outage fallback is generated. Remote APIs still require HTTPS.

The server binds only to loopback, accepts only its exact Host and same-origin requests, and exposes read-only discovery and site assets. It does not expose credentials, database writes or arbitrary files. The preview omits the separate company-logo and funder-detail endpoints; add those only if their preview becomes necessary. Public deployment is separate.

For a checkout with unfinished UI changes, use an isolated worktree at the tested UI commit. Do not overwrite unrelated edits to make the preview load.
