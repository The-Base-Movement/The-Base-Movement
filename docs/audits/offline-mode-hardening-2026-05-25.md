# Offline Mode Hardening — 2026-05-25

**Scope:** Registration flow — IndexedDB draft caching, service-worker SPA fallback, sync-on-reconnect  
**Status:** COMPLETE — All items implemented and verified ✅

> Consolidated from `offline-mode-hardening-implementation-plan.md` (spec) and  
> `offline-mode-hardening-walkthrough.md` (post-implementation record). Both originals removed.

---

## Objective

Support patriots registering in areas with intermittent or no connectivity. Registration details, photographed ID cards, and selfies are saved securely to IndexedDB on-device. When connectivity is restored the draft is submitted automatically (or manually via "Sync Now").

---

## Implementation Status

| File                                                   | Status    | Notes                                                                                                  |
| ------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------ |
| `src/utils/offlineDb.ts`                               | ✅ DONE   | 5 CRUD functions, DB name `tbm_offline_db`, draft structure matches spec                               |
| `src/hooks/useOfflineSync.ts`                          | ✅ DONE   | All features present; see effect re-run note below                                                     |
| `src/components/OfflineBanner.tsx`                     | ✅ DONE   | Brand colours, animations, offline/online states all correct                                           |
| `src/pages/register/components/OfflineSuccessStep.tsx` | ✅ DONE   | Checklist, manual sync button, reactive state; typography patched post-audit                           |
| `public/sw.js`                                         | ✅ DONE   | `/index.html` in PRECACHE, navigation fallback to SPA shell implemented                                |
| `src/pages/Register.tsx`                               | ✅ DONE   | `OfflineBanner` mounted on form steps, `saveDraftRegistration` integrated, `isOnline` branching active |
| `src/services/registrationService.ts`                  | ✅ EXISTS | `registrationService.submit()` confirmed — correct signature, used by sync hook                        |

---

## Files Changed

### New files

**`src/utils/offlineDb.ts`** — Zero-dependency IndexedDB wrapper (`tbm_offline_db` / `draft_registrations`). Stores registration record with personal details, platform, base64-encoded photo/selfie, crop metadata, and audit fields (`createdAt`, `status`, `errorMessage`). CRUD operations: `saveDraftRegistration`, `getAllDraftRegistrations`, `deleteDraftRegistration`, `updateDraftRegistrationStatus`, `getDraftRegistrationCount`.

**`src/hooks/useOfflineSync.ts`** — Monitors `navigator.onLine` via `window` event listeners. On reconnect: iterates all pending drafts, submits sequentially through `registrationService`, shows progress toasts, deletes successful drafts from IndexedDB. Exposes `triggerSync()` for manual retry.

> **Implementation note:** `isSyncing` is a dependency of both `triggerSync` and the main `useEffect`. Each sync state change briefly re-attaches `online`/`offline` listeners and clears/recreates the 30s polling interval. Not a correctness bug — low priority.

**`src/components/OfflineBanner.tsx`** — Floating toast banner shown on the registration screen when the network drops. Glassmorphism style, brand gold/dark-grey, Material Symbol indicators.

**`src/pages/register/components/OfflineSuccessStep.tsx`** — Post-submission screen for offline registrations. Encryption checklist, next-steps, manual "Sync Now" button. Post-audit fix: 8 Tailwind `font-bold` violations patched (`h1/h3/h4` → `font-semibold`, pill → `font-medium`); raw `fontWeight: 500` → `'var(--font-weight-medium, 500)'` in `OfflineBanner.tsx`.

### Modified files

**`public/sw.js`** — Added `/index.html` to `PRECACHE`. Navigation-request catch handler now resolves to `/index.html` (SPA shell) instead of `offline.html`, so deep links (`/register`, `/dashboard`) boot React Router offline.

**`src/pages/Register.tsx`** — Integrated connection-state tracking, mounts `OfflineBanner` on form steps, saves draft to IndexedDB on submit when offline, renders `OfflineSuccessStep`, auto-triggers sync on reconnect.

**`src/services/registrationService.ts`** — Unified signup/photo-upload/DB-insert into a single service callable by both the normal flow and the offline sync worker.

**`src/pages/register/useRegistrationSubmit.ts`** — Refactored to use `registrationService`.

---

## Design Notes

**IndexedDB storage** — Photos are stored as base64 data-URL strings. IndexedDB handles large strings without binary blob serialisation. On sync, strings are converted to `Blob` before Supabase upload.

**Verification bypass** — KYC/OCR edge functions require network connectivity. When offline, biometric checks are bypassed and marked `pending`; the sync worker runs full verification on upload.

---

## Manual Verification Steps

1. Open DevTools → Network → set to **Offline**
2. Navigate to `/register` — page must boot from SW cache (no browser error)
3. Complete all 4 steps with mock ID/selfie cards
4. Submit → `OfflineSuccessStep` appears; confirm draft in DevTools → Application → IndexedDB → `tbm_offline_db`
5. Set Network back to **Online** → observe reconnect toasts, background sync, draft cleared from IndexedDB
