# Scene-based discovery trial — 11 October 2026

**Withdrawn after user review.** The user could not identify a starting point and found the scene insufficiently meaningful. Its presentation status is now `withdrawn`; the metadata remains in the database for audit, while the desktop renderer no longer displays it. Do not scale this design on the basis of functional tests. The failure was an abstract umbrella statement over hypotheses, with the long needs list still dominating orientation. A concrete situation requires a person, circumstance, goal and consequential obstacle; a headline plus plausible related points does not establish that situation.

## Product question

Can a venture builder understand a bounded problem faster when related difficulties are presented through a recognisable scene and an open question, rather than a flat list of equally prominent statements?

The user approved trying this direction. The first internal trial uses the existing family-care need `wc-candidate-f85711be98f5f495e1a4bc5d`. Its five existing child situations remain hypotheses. The scene is an illustrative editorial grouping, not an observed participant account or proof that all difficulties occur together. No additional graph level, invented persona, new offering or public deployment is introduced.

## Published guidance and its limits

- [IDEO.org: Create Insight Statements](https://www.designkit.org/methods/create-insight-statements.html) describes synthesising research themes into a small set of concise insights. [How Might We](https://www.designkit.org/methods/how-might-we.html) then frames bounded challenges that allow multiple answers. These are practitioner methods, not comparative evidence that this atlas will improve venture outcomes.
- [NN/g: How Might We questions](https://www.nngroup.com/articles/how-might-we-questions/) recommends starting from discovered problems, focusing on desired outcomes and avoiding embedded solutions. Our trial starts from explicitly unvalidated candidates, so its question remains provisional. “A clear plan” may overemphasise planning; test whether readers still imagine service, organisational and policy responses.
- [Teresa Torres: Opportunity Solution Trees](https://www.producttalk.org/2016/08/opportunity-solution-tree/) recommends organising customer-story opportunities around moments in an experience map. This supports context-led grouping. Her method serves a team with a defined outcome and ongoing interviews; a broad atlas of existing offerings is not a validated opportunity solution tree.
- [Seera Group case study](https://www.producttalk.org/discover-a-new-market/) describes interview-derived opportunity mapping informing further interviews and competitive analysis. It is a reported practitioner example, without a controlled comparison or evidence of the effect of our presentation.
- [NN/g: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) supports simplifying initial displays and revealing detail with clear labels. It also warns that too many layers impede use. The scene should explain the selected branch, not add another mandatory click before its points or offerings.

## What to test

Compare the old list and scene presentation using the same records and offerings. Counterbalance order, use comparable branches and recruit venture builders unfamiliar with those branches; do not count familiarity with the first version as a design effect.

Proposed pilot tasks and measures (test criteria, not proven benchmarks):

1. After a short browse, explain who is affected, what they want and two distinct obstacles. Record time and accuracy, not clicks alone.
2. Find an existing response and explain one supported fit or access limit. Record successful completion and navigation errors.
3. State a specific next research question. Evaluate whether it identifies a person, circumstance and uncertainty rather than merely naming an app idea.
4. Distinguish the illustrative scene and hypotheses from provider-supported offering claims. Any increase in false confidence is a failure even if browsing is quicker.
5. Find an adjacent concern and return to the original branch. Check whether compression has hidden breadth or made related areas harder to discover.

The expected benefit is faster comprehension and a better next investigation. Idea quantity, attractiveness ratings and company counts do not establish this benefit. Interviews and source research still need to ground the scene, including successful arrangements and counterexamples.

## Implementation and verification

`scope.navigation.scene` on one canonical need stores `status: illustrative`, title, summary, question and compact point labels keyed by existing child IDs. Desktop reads that metadata; original full titles, identities, evidence and links remain intact. Other branches retain their current presentation; this is a bounded trial rather than an atlas-wide reorganisation.

The audited change was backed up and applied first to the isolated test branch, then to the internal atlas database. Verification preserved all 1,363 other objects, all five child relationships and the target's hypothesis status. UI checks: 145 tests passed; database-only build validation passed. Browser inspection verified the scene and five compact points, then selected the care-system advice point and confirmed the existing Pflegestützpunkte Berlin and compass offerings with their scoped fit and authentic images. A screenshot was saved at `/private/tmp/whocares-scene-trial.jpg`. Image generation remains paused; no new scene image is claimed complete. Mobile and venture-builder comprehension remain untested.
