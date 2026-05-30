---
name: tsc --noEmit vs tsc -b discrepancy
description: npx tsc --noEmit (Step 1) can pass clean while npm run build (Step 2) fails because build uses tsc -b (project references / composite mode) which is stricter
type: project
---

`npx tsc --noEmit` uses the loose single-project check. `npm run build:client` runs `tsc -b` (composite/project-references mode), which is stricter and can surface errors that `--noEmit` misses.

Observed instance (2026-05-30): `donationService.ts` `_mapDonation` method assigned `string` to `'Pending' | 'Verified' | 'Rejected'` and `string | null` to `string | undefined` fields — invisible to `--noEmit`, blocked by `tsc -b`.

**Why:** The project uses `tsconfig.json` with `composite: true` / project references. `tsc -b` enforces stricter emit-compatible type resolution.

**How to apply:** When Step 1 passes but Step 2 fails with type errors, the discrepancy is always `tsc -b` strictness. Fix the types in the flagged file — common patterns are casting nullable DB columns to the correct DonationDetail union types.
