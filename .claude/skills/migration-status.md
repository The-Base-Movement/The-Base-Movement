---
name: migration-status
description: Live tracking of the design-system migration — which pages are done, which are pending, and the exact workflow to follow each session
---

# Migration Status — The Base Movement

## Workflow (every session, no exceptions)
1. `npx tsc --noEmit` — must be clean before committing
2. `git add <files>` → `git commit -m "feat: ..."` → `git push origin main`
3. Move to next page in the Pending list below

---

## Done ✅

### Infrastructure
- `src/components/DashboardLayout.tsx` — topbar, nav, user dropdown
- `src/components/MemberProfileCard.tsx` — card, pills, material symbols
- `src/components/OpinionPollCard.tsx` — replaced lucide (CheckCircle2→check_circle, Users→group, BarChart3→bar_chart)
- `src/components/BlogPostCard.tsx` — replaced ArrowRight with Material Symbol + Tailwind hover classes
- `src/components/LiveContributionFeed.tsx` — clean
- `src/components/layouts/AdminLayout.tsx` — lucide nav icons replaced with Material Symbols string names; icon field changed from `LucideIcon` to `string`

### Dashboard Pages
- `src/pages/Dashboard.tsx` — removed duplicate topbar section
- `src/pages/ProfileSettings.tsx` — native toggle replaces shadcn Switch
- `src/pages/Polls.tsx` — full dashboard rewrite with KPIs + .sidebar-main
- `src/pages/Blog.tsx` — isDashboard branch added; public layout preserved
- `src/pages/Impact.tsx` — isDashboard branch; KPIs + .main-sidebar; custom ActivityModal
- `src/pages/Chapters.tsx` — isDashboard branch; 4 KPIs; mobile filter modal; DashboardFilterControls; native pagination; public layout preserved
- `src/pages/ChapterDetails.tsx` — fully migrated (dashboard-only route); .main + .main-sidebar; sonner toast replaces useToast
- `src/pages/Donate.tsx` — isDashboard branch; dashboard gets .main wrapper without public header/SEO/Breadcrumbs
- `src/pages/Members.tsx` — .kpis + .sidebar-main + member profile modal

### Dashboard Sub-components
- `src/pages/donate/components/HeroStats.tsx` ✅
- `src/pages/donate/components/StrategicPriorities.tsx` ✅
- `src/pages/donate/components/MobilizationProtocol.tsx` ✅
- `src/pages/donate/components/VictoriesSection.tsx` ✅
- `src/pages/donate/components/OperationalTransparency.tsx` ✅
- `src/pages/donate/components/AuditModal.tsx` ✅
- `src/pages/dashboard/components/ActivityFeed.tsx` — removed cn() calls
- `src/pages/dashboard/components/MovementJourney.tsx` — removed cn() calls

### Admin Pages
- `src/pages/admin/Blogs.tsx` — media library wired, TinyMCE full width
- `src/pages/admin/Administrators.tsx` ✅
- `src/pages/admin/MediaLibrary.tsx` — shadcn Card/Button/Input + lucide replaced; TacticalKPI kept

---

## Pending ❌ (priority order)

### Admin pages — most-used first
1. `src/pages/admin/Members.tsx` (admin member management — heavily used)
2. `src/pages/admin/Chapters.tsx`
3. `src/pages/admin/Broadcasts.tsx` (lucide + shadcn Card + neon-button)
4. `src/pages/admin/FieldDirectives.tsx` (lucide + Card + Dialog + Input + Textarea)
5. `src/pages/admin/Authors.tsx` (lucide + neon-button + Select)
6. `src/pages/admin/Regions.tsx` (lucide + neon-button + Input + Card)
7. `src/pages/admin/Roadmap.tsx` (lucide + neon-button + Input + Card)
8. `src/pages/admin/LogisticsIntelligence.tsx` (lucide + Card + neon-button)
9. `src/pages/admin/MobilizationMetrics.tsx` (lucide + Card + neon-button)
10. `src/pages/admin/SentimentIntelligence.tsx` (lucide + Card + neon-button)
11. `src/pages/admin/StrategicPriorities.tsx` (lucide + Card + neon-button)
12. `src/pages/admin/ChapterLeadHub.tsx` (lucide + Card + neon-button)
13. `src/pages/admin/LeadershipHub.tsx` (lucide + Card + neon-button)
14. `src/pages/admin/RallyCommand.tsx` (lucide + Card + neon-button)
15. `src/pages/admin/WarRoomCommand.tsx` (lucide + neon-button)
16. `src/pages/admin/Trash.tsx` (lucide + Card + neon-button)
17. `src/pages/admin/Dashboard.tsx`
18. `src/pages/admin/Settings.tsx`
19. `src/pages/admin/store/components/ProductFormDialog.tsx` (Dialog + Label + Input + Select + Button + lucide)
20. `src/pages/admin/EditAuthor.tsx` (lucide + neon-button)

### Dashboard sub-components
- `src/pages/dashboard/components/AchievementsAndLeaderboard.tsx` (Trophy, Medal, Star lucide)

### Public pages (lower priority — public layout should be preserved as-is)
- `src/pages/BlogPost.tsx`
- `src/pages/Login.tsx`
- `src/pages/Register.tsx` + register sub-components
- `src/pages/CanvasserClipboard.tsx`
- `src/pages/VerifyID.tsx`
- `src/pages/Contact.tsx`, `FeedbackHub.tsx`, `OurAgenda.tsx`
- Store pages (`Cart.tsx`, `Checkout.tsx`, `Wishlist.tsx`, `ProductDetails.tsx`, etc.)

---

## Key Patterns

### isDashboard dual-route pages
Pages on both `/page` and `/dashboard/page` routes:
```tsx
const location = useLocation()
const isDashboard = location.pathname.startsWith('/dashboard')
if (isDashboard) { return <div className="main">...</div> }
// public layout falls through unchanged
```

### TacticalKPI (admin-only component)
`import { TacticalKPI } from '@/components/admin/TacticalKPI'` — keep as-is in admin pages.

### BrandLine from admin folder
`import { BrandLine } from '@/components/admin/BrandLine'` — DELETE, not part of design system.

### useToast → sonner
Replace `import { useToast } from '@/hooks/use-toast'` + `const { toast } = useToast()` with:
`import { toast } from 'sonner'` then `toast.success(...)` / `toast.error(...)`

### AdminLayout nav icons
Icon field is now `string` (Material Symbol name), rendered as:
`<span className="material-symbols-outlined" style={{ fontSize: 16 }}>{item.icon}</span>`
