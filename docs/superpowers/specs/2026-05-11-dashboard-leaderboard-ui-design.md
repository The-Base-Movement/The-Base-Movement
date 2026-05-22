# Specification: Dashboard Achievements & Regional Leaderboard

## Overview
This specification covers the implementation of the missing "Achievements & Regional Leaderboard" section in the user Dashboard. This resolves the linting warning regarding the unused `leaderboard` state and completes the intended UI for Section 4.

## Problem
- The `leaderboard` state is populated via `adminService.getLeaderboard(region)` but never rendered.
- The `achievements` state is used for count only, but the actual achievements are not listed.
- There is a placeholder comment in `Dashboard.tsx` for this section.

## Success Criteria
- [ ] No "unused variable" warnings for `leaderboard` in `Dashboard.tsx`.
- [ ] A new modular component `AchievementsAndLeaderboard.tsx` is created.
- [ ] Regional leaderboard (top 5 members) is displayed.
- [ ] Unlocked achievements are displayed with icons/labels.
- [ ] Visual style matches the existing "The Base" dashboard (clean, industrial, high-contrast).

## Architecture

### New Component: `AchievementsAndLeaderboard`
- **Location**: `src/pages/dashboard/components/AchievementsAndLeaderboard.tsx`
- **Props**:
  - `leaderboard: LeaderboardEntry[]`
  - `achievements: Achievement[]`
  - `region: string`
- **Internal State**: None required.

### Data Flow
1. `Dashboard.tsx` fetches `regionLeaderboard` and `userAchievements`.
2. `Dashboard.tsx` passes these as props to `AchievementsAndLeaderboard`.
3. `AchievementsAndLeaderboard` maps over the arrays to render the UI.

## UI Design

### Layout
- On desktop: 2-column grid.
- On mobile: Single column (stacked).

### Leaderboard Column
- Card-based container.
- Header: "Regional Members - [Region]".
- List items:
  - Rank (styled number).
  - Name (bold).
  - Points (italicized numeric).
- Empty state: "No regional data available."

### Achievements Column
- Card-based container.
- Header: "Unlocked Achievements".
- Grid of items:
  - Icon (from Lucide or Material Symbols).
  - Name (tiny bold).
- Empty state: "No achievements unlocked yet. Take action to earn points!"

## Implementation Plan
1. Create `src/pages/dashboard/components/AchievementsAndLeaderboard.tsx`.
2. Implement the UI using existing styling patterns (Tailwind + CSS variables).
3. Import and add the component to `Dashboard.tsx` at the Section 4 placeholder.
4. Verify by running the application or checking the build.

## Testing Strategy
- Manual verification: Ensure the data displays correctly when the leaderboard and achievements arrays are populated.
- Edge case: Verify empty states for both sections.
- Visual check: Ensure responsive behavior on mobile screens.
