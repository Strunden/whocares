# Pan, zoom and deliberate reading levels

Current contract: 8 October 2026. The user's later refinements govern this prototype. The old fixed-screen-size item implementation failed visual review and is superseded.

- Drag, scroll and arrow keys pan. Pinch or Ctrl/Command-scroll magnifies around the fixed gesture anchor. Shift-scroll pans horizontally.
- A wheel transaction locks mode and anchor until 180ms idle. Touch resolves translation versus separation, then preserves that mode until all fingers lift. Pan and zoom are not added together.
- Local zoom uniformly scales the entire item. Wording, internal wrapping, assets and disclosure do not change. A click/breadcrumb changes reading level explicitly.
- Fit level shows the current siblings/page and is the minimum scale. Maximum scale fits one centred item. Plus centres the nearest visible item; minus returns toward the complete scene. Cursor gestures remain cursor-anchored.
- Pagination refits the current collection; viewport changes reconcile scale. Parent return preserves its camera subject to current viewport bounds. Evidence closes back into the same context.
- No story shortcut, search/filter bar, About, bottom links or minimap remain in the map shell. These removals follow the user's latest instructions.

Prior research references: [FigJam input semantics](https://help.figma.com/hc/en-us/articles/1500004414582-Pan-and-zoom-in-FigJam), [Miro input modes](https://help.miro.com/hc/en-us/articles/360017731053-Using-Miro-with-a-mouse-trackpad-or-touchscreen), [MDN wheel events](https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event). Exact gesture thresholds and button focus behavior are implementation choices, not a claim of hardware/user validation.

See [implementation and QA](atlas-system.md) and [discovery information architecture](atlas-discovery-contract.md). The latter distinguishes meaningful reading depth from magnification. A working camera does not make legacy category folders a problem-discovery product.
