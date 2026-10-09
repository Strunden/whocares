---
name: whocares-hierarchy
description: Author, research or review the Who Cares needs → situations → existing solutions hierarchy, database navigation metadata and entry acceptance criteria. Use for indexing ageing-and-care research or extending atlas branches.
---

# Who Cares: needs, situations and existing solutions

## Product job and agreed direction

Who Cares helps venture builders find situations in ageing and care where people struggle and understand whether existing support falls short. A useful visit leaves someone able to identify who they might serve, what that person wants, what makes it difficult, what is already offered and which question to investigate next. The atlas does not score venture attractiveness or choose a venture for the user.

This brief records the integration direction agreed on **9 October 2026**, superseding the earlier three-branch prototype. Follow the principle authority and research standards in the repository's `AGENTS.md`; this skill neither replaces those authorities nor authorizes database writes or deployment. The integration work checked live product principles version 1, hash `1698c1ce402af9694166b15938d24fb9fb05c55e85a330b4e589b7dca5b2a8c2`; future agents must check the current record as instructed there.

The decisions another agent needs to preserve:

- **One structure across the whole visible atlas:** recognisable needs → specific situations → existing solutions. Do not mix old company themes, historical research buckets and the new structure between branches.
- Define needs independently of companies. Abstract themes, taxonomy labels and generic persona portraits previously obscured the situations people recognised.
- Existing solutions include named products, services, public provision and organised community support. They are concrete offerings a venture builder can investigate. A lived workaround remains valuable supporting evidence, but is **not a solution tile**. A generic mechanism or a future idea is not a named existing offering.
- People’s perspectives clarify the person affected and the buyer, payer or decision-maker. All lenses use one graph with stable identities; do not create separate persona taxonomies.
- **Click to drill; zoom only magnifies the current level.** Retain continuous pan/zoom and stable content. This explicit user decision supersedes earlier implementation briefs that changed semantic content at zoom thresholds.
- The brand’s second line shows the tagline only at the root. Within a branch, breadcrumbs replace it in the same position. No root “All needs” label, duplicate map heading or extra “Scope & evidence” control. Breadcrumbs use authored short titles; tiles and records use full titles.
- Keep the existing app, sparse map and evidence access. Desktop is the current review scope. Do not add dense metadata labels to explain a weak title.

## Hierarchy and information shown

```text
Need: I need a break from caring
  Situation: I need a few predictable hours to myself
    Existing solutions: Johanniter day care; Careship hourly support;
                        Alzheimer Hamburg home support visits
  Situation: I need a holiday without carrying all the care myself
    Existing solutions: a named supported-holiday offering;
                        a named short-term residential-care offering
```

Each solution opens a detailed record. Evidence, lived accounts, workarounds, mechanisms and open questions support the appropriate need, situation or solution; they are not additional mandatory map levels. “A relative steps in” belongs in a sourced account, not beside a bookable day-care service as an equivalent offering.

| View | Essentials on the map | Detail on deliberate inspection |
| --- | --- | --- |
| All needs | Human need, one short context line, relevant illustration | Whose perspective, scope and evidence status |
| Inside a need | Distinct situations, concise constraint, relevant illustration | Evidence, variation, related needs and unresolved questions |
| Inside a situation | Existing solutions and one contextual fit/limitation per item | Comparison of access, cost, eligibility and support boundaries |
| Solution detail | What it offers and for whom; authentic provider/product media | Sources, availability, price date, limits, unknowns and other situations served |

Keep material qualifications with the claim they qualify. An offering's existence does not establish demand, effectiveness or adequate support. Sparse coverage means research is incomplete; it does not mean no solutions exist. Research more offerings without reshaping the need to match a catalogue. Show differences between alternatives rather than inflate a branch with duplicates.

## Canonical data and projection contract

**The database graph is canonical.** The current integration covers six needs and nineteen situations across all branches. These counts describe the integration baseline, not a completeness claim or a limit on future research. Preserve historical records, sources and research context even where they are no longer navigation tiles; candidates remain candidates.

`site/js/atlas-needs.js` projects the live graph into map navigation. Local prototype JSON is not a production dependency or a parallel source of truth. Inspect the actual schema, read-layer payload and projection before editing; navigation roles are metadata, not new object kinds.

- Need: object `scope.navigation.role = "need"`.
- Situation: object `scope.navigation.role = "situation"`.
- Existing solution: `scope.navigation.role = "solution"` on an existing `solution` or `institutional_response` object. Public/community provision uses the latter where appropriate.
- Situation → need: `context_for`, with `from_id` the situation, `to_id` the need and `provenance.navigation = true`.
- Solution → situation: `responds_to`, with `from_id` the solution, `to_id` the situation and `provenance.navigation = true`. Put the situation-specific fit in the relationship statement and attach its evidence/provenance. The current reader also accepts explicitly flagged legacy `addresses` links; use `responds_to` for newly authored navigation links.
- `scope.navigation` carries the full display `title`, an authored `short_title` for breadcrumbs, `summary`, ordering and applicable lens metadata. Need/situation nodes require an approved `image`; the current reader expects `assets/illustrations/study/<filename>.png`. `view_id`, when used, preserves readable/stable routes without changing the object ID.
- Only deliberately flagged relationships enter the browsing tree. Historical `context_for` or `responds_to` research edges must not automatically become navigation. Never flag a workaround merely to fill a solution level.

One solution can respond to several situations. Reuse its identity; record fit and uncertainty on each edge. A visiting service that offers conversation does not thereby provide replacement nursing. A transport service can help someone get out without supplying companionship at the destination. Keep solution scope narrower than the provider's entire company where offerings differ.

## Acceptance criteria for entries

### Every record

- Helps someone understand a person, struggle, offering or meaningful constraint; not a synonym, decorative grouping or filler.
- Plain title and short explanation identify the person/context without universal claims about older people. An editorial first-person title is not a participant quote.
- Every mapped need, situation and solution stores both `scope.navigation.title` and `scope.navigation.short_title`. Short labels should usually be two to five words, remain distinguishable among siblings and preserve the meaning of the full title; a concise product name can serve as both. Do not generate them by character truncation or replace the full title. Preserve provider identity in solution labels.
- Stable identity, geography, setting and time scope; preserve source records and provenance. Distinguish the person affected from the buyer/payer.
- Honest epistemic status: documented observation, provider description, interpretation, candidate, hypothesis or unknown. Reorganisation and a citation do not upgrade status.
- Claims have source URL/publisher, date or access date, locator and an explanation of what is supported. Search snippets alone are insufficient verification. Keep contrary evidence and missing perspectives.

### Need and situation

- States a human desire or difficulty independently of a technology/provider. “I need to reach help when alone” leaves alternatives open; “I need an alarm pendant” preselects one.
- A situation is a specific instance of its parent need and distinguishable from siblings. Avoid duplicating the parent's title or using miscellaneous catch-alls.
- Has a source-supported basis, or an explicit candidate rationale and validation question. An offered product cannot alone validate the underlying need.
- Has a relevant reviewed illustration in the approved style. The default illustrated older adult is 80+; actual research and service age criteria remain unchanged. Follow the [illustration skill](../whocares-illustrations/SKILL.md), including scene specificity, respectful interactions and soft unfinished edges.

### Existing solution

- A real, identifiable current offering with named provider and mechanism: what does it actually do? Products, services, public and organised community provision qualify; a generic response class, idea or informal household workaround does not qualify as a solution tile.
- An opened official source verifies the offering. Record country/locality, access route, relevant eligibility and cost where published; explicitly record unknowns. Keep dates for prices and time-bound programmes. A past holiday is not current bookable capacity.
- The linked situation has a specific fit statement and material limitation or unknown. Distinguish a verified exclusion from something not checked. Do not invent weaknesses to imply opportunity.
- Provider evidence supports features and stated availability, not independent effectiveness. Use appropriate independent evidence for outcome claims; mark live capacity unverified unless checked.
- Use authentic provider logos and product/service imagery with source/reuse metadata; no generated brand marks or pretend product shots. A publisher explaining an intervention is not automatically its provider.

### Relationships and historical context

- All linked identities resolve; direction, parent scope and solution fit are correct. Preserve many-to-many reuse and relationship-level evidence.
- Related needs have a stated connection, not assumed causality from visual proximity. Mark inferred connections as such.
- Retain sourced lived workarounds, older classifications and accounts in the research graph. Exclude them from solution navigation without deleting their provenance.

## Whole-branch acceptance and success checks

Before a branch becomes visible, confirm its complete path follows the same needs → situations → existing solutions contract as every other branch. All visible need/situation items have readable titles, context lines and approved illustrations. Solutions resolve to inspectable records with source-supported mechanisms and honest availability/unknowns. An empty solution level must state research coverage is incomplete; never fill it with generic mechanisms or unsupported “no alternatives” claims.

After browsing without narration, can a venture builder:

1. Explain who struggles, what they want and how adjacent situations differ?
2. Compare concrete existing offerings and identify differences in fit, access or scope?
3. Distinguish evidence from interpretation and identify what remains unknown?
4. Form a specific next research question without interpreting tile size, order or colour as an opportunity ranking?

Functional tests check projection, links, preserved identities, evidence access and stable zoom content. They do not replace observation of venture builders or validate market demand. Keep candidate publication rules distinct from whether navigation renders.

## Workflow and historical example

Start from current database objects/relationships and source material; sketch the desired branch if that aids review. Research needs independently, then verify existing offerings and their fit. Reuse identities, retain status, record sources and update navigation metadata through the authorised audited workflow in `AGENTS.md`. Review the projected branch in the existing map and check the acceptance criteria above. Do not maintain hand-edited JSON as a production overlay.

The bundled [three-branch example](references/reviewed-tree.json) is a **historical prototype snapshot from earlier on 9 October 2026**, before the whole-atlas, existing-solutions-only decision. Read it only to understand provenance, identities and many-to-many research links. It contains workaround leaves and older response groupings that must not be copied into current navigation. In particular, the family member stepping in remains supporting evidence; named day-care and hourly-support offerings are solution alternatives. Historical supported-holiday accounts remain evidence of those accounts, not proof of today's supply.

This skill documents the intended data/display contract, not deployment status. Report separately what is local, committed, pushed, migrated and deployed; perform only the actions authorised for the task.
