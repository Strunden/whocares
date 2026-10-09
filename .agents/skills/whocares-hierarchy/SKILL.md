---
name: whocares-hierarchy
description: Extend or review the Who Cares ageing-and-care atlas hierarchy, entries and discovery navigation. Use when mapping needs, specific situations, existing responses, evidence or adjacent branches; includes acceptance criteria and a worked example.
---

# Who Cares: human-centred discovery

## Product job and agreed direction

Who Cares helps venture builders find situations in ageing and care where people struggle and understand whether existing support falls short. A successful browsing path helps someone identify who they might serve, what those people want, what makes it difficult, what they do today, and what deserves further investigation. The user chooses which opportunity matters to them; the atlas does not score venture attractiveness.

This skill records the direction agreed in the local prototype on 9 October 2026. It is an implementation brief, not a claim that all content is validated or deployed. Read the repository's product and research authorities as instructed by AGENTS.md. Preserve newer explicit user decisions; do not mechanically restore earlier taxonomy or zoom behaviour.

We tried abstract problem themes, generic persona portraits, dense labels and zoom-triggered content changes. They obscured real situations and made navigation unpredictable. The resulting decisions are:
- Lead with recognisable problems, needs and desires in people's language. Do not require a theme such as “Participation in everyday life” above them.
- Use people's perspectives to clarify who experiences a need. Do not require a global persona dropdown or make five disconnected taxonomies. A relative, older adult, professional carer, provider, buyer and payer can have different interests in the same situation.
- Drill into the next map level by clicking. Panning and zooming explore and magnify that same level; they do not swap its meaning or text. Any truncation must retain the same claim and provide access to the rest.
- Keep the existing app and navigation. Iterate the content structure in JSON or a simple tree before rebuilding UI around it. Desktop is the current testing scope.
- Keep the map sparse. Content should explain itself without “Problem theme” or similar taxonomy labels. Detailed evidence and uncertainty remain accessible at the relevant record.

## The navigation hierarchy

```text
Recognisable need / desire in ageing and care
  → Specific situation where that need is difficult to meet
    → Existing responses and workarounds, with their fit and limits
      → A detailed record with evidence, scope and unanswered questions
```

The first two levels are different scales of human need, not compulsory database types. Add depth only if it materially improves discovery. Do not create a duplicate child that restates its parent or force every branch to have the same depth. Evidence and lived accounts support the relevant records at every level; they are not a final taxonomy bucket beneath all solutions.

The tree is a browsing view over a graph. Keep one stable identity for a response used in several situations. Its fit and limitations belong on each relationship. The same DRK visiting service might offer conversation or accompany someone shopping; neither proves it provides replacement care. Show one situation with several plausible alternatives, and a few adjacent needs with a reason for the connection. Do not draw every edge at once or force a one-to-one need/solution pairing.

Responses include commercial products, public and voluntary services, adaptations and actual lived workarounds. A company is not a parent need. A market offering can suggest a research question, but its existence is not independent evidence of demand, unmet need or effectiveness. A branch with no known response is valid: say coverage is unknown, not that no solution exists.

## What to show when

| View | Visible essentials | Available on deliberate inspection |
| --- | --- | --- |
| Overview | Human need title; who/context in one short sentence; useful distinct illustration | Scope and basis of the need |
| Inside a need | Specific situations with a short explanation of the constraint | Sources, variation across people, related perspectives |
| Inside a situation | Relevant responses/workarounds; one concise fit or limitation for each; useful adjacent links | Full response comparison and open research question |
| Response detail | What it does and contextual fit; authentic logo/product or service imagery when available | Evidence, locality, access, cost/eligibility where verified, outcomes and unknowns; other needs addressed |

Do not manufacture an “underserved” verdict from a missing link. To assert a shortfall, identify for whom, in what circumstances, which support fails and the evidence for that limitation. Otherwise state a testable gap hypothesis. Keep material qualifications in the visible claim; moving all uncertainty into a hidden source list does not fix misleading copy.

## Entry acceptance criteria

Every entry must pass the relevant criteria below. No arbitrary source count or perfect completeness is required. A traceable individual account may support that individual's experience; it cannot establish prevalence.

### Common requirements

- **Useful to discovery:** it changes the reader's understanding of a person, struggle, response, constraint or research question. It is not a synonym, decorative category or filler for layout symmetry.
- **Bounded and clear:** a plain-language title and short description identify the person and relevant circumstance. Split bundled needs only when their mechanism or response fit differs meaningfully. Avoid unexplained jargon and universal claims about “the elderly”.
- **Traceable identity and scope:** reuse existing record IDs where meaning is unchanged; preserve source records and provenance. Record geography, population and time when they constrain the claim; mark unknowns rather than inventing them.
- **Age scope versus visual convention:** the atlas's default illustration of an older adult is 80+, as specified in the illustration skill. This does not exclude younger research participants or change a service's documented age eligibility. Keep actual source age ranges intact and relevant caregiver ages distinct.
- **Honest status:** distinguish documented observation, participant account, provider claim, interpretation, candidate and hypothesis. A first-person editorial title is not a participant quotation. Preserve exact quotations only with an attributable source and locator.
- **Evidence supports the precise claim:** record source URL/publisher/date or access date, the relevant passage or locator, what it supports and what it does not. Search snippets, promotional imagery and AI-generated summaries alone do not validate lived needs.

### Need or specific situation

- Express what someone wants or struggles to do, with relevant context, independently of a provider or technology. “I need a wearable alarm” embeds a solution; “I need to reach help when I'm alone” leaves response alternatives open.
- The child is a concrete instance of the parent's need, not just a remotely associated topic. A barrier to getting out can sit under spending time with others if that connection is explained.
- Explain what distinguishes it from siblings. Preserve overlaps through links rather than cloning needs or creating a miscellaneous bucket.
- Attach a source-supported basis or an explicit candidate rationale and open validation question. Do not promote an inference from service availability into a validated problem.
- Separate the person experiencing the need from the buyer/payer/decision maker when that distinction matters; do not presume the family member's choice matches the older person's desire.

### Response or workaround

- Explain the mechanism: what the response actually does. Identify the provider and geography when it is a specific offering. Keep a generic response class distinct from a named provider and an individual household's workaround.
- Link it to a situation with a specific fit explanation and the relevant limit or unknown. Distinguish “does not provide X” from “we have not checked whether it provides X”. Do not invent weaknesses merely to make an opportunity look attractive.
- Cite an official source for an offering; use independent evidence for outcome claims where available. Provider marketing must remain attributed. Verify changing prices/eligibility before including them, with date and locale.
- Describe a lived workaround at the scope supported by its account. “Her daughter steps in” from one interview does not mean daughters are generally available or that family support is a scalable service.
- Use authentic provider logos/product shots with source and reuse metadata; do not generate pretend product screenshots or brand marks. A charity service may have service imagery rather than a physical product. An advice publisher is not automatically the provider of the response it describes.

### Relationships and evidence

- Every linked record resolves. Parent/child scope and response fit make sense in both directions. Keep many-to-many relationships and stable identities.
- Adjacent needs have a short reason: shared barrier, different person's perspective, or a response that overlaps. Mark an inferred connection as a hypothesis; visual proximity is not proof of causality.
- Sources are not interchangeable: population research, personal accounts, official policy and provider descriptions support different claims. Retain contradictory evidence, dates and missing perspectives rather than cherry-picking only a gap narrative.

## Acceptance states

**Ready for local review:** clear entry and placement; traceable evidence or explicitly provisional rationale; honest status; useful fit/unknowns; no broken links. Candidates can appear in a review prototype, but must not look like established findings.

**Ready to support a published finding:** the particular claim has been checked against accessible source material, scope and material limitations are visible, and publication requirements are met. This is a separate editorial decision. A working prototype, generated image or passing software test does not provide it. Never silently upgrade statuses during a merge.

**Needs revision / keep in research backlog:** solution-shaped “needs”, unsupported universal or underserved claims, duplicates, unclear perspective, untraceable factual claims, misleading imagery or broken relationships. Keep useful raw evidence; rewrite or narrow the presentation instead of deleting provenance.

## Worked example and reproducible workflow

Read [the reviewed three-branch example](references/reviewed-tree.json). It includes actual titles, contextual response links, sources and evidence from the local review. It is a dated editorial snapshot with candidates and hypotheses, not new field research or a completeness claim. It deliberately retains many-to-many responses.

For example, “I need a break from caring” splits into predictable hours and a holiday. Day care, hourly support and a relative stepping in can be relevant to the first; supported holidays and short stays may be relevant to the second. Each has different suitability and access conditions. The supported-holiday account is historical and positive, not proof of current supply or typical outcomes.

To extend a branch:
1. Read its current records and sources. State whose need and the distinguishing situation in a short tree before adding UI.
2. Draft the need/situation independently of known companies. Then investigate current responses and lived workarounds. Preserve a useful empty branch if coverage is unknown.
3. Add scoped evidence and status; connect response fit, limits and adjacent needs. Check alternative explanations and missing stakeholder perspectives.
4. Apply the acceptance criteria and the [illustration skill](../whocares-illustrations/SKILL.md). Produce the editable structure plus a brief account of what is supported and what needs research.
5. When integration is requested, reuse the existing projection and click-to-drill map. Check titles, links, shared identities, evidence access and stable content while zooming. Test whether a reader can explain a person's struggle, compare support and name the next question without a narrated tour.

In the current local clone, `study/current-hierarchy.json` is the editable structure. `review_revision.branch_record_ids` selects the three reviewed branches; `records` holds identities and `review_revision.sources`/`evidence` hold claim support. `site/js/atlas-study.js` projects it over the preserved `study/source-snapshot.json` and base `site/data/study.json`; `server/dev.mjs` serves the review on reload. `study/three-branches-review.md` is a readable projection, not a competing authority. These prototype files may not exist in a fresh checkout containing only the skills: use the bundled example to understand the model, inspect that checkout's data contract, and do not claim that skills alone install the prototype.

Deliver only the requested scope. Do not deploy or write to the live database merely because an entry passes review. Preserve the distinction between local, committed, pushed and deployed work.
