# Database-backed discovery

All catalog content comes from the configured canonical service in `js/config.js`.
The atlas uses `GET /api/discovery`. Company pages use `GET /api/index`; both project
the same reviewed database rows. Logos use `GET /api/logo/<id>`.

Do not add `data/index.json`, graph snapshots, company chunks or product-media files.
The build guard rejects them. No fallback catalog is shown if the service is down.
Code, style sheets and illustrative artwork are static website assets, not a second
research database. Synthetic test fixtures are never included in the website.

Publication is a reviewed, audited database transaction. It is not a file edit or
website rebuild. See `../docs/ux/canonical-data-service.md`.
