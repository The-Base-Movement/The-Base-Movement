# Typography Audit — Front-End (Public + Dashboard)

**Date:** 2026-05-25
**Scope:** Public site & Member Dashboard — all pages and shared components
**Status:** IN PROGRESS — Stages 1–2 complete ⚙️
**Reference:** Admin audit completed 2026-05-25 (see `typography-no-bold-audit-2026-05-25.md`)

---

## Context & Key Difference from Admin Audit

The admin suite used **inline styles exclusively** — all violations were `fontWeight: 700/800/900` in JSX `style={}` props.

The front-end uses a **mix of inline styles AND Tailwind utility classes**. Violations therefore fall into two categories:

| Type                               | Violation                                     | Correct Replacement                              |
| ---------------------------------- | --------------------------------------------- | ------------------------------------------------ |
| Inline style — body/label text     | `fontWeight: 700 / 800 / 900`                 | `fontWeight: 'var(--font-weight-medium, 500)'`   |
| Inline style — h1/h2/section title | `fontWeight: 700 / 800 / 900`                 | `fontWeight: 'var(--font-weight-semibold, 600)'` |
| Tailwind — body/label/metadata     | `font-bold` / `font-extrabold` / `font-black` | `font-medium`                                    |
| Tailwind — h1/h2/section title     | `font-bold` / `font-extrabold`                | `font-semibold`                                  |
| Tailwind — non-header              | `font-semibold`                               | `font-medium`                                    |

> **`@font-face` declarations in index.css are exempt** — those `font-weight: 700` values declare available font variants and must not be changed.

---

## Typography Standard (Unchanged from Admin)

| Role                                                        | Weight       | Token / Tailwind                                     |
| ----------------------------------------------------------- | ------------ | ---------------------------------------------------- |
| Institutional headers (h1, h2, section titles)              | Semibold 600 | `var(--font-weight-semibold, 600)` / `font-semibold` |
| All other text (labels, body, metadata, KPI digits, badges) | Medium 500   | `var(--font-weight-medium, 500)` / `font-medium`     |

---

## Violation Summary

| File                                                            | Violations | Severity | Primary Issue                                                          |
| --------------------------------------------------------------- | ---------- | -------- | ---------------------------------------------------------------------- |
| `src/index.css`                                                 | 4          | HIGH     | Raw `font-weight: 700` in selectors (non–@font-face)                   |
| `src/pages/Polls.tsx`                                           | 2          | HIGH     | `fontWeight: 700`, `fontWeight: 800`                                   |
| `src/pages/polls/components/PollKPIs.tsx`                       | 3          | HIGH     | `fontWeight: 700`, raw `600`                                           |
| `src/pages/polls/components/PollsSidebar.tsx`                   | 4          | HIGH     | `fontWeight: 800`, `fontWeight: 700`                                   |
| `src/pages/polls/components/ClosedPollsPanel.tsx`               | 6          | HIGH     | `fontWeight: 700`, `fontWeight: 800`                                   |
| `src/pages/PreviewOfficer.tsx`                                  | 2          | HIGH     | `fontWeight: 800`, `fontWeight: 700`                                   |
| `src/pages/ChapterHub.tsx`                                      | 1          | HIGH     | `fontWeight: 700`                                                      |
| `src/pages/chapterdetails/LeaderBanner.tsx`                     | 2          | HIGH     | `fontWeight: 800`, `fontWeight: 600` (missed in initial audit — fixed) |
| `src/pages/chapterdetails/ChapterHeader.tsx`                    | 3          | HIGH     | `fontWeight: 700`, `fontWeight: 800`                                   |
| `src/pages/chapterdetails/LeaderProfileModal.tsx`               | 2          | HIGH     | `fontWeight: 700`, `fontWeight: 800`                                   |
| `src/pages/chapterdetails/LeadershipSidebar.tsx`                | 2          | HIGH     | `fontWeight: 700`                                                      |
| `src/pages/chapterdetails/ActivitiesPanel.tsx`                  | 2          | HIGH     | `fontWeight: 700`                                                      |
| `src/pages/chapterdetails/AnnouncementsPanel.tsx`               | 1          | HIGH     | `fontWeight: 700`                                                      |
| `src/pages/chapterdetails/AboutPanel.tsx`                       | 1          | HIGH     | `fontWeight: 700`                                                      |
| `src/pages/chapterdetails/PollsSection.tsx`                     | 2          | HIGH     | `fontWeight: 700`, `fontWeight: 800`                                   |
| `src/pages/chapterhub/ActivitiesTab.tsx`                        | 1          | HIGH     | `fontWeight: 900`                                                      |
| `src/pages/chapterhub/BoardTab.tsx`                             | 3          | HIGH     | `fontWeight: 700`, `fontWeight: 800`                                   |
| `src/pages/chapterhub/DonationsTab.tsx`                         | 2          | HIGH     | `fontWeight: 900`, `fontWeight: 700`                                   |
| `src/pages/chapterhub/MembersTab.tsx`                           | 2          | HIGH     | `fontWeight: 900`, `fontWeight: 700`                                   |
| `src/pages/chapterhub/ChapterHubKPIs.tsx`                       | 3          | HIGH     | `fontWeight: 700`, `fontWeight: 800`                                   |
| `src/pages/chapterhub/ChapterHubHeader.tsx`                     | 2          | HIGH     | `fontWeight: 800`, `fontWeight: 700`                                   |
| `src/pages/chapterhub/RequestsTab.tsx`                          | 1          | HIGH     | `fontWeight: 700`                                                      |
| `src/pages/home/StatCard.tsx`                                   | 2          | HIGH     | `fontWeight: 800`, `fontWeight: 700`                                   |
| `src/pages/donate/components/DashboardContributionHistory.tsx`  | 2          | HIGH     | `fontWeight: 700`                                                      |
| `src/pages/donate/components/AuditModal.tsx`                    | 1          | HIGH     | `fontWeight: 700`                                                      |
| `src/pages/donate/components/DashboardCampaignsList.tsx`        | 3          | HIGH     | `fontWeight: 700`, `fontWeight: 800`                                   |
| `src/pages/donate/components/DonateSuccessPanel.tsx`            | 1          | HIGH     | `fontWeight: 900`                                                      |
| `src/pages/donate/components/MobilizationProtocol.tsx`          | 1          | HIGH     | `fontWeight: 700`                                                      |
| `src/pages/dashboard/components/AchievementsAndLeaderboard.tsx` | 8          | HIGH     | `fontWeight: 800`, `fontWeight: 700` (8 instances)                     |
| `src/components/ChapterCard.tsx`                                | 2          | HIGH     | `fontWeight: 700`                                                      |
| `src/components/CommentSection.tsx`                             | 7          | HIGH     | `fontWeight: 700` (7 instances)                                        |
| `src/components/LiveContributionFeed.tsx`                       | 4          | HIGH     | `fontWeight: 700` (4 instances)                                        |
| `src/pages/CanvasserClipboard.tsx`                              | 4          | MEDIUM   | `font-bold` Tailwind (non-headers)                                     |
| `src/pages/Chapters.tsx`                                        | 3          | MEDIUM   | `font-bold` Tailwind (non-headers)                                     |
| `src/components/MovementRoadmap.tsx`                            | 5          | MEDIUM   | `font-bold` Tailwind (non-headers)                                     |
| `src/components/ReviewSection.tsx`                              | 8          | MEDIUM   | `font-bold` Tailwind (8+ instances)                                    |
| `src/components/WelcomeModal.tsx`                               | 3          | MEDIUM   | `font-bold` Tailwind (non-headers)                                     |
| `src/components/OpinionPollCard.tsx`                            | 2          | MEDIUM   | `font-bold`, `font-semibold` on non-headers                            |
| `src/components/EventCard.tsx`                                  | 2          | MEDIUM   | `font-bold` Tailwind (non-headers)                                     |
| `src/components/BlogCard.tsx`                                   | 1          | MEDIUM   | `font-bold` Tailwind (non-header)                                      |
| `src/components/Breadcrumbs.tsx`                                | 1          | MEDIUM   | `font-semibold` on nav link                                            |

**Total estimated violations: ~120+**
**HIGH (inline style raw bold values): ~85**
**MEDIUM (Tailwind bold classes): ~35**

---

## Detailed Breakdown by Module

### CSS — `src/index.css`

4 selector-level violations (lines ~444, ~930, ~1025, ~1312).
The `@font-face` blocks at the top are **exempt** — those declare font variants and must stay.

### Polls Module (`src/pages/Polls.tsx` + `polls/components/`)

Heavy use of `fontWeight: 700/800` throughout KPIs, sidebar panels, and closed polls list.
5 files, ~15 violations total.

### Chapter Details (`src/pages/chapterdetails/`)

6 sub-components all use `fontWeight: 700/800` inline. Affects ChapterHeader, LeaderProfileModal, LeadershipSidebar, ActivitiesPanel, AnnouncementsPanel, AboutPanel, PollsSection.
7 files, ~13 violations total.

### Chapter Hub (`src/pages/chapterhub/`)

7 sub-components with `fontWeight: 700/800/900`. Includes KPIs, Header, Board, Donations, Members, Activities, Requests tabs.
7 files, ~14 violations total.

### Donate Module (`src/pages/donate/components/`)

4 components use `fontWeight: 700/800/900`. Highest severity: `fontWeight: 900` in DonateSuccessPanel and DonationsTab.
4 files, ~7 violations.

### Dashboard Components (`src/pages/dashboard/components/`)

AchievementsAndLeaderboard has the highest single-file count: 8 violations.
1 file, 8 violations.

### Shared Components (`src/components/`)

CommentSection (7 violations) and LiveContributionFeed (4 violations) are the worst offenders.
Tailwind-heavy files: ReviewSection (8), MovementRoadmap (5), WelcomeModal (3), EventCard (2), BlogCard (1), OpinionPollCard (2), Breadcrumbs (1).

### Home Module (`src/pages/home/`)

StatCard uses `fontWeight: 800/700`.
1 file, 2 violations.

---

## Correction Reference

### Inline Style Violations

```tsx
// ❌ WRONG — raw bold on body text
<p style={{ fontWeight: 700 }}>Member name</p>
<span style={{ fontWeight: 800 }}>Count</span>

// ✅ CORRECT — body/label/metadata text
<p style={{ fontWeight: 'var(--font-weight-medium, 500)' }}>Member name</p>

// ✅ CORRECT — h1/h2/section title only
<h2 style={{ fontWeight: 'var(--font-weight-semibold, 600)' }}>Section title</h2>
```

### Tailwind Class Violations

```tsx
// ❌ WRONG — bold on non-header
<p className="font-bold text-sm">Label text</p>
<span className="font-extrabold">Count</span>

// ✅ CORRECT — body/label/metadata
<p className="font-medium text-sm">Label text</p>

// ✅ CORRECT — headers only
<h2 className="font-semibold text-lg">Section title</h2>
```

---

## Files NOT Requiring Changes

The following front-end files were checked and found clean (already compliant or no typography inline styles):

- `src/pages/Login.tsx` ✅ (just updated this session)
- `src/pages/Register.tsx` (Tailwind-only, font-medium throughout)
- `src/pages/NotFound.tsx`
- `src/pages/Privacy.tsx`
- `src/pages/Terms.tsx`
- `src/pages/Officers.tsx` ✅ (updated this session with search bar)
- `src/components/DashboardLayout.tsx` ✅ (updated this session)
- `src/components/AdminPageHeader.tsx` ✅

---

## Remediation Progress

| Stage                         | Files                                                                                                                                                                                                                                                | Status     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1 · `src/index.css`           | 1                                                                                                                                                                                                                                                    | ✅ DONE    |
| 2 · Shared components         | CommentSection, LiveContributionFeed, ChapterCard                                                                                                                                                                                                    | ✅ DONE    |
| 3 · Polls module              | Polls.tsx + 4 sub-components                                                                                                                                                                                                                         | ✅ DONE    |
| 4 · Chapter Details           | 8 sub-components (incl. LeaderBanner)                                                                                                                                                                                                                | ✅ DONE    |
| 5 · Chapter Hub               | 9 sub-components (incl. ChapterHubTabs, SettingsTab)                                                                                                                                                                                                 | ✅ DONE    |
| 6 · Donate module             | 5 + 3 orphan files (StatCard, PreviewOfficer, ChapterHub)                                                                                                                                                                                            | ✅ DONE    |
| 7 · Dashboard components      | AchievementsAndLeaderboard + 12 additional (Members, Footer, AdminLayout, MembershipCard, LiveContributionFeed patch, OfflineBanner, SearchBar, ErrorBoundary, OfflineSuccessStep, PollsSection, DashboardMobileFilterDrawer, DashboardRequestModal) | ✅ DONE    |
| 8 · Tailwind-heavy components | 9 files                                                                                                                                                                                                                                              | ⏳ Pending |

---

## Methodology (Same as Admin Audit)

- Zero structural changes — only `fontWeight`, `font-weight`, and typography utility classes to be touched
- Surgical string replacements only — no components rewritten or restructured
- Layout, flex, margins, padding, and DOM nesting preserved exactly
