# Who Cares Atlas Browsing v2

## Goal

Help venture builders explore ageing and care problem spaces, form a fast mental model of the landscape, understand lived experiences and systemic causes, and discover evidence-backed questions worth investigating. Do not algorithmically rank or score venture attractiveness.

## Core interaction principles

- **Map first:** a spacious, editorial landscape communicates breadth, relevance and relationships before any deep dive.
- **Explicit reading levels (latest user direction):** click a territory or collection to enter a stable level of detail. Keep one spatial canvas with Prezi-style camera travel into existing territory bounds. Pan with drag or scroll in both directions; retain parents and neighbours as context. Content does not change while panning. Breadcrumbs show the path and provide the route back. This supersedes the original continuous-zoom requirement.
- **Human-centered visual fidelity:** soft translucent organic territories, restrained typography, subtle links and illustrations rather than default box-and-line graph styling.
- **Illustrated person selection:** older adult, care worker, family caregiver, Angehörige and care provider each open a distinct editorial map of the same research graph. Angehörige arrange and coordinate support without necessarily providing hands-on care; family caregiving is a separate experience. Roles can overlap. Selection changes the organisation and questions of the map, not a dimming filter.
- **Stories as depth:** real, attributed accounts or clearly labelled illustrative workflows help visitors understand particular situations, evidence, workarounds and existing solutions.
- **Evidence integrity:** distinguish sourced findings from interpretations and open questions. No invented quotes, metrics, opportunity scores or misleading category-size encodings.
- **Minimal chrome:** the map is the primary UI; introduce details only when a visitor selects or zooms into something.

## Critique and validation

Test whether an unfamiliar venture builder can explain the landscape, find a non-obvious problem, explain who it affects and why it persists, inspect existing responses and articulate one useful next research question. Test navigation, orientation, evidence transparency, cognitive load and user agency separately from aesthetic appeal.

This branch is a safe workspace for the next iteration. The old mock is not considered validated.

## User-directed revision, 8 October 2026

- Text remains fixed in screen space. Explicit navigation opens territories, collections and records; no continuous zoom threshold changes content. See `atlas-system.md` for the current architecture.
- Clicking a territory, problem, company or story source opens one integrated reading panel. Closing restores the prior camera. Returning from a source preserves the story position and expanded evidence.
- Maps provide breadth; stories are exemplary routes, never definitions of a demographic. Fictional names, times and scenes are explicitly labelled. A person’s preferences and agency remain central.
- The same source record may belong in several perspectives. Broad category membership is distinct from an explicit research connection. Neither is evidence of effectiveness.
- The loneliness scroll-story reference mentioned in conversation was not exposed in the bounded cached conversation available to this implementation. Exact fidelity to that reference has not been assessed.

The latest implementation uses independent generated image assets, a data-derived hierarchy, viewport-culling at explicit reading levels, and compact metadata with on-demand evidence records. See `atlas-validation.md` for the measured scale test and remaining limits.
