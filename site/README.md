# AgeTech continuum site - how to add and rescan

The live list, tags, and logos come from the Worker `GET /api/index` and `GET /api/logo/<id>`. `data/index.json` is only the outage fallback. Adding a company is a database insert. It does not need a site rebuild or a Worker deploy.

## Schema (`data/index.json`)

Top level:

- `schema_version` (number, currently 1)
- `generated` (ISO date)
- `title` (string)
- `changelog` (array of `{date, text}`)
- `counts` (object, recomputed by tools)
- `entries` (array)

Each entry:

| Field | Company | Idea |
|-------|---------|------|
| `id` | `company-...` | `idea-...` |
| `type` | `company` | `idea` |
| `name` | required | required |
| `summary` | required | required |
| `status` | `new_this_scan` \| `deep_dive_done` \| `deep_dive_pending` | `open` \| `stressed` \| `standing` \| `killed` \| `parked` |
| `kill_reason` / `kill_source` | optional | required when `killed` |
| `added_date` | ISO date | ISO date |
| `source_scan` | which map/scan found it | e.g. THESIS-CARDS.md |
| `themes` | string[] e.g. `["T04"]` | string[] |
| `country` / `city` | ISO 3166-1 alpha-2 when verified, otherwise blank. `city` is a string | strings. Ideas have no country flag |
| `scene` | `{job, seller, payer}` | same |
| `website` | URL | usually empty |
| `related` | ids of related entries | ids |
| `deep_dive` | object with product, thesis, sources, ... | n/a |
| `claim` | n/a | what-if text |
| `idea_kind` | n/a | `theme` \| `parent_theme` \| `thesis_card` \| `manual` |

The public site is one list. It does not draw a map.

## Preview locally

```bash
cd site
python3 -m http.server 8877
# open http://127.0.0.1:8877/
```

`file://` may block `fetch` of JSON in some browsers. Prefer a static server.

## Add one entry

One SQL insert on the Neon project `proud-sea-34268045`, database `neondb`. The site reads `document` from `GET /api/index`. If `logo_bytes` is set, the API sets `logo` to `/api/logo/<id>` and `GET /api/logo/<id>` returns the PNG. Set `published` to false to keep a row out of the public list without deleting it.

```sql
INSERT INTO entries (
  id, type, name, summary, status, themes, related,
  country, website, position,
  title, job, who_sells, who_pays, tag, tag_secondary, published,
  logo_bytes, document
) VALUES (
  'company-example',
  'company',
  'Example',
  'One sentence about what it does.',
  'new_this_scan',
  '{}',
  '{}',
  'DE',
  'https://example.com',
  (SELECT COALESCE(MAX(position), 0) + 1 FROM entries),
  'Example',
  'It does this thing for older adults.',
  'Families buy it.',
  'Families pay for it themselves.',
  'Health and medicines',
  NULL,
  true,
  decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
  jsonb_build_object(
    'id', 'company-example',
    'type', 'company',
    'name', 'Example',
    'title', 'Example',
    'summary', 'One sentence about what it does.',
    'job', 'It does this thing for older adults.',
    'who_sells', 'Families buy it.',
    'who_pays', 'Families pay for it themselves.',
    'tag', 'Health and medicines',
    'tag_secondary', NULL,
    'published', true,
    'status', 'new_this_scan',
    'website', 'https://example.com',
    'country', 'DE',
    'themes', '[]'::jsonb,
    'related', '[]'::jsonb,
    'facts', jsonb_build_object(
      'founded', jsonb_build_object('year', 2018, 'source', 'https://example.com/about'),
      'country', jsonb_build_object('code', 'DE', 'source', 'https://example.com/impressum'),
      'hq', jsonb_build_object('city', 'Berlin', 'source', 'https://example.com/impressum')
    )
  )
);
```

Verified company facts live in `document.facts` (and the `facts` column). The detail page reads them from `GET /api/index`. Leave out any fact you cannot point at a public page. Do not write "unknown".

A researched write-up lives in `document.writeup`. The detail page shows any of these sections that are present, and hides the old job card once a write-up exists. Each section is `{text, sources}` with `sources` as an array of URLs you actually opened. Omit a section when you cannot support it. `summary` stays the one-line list text, verb first, at most 90 characters. `writeup.status.text` is the operating status (active, acquired, shut down, or pivoted), not the internal workflow `status`.

```json
"writeup": {
  "what_it_does": {"text": "Two to four plain sentences.", "sources": ["https://example.com"]},
  "who_pays": {"text": "Who buys it, and the price if it is public.", "sources": ["https://example.com/pricing"]},
  "traction": {"text": "Customers or results, with dates.", "sources": ["https://example.com/news"]},
  "why_interesting": {"text": "One to three sentences of insight.", "sources": ["https://example.com/news"]},
  "status": {"text": "Active. Still selling the product as of October 2026.", "state": "active", "as_of": "2026-10-05", "sources": ["https://example.com"]}
}
```

`facts` fields, each with its own `source` URL:

- `country`: `{code, source}`. `code` is ISO 3166-1 alpha-2. The list shows that country's flag next to the name, and the detail page shows it beside Headquarters. Leave it out when you cannot point at a public page. A domain such as `.de` is a hint to check the imprint, not proof. Ideas do not get a flag.
- `founded`: `{year, source}`
- `hq`: `{city, source}`
- `founders`: `[{name, linkedin, source}]`. `linkedin` only when that profile URL was found.
- `funding.total`: `{amount, source}`
- `funding.last_round`: `{amount, date, source}`
- `investors`: `[{name, source}]`
- `model`: `{text, source}` for pricing or the business model
- `apps`: `[{name, url}]` for App Store or Google Play listings

"Similar in Who Cares" is not stored. The page picks 3 to 5 other published entries with the same main tag and an overlapping job.

`logo_bytes` is a PNG. The sample above is a 1 pixel image. Replace the base64 with the real logo (app icon, apple-touch-icon, or favicon). Leave `logo_bytes` null to show the generic company icon. Tags are plain names: Health and medicines, Safety and falls, Memory and dementia, Loneliness and connection, Daily life and getting around, Home and housing, Family caregivers, Care staff and services, Money and retirement, End of life and inheritance. `tag_secondary` is optional.

Company `status` is `new_this_scan`, `deep_dive_done`, or `deep_dive_pending`. Idea `status` is `open`, `stressed`, `standing`, `killed`, or `parked`.

## Rescan AgeTechX

```bash
python3 tools/scan_agetechx.py          # live fetch Ones to Watch
python3 tools/scan_agetechx.py --dry-run
python3 tools/scan_agetechx.py --url https://agetechx.com/ones-to-watch
```

New names become `status: new_this_scan` (treated as pending deep dive). Existing name/domain skipped. Extend the script to other maps by adding parsers or more `--url` sources.

A new row shows up on the next visit. The home list does not show a changelog.

## Seed content

- Companies: continuum COMPANY-CLUSTERS + deep-dive pass (25 done, rest pending)
- Ideas: PICKABLE-MENU themes T01-T18, parent themes P01-P07, thesis cards from THESIS-CARDS.md

## Files

- `data/index.json` - outage fallback only. The live list is the database, via `GET /api/index`
- `data/companies.json` - earlier deep-dive payload (archive seed)
- `js/app.js` - runtime renderer
- `companies/entry.html?id=...` - single template for all entries
- `tools/add_entry.py`, `tools/scan_agetechx.py`
