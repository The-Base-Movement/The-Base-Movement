# Admin Login Security UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give role managers a responsive admin sign-in page matching the member login's two-column idea, with security protocol information on the right.

**Architecture:** Preserve all existing state and authentication handlers in `AdminLogin`. Replace only its presentation with a responsive two-column shell and token-based inline styles, keeping the security content local to the page.

**Tech Stack:** React 19, TypeScript, React Router, existing CSS variables, Material Symbols

## Global Constraints

- Preserve authentication, MFA, honeypot, redirects, session flags, and `AdminGate` behavior.
- Do not add dependencies, routes, services, database changes, Tailwind, shadcn, Lucide, or new icon libraries.
- Use existing CSS variables, radius tokens, Material Symbols, and `login-browser-grid` responsiveness.

---

### Task 1: Admin Login Presentation

**Files:**
- Modify: `src/pages/admin/Login.tsx`
- Verify: `src/pages/admin/Login.tsx`

**Interfaces:**
- Consumes: existing `handleLogin`, `handleVerifyMfa`, `AdminGate`, auth state, and `login-browser-grid` CSS.
- Produces: the unchanged `AdminLogin(): JSX.Element` route component with a new responsive presentation.

- [ ] **Step 1: Capture the behavior baseline**

Run: `npm run typecheck`

Expected: TypeScript exits successfully before the presentation change.

- [ ] **Step 2: Replace the compact card presentation**

Keep the existing handlers and state unchanged. Render a full-page branded shell with a left credential/MFA section and a right `Security Protocol` section listing verified role access, mandatory MFA, monitored sessions, and activity logging. Reuse `login-browser-grid`; hide the right panel on mobile through the existing `login-showcase-panel` rule.

- [ ] **Step 3: Verify the implementation**

Run: `npm run typecheck`

Expected: TypeScript exits successfully with no errors.

- [ ] **Step 4: Refresh the repository graph**

Run: `graphify update .`

Expected: Graphify completes its AST update without an error.

- [ ] **Step 5: Commit and push**

Run: `git add src/pages/admin/Login.tsx docs/superpowers/plans/2026-07-12-admin-login-security-ui.md graphify-out`

Run: `git commit -m "Redesign admin login security experience"`

Run: `git push origin main`

Expected: the implementation commit is created on `main` and pushed to `origin/main`.
