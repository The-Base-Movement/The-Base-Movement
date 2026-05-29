---
name: blog-posts-table-schema-and-missing-engagement-infra
description: blog_posts column list and confirmation that no likes/reactions/comments/views infrastructure exists in the DB as of 2026-05-29
type: project
---

The blog posts table is named **`blog_posts`** (not `posts`). As of 2026-05-29, the DB has zero engagement infrastructure for blog content.

**Columns of `public.blog_posts`:**

| Column           | Type           | Nullable | Default                |
| ---------------- | -------------- | -------- | ---------------------- |
| id               | uuid           | NO       | gen_random_uuid()      |
| title            | varchar        | NO       | —                      |
| slug             | varchar        | NO       | —                      |
| excerpt          | text           | YES      | —                      |
| content          | text           | YES      | —                      |
| author_id        | uuid           | YES      | —                      |
| category         | varchar        | YES      | —                      |
| published_at     | timestamptz    | YES      | timezone('utc', now()) |
| tags             | ARRAY (text[]) | YES      | —                      |
| is_featured      | boolean        | YES      | false                  |
| read_time        | varchar        | YES      | —                      |
| seo_title        | varchar        | YES      | —                      |
| meta_description | text           | YES      | —                      |
| deleted_at       | timestamptz    | YES      | — (soft-delete)        |
| status           | varchar        | YES      | 'Draft'                |

**What does NOT exist (confirmed 2026-05-29):**

- No `likes` table
- No `post_likes` / `blog_post_likes` junction table
- No `reactions` table
- No `likes_count` / `views_count` / `comments_count` columns on `blog_posts`
- No `comments` table for blog posts

**Why:** Engagement features (likes, reactions, comments, view counters) have not been built. Any feature requesting these needs net-new tables + RLS + likely an RPC for atomic counter increments.

**How to apply:** When a user asks to build like buttons, reaction counts, or comment threads on blog posts, the work starts from zero on the DB side — propose a schema (e.g., `blog_post_likes(user_id, post_id, created_at)` with unique constraint + RLS allowing authenticated users to insert/delete only their own rows) rather than assuming any column or table exists.
