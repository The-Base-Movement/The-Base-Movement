# Push Notifications — Design Spec

> **Status:** Approved  
> **Date:** 2026-05-29  
> **Stack:** Web Push API + VAPID + Supabase Edge Function

---

## Goal

Deliver browser push notifications to logged-in members of The Base Movement platform across six trigger events, with user-controlled opt-in via a dashboard banner and a settings toggle.

---

## Architecture

Four layers work together end-to-end:

1. **Service Worker** (`public/sw.js`) — Registered once when a member logs in. Listens for `push` events and calls `self.registration.showNotification()`. Handles `notificationclick` to focus/open the relevant deep-link URL.

2. **Client hook** (`src/hooks/usePushNotifications.ts`) — Encapsulates the full browser-side lifecycle:
   - Check `Notification.permission`
   - Register the service worker
   - Subscribe via `PushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VITE_VAPID_PUBLIC_KEY })`
   - Upsert subscription JSON into the `push_subscriptions` Supabase table
   - Expose `{ isSubscribed, isSupported, subscribe, unsubscribe, loading }`

3. **Database** — `push_subscriptions` table (one row per user, upserted on re-subscribe).

4. **Edge Function** (`supabase/functions/send-push-notification/index.ts`) — Takes a target audience and message, fetches subscriptions, sends via `web-push`, cleans up expired endpoints.

---

## Database

### `push_subscriptions` table

```sql
create table push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  subscription jsonb not null,
  created_at  timestamptz default now(),
  unique(user_id)
);

alter table push_subscriptions enable row level security;

create policy "users manage own subscription"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### DB trigger for chapter member join

```sql
create or replace function notify_chapter_lead_on_join()
returns trigger language plpgsql security definer as $$
declare
  lead_id uuid;
begin
  select lead_user_id into lead_id
  from chapters where id = NEW.chapter_id;

  if lead_id is not null then
    perform net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'userIds', jsonb_build_array(lead_id::text),
        'title', 'New chapter member',
        'body', 'A new patriot has joined your chapter.',
        'url', '/dashboard/chapter-hub'
      )
    );
  end if;
  return NEW;
end;
$$;

create trigger on_chapter_member_join
  after insert on chapter_memberships
  for each row execute procedure notify_chapter_lead_on_join();
```

> Requires `pg_net` extension (already available in Supabase projects).

---

## Supabase Secrets

| Secret              | Value                                            |
| ------------------- | ------------------------------------------------ |
| `VAPID_PUBLIC_KEY`  | Generated via `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Generated via `npx web-push generate-vapid-keys` |
| `VAPID_SUBJECT`     | `mailto:admin@thebasemovement.com`               |

The public key is also added to `.env` as `VITE_VAPID_PUBLIC_KEY` (safe to expose — it's designed to be public).

---

## Edge Function: `send-push-notification`

**File:** `supabase/functions/send-push-notification/index.ts`

**Input:**

```json
{
  "userIds": ["uuid1", "uuid2"],
  "title": "Notification title",
  "body": "Notification body text",
  "url": "/dashboard/polls"
}
```

**Behaviour:**

1. Fetch `push_subscriptions` rows where `user_id = any(userIds)`
2. For each subscription, call `webpush.sendNotification(subscription, payload)` with VAPID credentials from `Deno.env`
3. If response is 410 Gone (subscription expired/revoked), delete that row from `push_subscriptions`
4. Return `{ success: true, sent: N, failed: N }`

**Notification payload sent to browser:**

```json
{
  "title": "...",
  "body": "...",
  "icon": "/logo192.png",
  "badge": "/logo192.png",
  "url": "/dashboard/..."
}
```

---

## Service Worker

**File:** `public/sw.js`

```js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'The Base', {
      body: data.body,
      icon: data.icon ?? '/logo192.png',
      badge: data.badge ?? '/logo192.png',
      data: { url: data.url ?? '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((list) => {
      const url = event.notification.data?.url ?? '/'
      for (const client of list) {
        if (client.url.includes(url) && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
```

---

## Client Hook: `usePushNotifications`

**File:** `src/hooks/usePushNotifications.ts`

**Returns:**

```ts
{
  isSupported: boolean // 'serviceWorker' in navigator && 'PushManager' in window
  isSubscribed: boolean // row exists in push_subscriptions for current user
  loading: boolean
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
}
```

**Subscribe flow:**

1. `await navigator.serviceWorker.register('/sw.js')`
2. `await Notification.requestPermission()` — abort if denied
3. `reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VITE_VAPID_PUBLIC_KEY) })`
4. `supabase.from('push_subscriptions').upsert({ user_id, subscription: sub.toJSON() })`

**Unsubscribe flow:**

1. Get active subscription via `reg.pushManager.getSubscription()`
2. `sub.unsubscribe()`
3. `supabase.from('push_subscriptions').delete().eq('user_id', user.id)`

---

## Opt-in UI

### Dashboard banner (`src/components/PushPromptBanner.tsx`)

- Rendered at the top of the `/dashboard` page content area (inside `DashboardLayout`, below the topbar)
- Only shown when:
  - `isSupported === true`
  - `isSubscribed === false`
  - `localStorage.getItem('push_prompted') === null`
- Slim panel bar, inline styles, design system classes (`.panel`, CSS variables)
- Two buttons: **"Enable notifications"** (calls `subscribe()`, sets `localStorage.push_prompted = 'accepted'`) and **"Not now"** (sets `localStorage.push_prompted = 'dismissed'`, hides banner)
- After subscribe: shows a brief "Notifications enabled ✓" confirmation then disappears

### Settings toggle (`src/pages/ProfileSettings.tsx`)

- New "Notifications" section added to the settings page
- Single row: "Push notifications" label + description + toggle switch
- Toggle state driven by `isSubscribed` from the hook
- Toggling on calls `subscribe()`, toggling off calls `unsubscribe()`
- Shows "Not supported in this browser" text if `isSupported === false`

---

## Trigger Wiring

| Event                | File modified                                        | Change                                                                                                                  |
| -------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Urgent broadcast     | `supabase/functions/broadcast-dispatcher/index.ts`   | After fetching recipients, call `send-push-notification` with all user IDs                                              |
| New poll published   | `src/pages/admin/AdminPolls.tsx`                     | After `insert` into `polls`, call `supabase.functions.invoke('send-push-notification', { userIds: 'all-active', ... })` |
| Poll closing (24h)   | `supabase/functions/send-poll-notification/index.ts` | After email loop, call `send-push-notification` with same recipient IDs                                                 |
| New blog post        | `src/pages/admin/Blogs.tsx`                          | After status is set to `published`, call `supabase.functions.invoke('send-push-notification', ...)`                     |
| New chapter member   | DB trigger `on_chapter_member_join`                  | Fires on `chapter_memberships` insert, calls Edge Function via `pg_net` to notify chapter lead                          |
| Chapter announcement | `src/pages/ChapterHub.tsx`                           | After announcement is saved, call `supabase.functions.invoke('send-push-notification', ...)` with chapter member IDs    |

### "All active users" helper

For poll and blog triggers, the Edge Function accepts `"all"` as a special `userIds` value:

- If `userIds === "all"`, fetch all `user_id` values from `push_subscriptions` (i.e., everyone who opted in) rather than filtering by a specific list.

---

## Notification Deep Links

| Trigger               | `url` field              |
| --------------------- | ------------------------ |
| Urgent broadcast      | `/dashboard`             |
| New poll              | `/dashboard/polls`       |
| Poll closing          | `/dashboard/polls`       |
| New blog post         | `/dashboard/blog/:id`    |
| Chapter member joined | `/dashboard/chapter-hub` |
| Chapter announcement  | `/dashboard/chapter-hub` |

---

## Browser Support

Works on: Chrome 50+, Firefox 44+, Edge 17+, Safari 16.4+ (macOS Ventura / iOS 16.4+).  
Does not work on: iOS < 16.4, Opera Mini.  
The `isSupported` flag hides all UI on unsupported browsers — no errors surface to the user.

---

## `.env.example` additions

```
# Web Push — generate VAPID keys with: npx web-push generate-vapid-keys
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

The private key and subject go into **Supabase secrets only** — never in `.env`.
