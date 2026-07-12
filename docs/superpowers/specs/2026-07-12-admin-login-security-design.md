# Admin Login Security UI Design

## Goal

Bring the admin login page in line with the member login page's responsive two-column presentation while preserving the existing admin authentication and MFA behavior.

## Design

- Keep the credential and MFA forms on the left in a compact command-center treatment.
- Add a right-side Security Protocol panel for role managers covering verified role access, mandatory MFA, monitored sessions, and activity logging.
- Reuse existing design tokens, Material Symbols, branding, and the member login's responsive grid pattern.
- On mobile, collapse to the form and retain a concise security notice without the large showcase panel.

## Behavior

Authentication, honeypot protection, MFA challenge and verification, redirects, session flags, error messages, and the `AdminGate` wrapper remain unchanged.

## Scope

Change `src/pages/admin/Login.tsx` only unless a small shared responsive CSS adjustment is required. No route, service, database, dependency, or authentication-policy changes.

## Verification

- Run `npm run typecheck`.
- Confirm the credential and MFA states remain available and responsive layout classes compile correctly.
