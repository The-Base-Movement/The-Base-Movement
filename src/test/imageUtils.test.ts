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
