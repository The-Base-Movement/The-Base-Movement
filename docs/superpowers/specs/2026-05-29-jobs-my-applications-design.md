# Jobs — My Applications Tab & Monthly Rate Limit

**Date:** 2026-05-29  
**Status:** Approved  
**Scope:** Dashboard Jobs page (`/dashboard/jobs`)

---

## Overview

Add a "My Applications" tab to the dashboard Jobs page so members can track the status of their submissions. Enforce a hard limit of 3 job applications per calendar month per user, with a persistent counter chip always visible on the page.

---

## Architecture

Three layers of change, no new routes.

### Database

A new `apply_to_job(p_job_id, p_cover_letter, p_resume_url)` Postgres function (`SECURITY DEFINER`, `GRANT EXECUTE TO authenticated`). Runs atomically:

1. Checks `created_at >= date_trunc('month', now())` count for `auth.uid()` — if ≥ 3, raises `monthly_limit_reached`
2. Checks for an existing row with the same `(member_id, job_id)` — if found, raises `already_applied`
3. Inserts and returns the new application `uuid`

Enforcement lives in the DB; cannot be bypassed by direct API calls.

### Service (`src/services/jobService.ts`)

Three changes:

| Method                         | Change                                                                                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `applyToJob()`                 | Switch from direct table insert to `supabase.rpc('apply_to_job', ...)`. Returns `{ ok: boolean; reason?: 'limit_reached' \| 'already_applied' \| 'error' }` |
| `getMonthlyApplicationCount()` | **New.** Returns `Promise<number>` — count of user's applications where `created_at >= start of current calendar month`                                     |
| `getMemberApplicationsFull()`  | **New.** Returns `Promise<ApplicationWithJob[]>` — user's applications joined with `jobs(title, organization, status)`, ordered `created_at DESC`           |

### UI

- `src/pages/Jobs.tsx` — tab bar, counter chip, wires state
- `src/pages/jobs/MyApplicationsTab.tsx` — **new file**, receives `applications`, `monthlyCount`, `onBrowse` callback; renders the application list

---

## Types

Add to `src/types/jobs.ts`:

```ts
export interface ApplicationWithJob extends JobApplication {
  job?: Pick<Job, 'title' | 'organization' | 'status'>
}
```

`applyToJob` result type (internal to service, inferred by callers):

```ts
{ ok: boolean; reason?: 'limit_reached' | 'already_applied' | 'error' }
```

---

## UI Design

### Tab bar (dashboard only)

Sits between the page title block and the filter/grid area.

```
[ Browse Jobs ]  [ My Applications  2 ]          2 / 3 used this month  ●
```

- Uses existing `.btn-active-tab` / `.btn-inactive-tab` classes
- "My Applications" label includes total-application count badge
- Counter chip right-aligned in the same flex row:
  - 0 used → `pill-mute`: _"0 / 3 used this month"_
  - 1–2 used → `pill-warn`: _"2 / 3 used this month"_
  - 3 used → `pill-err`: _"3 / 3 — resets 1 [Month]"_
- Counter shows `—` (skeleton) while `monthlyCount` is loading

### Browse tab

Identical to current page. When `monthlyCount >= 3`, the "Apply Now" button in the job detail modal is replaced with a disabled button: _"Limit reached — resets 1 [Month]"_.

### My Applications tab

Stacked application cards (not a table — better mobile):

```
┌─────────────────────────────────────────────────┐
│ Community Organiser          ● Shortlisted       │
│ The Base Movement                                │
│ Applied 14 May 2026                              │
└─────────────────────────────────────────────────┘
```

Status badge colours:

| Status        | Badge class                                              |
| ------------- | -------------------------------------------------------- |
| `pending`     | `pill-warn`                                              |
| `reviewed`    | `pill-mute`                                              |
| `shortlisted` | gold accent pill (`background: hsl(var(--accent)/0.15)`) |
| `accepted`    | `pill-ok`                                                |
| `rejected`    | `pill-err`                                               |

Empty state: centred icon + _"No applications yet — browse available jobs and apply."_ + button that switches back to Browse tab.

Loading state: 3 skeleton cards while `getMemberApplicationsFull()` is in flight.

---

## Error Handling

| Condition                        | User experience                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| `monthly_limit_reached` from RPC | Toast: _"You've reached your 3-application limit for this month. Resets on 1 [Month]."_ |
| `already_applied` from RPC       | Toast: _"You've already applied for this position."_ — `hasApplied` flipped to `true`   |
| Any other DB error               | Toast: _"Application failed. Please try again."_                                        |
| `not_authenticated` from RPC     | Redirect to `/login`                                                                    |
| Job deleted after application    | Card shows _"[Position removed]"_ in place of title                                     |

**Optimistic update:** on successful apply, new card appended to local applications list immediately with status `pending` — no re-fetch required.

**Tab data caching:** switching tabs does not re-fetch if data was already loaded in the same page session.

---

## Files Changed / Created

| File                                   | Action                                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| Supabase DB                            | Create `apply_to_job` function                                                         |
| `src/types/jobs.ts`                    | Add `ApplicationWithJob` interface                                                     |
| `src/services/jobService.ts`           | Change `applyToJob`, add `getMonthlyApplicationCount`, add `getMemberApplicationsFull` |
| `src/pages/jobs/MyApplicationsTab.tsx` | **Create**                                                                             |
| `src/pages/Jobs.tsx`                   | Add tab bar, counter chip, integrate `MyApplicationsTab`                               |

---

## Out of Scope

- Withdrawing / cancelling an application (does not free up a monthly slot)
- Admin notification when a new application is received (existing admin panel handles this)
- Public-facing Jobs page (`/jobs`) — tabs and rate limit are dashboard-only
