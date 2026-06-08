---
name: docs-architecture
description: Use when a task depends on repository docs for architecture, business rules, database rules, deployment notes, design rules, feature specs, or terminology.
---

# Purpose

Use repository docs to answer or implement architecture, business-rule, feature, and operations tasks without broad rescans.

# When to use

Use this skill when the task involves:

- Architecture, business rules, feature specs, database notes, deployment notes, design rules, or project terminology.

# Project context

The docs folder contains audits, project docs, database notes, design-system handoff, superpowers plans/specs, assets, screenshots, and operational notes.

# Inspect first

- `AGENTS.md`
- The relevant file under `docs/audits`, `docs/project-docs`, `docs/database`, or `docs/superpowers`
- Target code only after doc review.

# Docs to check

- `docs/audits/`
- `docs/project-docs/`
- `docs/database/`
- `docs/superpowers/plans/`
- `docs/superpowers/specs/`

# Avoid touching

- Code unrelated to the documented feature.
- Generated or archived docs unless explicitly requested.

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

Summarize docs; do not paste long docs. Use docs to narrow code inspection.

# Validation

- Use the relevant command for the resulting code change.
- not available for docs-only changes.

# Token-saving behavior

- Do not scan the whole repo during normal use of this skill.
- Use the inspect-first list.
- Use targeted search.
- Do not print full files.
- Do not rewrite files unnecessarily.
- Prefer small diffs.
- Stop after the requested task is complete.
