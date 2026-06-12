# The Base — Remaining Tasks (Master)

> Single source of truth for all outstanding work. Update this file as tasks are completed.
> Last updated: 2026-05-29

---

## ✅ Recently Completed (This Session)

- [x] **Jobs Board** — DB migration, jobService, admin CRUD page, public/dashboard listing, job detail modal, job form with banner upload, applications drawer
- [x] **Blog Comments** — `blog_comments` table with RLS, `CommentSection` wired to Supabase (load, post, reply, flag), `BlogPost.tsx` passes `post.id`
- [x] **Product Reviews** — `Reviews.tsx` wired to `reviews` table; interactive star picker + submit form; optimistic append
- [x] **Admin Moderation Page** — `/admin/moderation` with Blog Comments + Product Reviews tabs, flagged filter, clear-flag, delete, KPI tiles, sidebar nav entry
- [x] **Frontend Design System Audit (P1–P3)** — All public pages scanned and migrated; Tailwind colour classes → CSS vars; page-container utility added; breadcrumb overflow + double-title bugs fixed
- [x] **Production RLS Audit** — 7 data-exposure bugs patched; `is_admin()` SECURITY DEFINER function created; all 78 inline `EXISTS (SELECT 1 FROM admins...)` policies migrated to `is_admin()`; admins table locked to admin-only SELECT

---

## 💳 1. Hubtel Payment Integration

- [x] Remove previous browser payment dependency and public key usage
- [x] Add Hubtel server-side checkout initiation function
- [x] Add Hubtel callback function to update donation/order payment status
- [x] Wire chapter/constituency donation modal to Hubtel checkout
- [ ] Deploy Hubtel Supabase edge functions and configure live secrets
- [ ] Register Hubtel callback URL in the Hubtel dashboard
- [ ] Wire store checkout to redirect through Hubtel before order summary
- [ ] Transaction history tab on member dashboard
- [ ] Fallback manual support link for failed payments

---

## 📱 2. SMS Gateway Integration

> File: `docs/project-docs/sms_implementation_todo.md`

- [ ] Choose provider: Twilio / Arkesel / Hubtel
- [ ] Register "THEBASE" alpha-numeric Sender ID
- [ ] Add `SMS_PROVIDER_API_KEY` + `SMS_SENDER_ID` to Supabase Vault
- [ ] Build `sendSms` helper in `supabase/functions/shared/sms.ts`
- [ ] Update `broadcast-dispatcher` Edge Function to call real SMS API
- [ ] Update `notify-leads` Edge Function for chapter lead SMS alerts
- [ ] Regional routing (Ghana local vs Diaspora international prefixes)
- [ ] Opt-out mechanism on all automated blasts
- [ ] Rate limiting / queueing for high-volume dispatches
- [ ] Delivery status webhooks + admin failure alerting (>5% failure rate)

---

## ✅ 3. Production RLS Audit — COMPLETE (2026-05-29)

- [x] Review all `SELECT` policies — 4 public/over-broad exposures found and patched
- [x] Review all `INSERT`/`UPDATE`/`DELETE` policies — `users` INSERT and `admins` UPDATE WITH CHECK fixed
- [x] Verify `blog_comments` RLS — sound
- [x] Verify `reviews` RLS — sound
- [x] Verify `job_applications` RLS — overly broad ALL policy removed
- [x] Verify `store_orders` RLS — sound
- [x] Created `public.is_admin()` SECURITY DEFINER function
- [x] Migrated all 78 inline admin EXISTS checks to `is_admin()` across 57 tables
- [x] Locked `admins` table SELECT to admin-only (was world-readable, exposed roles/permissions)

---

## ✅ 4. Analytics & Tracking — COMPLETE (2026-05-29)

- [x] Chose Umami Cloud (privacy-first, GDPR, free tier)
- [x] Install tracking script (env-gated — only active in production via `import.meta.env.PROD`)
- [x] Track key events: `registration_complete`, `donation_submitted`, `store_purchase`, `job_application`
- [x] Admin dashboard at `/admin/analytics` — Umami iframe embed + tracked-events legend

---

## ✅ 5. GIS Logistics — COMPLETE (2026-05-29)

- [x] Live warehouse inventory markers on Mapbox logistics map
- [x] Real-time fulfillment transport route plotting across regions

---

## ✅ 6. Communication & Notifications — Push Notifications COMPLETE (2026-05-29)

- [x] **Push Notifications** — Web Push API + VAPID + Supabase Edge Function `send-push-notification`
  - [x] `push_subscriptions` table + RLS policy
  - [x] `public/sw.js` push + notificationclick handlers
  - [x] `usePushNotifications` hook (subscribe/unsubscribe/isSubscribed/isSupported)
  - [x] `PushPromptBanner` opt-in banner on `/dashboard`
  - [x] `NotificationsPanel` toggle in `/dashboard/settings`
  - [x] 6 trigger wires: urgent broadcast, new poll, blog publish, poll-closing, chapter member join, chapter announcement
- [ ] **Mailing List Sync** — Bridge registration data with SendGrid or Mailchimp for transactional email

---

## ✅ 7. Frontend Mobile Responsiveness — COMPLETE (2026-05-29)

All P1–P3 pages migrated to design system. Lucide icons removed, Tailwind colour classes replaced with CSS vars, NeonButton removed.

### Priority 1 — High Traffic

- [x] `src/pages/Blog.tsx` — no violations
- [x] `src/pages/BlogPost.tsx` — no violations
- [x] `src/pages/OurAgenda.tsx` — no violations
- [x] `src/pages/Contact.tsx` — no violations
- [x] `src/pages/Donate.tsx` + `src/pages/donate/components/` — NeonButton removed from StrategicPriorities.tsx

### Priority 2

- [x] `src/pages/Impact.tsx` — no violations
- [x] `src/pages/Chapters.tsx` — stone-200/50 → border-border, hover:opacity-80
- [x] `src/pages/ChapterDetails.tsx` — no violations
- [x] `src/pages/Members.tsx` — no violations
- [x] `src/pages/Press.tsx` — stone/slate color classes → CSS vars
- [x] `src/pages/Login.tsx` — no violations
- [x] `src/pages/Register.tsx` — no violations

### Priority 3 — Store

- [x] `src/pages/Store.tsx` — hover:text-red-700 Tailwind class removed
- [x] `src/pages/ProductDetails.tsx` — stone color classes → CSS vars
- [x] `src/pages/Cart.tsx` — no violations
- [x] `src/pages/Checkout.tsx` — stone color/border classes → CSS vars
- [x] `src/pages/Polls.tsx` — bg-stone-50/50 → container-low CSS var

> Reference: `docs/audits/frontend_mobile_guide.md` — full Lucide → Material Symbols mapping + per-page checklist

---

## 🤖 8. ML Intelligence (Future / Post-Launch)

- [ ] Python / FastAPI microservice connected to Supabase data
- [ ] Propensity modelling for donors
- [ ] Sentiment-based mobilization forecasting

---

## Priority Order

| #   | Task                       | Impact                                  | Effort |
| --- | -------------------------- | --------------------------------------- | ------ |
| 1   | Hubtel Integration         | 🔴 Critical — enables real transactions | Medium |
| 2   | Frontend Mobile (P1 pages) | 🔴 High — user-facing quality           | Medium |
| 3   | SMS Gateway                | 🟡 High — mobilization core             | Medium |
| 4   | ~~Production RLS Audit~~   | ✅ Done                                 | —      |
| 5   | Frontend Mobile (P2 + P3)  | 🟡 Medium                               | High   |
| 6   | Push Notifications + Email | 🟡 Medium                               | Medium |
| 7   | Analytics                  | 🟢 Low — observability                  | Low    |
| 8   | GIS remaining              | 🟢 Low — logistics ops                  | Medium |
| 9   | ML Intelligence            | 🟢 Post-launch                          | High   |
