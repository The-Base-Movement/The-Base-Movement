# Docs & Architecture Workflow

## Purpose

Finding, reading, and leveraging the documentation in `docs/` to inform architectural decisions, database design, feature behavior, and business rules for The Base Movement.

## When to use

Use this workflow when the task involves:

- Understanding how a feature is supposed to work before implementing it
- Checking database schema documentation before writing a query
- Reviewing design system specs before building a UI component
- Checking business rules for political movement operations
- Looking up a past architectural decision
- Understanding the registration flow end-to-end

## Project context

Key docs available:

- `docs/database/` — schema documentation, including `users-column-security.md`
- `docs/audits/` — design system audit reports (border-radius tokens, etc.)
- `docs/design-system-handoff/` — visual reference for dashboard UI
- `docs/Messaging-Templates/` — email/SMS brand-approved templates
- `docs/session_handover.md` — project handover notes
- `docs/homepage.md` — homepage feature docs
- `docs/jobs.md` — jobs feature docs
- `docs/project-docs/` — general project documentation
- `docs/superpowers/` — governance and superpower declarations
- `docs/future webapp/` — prototype/concept work
- `docs/archive-resources/` — archived references
- GeoJSON: `docs/geoBoundaries-GHA-ADM1...geojson` and `docs/gh.json` (Ghana regions)

## Inspect first

- `docs/` — list directory structure first
- `docs/session_handover.md` — for overall context
- `docs/database/` — for any database-related task
- `docs/design-system-handoff/` — for any UI design reference

## Docs to check

- All docs in `docs/` — this workflow IS the docs workflow

## Avoid touching

- `src/` — this workflow is read-only
- `supabase/` — this workflow is read-only
- Application code

## Workflow

1. Identify which domain the task belongs to (database, UI, feature, business rule).
2. Navigate to the relevant `docs/` subdirectory.
3. Read the relevant doc file.
4. Extract only the relevant section — do not paste the full doc.
5. Summarize what the docs say about the task.
6. Proceed to the implementation workflow with this context.

## Project rules

- Docs are authoritative for business rules — if code conflicts with docs, flag it.
- Do not paste large docs sections into responses — summarize relevantly.
- GeoJSON files are large — do not read `gh.json` (1.2 MB) unless specifically needed.

## Validation

Not applicable — docs workflow is read-only.

## Token-saving behavior

- Read only the specific doc file relevant to the task.
- Do not list all docs files on every task.
- Summarize rather than quoting long passages.
- Stop after the relevant docs have been reviewed.
