# Database Schema Oracle Report
**Date:** 2026-05-15  
**Project:** The Base Movement (`vhlyekyxutwbxlvktnzd`)  
**Triggered by:** Session start — full schema audit

---

## Summary

- **58 tables** documented (public schema)
- **3 edge functions** active
- **60 migrations** applied (earliest: 2026-05-04, latest: 2026-05-14)
- RLS enabled on all tables

---

## Edge Functions

| Slug | JWT Required | Status |
|------|-------------|--------|
| `ocr-verify` | No | ACTIVE |
| `notify-leads` | Yes | ACTIVE |
| `broadcast-dispatcher` | Yes | ACTIVE |

---

## Tables by Domain

### Identity & Auth

#### `users` (8 rows)
Primary member/patriot records. `id = auth.uid()`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, `auth.uid()` |
| `full_name` | varchar | NOT NULL |
| `email` | varchar | nullable (made nullable in migration `make_users_email_nullable`) |
| `registration_number` | varchar | NOT NULL, UNIQUE |
| `platform` | varchar | `'GHANA'` or `'DIASPORA'` |
| `country` | varchar | NOT NULL |
| `phone_number` | varchar | nullable |
| `gender` | varchar | nullable |
| `region` | varchar | nullable |
| `constituency` | varchar | nullable |
| `chapter` | varchar | nullable |
| `profession` | varchar | nullable |
| `joined_at` | timestamptz | default `now()` |
| `status` | varchar | default `'Active'` |
| `avatar_url` | text | nullable |
| `age_range` | varchar | nullable |
| `education_level` | varchar | nullable |
| `emergency_name` | varchar | nullable |
| `emergency_relationship` | varchar | nullable |
| `emergency_phone` | varchar | nullable |
| `verification_status` | varchar | default `'In Review'` |
| `points` | bigint | default `0` |
| `verification_notes` | text | nullable |
| `national_id` | text | nullable |
| `children_count` | integer | default `0` |
| `residential_address` | text | nullable |
| `city` | text | nullable |

**RLS:**
- Public INSERT (open registration)
- SELECT own: `id = auth.uid()`
- SELECT all: admins only
- SELECT constituency: chapter leaders can view their constituency
- UPDATE own: `id = auth.uid()`
- UPDATE all: admins only

#### `admins`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, FK → `users.id` CASCADE |
| `role` | varchar | default `'Editor'` |
| `permissions` | jsonb | default `{}` |
| `assigned_region` | varchar | nullable |
| `created_at` | timestamptz | default `now()` |

**RLS:** Public SELECT. Admins UPDATE own record.

---

### Content

#### `blog_posts`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `title` | varchar | NOT NULL |
| `slug` | varchar | NOT NULL |
| `excerpt` | text | nullable |
| `content` | text | nullable |
| `author_id` | uuid | FK → `authors.id` SET NULL |
| `category` | varchar | nullable |
| `published_at` | timestamptz | default `now()` |
| `tags` | ARRAY | nullable |
| `is_featured` | boolean | default `false` |
| `read_time` | varchar | nullable |
| `seo_title` | varchar | nullable |
| `meta_description` | text | nullable |
| `deleted_at` | timestamptz | soft delete |
| `status` | varchar | default `'Draft'` |

> **Note:** Public SELECT has no `deleted_at IS NULL` or `status = 'Published'` filter — drafts are currently publicly readable.

#### `authors`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `name` | text | NOT NULL |
| `slug` | text | NOT NULL |
| `role` | text | nullable |
| `bio` | text | nullable |
| `image_url` | text | nullable |
| `created_at` | timestamptz | default `now()` |
| `deleted_at` | timestamptz | soft delete; SELECT filtered by `IS NULL` |

#### `press_releases`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `title` | text | NOT NULL |
| `slug` | text | NOT NULL |
| `category` | text | NOT NULL |
| `excerpt` | text | nullable |
| `content` | text | NOT NULL |
| `published_at` | timestamptz | default `now()` |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | default `now()` |
| `deleted_at` | timestamptz | soft delete; SELECT filtered by `IS NULL` |
| `author_id` | uuid | FK → `authors.id` |
| `image_url` | text | nullable |
| `is_official` | boolean | default `true` |

#### `comments`
FK → `blog_posts.id` CASCADE. Public SELECT, authenticated INSERT.

#### `media_library`
Soft delete. Admins only. Tracks uploaded files with `folder`, `filename`, `url`, `mime_type`.

#### `media_kit`
Public assets. SELECT filtered by `is_active = true`.

---

### Chapters

#### `chapters`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `name` | varchar | NOT NULL |
| `city_or_region` | varchar | nullable |
| `country` | varchar | default `'Ghana'` |
| `leader_name` | varchar | nullable |
| `member_count` | integer | default `0` |
| `description` | text | nullable |
| `details_url` | text | nullable |
| `status` | varchar | default `'Active'` |
| `leader_id` | uuid | FK → `users.id` SET NULL |
| `region` | varchar | nullable |
| `constituency` | varchar | nullable |
| `meeting_schedule` | text | nullable |
| `local_focus` | text | nullable |
| `email` | text | nullable |
| `phone_number` | text | nullable |

**RLS:** Public SELECT. Chapter leaders UPDATE own (`leader_id = auth.uid()`).

Related: `chapter_activities`, `chapter_leaders`, `chapter_applications`, `chapter_performance`

---

### Engagement & Communication

#### `polls` + `poll_options` + `poll_votes`
- Polls: public SELECT, regional targeting via `region` column
- Options: FK → polls CASCADE
- Votes: users INSERT/SELECT own; one vote per user enforced at app layer

#### `notifications`
Per-user, FK → `broadcasts.id`. Users SELECT/UPDATE own.

#### `broadcasts`
Sent by admins. `target_type` + `target_value` drive fanout via `broadcast-dispatcher` edge function. Public SELECT.

#### `member_feedback`
Sentiment-scored feedback. Users INSERT own; admins SELECT all.

---

### Store & Logistics

#### `store_inventory`
Soft delete. `low_stock_threshold` + `alert_sent` for stock alerts. Public SELECT; admin write.

#### `store_orders` / `store_order_items`
Full order lifecycle with timestamp columns: `processing_at`, `dispatched_at`, `delivered_at`, `cancelled_at`. Users SELECT own; authenticated INSERT; admin manage.

> `store_order_items.product_id` ON DELETE RESTRICT — a product with orders cannot be deleted.

#### `store_inventory_regional`
Per-region stock and restriction flags.

#### `reviews` / `wishlist`
Product reviews: public SELECT, authenticated INSERT.  
Wishlist: authenticated users manage own.

#### `resource_requests` / `resource_request_items` / `logistics_audit` / `logistics_velocity`
Campaign resource allocation chain. Regional leaders request; admins fulfil; audit trail in `logistics_audit`.

---

### Donations

#### `donation_campaigns`
Public SELECT where `status = 'Active'`.

#### `donations`
Links to `users`, `donation_campaigns`, and verifying `admins`. `cleared` boolean for financial reconciliation. Public SELECT (no row filter — all donations visible).

---

### Gamification

#### `achievements` / `badges`
Public SELECT. Admin manage.

#### `member_achievements` / `user_badges`
Junction tables linking users to earned achievements/badges.

#### `member_points`
Separate points store (alongside `users.points` bigint — dual-tracking exists).

#### `leaderboard_rewards`
Rank-to-reward mapping, FK → `achievements`.

---

### Field Operations

#### `field_directives`
`target_type`: `'Global'` | `'Regional'` | `'Chapter'` | `'Individual'`. RLS routes visibility per type.

#### `field_reports`
Members submit against directives. Points applied via `points_applied` flag.

#### `field_actions` / `field_action_attendance`
Geo-fenced events with check-in lat/lng. Attendance verified and points awarded.

#### `field_events`
Budget tracking (`budget_allocated` / `budget_spent`). Regional admin scoped.

#### `canvassing_campaigns` / `canvasser_logs`
Door-to-door campaigns with interaction results and follow-up flags.

#### `gotv_transport_requests` / `voter_registrations`
GOTV infrastructure — transport to polling stations and voter verification.

---

### Intelligence / War Room

#### `crisis_incidents`
Severity levels. Linked to `media_counter_narratives` for approved response messaging.

#### `national_sentiment_intelligence`
Region-level sentiment aggregates (positive/negative/neutral counts).

#### `predictive_impact_projections`
Region-level projections with confidence scores and election impact estimates.

#### `rapid_response_directives`
Public SELECT where `status = 'ACTIVE'`. Time-limited directives with `expires_at`.

#### `mobilization_ledger`
Financial ledger per chapter. Regional admins see own chapter; SuperAdmins see all.

---

### Reference Data

| Table | Contents | RLS |
|-------|----------|-----|
| `ghana_regions` | 16 regions | Public SELECT |
| `ghana_constituencies` | FK → regions | Public SELECT |
| `countries` | Diaspora countries with dialing codes | Public SELECT |

---

### Site Settings & Public Forms

| Table | Purpose | RLS |
|-------|---------|-----|
| `site_settings` | Key/value config (jsonb value) | Public SELECT, Admin write |
| `newsletter_subscribers` | Email subscribers | Public INSERT |
| `contact_submissions` | Contact form entries | Public INSERT, Admin SELECT |

---

## Foreign Key Map (abridged)

```
users ←── admins (CASCADE)
users ←── chapters.leader_id (SET NULL)
users ←── chapter_applications.applicant_id (CASCADE)
users ←── member_achievements, user_badges, member_points, member_sessions, member_notes (CASCADE)
users ←── donations.member_id
users ←── field_reports.member_id (CASCADE)

authors ←── blog_posts.author_id (SET NULL)
authors ←── press_releases.author_id

polls ←── poll_options (CASCADE) ←── poll_votes (CASCADE)
broadcasts ←── notifications.broadcast_id

store_inventory ←── store_order_items.product_id (RESTRICT)
store_inventory ←── store_inventory_regional, reviews, wishlist, resource_request_items (CASCADE)
store_orders ←── store_order_items (CASCADE)

chapters ←── chapter_activities, chapter_leaders (CASCADE)
field_actions ←── field_action_attendance (CASCADE)
field_directives ←── field_reports (CASCADE)
canvassing_campaigns ←── canvasser_logs (CASCADE)
crisis_incidents ←── media_counter_narratives (CASCADE)
resource_requests ←── resource_request_items (CASCADE), logistics_audit (SET NULL)
achievements ←── member_achievements, leaderboard_rewards
```

---

## Key Observations & Potential Issues

| # | Observation | Severity |
|---|-------------|----------|
| 1 | `blog_posts` public SELECT has no `status = 'Published'` filter — drafts are readable | Medium |
| 2 | `users.points` (bigint) and `member_points` table both track points — dual-tracking may drift | Low |
| 3 | `donations` public SELECT has no row filter — all donation records are publicly readable | Medium |
| 4 | `member_notes` SELECT policy has no row filter — all notes visible to any authenticated user | Medium |
| 5 | `notifications` has a redundant ALL policy alongside the `user_id = auth.uid()` policy | Low |
| 6 | `audit_logs` has two FK constraints pointing to `admins.id` (SET NULL and NO ACTION) | Low |
| 7 | `wishlist.user_id` column has a FK to `store_inventory.id` (looks like a copy-paste error — should FK to `users.id`) | High |

---

## Admin Check Pattern (for RLS reference)

All admin-gated policies use:
```sql
EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
```
`admins.role` values include at minimum `'Editor'` (default) and `'SuperAdmin'`.
