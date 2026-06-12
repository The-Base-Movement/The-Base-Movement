# Discord Webhook Integration — Audit

**Date:** 2026-05-29  
**Status:** Complete

---

## What Was Built

Real-time Discord notifications for four platform events. Every triggered event posts a rich embed to the configured Discord channel — fire-and-forget, never blocking the user flow.

---

## Files Changed

| File                                  | Change                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/services/discordService.ts`      | Created — webhook client with typed embed helpers for all 4 events                               |
| `src/services/registrationService.ts` | Fires `memberRegistered` after successful DB insert                                              |
| `src/services/adminService.ts`        | Fires `donationSubmitted` after donation insert; fires `memberVerified` after verification       |
| `src/services/contentService.ts`      | Fires `blogPostPublished` on `createBlogPost` and `updateBlogPost` when `status === 'Published'` |
| `.env`                                | Added `VITE_DISCORD_WEBHOOK_URL`                                                                 |

---

## Discord Service (`src/services/discordService.ts`)

Central webhook client. All methods are fire-and-forget — errors are swallowed so Discord downtime never surfaces to the user.

```ts
const WEBHOOK = import.meta.env.VITE_DISCORD_WEBHOOK_URL
```

If `VITE_DISCORD_WEBHOOK_URL` is not set, all methods return immediately without making any network call.

### Methods

| Method                                                        | Embed Color                 | Description                               |
| ------------------------------------------------------------- | --------------------------- | ----------------------------------------- |
| `memberRegistered(name, platform, regionOrCountry, regNo)`    | `#006b3f` (brand green)     | New member signup                         |
| `donationSubmitted(name, amount, method, country, campaign?)` | `#fcd116` (brand gold)      | Donation form submitted                   |
| `memberVerified(regNo, name, approved, chapter?)`             | `#006b3f` / `#ce1126`       | Member approved (green) or rejected (red) |
| `blogPostPublished(title, category, author, slug)`            | `#5865f2` (Discord blurple) | Blog post goes live                       |

---

## Event Wiring

### 1. New Member Registered

**File:** `src/services/registrationService.ts`  
**Trigger:** After `supabase.from('users').insert(...)` succeeds — before localStorage writes  
**Payload:** `fullName`, `platform`, `region` (Ghana) or `country` (Diaspora), `regNo`

```
🇬🇭 New Patriot Registered
Name       Kwame Asante          Network    Ghana Network
Region     Greater Accra         Reg No     TBM-GH-261234
```

---

### 2. Donation Received

**File:** `src/services/adminService.ts` → `submitDonation()`  
**Trigger:** After `supabase.from('donations').insert(...)` succeeds  
**Payload:** `fullName`, `amount`, `paymentMethod`, `country`  
**Footer:** "Awaiting verification"

```
💰 Donation Received
From       Akosua Mensah         Amount    ₵ 500
Method     MTN MoMo              Country   Ghana
                                 Awaiting verification
```

---

### 3. Member Approved / Rejected

**File:** `src/services/adminService.ts` → `verifyMember()`  
**Trigger:** After `memberService.verifyMember()` returns `true`  
**Payload:** `regNo`, member name (fetched via `getMemberProfile(id)`), `approve` boolean, `chapterName`  
**Note:** Name lookup is a best-effort `getMemberProfile` call; falls back to `regNo` if profile not found

```
✅ Member Approved                    ❌ Member Rejected
Member  Kwame Asante                  Member  TBM-GH-261234
Reg No  TBM-GH-261234                 Reg No  TBM-GH-261234
Chapter TBM Accra Central
```

---

### 4. Blog Post Published

**File:** `src/services/contentService.ts` → `updateBlogPost()` and `createBlogPost()`  
**Trigger:** When `post.status === 'Published'` — covers both publishing a draft and creating directly as Published  
**Payload:** `title`, `category`, `authorName`, `slug`  
**Footer:** `/blog/<slug>` — the public URL path

```
📢 New Post Published
**Navigating the 2028 Election Landscape**
Category   Politics              Author     Dr. Ama Owusu
                                 /blog/navigating-2028-election-landscape
```

---

## Environment Variable

```
VITE_DISCORD_WEBHOOK_URL=https://discordapp.com/api/webhooks/...
```

- Stored in `.env` (gitignored — never committed)
- Must also be added to **Vercel Environment Variables** before deploying
- Prefixed `VITE_` so Vite injects it into the client bundle at build time
- The webhook URL is write-only — it can only post to the channel, not read from it
- If compromised: regenerate at Discord channel → Edit Channel → Integrations → Webhooks

---

## Security Notes

- `VITE_` variables are embedded in the production JS bundle and therefore visible to anyone who inspects the bundle
- The risk is limited: a bad actor could spam the Discord channel, not read data or access the platform
- Mitigation: the webhook URL is easy to rotate (regenerate in Discord, update env var, redeploy)
- For higher security, route the webhook call through a Supabase Edge Function so the URL never leaves the server

---

## Known Gaps / Future Work

| Gap                        | Notes                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| Store order placed         | No order creation service method identified; wire when `store_orders` insert is centralised |
| Chapter join request       | `joinChapter()` in `chapterService` could fire a notification to chapter leaders            |
| Donation verified by admin | `donationService.verifyDonation()` could fire a "Donation Confirmed ✅" embed               |
| Edge Function proxy        | Move webhook call server-side to remove URL from client bundle                              |
