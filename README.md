> Product/data authority: read [AGENTS.md](AGENTS.md), [the product north star](WHOCARES_PRODUCT_NORTH_STAR.md), and [the atlas knowledge model](docs/atlas/knowledge-model.md). Versioned principles and the additive problem graph now live in Neon’s `atlas` schema. Legacy company themes are not the problem taxonomy.

# Who Cares

Design agents: start at [`WHO-CARES-DESIGN-BRIEF.md`](WHO-CARES-DESIGN-BRIEF.md) and [`docs/research-map-ux-patterns.md`](docs/research-map-ux-patterns.md).

Live list of companies and ideas in ageing and care. The site reads `GET /api/index` at runtime. Logos are `GET /api/logo/<id>` from the database, not files in the repo. Add a company with one SQL insert. See `site/README.md`. `site/data/index.json` is only the outage fallback.
