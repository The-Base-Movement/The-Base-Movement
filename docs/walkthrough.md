# Typographic Modernization and Dynamic Telemetry Walkthrough

We have modernized the opinion poll designs by softening typographic font weights and removing harsh styling, and integrated dynamic real-time database queries to fetch nationwide and diaspora user stats.

## Changes Made

### 1. Opinion Poll Design & Typography Standards

In [OpinionPollCard.tsx](file:///c:/MAMP/htdocs/The-Base/src/components/OpinionPollCard.tsx):

- **Poll Header & Subtitle**: Softened the live status / close date indicator from `font-bold` to `font-semibold` and total votes count to `font-medium`.
- **Question Title**: Softened the poll question title (`h3`) font-weight to `font-medium` (500) for public layout and `font-semibold` (600) for internal layout.
- **Results Percentage**: Adjusted the results percentage value (`{percentage}%`) to a soft `font-semibold` (600) weight rather than `font-extrabold` (800).
- **"Members only" Subtitle**: Dropped the harsh `uppercase` text styling and `font-bold` weight. The badge now renders in standard sentence case with a premium `font-medium` weight and subtle `tracking-[0.02em]`.
- **Footer**: Softened the footer counts and actions to a cleaner `font-semibold` weight.

### 2. Telemetry and Dynamic Database Fetching

In [adminService.ts](file:///c:/MAMP/htdocs/The-Base/src/services/adminService.ts):

- **Verified Citizens Count**: Removed the status filters in the `membersTotal` query so that the statistics dashboard on the homepage displays all registered user accounts.
- **Global Ghanaian Diaspora Count**: Removed the status filters in the `diasporaTotal` query so that diaspora registrations reflect the total number of profiles where `platform === 'DIASPORA'`.

---

## Follow-up: Homepage Polls Casing & Stats Visibility Corrections

### 1. Homepage Polls Styling (`PollsSection.tsx`)

In [PollsSection.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/home/PollsSection.tsx), the teaser cards were previously styled using separate inline CSS with extra bold typography. We softened them to match the main `OpinionPollCard.tsx` design guidelines:

- **Title Question**: Reduced font weight from `800` to `600`.
- **Options labels**: Softened font weight from `800` to `500`.
- **Option percentages**: Reduced parent weight to `500` and specified `600` specifically for the dynamic percentage `pct%`.
- **Header & Footer text**: Softened metadata and voter guidelines from `700` to `600` and `500` respectively.

### 2. Stats Section Visibility Fixes

We diagnosed that the "Movement at a glance" statistics section header and metric cards could remain hidden at `opacity: 0` due to GSAP ScrollTriggers under specific viewport heights or initial layout shift conditions. We made the rendering extremely robust:

- **Title Visibility**: Removed the `data-fade` GSAP trigger from the statistics section title div in [StatsSection.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/home/StatsSection.tsx) so the header is always rendered instantly.
- **Stats Card Animations**: Removed `scrollTrigger` constraints from [Home.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/Home.tsx) (the stats grid stagger animation) and [StatCard.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/home/StatCard.tsx) (the numeric roll-up animation).
- **Dynamic Render on Mount**: Modified both animations to run immediately upon mount/data changes by specifying `stats` and `value` as react/GSAP hook dependency arrays. This guarantees that stats are instantly visible and roll up dynamically as soon as Supabase resolves the counts!

### Type Safety check

We ran `npm run typecheck` to verify complete type safety and code compilation:

- **Result**: Compiles perfectly with 0 type errors.

---

## Follow-up: Admin Components & Blog Typography Modernization

We completed a comprehensive sweep of the remaining admin panel elements and blog card components to soften harsh font weights (reducing 800/900 down to 700/600/500 where appropriate) to match the brand guidelines.

### 1. Admin Control Cards

- **PulseReport.tsx**: Softened metrics metrics and regional matrix growth rates to `700`.
- **OrderListCard.tsx**: Softened customer names to `700` and order metadata to `600`.
- **MobilizationLeaderboardCard.tsx**: Softened chapter names to `700`, point counts to `700`, and metrics labels to `600`.
- **MemberListCard.tsx**: Softened member names and initials to `700`, and registration IDs/metaStyle to `600`.
- **DonationListCard.tsx**: Softened donor names, amounts, reference keys to `700`, and payment method labels/dates to `600`.
- **DeleteConfirmationModal.tsx**: Softened warning header to `700`, explanation copy to `500`, and item descriptors to `600`/`700`.
- **RegistrationForm.tsx**: Bulk-softened all step headers, progress markers, and input fields to a consistent `700` weight.

### 2. Public / Shared Components

- **Navbar.tsx**: Softened logo weight from `900` to `700`, user names from `800` to `600`, and other action buttons to `500`.
- **BlogPostCard.tsx**: Softened main title headings to `600`, and metadata/author details to `600`/`500`.
- **LatestUpdatesSection.tsx**: Adjusted category markers, callouts, and update section headlines from bold to `semibold` (600).

---

## Store Branding Renaming & ErrorBoundary Test Fix

### 1. Store Renaming (from "Supplies")

We renamed UI labels and headers referring to "Supplies" back to "Store" for consistent product branding and alignment with the `/store` and `/dashboard/store` technical routes:

- **Navbar & Footer** ([Navbar.tsx](file:///c:/MAMP/htdocs/The-Base/src/components/Navbar.tsx) & [Footer.tsx](file:///c:/MAMP/htdocs/The-Base/src/components/Footer.tsx)): Updated link labels to "Store".
- **Dashboard Sidebar & Breadcrumbs** ([DashboardLayout.tsx](file:///c:/MAMP/htdocs/The-Base/src/components/DashboardLayout.tsx) & [StoreBreadcrumb.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/store/StoreBreadcrumb.tsx)): Updated title mapping and navigation targets to display "Store" instead of "Supplies".
- **Storefront & SEO** ([Store.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/Store.tsx)): Replaced metadata, share description text, and primary `h1` heading with "Movement Store".
- _Note_: Budget category "Supplies" in [types.ts](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/spendingledger/types.ts) remains untouched as it refers to a distinct physical supplies spending category in the ledger rather than the public e-commerce store.

### 2. ErrorBoundary Test Alignment

- In [ErrorBoundary.test.tsx](file:///c:/MAMP/htdocs/The-Base/src/test/ErrorBoundary.test.tsx), the `ErrorBoundary` retry test was reordered. We now call `rerender` with a non-throwing child component _before_ clicking "Try again" (the retry trigger). This aligns with the react testing environment lifecycle, preventing the component from immediately re-throwing on click and ensuring the test successfully verifies boundary resetting.

### 3. Verification & Compilation

- Ran `npm run typecheck` to confirm zero compilation errors.
- Ran `npm run test:run` to confirm all 6 test suites pass successfully.

---

## CSS Custom Property Font-Weight System & Dashboard/Settings Typography

### 1. Foundational Token System

We introduced a central CSS custom property font-weight scale so all typography can be controlled globally from a single source of truth:

- **[index.css](file:///c:/MAMP/htdocs/The-Base/src/index.css)**: Added 9 `--font-weight-*` CSS variables (`thin` → `black`) under `:root`.
- **[tailwind.config.js](file:///c:/MAMP/htdocs/The-Base/tailwind.config.js)**: Extended Tailwind's `fontWeight` scale so every utility class (e.g. `font-semibold`) now resolves through the CSS variable with a static fallback (e.g. `var(--font-weight-semibold, 600)`). This means font weights can be globally adjusted via CSS without touching component files.

### 2. Dashboard Components

- **[StatCards.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/dashboard/components/StatCards.tsx)**: Softened stat labels from `800` → `semibold (600)`, values from `800` → `semibold (600)`, delta from `700` → `medium (500)`.
- **[ActivityFeed.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/dashboard/components/ActivityFeed.tsx)**: Softened member name/target highlights from `font-extrabold` → `font-semibold`, inline CSS `800` → `var(--font-weight-semibold, 600)`.
- **[MovementJourney.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/dashboard/components/MovementJourney.tsx)**: Softened section heading and step titles from `font-extrabold` → `font-semibold`.
- **[QuickActions.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/dashboard/components/QuickActions.tsx)**: Softened section heading and action card labels from `800` → `semibold (600)`.

### 3. Profile Settings Pages

- **[shared.ts](file:///c:/MAMP/htdocs/The-Base/src/pages/settings/shared.ts)**: Updated shared `labelStyle` and `inputStyle` weights from `800/700` → `semibold/medium`.
- **[ProfileSettingsHeader.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/settings/ProfileSettingsHeader.tsx)**: Softened page title from `900` → `semibold (600)`, subtitle from `700` → `normal (400)`.
- **[PersonalInfoForm.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/settings/PersonalInfoForm.tsx)**: Softened registration number label from `700` → `medium (500)`.
- **[VerificationStatusPanel.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/settings/VerificationStatusPanel.tsx)**: Softened status label from `800` → `semibold (600)`, body copy from `700` → `normal (400)`.
- **[VoterRegistrationPanel.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/settings/VoterRegistrationPanel.tsx)**: Softened district labels from `800` → `semibold (600)` and descriptive text from `700` → `medium (500)`.
- **[DangerZonePanel.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/settings/DangerZonePanel.tsx)**: Softened warning heading from `800` → `semibold (600)`, explanatory copy from `700` → `normal (400)`.
- **[PerformancePrefsPanel.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/settings/PerformancePrefsPanel.tsx)**: Softened toggle label from `800` → `semibold (600)`, hint text from `700` → `normal (400)`.

### 4. Verification

- `npm run typecheck` → **0 errors**
- lint-staged (ESLint + Prettier) ran cleanly on all 15 files at commit time.

---

## Admin Administrators Page Typography Softening

We completed a thorough typographic review and softening pass of the **Administrators Command Center** (`/admin/administrators`) and all its administrative modal components. All font weights have been migrated from heavy, rigid, hard-coded numeric values (`900`, `800`, `700`) to the centralized, highly maintainable CSS variable system with robust fallbacks (`var(--font-weight-*)`).

### 1. Roster and Table Components

- **[AdministratorsTable.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/administrators/AdministratorsTable.tsx)**:
  - Softened avatar initials style (`avatarSt`) weight from `800` → `semibold (600)`.
  - Softened table column headers (`thSt`) weight from `800` → `semibold (600)`.
  - Softened active records counter in panel header from `700` → `medium (500)`.
  - Softened empty roster state text from `800` → `medium (500)`.
  - Softened administrator names from `800` → `semibold (600)`.
  - Softened unique administrative IDs from `700` → `normal (400)`.
  - Softened security role badge text from `800` → `semibold (600)`.
  - Softened location region indicators from `700` → `medium (500)`.
  - Softened dropdown context action menu options ("Edit permissions", "Activity logs", "Revoke access") weights from `800` → `semibold (600)`.
- **[AdministratorsMobileCards.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/administrators/AdministratorsMobileCards.tsx)**:
  - Softened mobile card avatar initials weight from `800` → `semibold (600)`.
  - Softened empty state text from `800` → `medium (500)`.
  - Softened administrator name from `800` → `semibold (600)`.
  - Softened administrative ID from `700` → `normal (400)`.
  - Softened role badges from `800` → `semibold (600)`.
  - Softened "Region" labels and values from `800` → `semibold (600)`.

### 2. Search & Overview Headers

- **[AdminsHeader.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/administrators/AdminsHeader.tsx)**: Softened description/subheading copy from `700` → `normal (400)`.
- **[AdminsSearchBar.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/administrators/AdminsSearchBar.tsx)**: Softened interactive search input placeholder and typed text from `700` → `medium (500)`.
- **[AdminsSecurityNote.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/administrators/AdminsSecurityNote.tsx)**: Softened alert title from `800` → `semibold (600)` and safety description copy from `700` → `normal (400)`.

### 3. Administrative Modals

- **[AuditLogsModal.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/administrators/AuditLogsModal.tsx)**:
  - Softened modal title "Administrative Audit Vault" from `900` → `semibold (600)`.
  - Softened target administrator subtitle text from `700` → `normal (400)`.
  - Softened "Decrypting audit stream..." loader and "No recorded activity" empty state from `700` → `medium (500)`.
  - Softened action labels inside logs from `900` → `semibold (600)`.
  - Softened logs timestamp from `700` → `normal (400)`.
  - Softened "Resource:" prefix labels from `700` → `medium (500)`.
  - Softened status status indicator badges from `800` → `semibold (600)`.
- **[EditPermissionsModal.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/administrators/EditPermissionsModal.tsx)**:
  - Softened input/select form styles (`inputSt`) from `700` → `medium (500)`.
  - Softened uppercase form labels (`labelSt`) from `800` → `semibold (600)`.
  - Softened modal title "Edit Permissions" from `900` → `semibold (600)`.
  - Softened target name subtitle from `700` → `normal (400)`.
  - Softened disclaimer note from `700` → `normal (400)`.
- **[ProvisionModal.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/administrators/ProvisionModal.tsx)**:
  - Softened input/select fields from `700` → `medium (500)`.
  - Softened field labels from `800` → `semibold (600)`.
  - Softened modal title "Provision Credentials" from `900` → `semibold (600)`.
  - Softened subtitle copy from `700` → `normal (400)`.
  - Softened search and selected member names from `800` → `semibold (600)`.
  - Softened "Searching..." state feedback from `700` → `medium (500)`.
- **[RevokeConfirmModal.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/administrators/RevokeConfirmModal.tsx)**:
  - Softened deletion modal header "Revoke Access" from `900` → `semibold (600)`.
  - Softened warning copy from `700` → `normal (400)`.

### 4. Verification & Lint-Staged Execution

- Verified typescript compilation by running `npm run typecheck` which completed successfully with **0 compilation errors**.
- All changes fully passed ESLint linting and Prettier formatting checks during staging and commit.

---

## Follow-up: Member Verification & Leadership Hub Typography Softening

We completed a comprehensive sweep of the **Member Verification** and **Leadership Hub** directories (`/admin/verification` and `/admin/leadership`) to migrate all remaining rigid, hard-coded numeric font weights to our centralized CSS custom property system (`var(--font-weight-*)`).

### 1. Member Verification

- **[AuditVaultModal.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/memberverification/AuditVaultModal.tsx)**:
  - Softened modal subheaders and structural labels (e.g., "Secure vault record", "Identity metadata", "Captured credentials") from `800` to `semibold (600)`.
  - Softened vault record name `h2` heading from `800` to `semibold (600)`.
  - Softened description copy, biometric feedbacks, legal disclaimers, and record IDs from `700` to `normal (400)`.
  - Softened list keys (e.g., "Full name") from `800` to `semibold (600)` and their corresponding values from `700` to `normal (400)`.
  - Softened audit log labels from `800` to `semibold (600)` and timestamps/metadata lines from `700` to `normal (400)`.

### 2. Leadership Hub

- **[DirectAppointModal.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/leadershiphub/DirectAppointModal.tsx)**:
  - Softened the modal main header from `800` to `semibold (600)`.
  - Softened description copy from `600` to `normal (400)`.
  - Softened field labels (e.g., "Select member", "Chapter", "Role") from `800` to `semibold (600)`.
  - Softened member search initials avatar box from `800` to `semibold (600)`.
  - Softened search results list item names from `800` to `semibold (600)`, unique member IDs from `700` to `normal (400)`, and regions from `600` to `medium (500)`.
  - Softened warning feedback and placeholder options from `700` to `medium (500)`.
  - Softened confirmation summary text from `700` to `medium (500)`.
- **[ChapterApplicationsTable.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/leadershiphub/ChapterApplicationsTable.tsx)**:
  - Softened section header title and all table column header cells (`Officer`, `Proposed chapter`, `Geography`, `Status`, `Actions`) from `900` to `semibold (600)`.
  - Softened subtitle text from `700` to `normal (400)`.
  - Softened applicant names from `800` to `semibold (600)` and applicant IDs from `800` to `normal (400)`.
  - Softened geographic regions from `800` to `semibold (600)` and constituency metadata from `700` to `normal (400)`.
  - Softened empty state description text from `800` to `medium (500)`.
  - Softened badges and button text weights from `900` to `semibold (600)`.
- **[AppointedLeadersTable.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/leadershiphub/AppointedLeadersTable.tsx)**:
  - Softened section header title and table column header cells from `900` to `semibold (600)`.
  - Softened subtitles from `700` to `normal (400)`.
  - Softened initials avatar fallback and officer names from `800` to `semibold (600)`.
  - Softened registration numbers and phone numbers from `700` to `normal (400)`.
  - Softened appointed chapter names from `700` to `medium (500)`.

### 3. Verification & Safety

- Successfully executed type checks by running `npm run typecheck`, verifying **0 typescript errors** across the entire project repository.
- Verified that all modified pages align with a consistent, premium, and beautiful aesthetic.

---

## Follow-up: Mobilization & Field Operations Typography Softening

We completed a comprehensive sweep of the **Mobilization & Field Operations** command modules (`/admin/chapters`, `/admin/ground-game-command`, `/admin/rally-command`, and `/admin/field-directives`) and all their nested dashboard widgets, panels, list items, and modal interfaces. We migrated all rigid, heavy numeric font weights (`900`, `800`, `700`) to our centralized CSS custom property system (`var(--font-weight-*)`).

### 1. Chapters Management (`/admin/chapters`)

- **[PollManagementModal.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/chapters/PollManagementModal.tsx)**: Softened header titles, labels, and informational subheaders from `800`/`700` to `semibold (600)` and `medium (500)`.
- **[PollCreateEditModal.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/chapters/PollCreateEditModal.tsx)**: Softened modal headers, field labels, interactive option text, and control buttons to CSS variables.
- **[ChaptersStats.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/chapters/ChaptersStats.tsx)**: Softened chart legends, tooltips, ticks, and card metric values from `800`/`700` to `semibold (600)` or `medium (500)`.
- **[ChaptersMap.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/chapters/ChaptersMap.tsx)**: Softened chapter card titles and status badges to `semibold (600)`.
- **[ChaptersGrid.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/chapters/ChaptersGrid.tsx)**: Softened region filters, grid titles, and card headers to clean `semibold (600)` weights.
- **[ChapterDetailModal.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/chapters/ChapterDetailModal.tsx)**: Softened chapter header, regional stats grid, and detail sections.

### 2. Ground Game Command (`/admin/ground-game-command`)

- **[RoutesPanel.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/groundgamecommand/RoutesPanel.tsx)**: Softened itinerary headings, mileage metrics, and field detail cards to `semibold (600)`.
- **[QuickActionsPanel.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/groundgamecommand/QuickActionsPanel.tsx)**: Softened command panel headers and action card labels.
- **[PollingAgentsList.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/groundgamecommand/PollingAgentsList.tsx)**: Softened agent titles, constituency markers, and card metadata.
- **[MemberReadinessTable.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/groundgamecommand/MemberReadinessTable.tsx)**: Softened name headings, status pills, and readiness percentages in the datagrid.
- **[LeaderboardPanel.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/groundgamecommand/LeaderboardPanel.tsx)**: Softened regional chapter items and performance stats.
- **[FieldAgentsList.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/groundgamecommand/FieldAgentsList.tsx)**: Softened officer cards, assignment details, and active tags.
- **[ConstituencyCoverageTable.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/groundgamecommand/ConstituencyCoverageTable.tsx)**: Softened progress markers, coverage bars, and table cell text.
- **[AppointStationAgentModal.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/groundgamecommand/AppointStationAgentModal.tsx)** & **[AppointFieldAgentModal.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/groundgamecommand/AppointFieldAgentModal.tsx)**: Softened form prompts, list selectors, and submit triggers.

### 3. Rally Command (`/admin/rally-command`)

- **[RallyHeader.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/rally/RallyHeader.tsx)**: Softened page subtitle description weight from `700` to a highly readable `var(--font-weight-normal, 400)`.
- **[OperationalMetrics.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/rally/OperationalMetrics.tsx)**: Softened 3-column metric card labels, large numeric value counts, and contextual subheadings from `900` to `var(--font-weight-semibold, 600)` and `var(--font-weight-medium, 500)`.
- **[GeofenceViewer.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/rally/GeofenceViewer.tsx)**: Softened geofence status panels, location parameters, and visual visualization text indicators from `900`/`800` to clean CSS variables.
- **[AttendanceTable.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/rally/AttendanceTable.tsx)**: Softened table headers, search inputs, user initials, names, checked-in timestamp lines, and verification badge text to soft semibold/medium weights.
- **[ActionList.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/rally/ActionList.tsx)**: Softened sidebar list title, action titles, schedule timing values, status pills, and map markers.

### 4. Field Directives (`/admin/field-directives`)

- **[SituationalAwarenessFeed.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/fielddirectives/SituationalAwarenessFeed.tsx)**: Softened feed headers, GPS badge indicators, member details, time headers, and status badges.
- **[IssueDirectiveModal.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/fielddirectives/IssueDirectiveModal.tsx)**: Softened input fields, uppercase form labels, modal title, and action deployment buttons.
- **[ActiveDirectivesList.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/fielddirectives/ActiveDirectivesList.tsx)**: Softened priority status badges, titles, descriptions, awarded points, and schedule values.

### 5. Verification

- Verified complete compilation of the entire codebase with **zero typescript errors** via `npm run typecheck`.

---

## Follow-up: Strategic Priorities & Roadmap Typography Softening & Media Vault Sync

We completed a thorough typographic softening sweep across all **Strategic Priorities** (`/admin/priorities`) and **Roadmap** (`/admin/roadmap`) administration pages. All rigid, heavy, hardcoded font weights (`900`, `800`, `700`) were replaced with standard CSS variable properties (`var(--font-weight-*)`). In addition, we synchronized the priority visual assets with a new `'priorities'` folder in the Media Library, added flexible multi-source selectors, robust image fallbacks, and polished the modal aesthetics.

### 1. Strategic Priorities (`/admin/priorities`)

- **[StrategicPrioritiesSidebar.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/strategicpriorities/StrategicPrioritiesSidebar.tsx)**: Softened active/inactive filters, keywords search fields, total active categories, and success rates.
- **[PriorityModal.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/strategicpriorities/PriorityModal.tsx)**:
  - **Dynamic Media Vault Sync**: Integrated a 3-tab select system allowing administrators to pick from the **Media Library** (which auto-queries pre-loaded illustration assets from the dedicated `'priorities'` vault folder), **Ingest Local file** uploads, or input custom **Image URLs**.
  - **Premium UI Error Fallbacks**: Added an `onError` trigger on the image preview that points to the premium, high-resolution branding logo fallback (`/branding/logo.png`). This guarantees that broken links or empty inputs never break the visual flow or hide the preview on the modal.
  - **Wider Desktop Viewport**: Increased the modal's `maxWidth` on wide screens to `720` to allow breathing room for files list, selectors, and form elements.
  - **Vertical Stack Alignment**: Separated **Status** and **Visual Asset** from sharing a single row in desktop grid view to stack as their own independent, full-width rows for enhanced layout flow and scanning ease.
  - **Simplified CTAs**: Renamed the primary submission button label from the rigid "Sync Adjustments" to a clean, standard **"Update Protocol"**.
- **[PriorityCard.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/strategicpriorities/PriorityCard.tsx)**: Softened priority title headers, progress percentages, and milestones; integrated local state `imageError` fallback to standard logo `/branding/logo.png` on 404/broken DB links.
- **[MobileFilterModal.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/strategicpriorities/MobileFilterModal.tsx)**: Softened dialog headings, filter selectors, total active indicators, and success summaries.
- **Asset Redirection & public Directory Organization**:
  - Created a dedicated `public/priorities/` subfolder.
  - Moved the pre-loaded visual assets `agro_processing_illustration.png`, `digital_economy_illustration.png`, and `ghana_network_map.png` from the public root into `public/priorities/` for cleaner directory architecture.
  - Updated all references in [contentService.ts](file:///c:/MAMP/htdocs/The-Base/src/services/contentService.ts) to resolve under `/priorities/...`.
  - Removed all legacy title-based hardcoded overrides in the public card renderer [StrategicPriorities.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/donate/components/StrategicPriorities.tsx). The public strategic priorities view now dynamically binds `c.imageUrl` directly from Supabase, enabling updates and new files to propagate instantly to the cards.

### 2. Roadmap (`/admin/roadmap`)

- **[utils.ts](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/roadmap/utils.ts)**: Softened core input weights (`inputSt`), uppercase form label properties (`labelSt`), and category milestone tags (`pillBase`).
- **[RoadmapTable.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/roadmap/RoadmapTable.tsx)**: Softened timeline metrics, roadmap objectives, category tags, importance levels, status tables, and details.
- **[RoadmapFormModal.tsx](file:///c:/MAMP/htdocs/The-Base/src/pages/admin/roadmap/RoadmapFormModal.tsx)**: Softened panel headers and strategic labels.

### 3. Database Overwrite Persistency Fix

- **[adminService.ts](file:///c:/MAMP/htdocs/The-Base/src/services/adminService.ts)**: Refactored the `updateDonationCampaign` payload builder to use `!== undefined` boundary checks rather than raw truthiness checks. This corrects a critical database bug where fields set to `0` or empty values, and selected Media Library images, were skipped from the update SQL statement, allowing selected images to successfully override and persist to the Supabase database.

### 4. Verification & Compliance

- Verified complete compilation of the entire codebase with **zero typescript errors** via `npm run typecheck`.
- Verified that dynamic folder synchronization works perfectly on the main admin Media Library and local dashboard overlays.
