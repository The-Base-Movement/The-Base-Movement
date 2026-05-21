---
name: avatar-storage-conventions-and-drift
description: Avatar bucket name, file-naming drift between adminService and live DB rows, and chapter_leaders.image_url usage
metadata:
  type: project
---

**Bucket:** `avatars` (public read). Verified 2026-05-21 via `storage.buckets`.
Second bucket: `media` (also public).

**Column reference:** `public.users.avatar_url` (text, nullable). Full public URL is stored — not just a filename or path.

**Example live values** (`users.avatar_url`):

- `https://vhlyekyxutwbxlvktnzd.supabase.co/storage/v1/object/public/avatars/5b7dd2c1-1307-41bb-845c-92b193220f79/1777938499984.png`
- `https://vhlyekyxutwbxlvktnzd.supabase.co/storage/v1/object/public/avatars/0245f6a7-3e8a-41e4-808d-dbfe697ea633/1778658713600.jpg`

**Three-way drift in avatar file naming** (as of 2026-05-21):

1. JSDoc on `adminService.generateAvatarPath` claims `{userId}/{timestamp}.jpg` (with leading slash separator).
2. Actual implementation: `return ${regNo}.jpg` — flat, by registration number.
3. Live storage objects: `{userId}/{timestamp}.{ext}` — matches the JSDoc, NOT the implementation.

**Conclusion:** Either the rows seen were uploaded by a different code path (admin panel, manual upload, or an older version of `generateAvatarPath`), or the implementation was changed to flat-`{regNo}.jpg` after those rows were written. The CLAUDE.md / prior memory note that the bucket is `{regNo}.jpg` flat is consistent with the _current_ code but NOT with what's in production storage.

**Why:** When debugging missing/wrong avatars, both naming schemes may coexist. Don't assume a single convention.

**How to apply:**

- To read an avatar for a user, always use `users.avatar_url` directly — it's a full URL, no construction needed.
- When uploading new avatars via `useRegistrationSubmit` flow, current code writes to `{regNo}.jpg` at bucket root.
- When investigating older rows or admin-panel uploads, expect `{userId}/{timestamp}.{ext}` layout.
- This naming inconsistency is tech debt worth flagging to the user if they touch upload code.

**chapter_leaders.image_url:** Column exists (text, nullable). Live values observed are external Unsplash URLs (e.g. `https://images.unsplash.com/photo-…`) — i.e. placeholder/seed data, NOT Supabase Storage. No code path currently uploads chapter leader photos to the `avatars` or `media` buckets.

Related: [[users-table-schema-and-drift]]
