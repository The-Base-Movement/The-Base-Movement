# Image Compression System — Design Spec

**Date:** 2026-05-28  
**Status:** Approved

## Goal

Automatically compress images in two contexts:

1. **Static assets** (`public/`) — lossless compression at build time, original formats kept
2. **User uploads** — convert to WebP before uploading to Supabase Storage

## Scope

- All images in `public/` (PNG, JPG, SVG) compressed on every `vite build` via cache-aware plugin
- All user-uploaded images converted to WebP via a shared utility called from the two upload service methods
- No component files touched

Out of scope: video files, PDFs, existing files already in Supabase Storage (only new uploads going forward).

---

## Part 1: Build-time Static Asset Compression

### Plugin

`@vite-plugin-image-optimizer` added as a dev dependency and registered in `vite.config.ts`.

### Behaviour

- Runs during `vite build` only (not dev server)
- PNG/JPG: lossless squeeze via `sharp` — no format change, no quality loss
- SVG: optimised via `svgo` — strips metadata, collapses redundant paths
- **Cache-aware**: hashes each file; skips unchanged files on subsequent builds. Cache stored in `node_modules/.cache/vite-plugin-image-optimizer` (gitignored)
- First build processes everything; subsequent builds skip files whose hash hasn't changed
- CI/CD cold cache reprocesses all files — acceptable overhead (seconds)

### Asset path impact

None. All references in `index.html`, `sw.js`, and component code remain unchanged.

---

## Part 2: Upload-time WebP Conversion

### Utility: `src/lib/imageUtils.ts`

Single exported function:

```ts
export async function compressForUpload(input: File | Blob, name?: string): Promise<File>
```

**Options:**

- `maxSizeMB: 1` — cap output at 1 MB
- `maxWidthOrHeight: 1920` — no dimension above 1920px
- `useWebWorker: true` — non-blocking compression
- `fileType: 'image/webp'` — always output WebP
- `initialQuality: 0.85` — high quality, visually lossless for photos

Returns a `File` with the original name rewritten to `.webp` extension.

**Error handling:** If compression throws (unsupported format, memory pressure), the original file/blob is uploaded as-is. Error is logged; upload is not blocked.

### Integration points

| Method                                      | Change                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `contentService.uploadImage(file, path)`    | Compress `file` before upload; storage path uses the returned `.webp` filename                         |
| `adminService.uploadAvatar(fileName, blob)` | Compress `blob` before upload; `fileName` extension replaced with `.webp` before Supabase Storage call |

The `avatar_url` written to the DB and auth metadata will reference the `.webp` path automatically.

### Component impact

None. All 18 file-input components continue passing `File`/`Blob` to services unchanged.

---

## Dependencies

| Package                        | Type          | Purpose                                |
| ------------------------------ | ------------- | -------------------------------------- |
| `@vite-plugin-image-optimizer` | devDependency | Build-time static asset compression    |
| `browser-image-compression`    | dependency    | Runtime WebP conversion in the browser |

---

## Testing

- Build: confirm `public/branding/logo.png` and `favicon.png` are smaller after first build; confirm second build skips them (no size change, faster build log)
- Upload: upload a PNG via blog media library → verify Supabase Storage receives a `.webp` file; upload an avatar during registration → verify `avatar_url` ends in `.webp`
- Fallback: passing a non-image file should log an error and upload the original unchanged
