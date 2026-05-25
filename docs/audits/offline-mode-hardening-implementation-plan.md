# Offline Mode Hardening: Draft Registration Under Signal Loss

Provide support for patriots to register offline during signal loss or connectivity issues. The system will gracefully save their registration details, photographed ID cards, and selfies securely on their local device in an IndexedDB database, allowing automatic background synchronization or manual upload when connectivity is restored.

**Audit Date:** 2026-05-25
**Status:** COMPLETE — All items implemented and verified ✅

---

## User Review Required

> [!IMPORTANT]
> **SPA Cache Fallback & Precache:** We will update `public/sw.js` to cache `index.html` (the SPA shell). When the user is completely offline and attempts to access `/register` or `/dashboard` directly, the service worker will intercept the request and fallback to `index.html`. This ensures the React Router application boots up and works offline, rather than showing a generic browser error or falling back to the static `offline.html` page.

> [!TIP]
> **Data URL String Storage in IndexedDB:** Photo IDs and selfie files are read into memory as base64-encoded Data URLs by `Register.tsx`. IndexedDB handles storing large strings easily, allowing us to serialize draft files alongside form metadata with zero performance issues and no complex binary blob serialization code. When synchronization starts, these will be converted to Blobs and uploaded to Supabase using existing service routines.

---

## Implementation Status

| Item                                                   | Status    | Notes                                                                                                              |
| ------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/utils/offlineDb.ts`                               | ✅ DONE   | All 5 CRUD functions implemented, correct DB name (`tbm_offline_db`), draft structure matches spec                 |
| `src/hooks/useOfflineSync.ts`                          | ✅ DONE   | All features present; see note on effect re-runs below                                                             |
| `src/components/OfflineBanner.tsx`                     | ✅ DONE   | Brand colours, animations, offline/online states all correct                                                       |
| `src/pages/register/components/OfflineSuccessStep.tsx` | ✅ DONE   | Checklist, manual sync button, reactive online/offline state; typography patched post-audit                        |
| `public/sw.js`                                         | ✅ DONE   | `/index.html` in PRECACHE, navigation fallback to SPA shell implemented                                            |
| `src/pages/Register.tsx`                               | ✅ DONE   | `OfflineBanner` mounted on both form-step renders, `saveDraftRegistration` integrated, `isOnline` branching active |
| `src/services/registrationService.ts`                  | ✅ EXISTS | `registrationService.submit()` confirmed — correct signature, used by sync hook                                    |

---

## Proposed Changes

### Offline Database Module

#### [NEW] [offlineDb.ts](file:///c:/MAMP/htdocs/The-Base/src/utils/offlineDb.ts)

Implement a clean helper using native `IndexedDB` with zero external dependencies to store registration drafts.

- Draft Structure:
  - Unique ID (UUID/Timestamp format)
  - Platform (`'GHANA' | 'DIASPORA'`)
  - Form Data (`RegistrationFormData` fields)
  - Photo URL & Selfie URL (as base64 string data URLs)
  - Crop coordinates metadata (`croppedAreaPixels`)
  - Verification context (`usedScan`, `refParam`)
  - Audit metadata: `createdAt`, `status` (`'pending' | 'syncing' | 'failed'`), `errorMessage`.
- Database CRUD actions: `saveDraftRegistration`, `getAllDraftRegistrations`, `deleteDraftRegistration`, `updateDraftRegistrationStatus`, `getDraftRegistrationCount`.

---

### Synchronization Service & UI Components

#### [NEW] [useOfflineSync.ts](file:///c:/MAMP/htdocs/The-Base/src/hooks/useOfflineSync.ts)

A React hook / state manager that:

- Monitors network connectivity (`navigator.onLine`) via window `online` and `offline` event listeners.
- Performs background synchronization when connection is restored.
- Iterates over all pending drafts in IndexedDB, submits them sequentially using the existing `useRegistrationSubmit` API workflow (biometric verification fallback -> user authentication signup -> file upload -> user insert), and reports progress via toasts.
- Handles partial failures gracefully by updating the status with errors in IndexedDB.

> **Implementation note:** `isSyncing` is a dependency of both `triggerSync` and the main `useEffect`. Each sync state change causes the effect to re-run, briefly detaching and re-attaching the `online`/`offline` listeners and clearing/recreating the 30s polling interval. Not a correctness bug — low priority.

#### [NEW] [OfflineBanner.tsx](file:///c:/MAMP/htdocs/The-Base/src/components/OfflineBanner.tsx)

A premium floating toast banner shown on the Registration screen when connection is lost.

- Renders in brand colours (warm gold and dark grey) with custom typography.
- Reassures the user that "Offline Mode is Active: Your progress is securely saved locally and will auto-sync."

#### [NEW] [OfflineSuccessStep.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/register/components/OfflineSuccessStep.tsx)

A beautiful replacement for `SuccessStep` rendered when a registration is submitted offline.

- Features custom Ghana-themed design (brand greens, gold accents).
- Displays a checklist explaining that their registration has been saved as a local draft.
- Informs them of the exact synchronization queue and details their temporary offline status.
- Offers a manual "Sync Now" button (which shows when they come back online or want to trigger retry).

> **Post-audit fix (2026-05-25):** 8 Tailwind `font-bold` violations patched — h1/h3/h4 → `font-semibold`, pill badge → `font-medium`. Also fixed raw `fontWeight: 500` in `OfflineBanner.tsx` → `'var(--font-weight-medium, 500)'`.

---

### Service Worker & Router Orchestration

#### [MODIFY] [sw.js](file:///c:/MAMP/htdocs/The-Base/public/sw.js)

- Include `/index.html` in the precached array.
- Modify the navigation request handler catch block to resolve to `/index.html` (the SPA shell) if the network fails. This allows deep links like `/register` to function smoothly offline.

#### [MODIFY] [Register.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/Register.tsx)

- Integrate connection state tracking.
- Mount `OfflineBanner` on form steps if the client goes offline.
- Integrate saving a draft registration into the submission handler if offline status is detected, transitioning the step state to a customized offline success screen.
- Set up auto-sync triggers in the background so that any draft is automatically submitted as soon as the client transitions from offline to online.

---

## Verification Plan

### Manual Verification

1. **Simulation in DevTools:** Open Chrome/Firefox DevTools, navigate to `/register`, inspect the Service Worker registration, and switch the Network profile to "Offline".
2. **Offline Rendering:** Refresh the page to verify that `/register` boots correctly using the cached SPA index shell.
3. **Form Entry & ID Scanning:** Fill out the registration steps offline, upload mock ID/selfie cards (which convert to data URLs in memory).
4. **Draft Submission:** Click "Submit" on Step 4 when offline. Ensure it transitions to the premium `OfflineSuccessStep` showing that the registration is saved locally.
5. **IndexedDB Inspection:** Check the browser DevTools "Application" -> "IndexedDB" -> "tbm_offline_db" to verify that the draft is stored with all form data and base64 images intact.
6. **Online Transition (Sync Test):** Switch the Network profile back to "Online". Verify that the application detects the online transition, triggers the background sync, runs the full biometric and Supabase upload/signup logic, displays progress toasts, and removes the draft from IndexedDB upon successful upload.
