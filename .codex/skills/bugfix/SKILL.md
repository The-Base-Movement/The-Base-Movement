---
name: bugfix
description: Use when fixing a narrow bug, TypeScript error, failing test, runtime regression, broken state, or incorrect service behavior in this repo.
---

# Purpose

Fix narrow bugs without disturbing unrelated app code or user changes.

# When to use

Use this skill when the task involves:

- Runtime errors, TypeScript errors, failing tests, broken UI state, incorrect service behavior, or small regressions.

# Project context

The repo may have unrelated dirty files. Most behavior flows through React pages/components and the Supabase service layer.

# Inspect first

- `AGENTS.md`
- The failing file or component.
- Nearest service/helper/type.
- Existing tests under `src/test` or colocated test files.

# Docs to check

- Relevant docs only; start with `docs/audits/` or `docs/project-docs/` when the bug mentions a documented feature.

# Avoid touching

- Unrelated dirty files.
- Auth, database, routing, and deployment unless directly part of the bug.

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

Prefer service/helper fixes over page duplication. Preserve custom CSS conventions. Do not refactor beyond the failing path.

# Validation

- `npm run typecheck`
- `npm run test:run`
- `npm run lint` for broad edits.

# Token-saving behavior

- Do not scan the whole repo during normal use of this skill.
- Use the inspect-first list.
- Use targeted search.
- Do not print full files.
- Do not rewrite files unnecessarily.
- Prefer small diffs.
- Stop after the requested task is complete.
