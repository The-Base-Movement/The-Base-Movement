# Implementation Plan - Authors Modernization (COMPLETED)

Refactor the `Authors.tsx` editorial board interface to align with the project-wide intrinsic design system.

## 1. Editorial Header
- [x] **Objective**: Standardize the administrative context for content leadership.
- [x] **Action**: Use the `.flow` utility for the header section (Breadcrumbs, Title, BrandLine).
- [x] **Spacing**: Use `--flow-space: 0.75rem` for a dense, professional administrative rhythm.

## 2. Author Profile Cards
- [x] **Objective**: Replace legacy responsive grids with fluid, container-aware cards.
- [x] **Location**: The main listing of editorial staff and movement authors.
- [x] **Action**: Replace `grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4` with `flex-columns`.
- [x] **Logic**: This ensures that author profiles maintain a consistent visual weight across all sidebar configurations.

## 3. Biography & Role Prose
- [x] **Objective**: Prevent text from stretching too wide in author biographies.
- [x] **Action**: Apply `.prose-standard` to all biography paragraphs.
- [x] **Vertical Spacing**: Implement `.flow` inside the author cards to manage the gap between name, role, and bio.

## 4. Verification
- [x] **Check**: Ensure the avatar images and social link groups within the cards remain centered and correctly sized within the new `.flex-columns` container.
