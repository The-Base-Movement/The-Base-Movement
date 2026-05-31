# 🚀 Remaining Tasks: National Production Deployment

This list tracks the final engineering and integration requirements to transition from a stabilized build to a full national rollout.

## 1. Enterprise Technical Integrations

- [x] **Live KYC Integration**: Replace `tacticalService` simulation with a production-ready Identity Provider (Smile Identity or Onfido).
  - [x] Implement biometric face-match for registration.
  - [x] Connect automated Ghana Card / Voter ID validation.
- [x] **GIS Logistics Layer**: Replace SVG placeholders with a dynamic map (Mapbox GL) (Chapters completed).
  - [ ] Integrate live warehouse inventory markers.
  - [ ] Plot real-time fulfillment transport routes across regions.
- [ ] **ML Intelligence Microservice**: Connect Supabase data to a Python/FastAPI service for predictive analytics. ⬅️ **NEXT UP**
  - [ ] Implement propensity modeling for donors.
  - [ ] Deploy sentiment-based mobilization forecasting.

## 2. Mobilization & Communication

- [ ] **SMS Gateway Integration**: Hook up Twilio or Africa's Talking for "Urgent" priority broadcasts.
  - `broadcast-dispatcher` edge function has email (Resend) and push working; SMS has a `// TODO` stub awaiting provider credentials.
- [x] **Push Notification Deployment**: Supabase Edge Function `send-push-notification` deployed. `push_subscriptions` table live with RLS. Frontend wired via `usePushNotifications` hook, `PushPromptBanner`, and `NotificationsPanel`. Active in ChapterHub announcements and the broadcast dispatcher.
  - VAPID keys (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) are being configured in Supabase secrets — activation imminent.
- [x] **Transactional Email**: Resend integrated across four edge functions — welcome emails (`notify-leads`), donation receipts (`send-donation-receipt`), urgent broadcast dispatch (`broadcast-dispatcher`), poll notifications (`send-poll-notification`).
  - [ ] **Newsletter / Mailing List Sync**: Syncing registration data to a newsletter platform (Mailchimp / ConvertKit) for campaign list management is not yet implemented.

## 3. Automation & Optimization

- [x] **Trash Vault Auto-Purge**: `pg_cron` job deployed — permanently deletes items from trash after **90 days** (retention extended from original 30-day spec).
- [x] **Low-Bandwidth Stress Test**: Validated asset delivery and state synchronization under simulated 3G/2G conditions.
- [x] **Offline Mode Hardening**: Service Worker extended to support draft registration saving during signal loss.
- [x] **Image Compression System**: Automatic WebP conversion on all user uploads (`uploadAvatar`, `uploadImage`). Build-time static asset compression via `vite-plugin-image-optimizer`. See `docs/audits/image-compression-audit-2026-05-29.md`.

## 4. Final Deployment Readiness

- [x] **Membership Card UX**: Replaced raw verification URL on physical card footer with "If found, please contact..." statement.
- [ ] **Production RLS Audit**: Full security review of all Row Level Security policies not yet conducted. Partial fix: duplicate `member_feedback` INSERT policy removed (health scan 2026-05-29).
- [x] **Analytics & Tracking**: Umami integrated — `src/components/Analytics.tsx` loads the script in production via `VITE_UMAMI_WEBSITE_ID`, `src/lib/analytics.ts` exposes a `trackEvent()` wrapper used across key flows.

## 5. Recently Completed (2026-05-29)

- [x] **Discord Webhook Integration**: Real-time notifications for four platform events — new member registered, donation received, member approved/rejected, blog post published. Fire-and-forget, never blocks user flow. See `docs/audits/discord-webhook-audit-2026-05-29.md`.
- [x] **Health Scan + Code Quality**: 7 issues resolved — `window.location` → `useLocation` migration in Cart/Wishlist/Checkout, SEO meta tags added to Impact and ChapterDetails, three live TODO stubs wired to DB (FeedbackVaultModal, EngagementBanner, AttendanceTable search), duplicate RLS policy dropped, `as any` typed properly. See `docs/audits/health-scan-audit-2026-05-29.md`.
- [x] **Admin Security Hardening**: Admin provisioning and revocation routed through `SECURITY DEFINER` RPCs. Roles Manager restricted to Super Admin+. `ADMIN` role tier added.
- [x] **Jobs Board — My Applications**: Members can view their own job applications with status badges and rate-limit-aware apply flow (3 applications/month enforced via DB function). Job detail modal accessible from applications list.
- [x] **Blog Post Likes**: `blog_post_likes` junction table with RLS. Like/unlike from any blog post in the dashboard. `/dashboard/liked` page with card grid and empty state. "Liked Posts" sidebar nav entry.
- [x] **ChapterHub Mobile + Design Polish**: Members tab replaced table with card list + slide-up profile sheet on mobile. All sub-components migrated to design system tokens. Tab bar scrollbar hidden; tab button spacing improved.

## 6. Previously Completed (2026-05-28)

- [x] **Jobs Board**: Full implementation — DB migration, `jobService`, admin CRUD + form with banner upload, applications drawer, public/dashboard listing with filters and detail modal.
- [x] **Blog Comments**: `blog_comments` table with full RLS. `CommentSection` loads/saves from DB, supports replies with `parent_id`, flags update DB row.
- [x] **Product Reviews**: `Reviews.tsx` wired to existing `reviews` table — interactive star picker, submit form, optimistic append, sign-in gate for guests.
- [x] **Admin Moderation Page**: `/admin/moderation` — Blog Comments tab (flagged filter, clear-flag, delete) + Product Reviews tab (delete). KPI tiles, search, sidebar nav entry.
- [x] **User Activity Log**: All key member actions tracked in `user_activity_log` table.

---

**Status**: `STABILIZED` | **Integrations Remaining**: 3 Primary Modules (SMS, Newsletter Sync, ML Microservice)
**Blocked / Pending external action**: Resend DNS verification, Production RLS Audit
**Next active development**: ML Intelligence Microservice (Python/FastAPI)
