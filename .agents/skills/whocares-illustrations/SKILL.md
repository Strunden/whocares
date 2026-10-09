---
name: whocares-illustrations
description: Create, select, reuse or review WhoCares illustrations for clear meaning, plausible human interactions and reduced bias. Use for atlas imagery and its placement, including generation through the approved local image endpoint.
---

# WhoCares illustrations

For generation, use the configured local illustration service (`WHOCARES_ILLUSTRATION_URL`; default `http://127.0.0.1:8788`). Check its health before submitting: another local app may occupy the default port. The approved recipe is the second-round `sparse-wash-v2` prompt, the `sketch-color-v1` reference library, and GPT Image 2.5 Sunburst through OpenRouter. The server owns these choices; callers submit content only.

Read [the prompting guide](references/prompting.md) for scene examples and [the endpoint contract](references/endpoint.md) for generation and recovery. Locate `workers/illustrations` in the current repository or an available sibling `whocares/` checkout; the local prototype does not necessarily contain the service implementation. The endpoint is a local dependency, not a public URL guaranteed to exist on another agent's machine. If unavailable, preserve scene briefs and report the dependency rather than claim generation succeeded. This skill does not imply authorization to publish to production.

## Meaning before decoration

The atlas helps venture builders find situations where people struggle and understand whether existing support falls short. An illustration should make its particular situation easier to recognise and distinguish from adjacent situations.

**Reuse the visual style; choose the scene for its meaning.** Do not reuse an image just because it depicts the same persona or has the right aesthetic. Reuse is appropriate when the underlying situation is genuinely the same and continuity is intended. Different crops of one scene do not establish different needs.

Before selecting or generating, state briefly in the working brief:
- The specific need or situation this image supports, and the visible action, setting or obstacle that communicates it.
- The nearest neighbouring situation it must remain distinguishable from.
- The most plausible misleading reading to avoid, including an implied solution or relationship.

Keep these notes out of the map UI. If no useful visual distinction is possible, omit the image rather than add decorative ambiguity. The title carries the precise claim; an image need not explain every detail on its own.

For a need, show a relevant circumstance, tension or desired activity without prematurely selecting an intervention. A wrist alarm illustrates a particular response, not the whole need to reach help when alone. A pleasant conversation can illustrate a desired outcome, but does not establish loneliness or unmet demand. Do not force every need into a distress scene either. Solutions may show how their actual response works; a happy scene is not evidence that it succeeds.

## Human interactions and bias

### Age portrayal

For this atlas, the user's visual default for an older adult is **80+ years**, not a youthful-looking person in their sixties. Specify an age such as 84 or 87 in scene briefs; “older”, “senior” or grey hair alone is insufficient. Inspect the result for a coherent combination of facial ageing, skin texture, hair and hands that reads as advanced old age at tile size. Apparent age is subjective: do not claim an image proves someone's age, and do not rely on enlarged wrinkles or caricature alone.

Keep family caregivers, professionals and other participants at ages appropriate to their roles; do not age everyone to 80+. Show the older person's agency and variation in ability. Age does not itself imply a walking aid, stooped posture, illness, confusion, poverty or dependence. Include such details only when the situation calls for them. If a particular record explicitly concerns a different age group, follow that record and make the distinction clear rather than applying the default blindly.

This is a visual casting convention for the current atlas, not a universal definition of old age, a diagnostic threshold or a change to research eligibility. Do not rewrite source age ranges (for example a service for people aged 60+) to match the artwork. Authentic provider images retain their real subjects; prefer relevant imagery, and do not alter photographs to make people appear older.

Specify who is doing what, who initiates, and which visible cues make the interaction intelligible. Inspect the rendered result, not just the prompt:
- Check gaze, posture, facial expression, interpersonal distance, hands and touch. Watch for accidental sexual or romantic suggestion, invasive contact, restraint, aggression, humiliation or infantilisation that changes the intended meaning. Normal affection is not inherently inappropriate; its fit depends on the intended relationship and situation.
- Check agency: is someone apparently being dragged, physically controlled, spoken over, ignored or treated as a passive prop when that is not the situation? Do not assume a smile proves consent. For assistance, make participation and the purpose of contact legible; if ambiguous at tile size, choose a clearer action or composition.
- Check physical plausibility and role clarity: who supports whom, where hands touch, whether mobility aids are used coherently, and whether actions imply unsafe care. Do not infer family ties, professional qualifications, diagnoses or consent from appearance.
- Review the set as well as each image. Avoid consistently making women carers, men authorities, older people frail or helpless, disabled people passive, or particular ethnicities service workers. Vary casting without using identity as shorthand for a problem. Do not erase relevant disability, dependency or cultural context merely to make an image positive.
- Do not make every older adult live alone, own a comfortable home, use technology, or have nearby family. Depict relevant context without presenting one fictional household as representative of everyone.
- Repeated distinctive characters can imply a continuous family story or evidence from one participant. Use that continuity only when intended; style references must not silently import their people, relationships or props into unrelated scenes.

When an image has a problematic reading, identify the concrete visible cue and its consequence rather than declaring the people or identities depicted inappropriate. Revise the cue or composition; do not rely on a caption to repair it.

## Review in context

Inspect full-size pixels for anatomy and contact, then the actual crop at ordinary tile size beside neighbouring tiles. Small scale can hide the obstacle or turn a helping gesture into a grip. Check these tests before integration:
- **Swap test:** could this image move to a neighbouring tile without anyone noticing? If so, it may not add useful distinction.
- **Interpretation test:** describe the visible action without relying on the title, then compare it with the intended meaning. Consider a plausible alternative reading; the generating model's intention or confidence is not validation.
- **Placement test:** check that cropping, overlap, image scale, colour, arrows or repeated characters do not imply unsupported importance, prevalence, causality, hierarchy or relationships. Preserve text legibility and do not encode an essential distinction solely in colour or imagery.

For unresolved ambiguity that materially affects understanding, use a simpler scene or omit it and report the limitation. Treat a viewer's different reading as feedback, not user error. When testing with people, ask what they think is happening before explaining the intended meaning; do not claim audience validation from an internal review.

Keep fictional illustration metadata with the asset for maintenance. Per the user's preference, do not add illustration-provenance captions to map tiles or detailed records. Keep artwork separate from evidence: never present it as a participant photograph or observed event, or use it to support a research claim.

## Write the scene

Describe the subjects, one main visible action, the necessary setting, and important details. Specify exact counts when they matter. Choose portrait, interaction, object, or environment as the composition; omit it for interaction. Do not send model, style, reference paths, lighting recipes, or a full UI screenshot. The endpoint rejects unsupported fields.

Example:

```json
{
  "scene": "An older adult woman and her adult son preparing vegetables together at a small kitchen counter. Both participate: she slices a carrot, he adds leafy greens to a bowl. A warm everyday moment.",
  "template": "interaction"
}
```

Translate abstract categories into concrete scenes. Keep illustrations fictional; they do not establish research evidence. Reflect the situation requested rather than adding assumptions about dependency, distress or medical care.

## Generate

From `workers/illustrations`, save the brief to a JSON file and use:

```sh
node scripts/generate-scene.mjs /tmp/scene.json /tmp/whocares-scene
```

The caller saves the image and exact generation metadata. It reads only the local studio token; do not display or copy `.env.local` or the OpenRouter key. The helper accepts `--dry-run` for prompt compilation without spending credits. If the service is absent, start `npm run dev` from the service directory. If dependencies are missing, use `npm ci` first. If the provider key is absent, direct the user to the studio's Connect image generation field; do not ask them to paste it into chat.

Up to three jobs run in parallel; additional independent scenes wait in a FIFO queue. Agents can call the helper concurrently without waiting for idle. It submits to POST /v1/jobs and polls the accepted job ID. A 429 means the queue or session allowance is full, rather than merely that another job is active. Do not automatically retry a timeout or provider failure: first check saved results for the original request. Retrieve an existing result without paying for another generation:

```sh
node scripts/generate-scene.mjs --existing RESULT_ID /tmp/whocares-recovered
```

## Judge the result

Inspect the actual pixels at the intended card size and against the service's reference images. Check the subjects/action, counts, obvious anatomy errors, unwanted text, and copied reference content. In the first test, “weekly organiser” yielded five compartments even though the critic gave scene_match 5/5; ask for exactly seven and count them yourself when that detail is relevant.

The user preferred the second-round images. Preserve their organic pencil character, reduced shading and partial watercolor. Automatic style notes are optional observations, not rejection criteria. Do not chase a perfect critic score or keep changing the approved visual direction. Concrete scene errors may justify one corrective generation within the authorized task; after another failure, show the candidates and explain the issue instead of retrying indefinitely.

Return or integrate the inspected artifact as requested, preserve its metadata, and report any relevant limitation. Do not describe a model score as a guarantee of correctness or treat generated artwork as a field observation.
