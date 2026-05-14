---
name: migration-status
description: Live tracking of the design-system migration — admin is 100% done; public pages are pending.
---

# Migration Status — The Base Movement

## Workflow (every session, no exceptions)
1. `npx tsc --noEmit` — must be clean before committing
2. `git add <files>` → `git commit -m "feat: ..."` → `git push origin main`
3. Move to next page in the Pending list below

---

## Done ✅

### Admin pages (100% — confirmed clean by grep)
- `Dashboard.tsx`, `WarRoomCommand.tsx`, `MobilizationMetrics.tsx`
- `Members.tsx`, `MemberVerification.tsx`, `Administrators.tsx`
- `Chapters.tsx`, `ChapterLeadHub.tsx`, `Regions.tsx`
- `Broadcasts.tsx`, `NewBroadcast.tsx`, `RallyCommand.tsx`
- `LogisticsIntelligence.tsx`, `SentimentIntelligence.tsx`, `StrategicPriorities.tsx`
- `Store.tsx`, `Orders.tsx`, `EditAuthor.tsx`, `Authors.tsx`
- `Settings.tsx`, `GroundGameCommand.tsx`, `Trash.tsx`, `Roadmap.tsx`
- `FieldDirectives.tsx`, `DonationVerification.tsx`

### Admin components (100%)
- `TacticalKPI.tsx`, `BrandLine.tsx` (deleted), `SystemHealthDashboard.tsx` (deleted)
- `RegistrationForm.tsx`, `PulseReport.tsx`

### Infrastructure
- `src/components/DashboardLayout.tsx`
- `src/components/layouts/AdminLayout.tsx`
- `src/components/MemberProfileCard.tsx`
- `src/components/OpinionPollCard.tsx`
- `src/components/BlogPostCard.tsx`
- `src/components/LiveContributionFeed.tsx`

### Dashboard pages (member-facing, dashboard branch)
- `Dashboard.tsx`, `ProfileSettings.tsx`, `Polls.tsx`, `Blog.tsx` (dashboard branch)
- `Impact.tsx` (dashboard branch), `Chapters.tsx` (dashboard branch)
- `ChapterDetails.tsx`, `Donate.tsx`, `Members.tsx`

---

## Pending ❌ (public pages — all confirmed by grep)

> Public pages: preserve public layout, modernize icons/buttons only (replace lucide → Material Symbols, neon-button → `.btn`).

### Priority 1 — user-entry pages
1. `src/pages/Login.tsx`
2. `src/pages/Register.tsx` + `src/pages/register/components/`
3. `src/pages/VerifyID.tsx`

### Priority 2 — content pages
4. `src/pages/BlogPost.tsx`
5. `src/pages/OurAgenda.tsx`
6. `src/pages/Impact.tsx` (public branch only — dashboard branch done)
7. `src/pages/CanvasserClipboard.tsx`
8. `src/pages/FeedbackHub.tsx`

### Priority 3 — store & transactional
9. `src/pages/Store.tsx`
10. `src/pages/Cart.tsx`
11. `src/pages/Checkout.tsx`
12. `src/pages/ProductDetails.tsx` + `src/pages/product-details/components/`
13. `src/pages/OrderSummary.tsx`
14. `src/pages/Wishlist.tsx`

### Priority 4 — static / lower traffic
15. `src/pages/Chapters.tsx` (public branch only — dashboard branch done)
16. `src/pages/Blog.tsx` (public branch only — dashboard branch done)
17. `src/pages/Contact.tsx`
18. `src/pages/NotFound.tsx`
19. `src/pages/Press.tsx`
20. `src/pages/Privacy.tsx`
21. `src/pages/Terms.tsx`
22. `src/pages/RegistrationFormPreview.tsx`

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

### Public page icon swap
Replace every `<SomeIcon className="w-N h-N ..." />` with:
`<span className="material-symbols-outlined" style={{ fontSize: N }}>icon_name</span>`

### Public page button swap
Replace `<Button variant="..." ...>` with `<button className="btn btn-primary btn-sm">` etc.
