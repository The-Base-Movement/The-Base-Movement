---
name: migration-status
description: Live tracking of the design-system migration — COMPLETE. All pages, components and shared files migrated.
---

# Migration Status — The Base Movement

## Status: COMPLETE ✅

Confirmed by grep — zero lucide-react or neon-button imports remain outside of:
- `src/components/ui/` — shadcn base library files (intentionally untouched)
- `src/components/buttons/` — dead wrapper code (unused anywhere, can be deleted later)

---

## Workflow (for any future work)
1. `npx tsc --noEmit` — must be clean before committing
2. `git add <files>` → `git commit -m "feat: ..."` → `git push origin main`

---

## All Migrated ✅

### Admin pages
- `Dashboard.tsx`, `WarRoomCommand.tsx`, `MobilizationMetrics.tsx`
- `Members.tsx`, `MemberVerification.tsx`, `Administrators.tsx`
- `Chapters.tsx`, `ChapterLeadHub.tsx`, `Regions.tsx`
- `Broadcasts.tsx`, `NewBroadcast.tsx`, `RallyCommand.tsx`
- `LogisticsIntelligence.tsx`, `SentimentIntelligence.tsx`, `StrategicPriorities.tsx`
- `Store.tsx`, `Orders.tsx`, `EditAuthor.tsx`, `Authors.tsx`
- `Settings.tsx`, `GroundGameCommand.tsx`, `Trash.tsx`, `Roadmap.tsx`
- `FieldDirectives.tsx`, `DonationVerification.tsx`
- `DeployMission.tsx`, `LeadershipHub.tsx`, `Polls.tsx`, `Blogs.tsx`

### Admin components
- `TacticalKPI.tsx`, `RegistrationForm.tsx`, `PulseReport.tsx`
- `BrandLine.tsx` (deleted — replaced with inline `.bl` div)
- `SystemHealthDashboard.tsx` (deleted — unused)

### Shared infrastructure components
- `DashboardLayout.tsx`, `AdminLayout.tsx`
- `MemberProfileCard.tsx`, `OpinionPollCard.tsx`, `BlogPostCard.tsx`
- `LiveContributionFeed.tsx`, `BackToTop.tsx`, `Breadcrumbs.tsx`
- `ProductCard.tsx`, `ShareModal.tsx`, `WelcomeModal.tsx`
- `CommentSection.tsx`, `MovementRoadmap.tsx`, `ReviewSection.tsx`

### Dashboard pages (member-facing)
- `Dashboard.tsx`, `ProfileSettings.tsx`, `Polls.tsx`, `Blog.tsx`
- `Impact.tsx`, `Chapters.tsx`, `ChapterDetails.tsx`, `Donate.tsx`, `Members.tsx`
- `dashboard/components/AchievementsAndLeaderboard.tsx`

### Public pages — content
- `OurAgenda.tsx`, `Impact.tsx`, `CanvasserClipboard.tsx`, `FeedbackHub.tsx`
- `BlogPost.tsx`, `Blog.tsx`, `Home.tsx`

### Public pages — store & transactional
- `Store.tsx`, `Cart.tsx`, `Checkout.tsx`, `Wishlist.tsx`
- `ProductDetails.tsx` + `product-details/components/` (ProductInfo, Reviews, ImageGallery)
- `OrderSummary.tsx`

### Public pages — static
- `Chapters.tsx`, `Contact.tsx`, `NotFound.tsx`, `Press.tsx`
- `Privacy.tsx`, `Terms.tsx`, `RegistrationFormPreview.tsx`
- `Login.tsx`, `Register.tsx` + `register/components/`, `VerifyID.tsx`
- `Donate.tsx`

---

## Key Patterns

### isDashboard dual-route pages
```tsx
const location = useLocation()
const isDashboard = location.pathname.startsWith('/dashboard')
if (isDashboard) { return <div className="main">...</div> }
// public layout falls through unchanged
```

### TacticalKPI (admin-only component)
`import { TacticalKPI } from '@/components/admin/TacticalKPI'` — keep as-is.

### useToast → sonner
Replace `import { useToast } from '@/hooks/use-toast'` + `const { toast } = useToast()` with:
`import { toast } from 'sonner'` then `toast.success(...)` / `toast.error(...)`

### Icon swap
```tsx
// Before
<SomeIcon className="w-5 h-5 text-stone-400" />
// After
<span className="material-symbols-outlined text-stone-400" style={{ fontSize: 20 }}>icon_name</span>
// Filled variant (e.g. star, favorite)
<span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>star</span>
```

### Brand social icons (no Material Symbol equivalent)
WhatsApp, Facebook, X/Twitter — use inline SVG inside a `ShareIcon` helper. See `ShareModal.tsx`.

### Button swap
```tsx
// Before: <Button variant="primary">Label</Button>
<button className="btn btn-primary">Label</button>
// Before: <Button asChild><Link to="/x">Label</Link></Button>
<Link to="/x" className="btn btn-primary">Label</Link>
```

### BrandLine (inlined — component deleted)
```tsx
<div className="bl"><div /><div /><div /></div>
```
