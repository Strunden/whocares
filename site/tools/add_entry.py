#!/usr/bin/env python3
"""Append or merge an entry into site/data/index.json.

Usage examples:
  python3 tools/add_entry.py --file new.json
  python3 tools/add_entry.py --type company --id acme --name Acme --website https://acme.example --themes T04 --country Germany --summary "..." --source-scan "manual 2026-10-05"
  python3 tools/add_entry.py --type idea --id T19-H1 --name T19-H1 --claim "What if ..." --status open --themes T19 --source-scan "manual"

Dedupe: same id merges; else same normalized name+domain for companies refuses duplicate unless --force.
Validates required fields against schema_version 1.
"""
from __future__ import annotations
raise SystemExit('Local catalog edits are retired. Publish reviewed research to Neon.')
import argparse, json, re, sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "data" / "index.json"
TODAY = date.today().isoformat()

COMPANY_STATUSES = {"new_this_scan", "deep_dive_done", "deep_dive_pending"}
IDEA_STATUSES = {"open", "stressed", "standing", "killed", "parked"}

def domain(url: str) -> str:
    if not url or not str(url).startswith("http"):
        return ""
    try:
        return urlparse(url).netloc.lower().removeprefix("www.")
    except Exception:
        return ""

def norm_name(n: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", (n or "").lower())

def load():
    return json.loads(INDEX.read_text())

def save(data):
    INDEX.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")

def validate(entry: dict):
    errs = []
    if entry.get("type") not in ("company", "idea"):
        errs.append("type must be company or idea")
    if not entry.get("id"):
        errs.append("id required")
    if not entry.get("name"):
        errs.append("name required")
    if not entry.get("added_date"):
        errs.append("added_date required")
    if not entry.get("source_scan"):
        errs.append("source_scan required")
    if entry.get("type") == "company" and entry.get("status") not in COMPANY_STATUSES:
        errs.append(f"company status must be one of {sorted(COMPANY_STATUSES)}")
    if entry.get("type") == "idea" and entry.get("status") not in IDEA_STATUSES:
        errs.append(f"idea status must be one of {sorted(IDEA_STATUSES)}")
    if entry.get("status") == "killed" and not entry.get("kill_reason"):
        errs.append("killed entries need kill_reason")
    if "themes" in entry and not isinstance(entry["themes"], list):
        errs.append("themes must be a list")
    if "scene" in entry and not isinstance(entry["scene"], (dict, str)):
        errs.append("scene must be object or string")
    return errs

def recount(data):
    entries = data["entries"]
    data["counts"] = {
        "total": len(entries),
        "companies": sum(1 for e in entries if e["type"] == "company"),
        "ideas": sum(1 for e in entries if e["type"] == "idea"),
        "deep_dive_done": sum(1 for e in entries if e.get("status") == "deep_dive_done"),
        "deep_dive_pending": sum(1 for e in entries if e.get("status") == "deep_dive_pending"),
        "ideas_standing": sum(1 for e in entries if e["type"] == "idea" and e["status"] == "standing"),
        "ideas_open": sum(1 for e in entries if e["type"] == "idea" and e["status"] == "open"),
        "ideas_killed": sum(1 for e in entries if e["type"] == "idea" and e["status"] == "killed"),
        "ideas_parked": sum(1 for e in entries if e["type"] == "idea" and e["status"] == "parked"),
    }

def merge_entry(data, entry, force=False):
    errs = validate(entry)
    if errs:
        raise SystemExit("Validation failed: " + "; ".join(errs))
    entries = data["entries"]
    by_id = {e["id"]: i for i, e in enumerate(entries)}
    if entry["id"] in by_id:
        i = by_id[entry["id"]]
        old = entries[i]
        old.update(entry)
        entries[i] = old
        action = "merged"
    else:
        if entry["type"] == "company" and not force:
            dn = domain(entry.get("website", ""))
            nn = norm_name(entry["name"])
            for e in entries:
                if e["type"] != "company":
                    continue
                if nn and nn == norm_name(e["name"]):
                    raise SystemExit(f"Duplicate name '{entry['name']}' matches {e['id']} (use --force)")
                if dn and dn == domain(e.get("website", "")):
                    raise SystemExit(f"Duplicate domain '{dn}' matches {e['id']} (use --force)")
        # prefix ids if caller passed bare id
        if entry["type"] == "company" and not entry["id"].startswith("company-"):
            entry["id"] = "company-" + entry["id"]
        if entry["type"] == "idea" and not entry["id"].startswith("idea-"):
            entry["id"] = "idea-" + entry["id"]
        # re-validate id after prefix? already validated once - ok
        entries.append(entry)
        action = "added"
    data.setdefault("changelog", []).append({
        "date": TODAY,
        "text": f"{action.title()} {entry['type']} {entry['id']} ({entry['name']}) via add_entry.py · scan: {entry.get('source_scan')}",
    })
    recount(data)
    return action

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--file", help="JSON file with one entry object or {entries:[...]}")
    ap.add_argument("--type", choices=["company", "idea"])
    ap.add_argument("--id")
    ap.add_argument("--name")
    ap.add_argument("--website", default="")
    ap.add_argument("--summary", default="")
    ap.add_argument("--claim", default="")
    ap.add_argument("--status")
    ap.add_argument("--themes", default="", help="comma-separated")
    ap.add_argument("--country", default="")
    ap.add_argument("--source-scan", dest="source_scan")
    ap.add_argument("--added-date", dest="added_date", default=TODAY)
    ap.add_argument("--kill-reason", dest="kill_reason")
    ap.add_argument("--kill-source", dest="kill_source")
    ap.add_argument("--scene-job", default="")
    ap.add_argument("--scene-seller", default="")
    ap.add_argument("--scene-payer", default="")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    data = load()
    batch = []
    if args.file:
        blob = json.loads(Path(args.file).read_text())
        if isinstance(blob, list):
            batch = blob
        elif "entries" in blob:
            batch = blob["entries"]
        else:
            batch = [blob]
    else:
        if not (args.type and args.id and args.name and args.source_scan):
            ap.error("Need --file or --type --id --name --source-scan")
        status = args.status or ("deep_dive_pending" if args.type == "company" else "open")
        entry = {
            "id": args.id,
            "type": args.type,
            "name": args.name,
            "summary": args.summary or args.claim,
            "status": status,
            "kill_reason": args.kill_reason,
            "kill_source": args.kill_source,
            "added_date": args.added_date,
            "source_scan": args.source_scan,
            "themes": [t.strip() for t in args.themes.split(",") if t.strip()],
            "country": args.country,
            "city": "",
            "scene": {
                "job": args.scene_job or args.summary or args.claim,
                "seller": args.scene_seller or "not found",
                "payer": args.scene_payer or "not found",
            },
            "website": args.website,
            "related": [],
        }
        if args.type == "idea":
            entry["claim"] = args.claim or args.summary
            entry["idea_kind"] = "manual"
        else:
            entry["deep_dive"] = {"note": "deep dive pending", "product": args.summary, "sources": []}
        batch = [entry]

    for entry in batch:
        action = merge_entry(data, entry, force=args.force)
        print(action, entry["id"])
    data["generated"] = TODAY
    save(data)
    print("Wrote", INDEX, "counts", data["counts"])

if __name__ == "__main__":
    main()
