# AgeTech social enrichment: LinkedIn, X/Twitter, Reddit (Oct 2026)

Research date: **2026-10-05** (Europe/Berlin). Scope: practical ways for a Grok Bot agent on Fabian's box to enrich an AgeTech company+idea landscape `index.json`. Preference: legal / ToS-safer paths first. No outreach, no posting, no installs.

## Verified box constraints (checked this run)

| Constraint | Status verified 2026-10-05 | Notes |
|---|---|---|
| LinkedIn personal account | **Closed** | Gmail: `security-noreply@linkedin.com` "We're sorry to see you go" at **2026-10-02 13:51 CEST** (also an earlier close on 2026-08-15). Email says reactivate by signing in **within 14 days** of that notice (deadline ~**2026-10-16**). |
| X / Twitter login on box | **Not verified finished** | No treg OAuth connection (`treg connections` → `[]`). Public `x.com` HEAD returns 200; search URL redirects (307). Prior notes say login unfinished; do not invent a working session. |
| Reddit from box network | **Blocked for content** | HEAD often 200, but HTML/JSON body is Reddit's "whoa there, pardner! … blocked due to a network policy" (hosting IP). `oauth.reddit.com` → 403. Confirmed with `/r/Aging/hot.json` and `old.reddit.com`. |
| Cursor MCP catalog | **No LinkedIn / X / Reddit connectors** | Dynamic catalog search for linkedin\|twitter\|reddit\|social returned only Gmail/Drive/Calendar/Miro/GitHub search tools. Do not claim a social MCP exists. |
| treg plugin | **Available** | CLI at `/home/box/.local/bin/treg`, `TREG_TOKEN` set. Balance **~$0.78** promotional credit (of $1). Prior successful calls: `scrapecreators.reddit.search.posts`. No org-owned LinkedIn/X tools registered (`treg tool ls` → `[]`, `treg connections` → `[]`). |
| LinkedIn guest jobs API | **Works from box** | `jobs-guest/.../seeMoreJobPostings/search` → HTTP 200 (managed skill `site-playbooks-linkedin`). |

---

## Cross-cutting: what to put in `index.json`

Recommended enrichment fields (pull when cheap; stamp `source` + `fetched_at`):

| Field | Why | Best TODAY source |
|---|---|---|
| `company.linkedin_url` | Canonical firm page | Google `site:linkedin.com/company` via `treg.google.serp.organic`, or `treg.linkedin.company.profile` / `treg.companies.enrich` |
| `founders[].linkedin_url` | People graph, outreach later | SERP + `treg.linkedin.user.profile` / `treg.people.enrich` |
| `founders[].x_handle` | Funding / product voice | SERP `site:x.com` + `treg.x.user.profile` |
| `hiring.recent_roles[]` | Signal of growth / focus | LinkedIn guest jobs curl, or `anyapi.linkedin.search.jobs` / `apify.linkedin.search.jobs` via treg (~$0.0005–$0.001) |
| `announcements[]` | Product / funding posts | Company LinkedIn posts via treg (`harvestapi.linkedin.company.posts`, `scrapecreators.x.v1-linkedin-company-posts`); X via `treg.x.search.posts` / `treg.x.user.posts` |
| `competitors.mentions[]` | Landscape edges | X keyword search; Reddit search via treg (bypasses box block) |
| `reddit.sentiment_snippets[]` | Caregiver / operator honesty | `scrapecreators.reddit.search.posts` or `tikhub` Reddit search via treg; subreddits like r/Aging, r/CaregiverSupport, r/homecare, r/nursing, DE Pflege communities |
| `funding.tweets[]` | Round / investor signals | `treg.x.search.posts` with `("raised" OR funding OR Series) (AgeTech OR "senior care" OR …)` |
| `social.last_enriched_at` | Freshness | Always write ISO timestamp in Europe/Berlin or UTC with zone |

Keep payloads thin: URL, date, 1–2 sentence snippet, score/ups if present. Do not store full scrape dumps in the index.

---

## 1. LinkedIn

### 1.1 Official APIs

| Item | Reality (Oct 2026) |
|---|---|
| Access | Mostly **partner / vetted**. Community Management + Advertising APIs: apply via LinkedIn Developer Portal; Development tier default, Standard after vetting. Sales Navigator API (SNAP): **partner-only, not open to new apps**. Profile/people search as a general enrichment API is **not** a self-serve product for arbitrary company landscapes. |
| Cost | No public list price for Community Management; partner programs. Not usable without Fabian creating a developer app **and** LinkedIn login / org admin where required. |
| Rate limits (Community Management Development) | ~**500 app calls / 24h**, ~**100 per member / 24h**; BATCH_GET and some webhooks disabled until Standard. |
| Fields | Org pages you admin: posts, comments, followers, roles. Organization Lookup returns limited fields for non-admins. **Not** a substitute for scraping competitor company pages at scale. |
| Box use TODAY | **No.** Account closed; no LinkedIn OAuth in treg; no LinkedIn MCP. After reopen: still need approved app + scopes; signed-in browser helps humans, not bulk API. |

### 1.2 MCP / Cursor connectors

**None in catalog** for LinkedIn. Do not install without Fabian noting approval. Closest related: Gmail (closure emails), Google Drive (index files), managed skill `site-playbooks-linkedin` (guest jobs curl playbook, not a connector).

### 1.3 treg endpoints (usable TODAY without Fabian's LinkedIn login)

treg relays **third-party** LinkedIn data providers (server-side keys). These do **not** need Fabian's account. They may still conflict with LinkedIn ToS; prefer for research enrichment with low volume and clear attribution.

High-value routed IDs:

| Endpoint | Approx cost | Deliverable |
|---|---|---|
| `treg.linkedin.company.profile` | ~$0.001–$0.004 / success | Company page from URL/handle |
| `treg.linkedin.user.profile` | ~$0.0012+ / success | Public person profile |
| `treg.companies.enrich` | ~$0.0018+ / success | Firmographics from domain / LinkedIn URL |
| `treg.people.enrich` | ~$0.00263+ / success | Person from email / LinkedIn URL / name+domain |
| `harvestapi.linkedin.company.posts` | ~$0.004 / call | Company announce posts |
| `scrapecreators.x.v1-linkedin-company-posts` | ~$0.00188 / call | Company posts |
| `anyapi.linkedin.search.jobs` | ~$0.0005 / success | Hiring signals (thin) |
| `apify.linkedin.search.jobs` / `harvestapi.linkedin.search.jobs` | ~$0.001 | Job search |

Also free filters under `leadsforge.linkedin.company.followers.*` (async followers jobs are paid).

**OAuth paths** `linkedin.linkedin.user.post.create`, `linkedin.linkedin.user.profile` (connected member) are free on treg's model **but require a connected LinkedIn account**. `treg connections` is empty → unavailable until Fabian reconnects after reopen.

### 1.4 Browser scraping vs signed-in search

| Mode | Risk | Fit |
|---|---|---|
| Guest jobs API (`jobs-guest`) | Low–medium; Cloudflare challenges possible | **Good TODAY** for hiring enrichment (skill already documents curl). |
| Anonymous company/person pages | Auth walls, partial HTML, ToS | Weak for bulk; use treg profile endpoints instead of headless scrape loops. |
| Signed-in browser (after reopen) | Account risk if automated; LinkedIn actively sues scrapers (Proxycurl shut down after LinkedIn lawsuit, 2025–2026) | Manual spot-checks only. Do not automate logged-in scraping. |

### 1.5 Public search operators (Google / SERP)

Use `treg.google.serp.organic` (~$0.0009/success) or WebSearch:

```
site:linkedin.com/company ("AgeTech" OR "senior care" OR "home care" OR Pflege OR "assisted living") (Europe OR Germany OR Berlin OR UK)
site:linkedin.com/company "remote patient monitoring" elderly OR seniors
site:linkedin.com/in ("AgeTech" OR "longevity" OR "senior living") (founder OR CEO OR "co-founder")
site:linkedin.com/jobs "care coordinator" OR "pflege" company:"<Name>"
"<CompanyName>" site:linkedin.com/company
```

### 1.6 Third-party enrichers (public pricing ballpark)

| Vendor | Delivers | Approx cost (public) | Note |
|---|---|---|---|
| **Proxycurl** | Was LinkedIn person/company API | — | **Gone** (post-lawsuit shutdown). Do not plan on it. |
| **Bright Data** LinkedIn Profiles / company scrapers | Profile/company JSON | ~$1.50 / 1k records PAYG; free ~5k/mo credits on signup; $499/mo plans | Also exposed via treg (`brightdata.linkedin.*`) at ~$0.0015/result. |
| **Apify** LinkedIn actors | Profiles, companies, jobs | Often ~$3–$10 / 1k depending on actor; platform + usage | Via treg `apify.linkedin.*` where catalogued. |
| **Coresignal / PDL** | Dataset enrich | Per-record, often cheaper at volume, staler | In treg under `pdl.companies.enrich` (~$0.38) etc. |
| Account-based (Linked API, Unipile) | Live via **your** session | ~$49/seat/mo class | Needs open LinkedIn account; higher account-ban risk if abused. |

### 1.7 Recommendation for OUR constraints

**TODAY (account closed):** Prefer **treg** (`treg.linkedin.company.profile`, `treg.companies.enrich`, jobs endpoints) + **Google `site:linkedin.com`** via `treg.google.serp.organic` + **guest jobs curl**. Avoid browser login automation.

**After reopen (~by 2026-10-16):** Manual signed-in research + optional treg OAuth connect for *own* posting/profile tools. Still prefer treg public enrichers over logged-in scraping. Official Community Management API only if building page-admin tooling, not landscape index.

**Top line:** Use treg LinkedIn company/person/jobs endpoints + SERP `site:linkedin.com`; do not wait on account reopen for index enrichment.

---

## 2. X / Twitter

### 2.1 Official APIs

| Item | Reality (Oct 2026) |
|---|---|
| Access | Developer Console; **pay-per-use credits** (Free tier discontinued ~Feb 2026 for new apps). |
| Cost (reported) | Rough public figures: ~**$0.005 / post read**, ~**$0.015 / post create** (~$0.20 with URL), recent-search billed per results. Cap ~**3M post reads / billing cycle** before Enterprise. Confirm live rates in Developer Console. |
| Rate limits (self-serve examples) | Recent search ~**450/app / 15 min** (and per-user caps); timeline and lookup have separate windows. 429 on exceed. |
| Fields | Tweet text, metrics, user profile, recent search (7-day on standard recent search; full archive is higher tier / search-all). |
| Box use TODAY | Possible **if** Fabian creates an app and buys credits, **or** uses treg's metered `x.x.*` / third-party X providers. Fabian's unfinished X login is **not** required for app-only or treg third-party reads. |

### 2.2 MCP / Cursor connectors

**None** for X/Twitter in the dynamic catalog. treg documents that an X connection through treg's app is **metered per call**; team's own X developer app is not metered by treg. Currently **no** X connection registered.

### 2.3 treg endpoints (works TODAY)

| Endpoint | Approx cost | Use |
|---|---|---|
| `treg.x.search.posts` | ~$0.00075+ / success | Keyword / advanced operators (`from:`, `since:`, etc. via anyapi child) |
| `treg.x.user.profile` | ~$0.00022+ | Handle → bio, followers |
| `treg.x.user.posts` | ~$0.0005+ | Recent posts from a company/founder handle |
| `treg.x.post.comments` | ~$0.0005+ | Thread replies |
| `x.x.search-posts-recent` / `x.x.search-posts-all` | ~$0.005 / result | Official X via treg (needs treg X app metering or org key) |
| `x.x.post.create` | ~$0.015 | **Do not use** for this task (no posting) |

### 2.4 Browser scraping vs signed-in search

| Mode | Risk | Fit |
|---|---|---|
| Logged-out browser | Heavy JS, login walls, rate limits | Poor for agents; prefer treg search. |
| Signed-in browser (after Fabian finishes login) | Better UI search; automation still ToS-risky | Manual / light computerUse only. |
| Third-party scrapers via treg | ToS gray; works without login | **Best TODAY** for funding tweets / competitor mentions. |

TweetDeck: legacy Twitter-only column UI; not a modern listening stack and not available as a box connector. Prefer `treg.x.search.posts` or Social Searcher / Brand24 for human monitoring.

### 2.5 Public search operators

X advanced syntax (feed to `treg.x.search.posts` `q`):

```
("AgeTech" OR "age tech" OR "senior care" OR "home care technology") (raised OR funding OR "Series A" OR "seed round")
from:TechCrunch (AgeTech OR "senior living" OR caregiving)
("<CompanyName>" OR @handle) (launch OR raised OR hiring)
AgeTech (Berlin OR Germany OR Europe) -is:retweet
```

Google:

```
site:x.com OR site:twitter.com ("AgeTech" OR "senior care") (funding OR raised)
site:x.com "<CompanyName>" (raised OR announce OR launch)
```

Note: prior landscape work found `site:x.com` sometimes thin; combine with treg X search.

### 2.6 Third-party / listening tools

| Tool | Delivers | Approx cost |
|---|---|---|
| Social Searcher | Multi-network mention search (X coverage uneven post-API changes) | Free limited; paid from ~€3.49/mo |
| Brandwatch | Deep historical social + web | Enterprise quotes (~$800+/mo class; often much higher) |
| Brand24 / Awario / Mention | Mentions + light sentiment | ~$49–$79+/mo entry |
| Apify / ScrapeCreators / AnyAPI X actors | Structured posts | Via treg cents per call |

### 2.7 Recommendation for OUR constraints

**TODAY:** Use **`treg.x.search.posts` + `treg.x.user.posts/profile`**. No need to finish X login for read enrichment. Optional later: connect Fabian's X via treg or buy official credits for higher trust / archive search.

**After X login finished:** Slightly better for manual verification in browser; still use treg for bulk. Do not post from enrichment jobs.

**Top line:** treg X search/profile/posts is the working path today; official X API is optional paid backup.

---

## 3. Reddit

### 3.1 Official APIs

| Item | Reality (Oct 2026) |
|---|---|
| Access | OAuth app registration; Reddit pushing apps toward **Developer Platform**; register apps (deadline messaging around **2026-09-30** for good standing). Free tier for permitted use; commercial / bulk may need paid agreement. |
| Cost | Free at **100 QPM per OAuth client** (averaged over ~10 min) for eligible free use; commercial pricing not public (contact Reddit). |
| Fields | Posts, comments, subreddit listings, user (subject to Data API Terms). |
| Box use TODAY | **Direct reddit.com / oauth.reddit.com from box IP is network-blocked.** Even with OAuth credentials, calls from this box IP may fail the same policy unless Reddit allows authenticated traffic (help text suggests login can help browsers; unverified for API from this IP). Prefer **treg** (egress from treg's providers, not the box). |

### 3.2 MCP / Cursor connectors

**None** for Reddit.

### 3.3 treg endpoints (works TODAY; bypasses box block)

Proven on this org (ledger already shows `scrapecreators.reddit.search.posts` settles).

| Endpoint | Approx cost | Use |
|---|---|---|
| `scrapecreators.reddit.search.posts` | ~$0.00188 / call | Sitewide search (prefer `sort=relevance`) |
| `tikhub.x.reddit-app-fetch-dynamic-search` | ~$0.001 / success | Alternate search |
| `treg.reddit.subreddit.posts` | ~$0.001+ | Subreddit feed |
| `treg.reddit.post.detail` | ~$0.001+ | One post |
| `anyapi.reddit.post_comments` | ~$0.0012 | Comments for sentiment |
| `justoneapi.x.reddit-search-v1` | ~$0.0148 | Pricier fallback |

### 3.4 Browser scraping vs signed-in search

| Mode | Risk | Fit |
|---|---|---|
| Direct browser/curl to reddit.com on box | **Blocked** (confirmed) | Dead TODAY. |
| Signed-in browser from box | May still hit network policy; unknown until Fabian tests | Only try after unblock or different egress. |
| Archive mirrors (Arctic Shift, Pullpush) | Historical; incomplete | Box can reach arctic-shift / pullpush hosts (HEAD 200). Useful for old threads when live Reddit is blocked; not first choice for fresh landscape. |
| treg Reddit providers | ToS gray vs official API; practical | **Best TODAY.** |

### 3.5 Public search operators

Google (works without Reddit IP):

```
site:reddit.com (AgeTech OR "senior care" OR "home care" OR Pflege) (app OR startup OR product)
site:reddit.com/r/CaregiverSupport OR site:reddit.com/r/Aging "<CompanyName>"
site:reddit.com ("medication reminder" OR "fall detection" OR "nurse call") (recommend OR hate OR "don't buy")
```

Reddit native (via treg search query string):

```
AgeTech OR "senior tech" OR "care tech"
"<CompanyName>"
subreddit:homecare OR caregiving (software OR app OR startup)
```

Useful subs for AgeTech: r/Aging, r/CaregiverSupport, r/dementia, r/homecare, r/nursing, r/AssistedLiving, DE: Pflege-related subs (discover via search).

### 3.6 Third-party

| Vendor | Delivers | Approx cost |
|---|---|---|
| Apify Reddit scrapers | Posts/comments/search | Roughly **$0.60–$4.50 / 1k** results depending on actor; $5 free Apify credits/mo |
| ScrapeCreators / TikHub | Search + feeds | Via treg ~$0.001–$0.002 |
| Brandwatch / Brand24 | Reddit + web listening | See X section pricing |
| Official Reddit API | Cleanest ToS path | Free QPM limits; needs working egress + app |

### 3.7 Recommendation for OUR constraints

**TODAY:** Do **not** hit reddit.com from the box. Use **`scrapecreators.reddit.search.posts` / `treg.reddit.*` via treg** + Google `site:reddit.com`. Optional archive APIs for old citations.

**After network unblock (and optional Reddit login):** Official OAuth script on box becomes viable for ToS-safer continuous pulls; keep treg as fallback.

**Top line:** treg Reddit search is the only reliable live path from this box today.

---

## Ranked playbook under OUR constraints

### Works TODAY (priority order)

1. **treg social/enrich catalog** (LinkedIn company/person/jobs, X search/posts, Reddit search) — cents per call; balance ~$0.78 left (top up before large batches).
2. **`treg.google.serp.organic`** with `site:linkedin.com` / `site:reddit.com` / `site:x.com` operators — discovery of URLs before paid profile pulls.
3. **LinkedIn guest jobs curl** (managed skill) — hiring signals without login.
4. **Public company sites, press, Crunchbase/news via normal web** — not social, but fills funding fields when tweets are thin.
5. **Arctic Shift / Pullpush** — only for historical Reddit when needed.

### After Fabian actions

| Action | Unlocks |
|---|---|
| Reactivate LinkedIn by ~**2026-10-16** (email of 2026-10-02) | Manual LI research; optional treg LinkedIn OAuth for *own* identity tools; still prefer treg public enrichers for third-party companies. |
| Finish X login on box | Manual verification of tweets; optional treg X connection. Bulk still via `treg.x.*`. |
| Unblock Reddit egress (or run API from non-blocked network) | Official Reddit OAuth becomes realistic; keep treg until proven. |
| Top up treg balance | Batch enrich hundreds of companies safely. |
| Buy official X API credits (optional) | Higher-trust / archive search without third-party scrapers. |

### What NOT to do

- Automate signed-in LinkedIn scraping (lawsuit risk; Proxycurl precedent).
- Post or message anyone from enrichment jobs.
- Assume a Cursor LinkedIn/X/Reddit MCP exists (it does not in current catalog).
- Depend on Proxycurl.
- Hammer reddit.com from the box IP expecting HTML/JSON success.

### Suggested per-company enrichment recipe (cheap)

1. SERP: `site:linkedin.com/company "<Name>"` + `site:linkedin.com/in "<Founder>"` (~$0.001).
2. If URLs found: `treg.linkedin.company.profile` + optional founder `treg.linkedin.user.profile` (~$0.002–$0.005).
3. Jobs: guest curl or `anyapi.linkedin.search.jobs` with company name (~$0.0005).
4. X: `treg.x.search.posts` with company name + funding operators; if handle known, `treg.x.user.posts` (~$0.001–$0.003).
5. Reddit: `scrapecreators.reddit.search.posts` query=`"<Name>" OR <product>` sort=relevance (~$0.002).
6. Write snippets + URLs + `fetched_at` into `index.json`; skip empty platforms.

Budget sketch: **~$0.01–$0.02 per company** for a light pass; ~50 companies ≈ $0.50–$1.00 (top up treg first).

---

## Sources / verification stamps

- Gmail LinkedIn closure threads (2026-08-15 and **2026-10-02 13:51 CEST**).
- Live curl: Reddit block page; LinkedIn jobs-guest 200; treg catalog/balance/connections.
- Microsoft Learn LinkedIn Community Management (2026 LMS docs): Development tier 500/100 limits.
- Secondary reporting on X pay-per-use pricing and Reddit Data API wiki / Developer Platform notices (cross-check Developer Console / Reddit Help before spending).
- Bright Data / Apify / Proxycurl-alternatives public pricing pages (2026).
- treg SKILL.md + live `treg catalog get` for endpoint costs.

