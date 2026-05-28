# Image Compression System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically compress static assets at build time and convert all user-uploaded images to WebP before they reach Supabase Storage.

**Architecture:** A Vite plugin handles lossless compression of `public/` assets during `vite build`. A `compressForUpload()` utility wraps `browser-image-compression` and is called by the two upload service methods (`contentService.uploadImage` and `adminService.uploadAvatar`) — no component files are touched. `getCroppedImg` (already canvas-based) is updated to output WebP directly.

**Tech Stack:** `@vite-plugin-image-optimizer` (sharp + svgo), `browser-image-compression`, Vitest

---

### Task 1: Install dependencies

**Files:**

- Modify: `package.json` (via npm)

- [ ] **Step 1: Install runtime and dev dependencies**

```bash
npm install browser-image-compression
npm install --save-dev @vite-plugin-image-optimizer
```

Expected output: both packages added to `package.json`, no peer dependency errors.

- [ ] **Step 2: Verify installs**

```bash
npx tsc --noEmit
```

Expected: no new type errors (both packages ship their own types).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add browser-image-compression and vite-plugin-image-optimizer"
```

---

### Task 2: Configure build-time static asset compression

**Files:**

- Modify: `vite.config.ts`

- [ ] **Step 1: Add the plugin import at the top of `vite.config.ts`**

```ts
import { ViteImageOptimizer } from '@vite-plugin-image-optimizer'
```

Add this after the existing imports (after `import { visualizer } from 'rollup-plugin-visualizer'`).

- [ ] **Step 2: Register the plugin in the plugins array**

Replace the existing `plugins` array:

```ts
plugins: [
  react(),
  mode === 'production' &&
    ViteImageOptimizer({
      png: { compressionLevel: 9, adaptiveFiltering: true },
      jpeg: { quality: 90, mozjpeg: true },
      jpg: { quality: 90, mozjpeg: true },
      svg: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: { overrides: { removeViewBox: false } },
          },
        ],
      },
      cache: true,
      cacheLocation: 'node_modules/.cache/vite-plugin-image-optimizer',
    }),
  mode !== 'production' &&
    visualizer({
      filename: 'stats.html',
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
].filter(Boolean),
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run a production build and confirm compression runs**

```bash
npm run build 2>&1 | grep -i "optimiz\|compress\|png\|svg"
```

Expected: output lines from the plugin showing file sizes before/after for `logo.png`, `favicon.png`.

- [ ] **Step 5: Run build again and confirm cache skips all files**

```bash
npm run build 2>&1 | grep -i "skip\|cache\|optimiz"
```

Expected: plugin logs show files skipped (cached).

- [ ] **Step 6: Commit**

```bash
git add vite.config.ts
git commit -m "feat: add build-time image optimization via vite-plugin-image-optimizer"
```

---

### Task 3: Add `compressForUpload` to `imageUtils.ts` (TDD)

**Files:**

- Modify: `src/lib/imageUtils.ts`
- Create: `src/test/imageUtils.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/test/imageUtils.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('browser-image-compression', () => ({
  default: vi.fn(
    async (file: File) => new File([new Uint8Array([1, 2, 3])], file.name, { type: 'image/webp' })
  ),
}))

import { compressForUpload } from '../lib/imageUtils'

describe('compressForUpload', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns a File with .webp extension when given a File', async () => {
    const input = new File([new Uint8Array([1])], 'photo.png', { type: 'image/png' })
    const result = await compressForUpload(input)
    expect(result).toBeInstanceOf(File)
    expect(result.name).toBe('photo.webp')
    expect(result.type).toBe('image/webp')
  })

  it('returns a File with .webp extension when given a Blob + name', async () => {
    const input = new Blob([new Uint8Array([1])], { type: 'image/jpeg' })
    const result = await compressForUpload(input, 'avatar.jpg')
    expect(result.name).toBe('avatar.webp')
    expect(result.type).toBe('image/webp')
  })

  it('falls back to original File if compression throws', async () => {
    const imageCompression = (await import('browser-image-compression')).default
    vi.mocked(imageCompression).mockRejectedValueOnce(new Error('oom'))

    const input = new File([new Uint8Array([1])], 'photo.png', { type: 'image/png' })
    const result = await compressForUpload(input)
    expect(result).toBe(input)
  })

  it('uses "image" as fallback filename for unnamed Blob', async () => {
    const input = new Blob([new Uint8Array([1])], { type: 'image/png' })
    const result = await compressForUpload(input)
    expect(result.name).toBe('image.webp')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/test/imageUtils.test.ts
```

Expected: 4 tests fail with "compressForUpload is not a function" or similar.

- [ ] **Step 3: Add `compressForUpload` to `src/lib/imageUtils.ts`**

Add the following import at the top of the file (after the existing `import type { Area }`):

```ts
import imageCompression from 'browser-image-compression'
```

Add the following function at the bottom of the file (before the final empty line):

```ts
export async function compressForUpload(input: File | Blob, name?: string): Promise<File> {
  const fileName = name ?? (input instanceof File ? input.name : 'image')
  const file = input instanceof File ? input : new File([input], fileName, { type: input.type })
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: 0.85,
    })
    return new File([compressed], fileName.replace(/\.[^.]+$/, '.webp'), {
      type: 'image/webp',
    })
  } catch (err) {
    console.error('[imageUtils] Compression failed, uploading original:', err)
    return file
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/test/imageUtils.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Also update `getCroppedImg` to output WebP instead of JPEG**

In `src/lib/imageUtils.ts`, find line 43:

```ts
canvas.toBlob((blob) => {
  resolve(blob)
}, 'image/jpeg')
```

Change to:

```ts
canvas.toBlob(
  (blob) => {
    resolve(blob)
  },
  'image/webp',
  0.85
)
```

- [ ] **Step 6: Run full test suite to check nothing regressed**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/imageUtils.ts src/test/imageUtils.test.ts
git commit -m "feat: add compressForUpload utility and update getCroppedImg to output WebP"
```

---

### Task 4: Wire `contentService.uploadImage()` to compress before upload

**Files:**

- Modify: `src/services/contentService.ts`

- [ ] **Step 1: Add the import**

At the top of `src/services/contentService.ts`, add:

```ts
import { compressForUpload } from '../lib/imageUtils'
```

- [ ] **Step 2: Compress before upload in `uploadImage`**

Find the `uploadImage` method (around line 244). Replace:

```ts
  async uploadImage(file: File, path: string): Promise<string | null> {
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `${path}/${fileName}`

      // Upload the file to the 'media' bucket
      const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file)
```

With:

```ts
  async uploadImage(file: File, path: string): Promise<string | null> {
    try {
      const compressed = await compressForUpload(file)
      const baseName = `${Math.random().toString(36).substring(2)}-${Date.now()}`
      const fileName = `${baseName}.webp`
      const filePath = `${path}/${fileName}`

      // Upload the file to the 'media' bucket
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, compressed)
```

Also update the `media_library` insert a few lines below to use `compressed` metadata:

Find:

```ts
await supabase.from('media_library').insert({
  filename: file.name,
  url: `${supabase.storage.from('media').getPublicUrl(filePath).data.publicUrl}`,
  folder: path,
  size_bytes: file.size,
  mime_type: file.type,
})
```

Replace with:

```ts
await supabase.from('media_library').insert({
  filename: fileName,
  url: `${supabase.storage.from('media').getPublicUrl(filePath).data.publicUrl}`,
  folder: path,
  size_bytes: compressed.size,
  mime_type: 'image/webp',
})
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/services/contentService.ts
git commit -m "feat: compress and convert to WebP in contentService.uploadImage"
```

---

### Task 5: Wire `adminService.uploadAvatar()` to compress before upload

**Files:**

- Modify: `src/services/adminService.ts`

- [ ] **Step 1: Add the import**

At the top of `src/services/adminService.ts`, add:

```ts
import { compressForUpload } from '../lib/imageUtils'
```

- [ ] **Step 2: Update `generateAvatarPath` to use `.webp`**

Find (around line 909):

```ts
  generateAvatarPath(regNo: string): string {
    return `${regNo}.jpg`
  }
```

Replace with:

```ts
  generateAvatarPath(regNo: string): string {
    return `${regNo}.webp`
  }
```

- [ ] **Step 3: Update `uploadAvatar` to compress the blob**

Find (around line 895):

```ts
  async uploadAvatar(
    fileName: string,
    blob: Blob
  ): Promise<{ data: { path: string } | null; error: Error | null }> {
    return supabase.storage.from('avatars').upload(fileName, blob, {
      upsert: true,
      contentType: blob.type || 'image/jpeg',
    })
  }
```

Replace with:

```ts
  async uploadAvatar(
    fileName: string,
    blob: Blob
  ): Promise<{ data: { path: string } | null; error: Error | null }> {
    const compressed = await compressForUpload(blob, fileName)
    return supabase.storage.from('avatars').upload(fileName, compressed, {
      upsert: true,
      contentType: 'image/webp',
    })
  }
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/services/adminService.ts
git commit -m "feat: compress and convert to WebP in adminService.uploadAvatar"
```

---

### Task 6: Manual verification and push

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test blog image upload**

1. Log in as admin → navigate to Blog editor
2. Upload a PNG or JPG via the media library
3. Open Supabase Storage → `media` bucket → confirm the file stored is `.webp`
4. Confirm the image renders correctly in the editor

- [ ] **Step 3: Test avatar upload via registration**

1. Start a new registration flow
2. Upload a photo or take a selfie
3. Complete registration
4. Open Supabase Storage → `avatars` bucket → confirm file is `<regNo>.webp`
5. Confirm avatar renders on dashboard

- [ ] **Step 4: Run full test suite one final time**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 5: Push to main**

```bash
git push origin main
```
