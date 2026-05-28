# Image Compression System — Audit

**Date:** 2026-05-29  
**Status:** Complete  
**Commits:** `eadfee5` → `6bafd02`

---

## What Was Built

Automatic image compression at two points in the pipeline:

1. **Build-time** — static assets in `public/` are compressed during `vite build`
2. **Upload-time** — every user-uploaded image is converted to WebP before reaching Supabase Storage

---

## Files Changed

| File                             | Change                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `package.json`                   | Added `browser-image-compression@^2.0.2` (dep) and `vite-plugin-image-optimizer@^2.0.3` + `svgo@^4.0.1` (devDeps) |
| `vite.config.ts`                 | Registered `ViteImageOptimizer` (production-only, cache-aware)                                                    |
| `src/lib/imageUtils.ts`          | Added `compressForUpload()` utility; updated `getCroppedImg` to output WebP                                       |
| `src/test/imageUtils.test.ts`    | Created — 5 tests for `compressForUpload`                                                                         |
| `src/services/contentService.ts` | `uploadImage()` now compresses before upload; extension/mime derived from output                                  |
| `src/services/adminService.ts`   | `uploadAvatar()` now compresses before upload; `generateAvatarPath()` returns `.webp`                             |
| `src/pages/admin/Settings.tsx`   | Avatar path hardcoded to `.webp` to match compressed output                                                       |
| `public/branding/*`              | All branding PNGs/JPGs compressed by first production build                                                       |

---

## Part 1: Build-time Compression

**Plugin:** `vite-plugin-image-optimizer` via `ViteImageOptimizer()`

**Config:**

- PNG: `compressionLevel: 9, adaptiveFiltering: true` — lossless, maximum compression
- JPEG/JPG: `quality: 90, mozjpeg: true` — high quality, smaller than default
- SVG: `multipass: true, preset-default` with `removeViewBox: false` — safe optimisation
- Cache-aware: hashes each file, skips unchanged files on subsequent builds
- Cache location: `node_modules/.cache/vite-plugin-image-optimizer`

**Behaviour:**

- Runs during `npm run build` (production only — does not affect dev server)
- First build processes all `public/` images; subsequent builds skip cached files
- CI/CD gets a cold cache per deploy — acceptable overhead (seconds)
- All asset paths in code remain unchanged

---

## Part 2: Upload-time WebP Conversion

### Utility: `src/lib/imageUtils.ts` — `compressForUpload()`

```ts
compressForUpload(input: File | Blob, name?: string): Promise<File>
```

**Options:** `maxSizeMB: 1`, `maxWidthOrHeight: 1920`, `useWebWorker: true`, `fileType: 'image/webp'`, `initialQuality: 0.85`

**Behaviour:**

- Accepts `File` or `Blob` (with optional name)
- Returns a `File` with `.webp` extension and `image/webp` type
- On compression error: logs `[imageUtils] Compression failed, uploading original:` and returns the original file unchanged

### `getCroppedImg()` — updated

Canvas output changed from `image/jpeg` to `image/webp` at quality `0.85`. Avatars cropped during registration are now WebP before even reaching `compressForUpload`.

### Service Integration

**`contentService.uploadImage(file, path)`**

- Calls `compressForUpload(file)` before upload
- Filename: `${random}-${timestamp}.${ext}` where `ext` comes from `compressed.name` (not hardcoded)
- `mime_type` in `media_library` insert: `compressed.type || 'image/webp'`

**`adminService.uploadAvatar(fileName, blob)`**

- Calls `compressForUpload(blob, fileName)` before upload
- `contentType`: `compressed.type || 'image/webp'`
- `generateAvatarPath(regNo)` now returns `${regNo}.webp` (was `.jpg`)

**`Settings.tsx` avatar upload**

- Path changed from `${user.id}/${Date.now()}.${originalExt}` to `${user.id}/${Date.now()}.webp`

### Upload paths covered

| Path                               | Covered                                               |
| ---------------------------------- | ----------------------------------------------------- |
| Blog/media library upload (admin)  | ✅ `contentService.uploadImage`                       |
| Avatar — registration flow         | ✅ `adminService.uploadAvatar` + `getCroppedImg` WebP |
| Avatar — profile settings (member) | ✅ `adminService.uploadAvatar`                        |
| Avatar — admin Settings page       | ✅ `adminService.uploadAvatar` + `.webp` path         |
| Avatar — member actions (admin)    | ✅ `adminService.uploadAvatar`                        |
| `uploadBrandingAsset`              | ⚠️ Not wired — no active callers in codebase          |
| Job banner upload                  | ⚠️ Not wired — out of scope for this work             |

---

## Tests

**File:** `src/test/imageUtils.test.ts` — 5 tests, all passing

| Test                                             | Covers                  |
| ------------------------------------------------ | ----------------------- |
| File input → `.webp` File returned               | Normal compression path |
| Blob + name → `.webp` File returned              | Blob input path         |
| Compression throws → original File returned      | Error fallback          |
| Unnamed Blob → fallback name `image.webp`        | Edge case               |
| Blob compression throws → promoted File returned | Blob fallback contract  |

---

## Known Gaps (Future Work)

- **`uploadBrandingAsset`** (`adminService.ts`) — has no active callers; wire compression when a branding upload UI is added
- **`jobService.uploadJobBanner`** — job banner images are user-uploaded and can be large; compress when job feature is prioritised
