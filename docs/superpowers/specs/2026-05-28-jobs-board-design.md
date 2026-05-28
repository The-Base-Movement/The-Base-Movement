# Jobs Board — Design Spec

**Date:** 2026-05-28  
**Status:** Approved

---

## Overview

A jobs board that is publicly visible but requires membership to apply. Admins post and manage jobs; members browse, view details, and submit applications with a cover letter and optional resume upload.

---

## Architecture

**Option chosen:** Two separate pages — admin management page + shared public/dashboard browse page (matching existing Blogs/Members pattern).

---

## 1. Database Schema

### `jobs`

| Column            | Type                   | Notes                                                           |
| ----------------- | ---------------------- | --------------------------------------------------------------- |
| `id`              | `uuid` PK              | default `gen_random_uuid()`                                     |
| `title`           | `text` NOT NULL        |                                                                 |
| `organization`    | `text` NOT NULL        | company/org posting the role                                    |
| `description`     | `text` NOT NULL        | rich text / markdown                                            |
| `requirements`    | `text`                 | optional                                                        |
| `location`        | `text`                 | city, region, or "Remote"                                       |
| `job_type`        | `text`                 | `full-time`, `part-time`, `contract`, `volunteer`, `internship` |
| `category`        | `text`                 | e.g. Technology, Legal, Finance, Admin                          |
| `salary_range`    | `text`                 | optional display string                                         |
| `platform_filter` | `text`                 | `ALL`, `GHANA`, `DIASPORA`                                      |
| `deadline`        | `date`                 | application closing date                                        |
| `status`          | `text`                 | `draft`, `published`, `closed`                                  |
| `posted_by`       | `uuid` FK → `profiles` | admin who created it                                            |
| `created_at`      | `timestamptz`          | default `now()`                                                 |
| `updated_at`      | `timestamptz`          | default `now()`                                                 |

### `job_applications`

| Column         | Type                                 | Notes                                                        |
| -------------- | ------------------------------------ | ------------------------------------------------------------ |
| `id`           | `uuid` PK                            | default `gen_random_uuid()`                                  |
| `job_id`       | `uuid` FK → `jobs` ON DELETE CASCADE |                                                              |
| `member_id`    | `uuid` FK → `profiles`               | applicant                                                    |
| `cover_letter` | `text` NOT NULL                      |                                                              |
| `resume_url`   | `text`                               | optional storage URL                                         |
| `status`       | `text`                               | `pending`, `reviewed`, `shortlisted`, `rejected`, `accepted` |
| `created_at`   | `timestamptz`                        | default `now()`                                              |
| `updated_at`   | `timestamptz`                        | default `now()`                                              |

**Unique constraint:** `(job_id, member_id)` — one application per member per job.

### RLS Policies

- `jobs`: public `SELECT` where `status = 'published'`; admins full access
- `job_applications`: members `INSERT` own + `SELECT` own; admins full access

---

## 2. Service Layer

**File:** `src/services/jobService.ts`

| Method                                | Access | Description                                                           |
| ------------------------------------- | ------ | --------------------------------------------------------------------- |
| `getJobs(filters?)`                   | Public | Returns published jobs; accepts category/type/platform/search filters |
| `getJobById(id)`                      | Public | Single published job                                                  |
| `createJob(data)`                     | Admin  | Insert new job                                                        |
| `updateJob(id, data)`                 | Admin  | Update any job field                                                  |
| `deleteJob(id)`                       | Admin  | Hard delete from DB                                                   |
| `applyToJob(jobId, payload)`          | Member | Insert application with cover letter + optional resume URL            |
| `getApplicationsForJob(jobId)`        | Admin  | All applications for a job with member profile join                   |
| `updateApplicationStatus(id, status)` | Admin  | Change application status                                             |
| `getMemberApplications(memberId)`     | Member | Member's own applications                                             |
| `uploadResume(file)`                  | Member | Upload to Supabase Storage bucket `job-resumes`, return public URL    |

---

## 3. Public / Dashboard Jobs Page

**Routes:**

- `/jobs` — `PublicLayout`, unauthenticated browse allowed
- `/dashboard/jobs` — `DashboardLayout`, authenticated

Both routes use a single `Jobs` page component with an `isDashboard` prop.

**Layout:**

- Page header: "Jobs Board" + subtitle
- Filter bar: search input, Category dropdown, Job Type dropdown, Platform filter (`ALL` / `GHANA` / `DIASPORA`)
- Responsive card grid — each card shows: title, organization, location, job type pill, category, deadline, platform badge
- **Job detail modal** (click card): full description, requirements, salary range, deadline, platform badge + Apply Now button
  - Not logged in → redirect to `/login`
  - Logged in → opens application form modal
  - Already applied → button disabled with "Applied" label
- **Application form modal:** cover letter textarea (required) + resume file upload (optional) + Submit button
- Post-submit: success state, button becomes "Applied ✓" (disabled), no duplicate apply

---

## 4. Admin Jobs Page

**Route:** `/admin/jobs`

**Layout:**

- `AdminPageHeader` — title "Jobs Board", "Post Job" CTA button
- KPI row (4 tiles): Total Jobs · Open · Closed · Total Applications
- Filter bar: search by title/org, status filter, category filter, type filter
- Jobs table — columns: Title, Organization, Type, Category, Deadline, Status pill, Applications count, Actions menu
  - Actions: Edit, Close (sets status=closed), Delete
- **Post / Edit modal:** full job form — title, org, description, requirements, location, type, category, salary range, platform filter, deadline, status
- **Applications drawer** (right-side overlay, triggered by "Applications (N)" count):
  - Lists applicants: member name, reg number, date applied, status pill
  - Status dropdown per row (Pending / Reviewed / Shortlisted / Rejected / Accepted)
  - "View Cover Letter" opens inner modal
  - Resume URL opens in new tab

---

## 5. File Plan

| File                                          | Type                      |
| --------------------------------------------- | ------------------------- |
| `src/services/jobService.ts`                  | New service               |
| `src/pages/Jobs.tsx`                          | New public/dashboard page |
| `src/pages/admin/Jobs.tsx`                    | New admin page            |
| `src/pages/admin/jobs/JobFormModal.tsx`       | Post/edit form            |
| `src/pages/admin/jobs/ApplicationsDrawer.tsx` | Applications panel        |
| `supabase/migrations/YYYYMMDD_jobs_board.sql` | DB migration              |
| `src/routes.tsx`                              | Add 3 routes              |

---

## 6. Routing Changes

```
/jobs                        → Jobs (PublicLayout)
/dashboard/jobs              → Jobs (DashboardLayout, ProtectedRoute)
/admin/jobs                  → AdminJobs (AdminLayout)
```
