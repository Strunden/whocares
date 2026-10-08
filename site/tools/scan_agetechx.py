#!/usr/bin/env python3
"""Pull AgeTechX Ones to Watch / market-map style listings and add new companies
as deep_dive_pending into data/index.json.

Default source: https://agetechx.com/ones-to-watch (HTML).
Extendable: pass --url for other public list pages.

Does not invent product theses. New rows get summary from the page blurb when present.
"""
from __future__ import annotations
raise SystemExit('Local catalog edits are retired. Publish reviewed research to Neon.')
import argparse, json, re, sys, urllib.request
from datetime import date
from pathlib import Path
from html import unescape
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
ADD = ROOT / "tools" / "add_entry.py"
TODAY = date.today().isoformat()
DEFAULT_URL = "https://agetechx.com/ones-to-watch"

# Known ones-to-watch from our RESEARCH-PLAN.md I10 (fallback if fetch thin)
FALLBACK = [
    ("Amara", "Germany", "https://amara.app"),
    ("AssistMe", "Germany", "https://assistme.io"),
    ("auditect", "Germany", "https://auditect.de"),
    ("caery", "Germany", "https://caery.care"),
    ("cogvis", "Austria", "https://cogvis.ai"),
    ("dala.care", "Iceland", "https://dala.care"),
    ("Ditto", "Netherlands", "https://ditto.care"),
    ("Gardia", "Germany", "https://gardia.net"),
    ("Harmonica", "United Kingdom", "https://heyolympia.com/"),
    ("inTouch.family", "Czechia", "https://intouch.family"),
    ("Lateral", "United Kingdom", "https://lateral.uk"),
    ("livil", "Germany", "https://livil.co"),
    ("Maurice & Nora", "Belgium", "https://mauricenora.be"),
    ("navel robotics", "Germany", "https://navelrobotics.com"),
    ("Quantune", "Germany", "https://quantune.com"),
    ("SteffiCare", "Germany", "https://stefficare.com"),
    ("TeiaCare", "Italy", "https://teiacare.com"),
    ("Veli", "Germany", "https://veli-care.de"),
    ("Zenaris", "Germany", "https://www.zenaris.com"),
]

def slug(name: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", name.strip().lower()).strip("-")
    return s[:60] or "company"

def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "AgeTechContinuumScan/1.0"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read().decode("utf-8", errors="replace")

def parse_ones_to_watch(html: str):
    """Best-effort extract of name-ish headings and nearby links from AgeTechX page."""
    text = unescape(re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I))
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    found = []
    # Look for markdown-like or anchor patterns; also match known names
    for name, country, website in FALLBACK:
        if re.search(re.escape(name), text, re.I):
            found.append({"name": name, "country": country, "website": website, "blurb": ""})
    # Extra: any https links near "Ones to Watch" body for unknown domains
    return found

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--url", default=DEFAULT_URL)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    try:
        html = fetch(args.url)
        rows = parse_ones_to_watch(html)
        scan_label = f"AgeTechX scan {TODAY} ({args.url})"
    except Exception as ex:
        print("Fetch failed, using RESEARCH-PLAN I10 fallback list:", ex, file=sys.stderr)
        rows = [{"name": n, "country": c, "website": w, "blurb": ""} for n, c, w in FALLBACK]
        scan_label = f"AgeTechX fallback list {TODAY} (RESEARCH-PLAN I10)"

    # Import merge via subprocess to reuse validation, or inline
    sys.path.insert(0, str(ROOT / "tools"))
    import add_entry as ae

    data = ae.load()
    existing_domains = {ae.domain(e.get("website", "")) for e in data["entries"] if e["type"] == "company"}
    existing_names = {ae.norm_name(e["name"]) for e in data["entries"] if e["type"] == "company"}
    added = 0
    skipped = 0
    for row in rows:
        nn = ae.norm_name(row["name"])
        dn = ae.domain(row["website"])
        if nn in existing_names or (dn and dn in existing_domains):
            skipped += 1
            continue
        entry = {
            "id": "company-" + slug(row["name"]),
            "type": "company",
            "name": row["name"],
            "summary": row.get("blurb") or f"Listed on AgeTechX Ones to Watch. Product thesis not yet written.",
            "status": "new_this_scan",
            "kill_reason": None,
            "kill_source": None,
            "added_date": TODAY,
            "source_scan": scan_label,
            "themes": [],
            "country": row.get("country", ""),
            "city": "",
            "scene": {"job": "not found", "seller": "not found", "payer": "not found"},
            "website": row.get("website", ""),
            "related": [],
            "deep_dive": {"note": "deep dive pending", "product": row.get("blurb") or "not found", "sources": [{"url": args.url, "note": "scan source", "accessed": TODAY}]},
        }
        if args.dry_run:
            print("would add", entry["id"], entry["website"])
            added += 1
            continue
        try:
            ae.merge_entry(data, entry, force=args.force)
            existing_names.add(nn)
            if dn:
                existing_domains.add(dn)
            added += 1
            print("added", entry["id"])
        except SystemExit as ex:
            print("skip", row["name"], ex)
            skipped += 1
    if not args.dry_run:
        data["generated"] = TODAY
        ae.save(data)
    print(f"done added={added} skipped_existing={skipped} dry_run={args.dry_run}")

if __name__ == "__main__":
    main()
