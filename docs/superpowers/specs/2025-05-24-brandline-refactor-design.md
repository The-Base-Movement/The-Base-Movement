# Design: BrandLine Component Refactoring

Replace all hardcoded `.bl` div blocks with the reusable `<BrandLine />` component across the application to ensure stylistic consistency and maintainability.

## 1. Context & Motivation

The project has introduced a centralized `<BrandLine />` component in `src/components/ui/BrandLine.tsx`. However, many files still use hardcoded `.bl` div structures. This violates the "institutional visual authority" and "modernization" guidelines established in the project's documentation (e.g., `docs/typography_modernization.md`).

## 2. Target Component

**Path**: `src/components/ui/BrandLine.tsx`
**Props**:

- `className?: string` (for custom margins or positioning)
- `width?: number | string` (default: 128)

## 3. Transformation Rule

**From**:

```tsx
<div className="bl">
  <div />
  <div />
  <div />
</div>
```

**To**:

1. Add Import: `import { BrandLine } from '@/components/ui/BrandLine'`
2. Use Component: `<BrandLine />`

### 3.1 Variation Handling

- If the `.bl` div has custom inline styles or additional classes, they will be passed to `BrandLine` via `className` or `width`.
- In most cases, the default `BrandLine` will suffice.

## 4. Affected Files

1. `src/pages/admin/Dashboard.tsx`
2. `src/pages/admin/LeadershipHub.tsx`
3. `src/pages/admin/MobilizationMetrics.tsx`
4. `src/pages/admin/PollingStations.tsx`
5. `src/pages/admin/WarRoomCommand.tsx`
6. `src/pages/admin/DeployMission.tsx`
7. `src/pages/admin/DonationVerification.tsx`
8. `src/pages/admin/FieldDirectives.tsx`
9. `src/pages/admin/GroundGameCommand.tsx`
10. `src/pages/admin/MediaLibrary.tsx`
11. `src/pages/admin/MemberVerification.tsx`
12. `src/pages/admin/NewBroadcast.tsx`
13. `src/pages/admin/Orders.tsx`
14. `src/pages/admin/PlanManager.tsx`
15. `src/pages/admin/Settings.tsx`
16. `src/pages/admin/Store.tsx`
17. `src/pages/admin/StrategicPriorities.tsx`
18. `src/pages/admin/Trash.tsx`
19. `src/pages/admin/administrators/AdminsHeader.tsx`
20. `src/pages/admin/authors/index.tsx`
21. `src/pages/admin/blogs/BlogsHeader.tsx`
22. `src/pages/admin/polls/PollsHeader.tsx`
23. `src/pages/admin/rally/RallyHeader.tsx`
24. `src/pages/admin/sentimentintelligence/SentimentHeader.tsx`
25. `src/pages/Donate.tsx`
26. `src/pages/chapterhub/ChapterHubHeader.tsx`
27. `src/pages/chapters/PublicHeader.tsx`
28. `src/pages/home/FoundationSection.tsx`
29. `src/pages/home/HeroSection.tsx`
30. `src/pages/impact/PublicImpactView.tsx`

## 5. Success Criteria

- All 30 files use `<BrandLine />` instead of hardcoded `.bl` divs.
- No breakage in JSX structure.
- Imports are correctly added.
- The visual appearance remains consistent with the brand guidelines.
