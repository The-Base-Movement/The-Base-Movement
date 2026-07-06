import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        createSignedUrl: vi.fn(),
      }),
    },
  },
}))

import { extractStorageObjectPath } from '@/lib/storageObject'

describe('extractStorageObjectPath', () => {
  it('normalizes raw paths and Supabase storage URLs', () => {
    expect(extractStorageObjectPath('job-resumes', 'folder/resume.pdf')).toBe('folder/resume.pdf')
    expect(extractStorageObjectPath('job-resumes', 'job-resumes/folder/resume.pdf')).toBe(
      'folder/resume.pdf'
    )
    expect(
      extractStorageObjectPath(
        'job-resumes',
        'https://example.supabase.co/storage/v1/object/public/job-resumes/folder/resume.pdf'
      )
    ).toBe('folder/resume.pdf')
    expect(
      extractStorageObjectPath(
        'job-resumes',
        'https://example.supabase.co/storage/v1/object/sign/job-resumes/folder/resume.pdf?token=abc'
      )
    ).toBe('folder/resume.pdf')
  })
})
