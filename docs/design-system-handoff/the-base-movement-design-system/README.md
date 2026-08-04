# The Base Movement — Design System Bundle

This folder contains the brand and design-system reference for The Base Movement,
plus a set of HTML/CSS prototypes.

## Start here

| File                                                         | What it is                                                                                                                                             |
| :----------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`../DEVELOPER-HANDOFF.md`](../DEVELOPER-HANDOFF.md)         | **The developer spec.** Tokens, components, states, theming, responsive rules, accessibility, pre-merge checklist. Start here if you are implementing. |
| [`project/README.md`](project/README.md)                     | Brand foundations and rationale — voice, colour system, typography, motion, iconography. Start here if you need the _why_.                             |
| [`project/colors_and_type.css`](project/colors_and_type.css) | Flattened, hex-valued token file for prototyping.                                                                                                      |
| `project/fonts/`                                             | Public Sans + Work Sans woff2 (the production faces).                                                                                                  |
| `project/preview/`                                           | Design-system reference cards (colours, type, spacing, radii, buttons, badges, cards, inputs, stats, logo).                                            |
| `project/ui_kits/`                                           | 16 surface prototypes. Only `website/` includes React components.                                                                                      |

## How to use the prototypes

The prototypes are **HTML/CSS mockups, not production code.** Match their visual
output; do not copy their internal structure. The production implementation is
React 19 + TypeScript with a custom CSS system — see the developer handoff for the
classes and tokens you should actually be using.

**Precedence:** `src/index.css` (the codebase) beats `DEVELOPER-HANDOFF.md`, which
beats `project/README.md`, which beats anything in `preview/` or `ui_kits/`. The
prototypes are the oldest artefacts here and have known gaps — they are light-mode
only and predate the current motion system.

## Reading the prototype files

Everything you need — dimensions, colours, layout rules — is in the source. Read the
HTML and CSS directly rather than rendering screenshots; the markup is more precise
than a picture of it.

---

© 2026 The Base Movement — Ghana First.
