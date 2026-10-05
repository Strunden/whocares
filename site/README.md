# AgeTech continuum site - how to add and rescan

Static-hostable. All map, table, and entry pages fetch `data/index.json` at runtime. Adding an entry does not require editing HTML.

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
| `country` / `city` | strings | strings |
| `scene` | `{job, seller, payer}` | same |
| `website` | URL | usually empty |
| `related` | ids of related entries | ids |
| `deep_dive` | object with product, thesis, sources, ... | n/a |
| `claim` | n/a | what-if text |
| `idea_kind` | n/a | `theme` \| `parent_theme` \| `thesis_card` \| `manual` |

Visuals: companies = solid circles on the map; ideas = dashed squares / dashed row accent.

## Preview locally

```bash
cd site
python3 -m http.server 8877
# open http://127.0.0.1:8877/
```

`file://` may block `fetch` of JSON in some browsers. Prefer a static server.

## Add one entry

```bash
cd site
python3 tools/add_entry.py \
  --type company \
  --id exampleco \
  --name "Example Co" \
  --website https://example.com \
  --country Germany \
  --themes T04 \
  --summary "One-line product." \
  --source-scan "manual 2026-10-05" \
  --status deep_dive_pending
```

Or pass a JSON file: `python3 tools/add_entry.py --file path/to/entry.json`

Dedupe: refuses same company name or same website domain unless `--force`. Same `id` merges fields.

For ideas:

```bash
python3 tools/add_entry.py \
  --type idea \
  --id T99-H1 \
  --name T99-H1 \
  --claim "What if ..." \
  --status open \
  --themes T99 \
  --source-scan "manual what-if"
```

## Rescan AgeTechX

```bash
python3 tools/scan_agetechx.py          # live fetch Ones to Watch
python3 tools/scan_agetechx.py --dry-run
python3 tools/scan_agetechx.py --url https://agetechx.com/ones-to-watch
```

New names become `status: new_this_scan` (treated as pending deep dive). Existing name/domain skipped. Extend the script to other maps by adding parsers or more `--url` sources.

After adding, refresh the browser. Changelog on the home page shows the latest tool lines.

## Seed content

- Companies: continuum COMPANY-CLUSTERS + deep-dive pass (25 done, rest pending)
- Ideas: PICKABLE-MENU themes T01-T18, parent themes P01-P07, thesis cards from THESIS-CARDS.md

## Files

- `data/index.json` - canonical index (edit via tools)
- `data/companies.json` - earlier deep-dive payload (kept as archive seed; runtime uses index.json)
- `js/app.js` - runtime renderer
- `companies/entry.html?id=...` - single template for all entries
- `tools/add_entry.py`, `tools/scan_agetechx.py`
