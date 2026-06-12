# Implementation Plan: Media Uploads & Management

This document outlines the strategy for implementing image uploads for blog posts, authors, and rich text content, transitioning from manual URL entry to a professional media management system.

## 1. Objectives
- Enable direct image uploads for Blog Featured Images and Author Profiles.
- Implement a "Media Library" where administrators can manage all assets.
- Integrate media uploads into the TinyMCE rich text editor.
- Ensure images are organized into logical categories (blog-images, author-images, etc.).

## 2. Proposed Architecture

### Option A: Supabase Storage (Recommended)
Since the project already uses Supabase for the database, using Supabase Storage is the most reliable and scalable approach. It provides a "publicly accessible" storage bucket that functions like a cloud-based `public` folder.

**Pros:**
- Zero configuration for production deployments (Vercel, Netlify).
- Integrated security rules (RLS).
- Automatically handles high-concurrency and image serving.

**Cons:**
- Images are not stored in the local `public/` directory (stored in Supabase Cloud).

### Option B: Local Filesystem (MAMP/PHP)
Since the project is hosted in a MAMP environment, we can use a PHP script to handle uploads to the local `public/uploads` directory.

**Pros:**
- Images are stored directly in the project's `public/` folder.
- Simple for local development within MAMP.

**Cons:**
- Won't work on modern cloud platforms (Vercel/Netlify) without a persistent volume.
- Requires maintaining a separate PHP script.

---

## 3. Implementation Steps (Supabase Storage)

### Step 1: Storage Configuration
- Create a public bucket named `media` in Supabase.
- Define folder structures:
  - `blog-images/`
  - `author-images/`
  - `editor-content/`

### Step 2: ContentService Updates
- Add `uploadImage(file: File, path: string): Promise<string | null>` to `contentService.ts`.
- This method will return the public URL of the uploaded asset.

### Step 3: Media Library Page
- Create `src/pages/admin/MediaLibrary.tsx`.
- Features:
  - Grid view of all uploaded assets.
  - Upload button with progress indicator.
  - "Copy URL" functionality for each asset.
  - "Delete" functionality.

### Step 4: Component Integration
- **Blog Editor**: Replace/Supplement the "Featured Image URL" input with an "Upload Image" button that triggers a file picker.
- **TinyMCE**: Configure the `images_upload_handler` to use the `ContentService.uploadImage` method.

---

## 4. Next Steps
1. [x] Confirm if **Option A (Supabase Storage)** is acceptable or if local `public/` folder persistence is strictly required. (Implemented as Option A for full cloud/production compatibility)
2. [x] Create the `MediaLibrary` page structure.
3. [x] Implement the upload logic in `contentService.ts`.
4. [x] Add the "Upload" buttons to the `Blogs.tsx` edit view.
5. [x] Integrate `images_upload_handler` into TinyMCE.
6. [x] Implement Author Information section (name, role, bio) and Author Image upload in the blog editor.
7. [x] Create an automated sync script (`scripts/sync-media.ts`) to migrate existing `public/` assets to Supabase Storage.
8. [x] Implement a "Local Asset Indexer" (`scripts/generate-media-manifest.cjs`) that scans the `public/` folder and allows the Media Library to display existing assets without moving them, preserving all existing file paths.
