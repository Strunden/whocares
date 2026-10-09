# Prompting WhoCares illustrations

The calling agent describes content. The endpoint owns the style, model, reference selection and review. Do not add a model name, watercolor instructions, lighting directions or a competing style to the scene. The approved sketch treatment is fixed in `src/style.js`, prompt version `sparse-wash-v2`.

## A useful scene brief

Describe the subject, one readable action, the necessary setting, and important visible details. Add counts and exclusions only when they matter. Give people agency and a specific everyday action; use relevant roles without assuming a uniform, dependence or distress.

Example:

```json
{
  "scene": "An older adult woman and her adult son preparing vegetables together at a small kitchen counter. Both participate: she slices a carrot, he adds leafy greens to a bowl. A warm everyday moment.",
  "template": "interaction"
}
```

A brief such as “care, support, dignity” is too abstract to tell the model what to draw. Translate a category into a concrete scene: a conversation over a notebook, someone preparing a meal, an accessible doorway, or a simple household object. Do not turn the illustration into proof of a research claim.

For busy ideas, choose one main action rather than requesting a whole narrative in one card. Keep background furniture to what makes the scene understandable. Request only visible details; tiny medical labels, precise numbers, and text generally belong in the app's HTML.

## Composition

- `portrait`: one person from the waist up.
- `interaction`: people engaged in a small readable moment; also appropriate for one person doing an activity.
- `object`: an isolated object or small related group.
- `environment`: a sparse room or setting; people only when requested.

These are composition instructions, not topic categories. Agents may omit the template and get interaction by default.

## Exact details

The first test of a “weekly pill organiser” produced five compartments. If a count matters, state it: “exactly seven separate compartments.” Inspect it afterwards; wording alone cannot guarantee counts. Avoid inventing brand names, written labels, or irrelevant objects from the style references.

See the runnable JSON files in `examples/`. Examples illustrate how to write a scene; they are not all certified live test results.

## Call and inspect

From `workers/illustrations`:

```sh
node scripts/generate-scene.mjs examples/cooking-together.json /tmp/whocares-cooking
```

The helper reads the local studio token, submits one job, polls it and saves the image plus metadata. Up to three jobs run concurrently; additional independent scenes queue automatically. Separate agents can call it at the same time. It does not read or display the OpenRouter key. Use `--dry-run` to inspect prompt compilation without generating:

```sh
node scripts/generate-scene.mjs examples/cooking-together.json --dry-run
```

Inspect the actual image at its normal card size, alongside the approved references. Check the requested action, people, important counts, obvious hands/limbs, accidental text, and whether unrelated reference content has leaked in. Consider style notes in context: the user preferred the second round, which keeps organic pencil/watercolor character with less shading and partial color patches. Keep that tested prompt; do not continue simplifying it solely to satisfy the critic.

A scene can be wrong even when the critic gives scene_match 5/5. Conversely, optional aesthetic notes do not mean the user-approved image is wrong. Preserve the exact prompt, model, reference IDs, and usage from the result metadata.

When an image has a concrete content error, revise only that detail and make at most one corrective generation within the user's requested work. If it still fails, show the candidates and explain the remaining issue instead of retrying indefinitely. Do not regenerate on a timeout before checking whether the first result was saved.
