# Bounded discovery delivery

The browser loads one canonical snapshot through `/api/discovery/manifest` and
`/api/discovery/page?revision=<md5>&page=<number>`. Existing full discovery and index
endpoints remain compatible. A manifest 404 permits the older loopback preview
route; service errors never substitute a local catalog.

Manifest refresh builds the current graph, reviews, catalog and public media in
one SQL statement, computes the same original bundle revision as full discovery,
and checks relationship/catalog integrity. An existing complete immutable
revision returns immediately after these gates. A changed revision is sanitized
and split once into indexed page rows. Page reads never rebuild/decompress the
full graph. This is a derived delivery read model, not a second research catalog.
A refresh supplies its last loaded revision; an unchanged manifest returns immediately
without downloading any pages. Every new browser refresh compares against current canonical data; no freshness
TTL hides edits.

Before storage, SQL applies the catalog document and deep-dive allowlists, strips
funding sources to valid URLs/quotes, and restricts logos/related IDs to admitted
catalog entries. Final catalog/funding presentation runs in the browser on this
already public data. Graph, evidence and public-media context remain complete.

Pages contain at most 65,536 PostgreSQL Unicode characters (131,072 UTF-16 units
or 262,144 UTF-8 bytes in the worst case). The browser permits four concurrent
requests, at most 2,048 pages, a 20-second per-request timeout and a 120-second
snapshot deadline. Expired/mismatched revisions retry the complete snapshot once;
other errors abort all remaining requests. Existing displayed data remains until
all pages and the assembled contract validate. No partial snapshot is installed.

Only 20 revisions, no older than two days, are retained; an active reader whose
revision expires uses the bounded retry. Canonical records are never pruned.
New revisions are committed atomically with every page. PUBLIC receives no table
or function permission; deployment grants execution of the two delivery functions
to the established API database role. The sanitization helper is not public.

Apply with `scripts/apply-discovery-pages.mjs test <api-role>` against an isolated
endpoint, then verify with `scripts/verify-discovery-pages.mjs test`. Live apply
requires the same migration digest and a verified receipt from another endpoint.
The executor checks current principles, backs up previous delivery definitions/
data, and adds an audited import batch. Parent deployment owns these mutations.
Read-only guard/fixture checks do not create snapshots or modify the database.

Full-response streaming was observed to fail intermittently under Cloudflare CPU
limits. Bounded pages remove large request-side catalog parse/clone and large
stream loops. Unit and SQL parity checks establish preservation, not a universal
CPU guarantee; repeated live telemetry and a real browser load remain required.
