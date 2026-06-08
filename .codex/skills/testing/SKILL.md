---
name: testing
description: Use when adding, fixing, or running Vitest and Testing Library tests, adjusting test setup, mocks, jsdom behavior, or test coverage.
---

# Purpose

Guide Vitest and Testing Library test creation, repair, and targeted validation.

# When to use

Use this skill when the task involves:

- Adding tests, fixing failing tests, adjusting test setup, or validating behavior with Vitest.

# Project context

Tests live in `src/test`. Vitest uses jsdom and setup file `src/test/setup.ts`. Existing tests cover SEO, newsletter service, image utilities, Hubtel phone helpers, helpdesk, and error boundaries.

# Inspect first

- `AGENTS.md`
- `src/test/setup.ts`
- Existing related test.
- Target module/component/service.
- `vite.config.ts` test config if setup fails.

# Docs to check

- Relevant feature docs only.

# Avoid touching

- Production code unless a test exposes a real bug.
- Broad test config unless setup is the task.

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

Prefer focused tests around helpers/services. Keep mocks narrow. Do not add brittle snapshots for custom UI unless explicitly useful.

# Validation

- `npm run test:run`
- `npm run typecheck`

# Token-saving behavior

- Do not scan the whole repo during normal use of this skill.
- Use the inspect-first list.
- Use targeted search.
- Do not print full files.
- Do not rewrite files unnecessarily.
- Prefer small diffs.
- Stop after the requested task is complete.
