# AgeTech social/research enrichment sample (5 companies)

**Date:** 2026-10-05 (Europe/Berlin, CEST)  
**Index:** `/home/box/shared/fabian-second-brain/02_venture_building/agetech-continuum/site/data/index.json`  
**Backup:** `index.json.bak-enrich-2026-10-05`  
**Budget:** started treg balance **$0.7750**, ended **$0.7589** → spent about **$0.016** (well under ~$0.15).  

Selection: five Europe/DE-heavy `deep_dive_done` companies with websites, tied to standing themes (T02, T07, T04, T06/T15, T14).

Methods: free WebSearch (`site:linkedin.com`), WebFetch (company/press), LinkedIn guest HTML; cheap treg (`anyapi.linkedin.search.jobs`, `treg.x.search.posts`, `scrapecreators.reddit.search.posts`). No reddit.com from the box. No outreach/posting.

---

## 1. AssistMe (`company-assistme`) — Berlin, T02

**Found:** Company LinkedIn `assistmeio`; founders Julio Brandl and Jens Grudno LinkedIn URLs; LinkedIn + FinSMEs + X funding tweets for EUR 6.5m (Aug 2026); announce posts (funding, Torun LTC conference); alea in eight EU countries + home-care expansion; ~43 employees on LinkedIn.

**Not found:** Open LinkedIn jobs (guest API empty); Reddit brand mentions; clean X competitor co-mentions vs TENA/Identifi.

**New deep-dive facts (3):** headcount/followers; eight-country + home-care use of alea; FinSMEs use-of-proceeds (EU sales, US prep, software).

---

## 2. Amara (`company-amara`) — Berlin, T07

**Found:** Company LinkedIn `amara-connects` (alias `amara-companion`); Philipp Hartz LinkedIn; EUR 3.7m pre-seed (IBB Ventures 29 Sep 2026; Econa, Caesar VC, IBB); AgeTechX Ones to Watch 2026 + IFA posts; X mention via @fundable_ai / @amara_companion; impressum H2 Technologies GmbH; Dec shipping; planned Hausnotruf + alarm bracelet.

**Not found:** Richard Hector personal LinkedIn URL (AgeTechX bio confirms co-founder; wrong `/in/richard-hector-*` hits discarded); hiring roles; Reddit brand mentions.

**New deep-dive facts (3):** Dec ship + SIM/WLAN membership pack; Hausnotruf roadmap + HRB; LinkedIn slug/followers.

---

## 3. LINDERA (`company-lindera`) — Berlin, T04

**Found:** Company LinkedIn `lindera`; Diana Heinrichs and Alireza/Reza Rezvani LinkedIn; Series A EUR 6m press (2021); unternehmen timeline (DiPA rejected 2024, L.Gait accepted, 4 countries); ISO 13485/27001 + MDR SaMD claims; homepage impact stats.

**Not found:** Recent open jobs; recent funding tweets (X polluted by plant genus *Lindera*); brand-named Reddit threads (false positives only). Adjacent Reddit: senior fall-detection app ask on r/androidapps (not LINDERA-named).

**New deep-dive facts (3):** certifications/product lines/address; 2024 stats + LinkedIn marketing claims; DiPA rejection + 2025 clinical focus.

---

## 4. navel robotics (`company-navel-robotics`) — Munich, T06/T07/T15

**Found:** Company LinkedIn `navel-robotics-gmbh`; founder Claude Toussaint LinkedIn; active hiring (Senior ML, Jetson, STM32, electronics, UX social interaction, mechanical, autonomous-driving body domain) via careers + ITCS; HIMSS Europe LinkedIn posts; DWN press (price ~EUR 28k / lease ~EUR 970/mo; ~EUR 2.6m financing cited; Lilienthaler Diakonie year trial with mixed staff burden); company funding-round blog 2023; privacy-by-design claims.

**Not found:** Reddit mentions (0 hits); clean X funding/competitor chatter (query noise).

**New deep-dive facts (3):** 60+ robots sold / team ~14 / Jetson hardware; DWN price + staff burden anecdote; on-device privacy claims.

---

## 5. livil (`company-livil`) — Halle, T14

**Found:** Company LinkedIn `livil.co` (Autonomy on Board GmbH, Halle); founder Nils Frers LinkedIn; product is voice+AI in-car office for mobile caregivers; LinkedIn event posts (digitalversorgtabend, TPG Halle); AgeTechX Berlin DE session speaker with myo / German Bionic.

**Not found:** Funding amount; open jobs; Reddit; useful recent X (only stale unrelated @livilhq).

**New deep-dive facts (3):** product feature set on livil.co; Halle HQ + legal alias; AgeTechX logistics session role.

---

## Field coverage checklist

| Field | AssistMe | Amara | LINDERA | navel | livil |
|---|---|---|---|---|---|
| Founder LinkedIn | yes (2) | Hartz yes; Hector not found | yes (CEO+CTO) | yes | yes |
| Hiring roles | not found | not found | not found | yes (many) | not found |
| Announce posts | yes | yes | press/timeline | yes | yes |
| Competitor mentions | shelf names | shelf + site table | shelf + GAITRite | shelf | shelf |
| Reddit sentiment | not found | not found | adjacent only | not found | not found |
| Funding tweets/press | X + press | X + press | older press | press | not found |
| New deep-dive facts | 3 | 3 | 3 | 3 | 3 |

---

## Spend detail (approx)

| Call class | Count (this pass) | ~USD |
|---|---|---|
| `anyapi.linkedin.search.jobs` | 5 | 0.0025 |
| `treg.x.search.posts` / anyapi X | ~7 | ~0.0042 |
| `scrapecreators.reddit.search.posts` | 5 | ~0.0094 |
| **Total** | | **~$0.016** |

Free supplements: Google/WebSearch `site:linkedin.com`, WebFetch of company + press pages, LinkedIn public/guest HTML (company IDs, posts, follower counts).

---

## Index writeback

Each of the five entries now has an `enrichment` object (no other entries modified). Changelog item appended on 2026-10-05 describing this sample pass.
