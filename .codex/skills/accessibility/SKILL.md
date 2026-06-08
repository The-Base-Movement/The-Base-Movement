---
name: accessibility
description: Use when changing keyboard access, focus behavior, ARIA labels, semantic markup, dialogs, dropdowns, buttons, icon-only controls, or contrast.
---

# Purpose

Guide accessibility fixes for custom UI components without replacing the design system.

# When to use

Use this skill when the task involves:

- Keyboard access, focus states, ARIA labels, dialogs, dropdowns, buttons, icon-only controls, contrast, or semantic markup.

# Project context

The app uses custom inline UI and Material Symbols. Modals and dropdowns often use fixed overlays and local state.

# Inspect first

- `AGENTS.md`
- Target component/page.
- Existing nearby modal/dropdown/button pattern.
- `src/components/states`
- `src/index.css`

# Docs to check

- `docs/audits/layout_guidelines.md`
- `docs/audits/button-audit-2026-05-25.md`
- `docs/audits/states-component-audit-2026-05-27.md`

# Avoid touching

- Visual redesigns unless accessibility requires a focused UI adjustment.
- New UI libraries.

# Workflow

1. Read AGENTS.md.
2. Check the listed docs only when relevant.
3. Inspect the smallest relevant file set.
4. Reuse existing project patterns.
5. Preserve custom inline styling and existing UI conventions.
6. Make the smallest safe patch.
7. Run only the relevant validation command.
8. Summarize changed files and why.

# Project rules

Icon-only buttons need accessible names. Preserve visible focus behavior. Keep custom modal/dropdown overlay behavior.

# Validation

- `npm run typecheck`

# Token-saving behavior

- Do not scan the whole repo during normal use of this skill.
- Use the inspect-first list.
- Use targeted search.
- Do not print full files.
- Do not rewrite files unnecessarily.
- Prefer small diffs.
- Stop after the requested task is complete.
