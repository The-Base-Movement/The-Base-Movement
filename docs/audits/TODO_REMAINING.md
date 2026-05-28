# 🚀 Remaining Tasks: National Production Deployment

This list tracks the final engineering and integration requirements to transition from a stabilized build to a full national rollout.

## 1. Enterprise Technical Integrations

- [x] **Live KYC Integration**: Replace `tacticalService` simulation with a production-ready Identity Provider (Smile Identity or Onfido).
  - [x] Implement biometric face-match for registration.
  - [x] Connect automated Ghana Card / Voter ID validation.
- [x] **GIS Logistics Layer**: Replace SVG placeholders with a dynamic map (Mapbox GL) (Chapters completed).
  - [ ] Integrate live warehouse inventory markers.
  - [ ] Plot real-time fulfillment transport routes across regions.
- [ ] **ML Intelligence Microservice**: Connect Supabase data to a Python/FastAPI service for predictive analytics.
  - [ ] Implement propentisy modeling for donors.
  - [ ] Deploy sentiment-based mobilization forecasting.

## 2. Mobilization & Communication

- [ ] **SMS Gateway Integration**: Hook up Twilio or African's Talking for "Urgent" priority broadcasts.
- [ ] **Push Notification Deployment**: Deploy Supabase Edge Functions for real-time mobile push notifications.
- [ ] **Mailing List Synchronization**: Bridge registration data with a transactional mail provider (SendGrid/Mailchimp).

## 3. Automation & Optimization

- [x] **Trash Vault Auto-Purge**: Deploy a 30-day cron job to permanently delete expired items from the trash.
- [x] **Low-Bandwidth Stress Test**: Validate asset delivery and state synchronization under simulated 3G/2G conditions.
- [x] **Offline Mode Hardening**: Extend Service Worker to support draft registration saving during signal loss.

## 4. Final Deployment Readiness

- [x] **Membership Card UX**: Replace the raw verification URL on the physical card footer with an "If found, please contact..." statement.
- [ ] **Production RLS Audit**: Conduct a final security review of all Row Level Security policies.
- [ ] **Analytics & Tracking**: Implement privacy-respecting usage tracking (Plausible or Matomo) for national metrics.

## 5. Recently Completed (2026-05-28)

- [x] **Jobs Board**: Full implementation — DB migration, `jobService`, admin CRUD + form with banner upload, applications drawer, public/dashboard listing with filters and detail modal.
- [x] **Blog Comments**: `blog_comments` table with full RLS. `CommentSection` loads/saves from DB, supports replies with `parent_id`, flags update DB row. `BlogPost.tsx` passes `post.id`.
- [x] **Product Reviews**: `Reviews.tsx` wired to existing `reviews` table — interactive star picker, submit form, optimistic append, sign-in gate for guests.
- [x] **Admin Moderation Page**: `/admin/moderation` — Blog Comments tab (flagged filter, clear-flag, delete) + Product Reviews tab (delete). KPI tiles, search, sidebar nav entry.

> See `docs/project-docs/REMAINING_TASKS.md` for the full consolidated remaining task list.

---

**Status**: `STABILIZED` | **Integrations Remaining**: 4 Primary Modules
