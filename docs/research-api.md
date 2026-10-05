# AgeTech landscape index: research API options

Quick check (2026-10-05 Europe/Berlin). Do not buy or install yet.

## Plugin / connector status

| Provider | In dynamic tools / SearchPlugins | Auth status | Notes |
|----------|----------------------------------|-------------|-------|
| Perplexity | Not found | N/A | No MCP/plugin namespace |
| Exa | Not found as direct connector | N/A | Reachable via **treg** catalog (`exa.*`) if `TREG_TOKEN` is set |
| Tavily | Not found | N/A | No MCP/plugin namespace |
| Brave Search | Not found | N/A | No MCP/plugin namespace |
| Firecrawl | Not found | N/A | No MCP/plugin namespace |
| SerpAPI | Not found as direct connector | N/A | SERP-style data available via **treg** catalog |
| SearchPlugins (cursor) | Namespace not available | N/A | Available namespaces: Gmail, Calendar, Drive, Miro, GitHub, Finance, Granola, strunden-mail |
| treg skill | Present at local skill path | MCP tools not listed in current namespaces | Skill docs: `catalog_search` / `call` for research-search; needs `TREG_TOKEN` |

## Pricing and citations (ballpark)

| API | Ballpark cost | Citation / sources | Fit for AgeTech index enrichment |
|-----|---------------|--------------------|----------------------------------|
| Perplexity (Search API) | ~$5 / 1k requests; Fast Search ~$1 / 1k | Strong: grounded answers + source URLs (Agent/web_search ~$0.0025/call + tokens) | Good for cited company/product briefs |
| Perplexity (legacy Sonar) | ~$1/M in+out + ~$5–12 / 1k request fees by context | Citations built in | Migrating to Agent API; still usable for synthesis |
| Exa | Search ~$7 / 1k (≤10 results); Answer ~$5 / 1k; free $10/mo credits | URLs + content; deep search has field-level grounding | Strong for discovery / similar-company find |
| Tavily | Free 1k credits/mo; basic search ~$0.008/credit; Project $30/4k | Result URLs + snippets (RAG-oriented) | Cheapest trial for batch URL harvest |

## Existing research path (treg)

Local skill `/home/box/agent-data/plugins/treg/plugins/treg/skills/treg/SKILL.md` already points at research-search style endpoints: catalog search by task, then `call`. It explicitly lists semantic Exa routes (e.g. `exa.web.answer`, `exa.*.search`) plus SERP/SEO providers. Prefer that over a new vendor key if the token is connected.

## Recommendation (6 sentences)

A dedicated Perplexity (or similar) API would help enrich the AgeTech landscape index mainly for citation-backed company and product briefs, not for the core listing crawl itself. None of Perplexity, Exa, Tavily, Brave Search, Firecrawl, or SerpAPI appear as installed connectors today, and SearchPlugins is not available in the current tool namespaces. Ballpark: Perplexity Search ~$1–5 per 1k calls with strong citations; Exa search ~$7 per 1k with grounding; Tavily ~$0.008 per basic credit and 1k free credits per month. The treg skill already documents research-search endpoints, including Exa semantic answer/search and SERP-style data, so reconnecting `TREG_TOKEN` is the lowest-risk next step. Skip buying a new API until one enrichment pass fails on treg or the built-in WebSearch path. If a paid trial is needed later, start with Tavily free credits or Exa monthly free credits before committing to Perplexity for synthesized, cited write-ups.
