# Push Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver browser push notifications to members across six trigger events (urgent broadcasts, new poll, poll closing, new blog post, chapter member join, chapter announcement) with opt-in via a dashboard banner and settings toggle.

**Architecture:** Web Push API + VAPID keys (no third-party service). A `public/sw.js` service worker receives pushes and shows browser notifications. A `usePushNotifications` hook handles subscribe/unsubscribe and persists subscriptions to Supabase. A single `send-push-notification` Edge Function sends to any list of user IDs (or all opted-in users) using the `web-push` npm package.

**Tech Stack:** Web Push API, VAPID, Supabase Edge Functions (Deno), `npm:web-push`, React hook, TypeScript, Supabase `push_subscriptions` table.

---

## File Structure

**Create:**

- `public/sw.js` — service worker: handles `push` events and `notificationclick`
- `src/hooks/usePushNotifications.ts` — subscribe/unsubscribe lifecycle, reads subscription state from Supabase
- `src/components/PushPromptBanner.tsx` — slim opt-in bar shown once on `/dashboard`
- `src/pages/settings/NotificationsPanel.tsx` — notifications toggle for `/dashboard/settings`
- `supabase/functions/send-push-notification/index.ts` — Edge Function that sends pushes via `web-push`

**Modify:**

- `src/pages/Dashboard.tsx` — mount `<PushPromptBanner />`
- `src/pages/ProfileSettings.tsx` — add `<NotificationsPanel />` between `PerformancePrefsPanel` and save button
- `src/pages/admin/Polls.tsx` — call push after poll created
- `src/pages/admin/Blogs.tsx` — call push after blog published
- `supabase/functions/broadcast-dispatcher/index.ts` — add push call after email send; add `id` to user SELECT
- `supabase/functions/send-poll-notification/index.ts` — add push call after email loop; add `id` to user SELECT
- `src/services/chapterService.ts` — call push in `approveJoinRequest()` after chapter assigned
- `src/pages/ChapterHub.tsx` — call push in `handlePostAnnouncement()` after success
- `.env.example` — add `VITE_VAPID_PUBLIC_KEY`

---

## Task 1: Generate VAPID Keys + DB Migration

**Files:**

- Modify: `.env.example`
- Run: Supabase migration SQL

- [ ] **Step 1: Generate VAPID keys**

Run this command (requires `web-push` installed or use `npx`):

```bash
npx web-push generate-vapid-keys
```

Expected output:

```
=======================================

Public Key:
BK3q2sRNuPF1...

Private Key:
e5hLZX3kv9...

=======================================
```

- [ ] **Step 2: Set Supabase secrets**

Run in your terminal (replace with your actual keys):

```bash
npx supabase secrets set VAPID_PUBLIC_KEY="BK3q2sRNuPF1..."
npx supabase secrets set VAPID_PRIVATE_KEY="e5hLZX3kv9..."
npx supabase secrets set VAPID_SUBJECT="mailto:admin@thebasemovement.com"
```

- [ ] **Step 3: Add to `.env` file**

Add this line to your local `.env` file (not `.env.example` — that gets the placeholder):

```
VITE_VAPID_PUBLIC_KEY=BK3q2sRNuPF1...   <-- your actual public key
```

- [ ] **Step 4: Update `.env.example`**

The full content of `.env.example` already has Supabase, TinyMCE, Sentry, Mapbox, Paystack, Umami, Tawk entries. Append this block at the end:

```
# Web Push — generate VAPID keys with: npx web-push generate-vapid-keys
# Only the PUBLIC key goes here. Private key + subject go into Supabase secrets only.
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

- [ ] **Step 5: Apply DB migration**

Run this SQL in your Supabase SQL editor (or via MCP `apply_migration`):

```sql
create table if not exists push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  subscription jsonb not null,
  created_at   timestamptz default now(),
  unique(user_id)
);

alter table push_subscriptions enable row level security;

create policy "users manage own push subscription"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 6: Verify migration**

In Supabase dashboard → Table Editor, confirm `push_subscriptions` table exists with columns: `id`, `user_id`, `subscription`, `created_at`.

- [ ] **Step 7: Commit**

```bash
git add .env.example
git commit -m "chore: add VAPID env example entry, push_subscriptions migration"
```

---

## Task 2: Service Worker

**Files:**

- Create: `public/sw.js`

- [ ] **Step 1: Create `public/sw.js`**

```js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'The Base Movement', {
      body: data.body ?? '',
      icon: data.icon ?? '/logo192.png',
      badge: data.badge ?? '/logo192.png',
      data: { url: data.url ?? '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const url = event.notification.data?.url ?? '/'
      const fullUrl = self.location.origin + url
      for (const client of list) {
        if (client.url === fullUrl && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
```

- [ ] **Step 2: Verify it exists**

Check that `public/sw.js` is present. When Vite builds, it copies `public/` contents to the output — the service worker will be served at `/sw.js`.

- [ ] **Step 3: Commit**

```bash
git add public/sw.js
git commit -m "feat: add push notification service worker"
```

---

## Task 3: `usePushNotifications` Hook

**Files:**

- Create: `src/hooks/usePushNotifications.ts`

- [ ] **Step 1: Create the hook**

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i)
  return output
}

export function usePushNotifications() {
  const { user } = useAuth()

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window

  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupported || !user) {
      setLoading(false)
      return
    }
    supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setIsSubscribed(!!data)
        setLoading(false)
      })
  }, [user, isSupported])

  const subscribe = useCallback(async () => {
    if (!isSupported || !user || !VAPID_PUBLIC_KEY) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      await supabase
        .from('push_subscriptions')
        .upsert({ user_id: user.id, subscription: sub.toJSON() }, { onConflict: 'user_id' })

      setIsSubscribed(true)
    } finally {
      setLoading(false)
    }
  }, [user, isSupported])

  const unsubscribe = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = await reg?.pushManager.getSubscription()
      await sub?.unsubscribe()
      await supabase.from('push_subscriptions').delete().eq('user_id', user.id)
      setIsSubscribed(false)
    } finally {
      setLoading(false)
    }
  }, [user])

  return { isSupported, isSubscribed, loading, subscribe, unsubscribe }
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/usePushNotifications.ts
git commit -m "feat: add usePushNotifications hook"
```

---

## Task 4: `send-push-notification` Edge Function

**Files:**

- Create: `supabase/functions/send-push-notification/index.ts`

- [ ] **Step 1: Create the Edge Function**

```typescript
// THE BASE: WEB PUSH SENDER
// Sends Web Push notifications to a list of users (or all opted-in subscribers).
// Invoke with: { userIds: string[] | "all", title: string, body: string, url?: string }
// Requires Supabase secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT

// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
// @ts-expect-error: npm import in Deno
import webpush from 'npm:web-push'

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  try {
    const { userIds, title, body, url } = await req.json()

    if (!title || !body) throw new Error('title and body are required')

    // @ts-expect-error: Deno global
    const supabaseAdmin = createClient(
      // @ts-expect-error: Deno global
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-expect-error: Deno global
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    webpush.setVapidDetails(
      // @ts-expect-error: Deno global
      Deno.env.get('VAPID_SUBJECT') ?? '',
      // @ts-expect-error: Deno global
      Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
      // @ts-expect-error: Deno global
      Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
    )

    // Fetch subscriptions — either all opted-in users or a specific list
    let query = supabaseAdmin.from('push_subscriptions').select('id, user_id, subscription')
    if (userIds !== 'all') {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return new Response(JSON.stringify({ success: true, sent: 0, failed: 0 }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }
      query = query.in('user_id', userIds)
    }

    const { data: subs, error: fetchError } = await query
    if (fetchError) throw fetchError
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, failed: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      url: url ?? '/',
    })

    let sent = 0
    let failed = 0
    const expiredIds: string[] = []

    for (const row of subs) {
      try {
        await webpush.sendNotification(row.subscription, payload)
        sent++
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) {
          // Subscription expired or revoked — clean up
          expiredIds.push(row.id)
        } else {
          failed++
          console.error('[PUSH] Send failed for user', row.user_id, err)
        }
      }
    }

    // Delete expired subscriptions
    if (expiredIds.length > 0) {
      await supabaseAdmin.from('push_subscriptions').delete().in('id', expiredIds)
      console.log(`[PUSH] Cleaned up ${expiredIds.length} expired subscriptions`)
    }

    return new Response(JSON.stringify({ success: true, sent, failed }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[PUSH-ERROR] ${message}`)
    return new Response(JSON.stringify({ error: message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

- [ ] **Step 2: Deploy Edge Function**

```bash
npx supabase functions deploy send-push-notification
```

- [ ] **Step 3: Test with curl**

```bash
curl -X POST https://<your-project-ref>.supabase.co/functions/v1/send-push-notification \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{"userIds":"all","title":"Test push","body":"This is a test notification","url":"/dashboard"}'
```

Expected: `{"success":true,"sent":0,"failed":0}` (0 sent because no subscriptions exist yet — that's correct at this stage).

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/send-push-notification/index.ts
git commit -m "feat: add send-push-notification Edge Function"
```

---

## Task 5: `PushPromptBanner` Component

**Files:**

- Create: `src/components/PushPromptBanner.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useState } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function PushPromptBanner() {
  const { isSupported, isSubscribed, loading, subscribe } = usePushNotifications()
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('push_prompted') !== null)
  const [confirmed, setConfirmed] = useState(false)

  // Don't render if: browser doesn't support push, already subscribed,
  // user already responded, or still loading initial state
  if (!isSupported || isSubscribed || dismissed || loading) return null

  const handleEnable = async () => {
    await subscribe()
    localStorage.setItem('push_prompted', 'accepted')
    setConfirmed(true)
    setTimeout(() => setDismissed(true), 2500)
  }

  const handleDismiss = () => {
    localStorage.setItem('push_prompted', 'dismissed')
    setDismissed(true)
  }

  if (confirmed) {
    return (
      <div
        className="panel"
        style={{
          padding: '10px 18px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'hsl(var(--container-low))',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
        >
          check_circle
        </span>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            margin: 0,
          }}
        >
          Notifications enabled
        </p>
      </div>
    )
  }

  return (
    <div
      className="panel"
      style={{
        padding: '12px 18px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 20, color: 'hsl(var(--primary))', flexShrink: 0 }}
        >
          notifications
        </span>
        <div>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            Stay informed
          </p>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              margin: '2px 0 0',
            }}
          >
            Get notified about broadcasts, new polls, and chapter updates.
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button type="button" className="btn btn-sm btn-outline" onClick={handleDismiss}>
          Not now
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={handleEnable}
          disabled={loading}
        >
          Enable notifications
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/PushPromptBanner.tsx
git commit -m "feat: add PushPromptBanner opt-in component"
```

---

## Task 6: `NotificationsPanel` + `ProfileSettings` Wiring

**Files:**

- Create: `src/pages/settings/NotificationsPanel.tsx`
- Modify: `src/pages/ProfileSettings.tsx`

- [ ] **Step 1: Create `NotificationsPanel.tsx`**

This follows the exact same pattern as `src/pages/settings/PerformancePrefsPanel.tsx` (a `.panel` div with `.ph` header and a toggle row).

```tsx
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function NotificationsPanel() {
  const { isSupported, isSubscribed, loading, subscribe, unsubscribe } = usePushNotifications()

  const handleToggle = () => {
    if (isSubscribed) {
      unsubscribe()
    } else {
      subscribe()
    }
  }

  return (
    <div className="panel">
      <div className="ph">
        <h3>Notifications</h3>
        <span className="meta">Push alerts</span>
      </div>
      <div style={{ padding: '16px 18px' }}>
        {!isSupported ? (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Push notifications are not supported in this browser.
          </p>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <label
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 10.5,
                  color: 'hsl(var(--on-surface-muted))',
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Push notifications
              </label>
              <p
                style={{
                  margin: 0,
                  fontSize: 11.5,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  maxWidth: 380,
                  lineHeight: 1.55,
                }}
              >
                Receive browser alerts for urgent broadcasts, new polls, blog posts, and chapter
                updates.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              disabled={loading}
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                background: isSubscribed ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '0 3px',
                justifyContent: isSubscribed ? 'flex-end' : 'flex-start',
                flexShrink: 0,
                transition: 'background 0.2s',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  background: '#fff',
                  borderRadius: '50%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add import to `ProfileSettings.tsx`**

At the top of `src/pages/ProfileSettings.tsx`, after the existing imports (after line 14 `import { DangerZonePanel } ...`), add:

```typescript
import { NotificationsPanel } from './settings/NotificationsPanel'
```

- [ ] **Step 3: Add `<NotificationsPanel />` to the JSX**

In `src/pages/ProfileSettings.tsx`, the right column `<form>` currently renders:

```tsx
<PerformancePrefsPanel
  lowBandwidthMode={lowBandwidthMode}
  onToggle={() => setLowBandwidthMode(!lowBandwidthMode)}
/>

{/* Save action */}
<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
```

Change it to:

```tsx
<PerformancePrefsPanel
  lowBandwidthMode={lowBandwidthMode}
  onToggle={() => setLowBandwidthMode(!lowBandwidthMode)}
/>

<NotificationsPanel />

{/* Save action */}
<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/settings/NotificationsPanel.tsx src/pages/ProfileSettings.tsx
git commit -m "feat: add NotificationsPanel toggle in profile settings"
```

---

## Task 7: Mount Banner in Dashboard

**Files:**

- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Add import**

At the top of `src/pages/Dashboard.tsx`, after the existing imports, add:

```typescript
import { PushPromptBanner } from '@/components/PushPromptBanner'
```

- [ ] **Step 2: Mount the banner**

In `src/pages/Dashboard.tsx`, the `return` currently starts with:

```tsx
return (
  <div className="main">
```

(The exact opening element — check by reading the file.) Add `<PushPromptBanner />` as the first child inside the top-level wrapper:

```tsx
return (
  <div className="main">
    <PushPromptBanner />
    {/* ...rest of existing dashboard content... */}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manual verify**

Start the dev server (`npm run dev`), log in, navigate to `/dashboard`. You should see the banner with "Enable notifications" and "Not now" buttons (assuming you haven't been prompted before — clear `localStorage.push_prompted` if needed).

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: mount PushPromptBanner on dashboard home"
```

---

## Task 8: Wire Poll Trigger

**Files:**

- Modify: `src/pages/admin/Polls.tsx`

- [ ] **Step 1: Add push call in `handleCreatePoll`**

In `src/pages/admin/Polls.tsx`, find `handleCreatePoll`. It currently reads:

```typescript
if (success) {
  toast.success('Poll created successfully!')
  setShowCreateModal(false)
  setNewPoll(DEFAULT_POLL)
  fetchData()
} else {
  toast.error('Failed to create poll.')
}
```

Change to:

```typescript
if (success) {
  toast.success('Poll created successfully!')
  setShowCreateModal(false)
  setNewPoll(DEFAULT_POLL)
  fetchData()
  // Push notification — fire-and-forget, don't block UI
  supabase.functions
    .invoke('send-push-notification', {
      body: {
        userIds: 'all',
        title: 'New poll — your voice matters',
        body: newPoll.title.slice(0, 100),
        url: '/dashboard/polls',
      },
    })
    .catch(console.error)
} else {
  toast.error('Failed to create poll.')
}
```

`supabase` is already imported at the top of the file via `@/lib/supabase` or similar. Verify the import exists — if not, add:

```typescript
import { supabase } from '@/lib/supabase'
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Polls.tsx
git commit -m "feat: fire push notification when new poll is created"
```

---

## Task 9: Wire Blog Publish Trigger

**Files:**

- Modify: `src/pages/admin/Blogs.tsx`

- [ ] **Step 1: Add import for supabase**

Check if `supabase` is imported in `src/pages/admin/Blogs.tsx`. It currently imports `adminService` and `contentService` but not `supabase` directly. Add at the top:

```typescript
import { supabase } from '@/lib/supabase'
```

- [ ] **Step 2: Add push call in `handlePublishPost`**

Find `handlePublishPost` in `src/pages/admin/Blogs.tsx`. It currently reads:

```typescript
const success = await adminService.updateBlogPost(post.id, {
  status: 'Published',
  publishedAt: new Date().toISOString(),
})
if (success) {
  toast.success('Post published.')
} else {
  // ...revert
  toast.error('Failed to publish post.')
}
```

Change the success branch to:

```typescript
if (success) {
  toast.success('Post published.')
  // Push notification — fire-and-forget
  supabase.functions
    .invoke('send-push-notification', {
      body: {
        userIds: 'all',
        title: 'New movement intelligence',
        body: post.title.slice(0, 100),
        url: `/dashboard/blog/${post.id}`,
      },
    })
    .catch(console.error)
} else {
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/Blogs.tsx
git commit -m "feat: fire push notification when blog post is published"
```

---

## Task 10: Wire Broadcast Dispatcher Push

**Files:**

- Modify: `supabase/functions/broadcast-dispatcher/index.ts`

- [ ] **Step 1: Add `id` to the user SELECT**

In `supabase/functions/broadcast-dispatcher/index.ts`, find this line:

```typescript
let userQuery = supabaseAdmin.from('users').select('full_name, phone_number, email')
```

Change to:

```typescript
let userQuery = supabaseAdmin.from('users').select('id, full_name, phone_number, email')
```

- [ ] **Step 2: Update the `Patriot` interface**

Find:

```typescript
interface Patriot {
  full_name: string
  phone_number: string | null
  email: string | null
}
```

Change to:

```typescript
interface Patriot {
  id: string
  full_name: string
  phone_number: string | null
  email: string | null
}
```

- [ ] **Step 3: Add push call after the email section**

After the `if (resendKey && emailRecipients.length > 0)` block (and its else branch), before the `phoneRecipients` section, add:

```typescript
// Push notifications — send to all recipients who have opted in
const pushUserIds = (recipients as Patriot[]).map((u) => u.id).filter(Boolean)
if (pushUserIds.length > 0) {
  await fetch(
    // @ts-expect-error: Deno global
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // @ts-expect-error: Deno global
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        userIds: pushUserIds,
        title: subject ?? 'Movement update',
        body: body ? body.slice(0, 120) : 'An important update from The Base Movement.',
        url: '/dashboard',
      }),
    }
  ).catch((e: unknown) => console.error('[PUSH] Broadcast push failed:', e))
}
```

- [ ] **Step 4: Deploy**

```bash
npx supabase functions deploy broadcast-dispatcher
```

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/broadcast-dispatcher/index.ts
git commit -m "feat: add push notification to urgent broadcast dispatcher"
```

---

## Task 11: Wire Poll-Closing Push

**Files:**

- Modify: `supabase/functions/send-poll-notification/index.ts`

- [ ] **Step 1: Add `id` to member SELECT**

Find:

```typescript
let memberQuery = supabaseAdmin.from('users').select('full_name, email').eq('status', 'Active')
```

Change to:

```typescript
let memberQuery = supabaseAdmin.from('users').select('id, full_name, email').eq('status', 'Active')
```

- [ ] **Step 2: Update the `Member` interface**

Find:

```typescript
interface Member {
  full_name: string
  email: string | null
}
```

Change to:

```typescript
interface Member {
  id: string
  full_name: string
  email: string | null
}
```

- [ ] **Step 3: Add push call after the email for-loop**

After the email for-loop (`for (let i = 0; i < recipients.length; i += BATCH) { ... }`), before the `if (!resendKey)` warning block, add:

```typescript
// Push notifications — fire to all recipients who have opted in
const pushUserIds = recipients.map((m) => (m as Member).id).filter(Boolean)
if (pushUserIds.length > 0) {
  await fetch(
    // @ts-expect-error: Deno global
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // @ts-expect-error: Deno global
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        userIds: pushUserIds,
        title: `Poll closing in ${hoursRemaining} hours`,
        body: `"${row.title}" — your vote still counts.`,
        url: '/dashboard/polls',
      }),
    }
  ).catch((e: unknown) => console.error('[PUSH] Poll-close push failed:', e))
}
```

- [ ] **Step 4: Deploy**

```bash
npx supabase functions deploy send-poll-notification
```

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/send-poll-notification/index.ts
git commit -m "feat: add push notification to poll-closing notifier"
```

---

## Task 12: Wire Chapter Member Join Push

**Files:**

- Modify: `src/services/chapterService.ts`

Context: When a chapter leader approves a join request, `approveJoinRequest(requestId, memberId, chapterName)` runs. After it updates `users.chapter`, we need to find the chapter's `leader_id` and push-notify them.

- [ ] **Step 1: Add push call in `approveJoinRequest`**

In `src/services/chapterService.ts`, find `approveJoinRequest`. It currently ends with:

```typescript
await this.incrementChapterMemberCount(chapterName)
return true
```

Change to:

```typescript
await this.incrementChapterMemberCount(chapterName)

// Notify the chapter leader
const { data: chapterRow } = await supabase
  .from('chapters')
  .select('leader_id')
  .eq('name', chapterName)
  .maybeSingle()

if (chapterRow?.leader_id) {
  supabase.functions
    .invoke('send-push-notification', {
      body: {
        userIds: [chapterRow.leader_id as string],
        title: 'New chapter member',
        body: 'A new patriot has joined your chapter.',
        url: '/dashboard/chapter-hub',
      },
    })
    .catch(console.error)
}

return true
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/chapterService.ts
git commit -m "feat: push-notify chapter leader when member join is approved"
```

---

## Task 13: Wire Chapter Announcement Push

**Files:**

- Modify: `src/pages/ChapterHub.tsx`

Context: `handlePostAnnouncement` (at line ~305) inserts into `chapter_announcements`. After success we want to notify all members whose `users.chapter = chapter.name`.

- [ ] **Step 1: Add push call in `handlePostAnnouncement`**

Find `handlePostAnnouncement`. It currently ends with:

```typescript
setAnnounceDraft('')
toast.success('Update posted to members.')
```

Change to:

```typescript
setAnnounceDraft('')
toast.success('Update posted to members.')

// Push-notify chapter members — fire-and-forget
const draftText = announceDraft.trim()
supabase
  .from('users')
  .select('id')
  .eq('chapter', chapter.name)
  .then(({ data: chapterMembers }) => {
    const memberIds = (chapterMembers ?? []).map((m: { id: string }) => m.id)
    if (memberIds.length === 0) return
    supabase.functions
      .invoke('send-push-notification', {
        body: {
          userIds: memberIds,
          title: `Chapter update — ${chapter.name}`,
          body: draftText.slice(0, 120),
          url: '/dashboard/chapter-hub',
        },
      })
      .catch(console.error)
  })
  .catch(console.error)
```

Note: `chapter` and `announceDraft` are already in scope at this point in the function.

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ChapterHub.tsx
git commit -m "feat: push-notify chapter members on new announcement"
```

---

## Task 14: Final TypeScript Check + Push to Remote

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Verify service worker is served**

```bash
npm run build
```

Check that `dist/sw.js` exists in the build output.

- [ ] **Step 3: Deploy remaining Edge Functions**

```bash
npx supabase functions deploy send-push-notification
npx supabase functions deploy broadcast-dispatcher
npx supabase functions deploy send-poll-notification
```

- [ ] **Step 4: Update `REMAINING_TASKS.md`**

In `docs/project-docs/REMAINING_TASKS.md`, under "Communication & Notifications", change:

```markdown
- [ ] **Push Notifications** — Supabase Edge Function for real-time mobile push (Web Push API)
```

to:

```markdown
- [x] **Push Notifications** — Web Push API + VAPID, service worker, 6 trigger events, opt-in banner + settings toggle — COMPLETE (2026-05-29)
```

- [ ] **Step 5: Final commit + push**

```bash
git add docs/project-docs/REMAINING_TASKS.md
git commit -m "docs: mark push notifications complete in remaining tasks"
git push origin main
```

---

## Post-Implementation: Manual End-to-End Test

1. Start dev server: `npm run dev`
2. Log in as a test member
3. Navigate to `/dashboard` — the opt-in banner should appear
4. Click "Enable notifications" — browser permission prompt should appear
5. Allow notifications — banner should show "Notifications enabled ✓" then disappear
6. Navigate to `/dashboard/settings` — Notifications panel should show toggle in ON state
7. In admin panel, create a new poll — within seconds, a browser notification should appear on the subscribed browser
8. Click the notification — should navigate to `/dashboard/polls`
9. Toggle off in Settings — toggle should flip, and the Supabase row should be deleted (verify in Supabase dashboard → `push_subscriptions` table)
