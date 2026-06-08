---
name: political-movement-supervisor
description: Use when working on The Base Movement features, security, member data, political content, donations, store, deployment, auth, database, admin workflows, messaging strategy, or electoral/compliance-sensitive decisions.
---

# The Base Movement Supervisor

Site: `thebasemovement.com` with staging/preview history on Vercel.
Stack in this repo: React/Vite/TypeScript, React Router, Supabase, Vercel, custom CSS design system.
Purpose: Ghana-focused grassroots political movement for membership, chapters, jobs, donations, store, blog, polls, and admin operations.

# Supervisor aims

Check every decision against these:

- Mobilize: move visitors toward joining, donating, volunteering, or taking action.
- Protect members: member/supporter data is highly sensitive.
- Own the narrative: the site is the source of truth; social channels amplify it.
- Stay live under pressure: political moments can bring traffic spikes and scrutiny.
- Build electoral trust: public pages, jobs, store, polls, and leadership content must be accurate.
- Compliance first on money: donation/store changes require legal/payment-process caution.

# Iron laws

- No member PII in client-side storage unless explicitly justified and minimized.
- No secrets, API keys, or DB credentials in code; use env files/platform env.
- Register, Contact, Donate, Newsletter, Store, and Poll flows need server-side validation where backend writes occur.
- Donate and Store changes require compliance review before production use.
- Blog/Updates content should have a named author or official designation and sources for factual claims.
- No data-selling analytics or ad pixels on Register or Donate pages.
- Admin dashboard access must stay role-restricted.
- Every risky change should be reversible.

# Security checks

Auth:

- Use Supabase Auth and existing route guards; do not roll custom session logic.
- Preserve session-storage behavior unless the task explicitly changes auth persistence.
- Rate-limit and abuse-protect login/register through backend/provider controls where available.
- Keep Ghana/Diaspora platform assignment server-trusted.

Member data:

- Use role-based access and audit logs for privileged actions.
- Bulk exports require clear audit trail.
- Do not expose national ID directly; use the admin-gated RPC.
- Treat Diaspora data with GDPR-adjacent care.

Payments:

- Never handle raw card data.
- Verify payment webhooks/signatures.
- Keep donation receipts tied to transaction ID, amount, timestamp, and member or public donor context.
- Do not change Donate/Store flows casually.

Forms and polls:

- Sanitize and validate writes server-side.
- Add abuse controls for Contact/Newsletter where possible.
- Gate poll voting to verified accounts where required.
- Review poll wording for bias and include methodology when showing results.

Infrastructure:

- Keep secrets in platform/env only.
- Separate staging and production credentials where possible.
- Preserve security headers in `vercel.json`.
- Use Sentry or equivalent for production error visibility.

# Content rules

Applies to Blog/Updates, Polls, The Plan/Agenda, Leadership, Press, Jobs:

- No anonymous publishing unless official designation is intentional.
- Every factual/statistical claim needs a source before publish.
- Corrections should be visible and traceable.
- Poll questions must avoid leading or manipulative wording.
- Leadership bios should be approved by the named person.
- Jobs must be real and verified; no ghost listings.
- Avoid fake urgency or dark patterns.

# Priority framework

- P0 Critical: site down, breach, broken register/login/donate, defamatory content live. Revert first, notify stakeholders.
- P1 High: core UX broken, security vulnerability, wrong political content live. Fix before new feature work.
- P2 Standard: features, content updates, optimizations, minor bugs. Prioritize by mobilization impact.

# Page-specific watchpoints

- `/register`: fake signups, PII exposure, server-side validation, email verification.
- `/donate`: compliance, payment failure, receipt handling, legal limits.
- `/store`: payment flow, inventory accuracy, out-of-stock truthfulness.
- `/polls`: vote manipulation, leading questions, verified voting.
- `/blog`: misinformation, missing author/source fields.
- `/officers`: outdated or unapproved leadership info.
- `/jobs`: ghost listings and applicant data protection.
- `/chapters` and constituency pages: stale counts, stale leaders, credibility of public stats.

# Inspect first

- `AGENTS.md`
- Relevant `.codex/skills/*/SKILL.md`
- Target page/service/function.
- `docs/audits/`, `docs/project-docs/`, `docs/database/`, or relevant feature specs.
- `src/routes.tsx`, `src/services`, `supabase/functions`, or `supabase/migrations` only when the task touches them.

# Validation

- Use the narrow validation from `AGENTS.md`.
- Run `npm run typecheck` after TypeScript/service/type changes.
- Run `npm run test:run` when behavior is covered.
- Run `npm run build` for public route, deployment, prerender, or cross-surface changes.

# Token-saving behavior

- Do not scan the full repo for normal tasks.
- Start with the page/flow named by the user.
- Use docs to narrow code inspection.
- Summarize security/compliance implications briefly.
