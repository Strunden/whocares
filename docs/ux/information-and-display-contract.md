# Information criteria and index display

Operational contract, 8 October 2026. Implements WhoCares principles v1, hash `1698c1ce402af9694166b15938d24fb9fb05c55e85a330b4e589b7dca5b2a8c2`. Internal delivery has standing user authorization; automated evidence checks and operational inspection remain.

## Admission and display

| Information | Required basis | How it appears |
| --- | --- | --- |
| Problem space | Bounded human/operational friction, affected people, inclusions/exclusions, provisional boundaries and gaps. Independent of company categories. | Landscape title and short orientation; drill into its problems and explicit connections. |
| Problem | One scoped obstacle; who, when, setting, geography and dated evidence or explicit unknowns. Distinct survey populations remain separate. | Short obstacle title; full assertion, epistemic status, scope and source detail in deep dive. |
| Situation | Attributed account/observation with speaker or study population, setting, date and limits. | Concrete context linked by `arises_in`. Fiction is labelled illustrative and never evidence. |
| Workaround | Described action people actually take, what it compensates for and its limits. | A separately sourced `works_around` connection. Unobserved suggestions stay hypotheses. |
| Mechanism | Institutional, environmental, financial or workflow explanation with supporting premises. | `contributes_to` connection with its own evidence; causal hypotheses stay visibly hypothetical. |
| Institutional response | Named policy, benefit, service or advocacy proposal, responsible actor and temporal/access scope. | Distinguish existing provision, measured use, counselor perception and requested policy change. No assumed access or effectiveness. |
| Product/service | Resolved provider identity, sourced capability and intended user; buyer, payer, price, Germany availability and maturity dated or explicitly unknown. | Offering, product image where checked, audience/access/price/availability facts with individual sources; outcomes remain unverified unless independently evidenced. |
| Aspiration/stakeholder | Attributed desired outcome or explicitly normative inclusion; never invent universal wishes. | Perspective and context in the same graph, not duplicate persona taxonomies. |
| Open question | Specific missing answer and useful next source/action; retain conflicting accounts. | A visible research gap connected to the relevant object; added to the durable backlog. |
| Source | Publisher, URL, captured version, access date; publication date, method, population/sample, geography and limitations recorded or unknown. | Group repeated citations by source version; retain every passage locator. Distinguish support, contradiction, origin and context. |
| Relationship | Explicit endpoints, scoped explanatory statement, status and its own evidence. | Explain why records connect. Object citations alone do not establish a causal or effectiveness edge. |
| Product image / logo | Observed official page or attributable source; asset URL, source snapshot hash, observed date, identity check, alt text, credit, depiction type and rights status. | Product depiction beneath the introduction; logo/icon for recognition. Caption distinguishes render/prototype/unknown and provider origin. Images never count as outcome evidence. |

Unknown fields are acceptable and visible. Missing evidence prevents stronger status, not preserving a useful partial finding. A reviewer checks every material clause against captured passages before mapping. There is no blanket three-source quota: independence and fitness for the claim matter more than count.

## Delivery rules implemented

1. Research saves passages, source assessments, follow-ups and media candidates. Models cannot write the catalog.
2. A second model reviews each finding; the supervising agent checks scope, identity, duplicate candidates and graph mapping. The user does not approve each batch.
3. The adapter creates version-bound import artifacts; the authorized executor writes an audited internal database branch, verifies the read snapshot and records delivery.
4. `atlas.object_presentations` stores a short title (maximum 90 characters) and orientation summary (maximum 420), separate from assertions. Each reviewed presentation records exact dependencies and a SHA-256 fingerprint. The exporter rejects stale hashes; the browser falls back if dependencies change. Status is never strengthened by polished copy.
5. `atlas.product_media` stores external sourced-media references attached to existing company identities. Image bytes remain with their source; the capture hash identifies the HTML where discovered, **not immutable image bytes**. No generated product photos/logos. The separately proposed generated-illustration asset registry is not implemented by this migration.
6. Candidate discovery costs no added model/search/image-download calls: extract URLs from saved HTML. Text and media changes have separate histories. Candidate collection is bounded to 24 per source and deduplicated. This is a first-pass collector for image tags, site icons and social metadata; CSS-only images and inline logos need a targeted follow-up.
7. Media identity/depiction checks are agent responsibilities. Unknown rights are allowed only in this internal prototype; public display/export requires recorded licensing/permission evidence. Broken media hides without hiding the record. Remote bytes can change: do not claim binary integrity or archival hosting.
8. For each delivered cohort, log source/finding versions, mapping, database branch/batch, affected IDs, visual checks and spending. Unsupported or unresolved claims stay held. Release the next bounded research question only after inspecting the current cohort.

## First populated slice

Ten display presentations cover the caregiver space, six existing findings and three gaps. The current surveys do not supply direct lived situations or observed workarounds; the next bounded brief targets those gaps. Rhem's product image and website icon demonstrate sourced product media, labelled as provider imagery with unconfirmed photo/render type and rights; its page states preorder. Nothing here establishes German availability, medical performance or delivery.

Internal database migration: `20261008-research-presentation-media.sql`, tested on a child of the existing verified research branch. Public production deployment remains separate.
