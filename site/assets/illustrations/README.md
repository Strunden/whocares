# Reusable editorial illustration library

Five independently generated transparent PNGs. They contain no text, quotes, statistics, territorial boundaries, or layout. They represent fictional people, not observed participants. Generated with the built-in image generation tool on 8 October 2026 using the user's care-worker portrait as a style reference.

`site/js/atlas-assets.js` is the registry. Each asset has semantic tags and a generic fallback. The map's data and layout do not depend on an image existing for a particular record. Add an image and registry entry to expand the visual vocabulary; never encode research claims in image pixels. Alternative text is intentionally empty where the nearby visible text already supplies the role; the artwork is decorative.

## Generation prompts

Shared prompt: “Generate ONE standalone reusable transparent PNG illustration asset for an editorial care research atlas. Match the attached reference's human illustration style closely: polished digitally painted editorial illustration, expressive natural adult face, nuanced hair, soft warm shading, beautifully rendered fabrics, delicate edges, refined restrained colour. Centered complete composition with generous transparent margin, all hair and arms within frame, soft feathered fade at lower torso. Genuine transparent background. No text, quotes, names, UI, labels, coloured background shape, frame or map. Not flat SVG line art. Fictional illustrative people, not real testimony. High refinement at small display sizes.”

Subjects:
- worker.png: thoughtful female home-care worker in her thirties, brown hair in a loose bun, blue collared uniform, looking left, waist-up; no medical cross.
- adult.png: independent older woman, silver bob and glasses, terracotta cardigan over cream blouse, holding a book; no frailty cues.
- relative.png: adult daughter in her forties, lilac casual clothing, phone and notebook, coordinating arrangements; no care uniform.
- family.png: middle-aged man in sage shirt and older partner in cream cardigan, attentive conversation as equals; no nurse uniform.
- provider.png: care-service manager, short dark hair and medium brown skin, navy smart casual jacket, slim folder, approachable expression.

These original PNGs total approximately 6.7 MB. Images load lazily and are reused across views. Responsive compressed derivatives are a remaining delivery optimisation; the source artwork should stay independent of any viewport.
