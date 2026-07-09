import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/lib/imageUtils', () => ({ getCroppedImg: vi.fn() }))
vi.mock('@/services/adminService', () => ({ adminService: {} }))
vi.mock('@/services/discordService', () => ({ discordService: {} }))
vi.mock('@/lib/sessionStore', () => ({ sessionStore: {} }))

import { duplicateRegistrationMessage } from '@/services/registrationService'

describe('duplicateRegistrationMessage', () => {
  it('points email duplicates back to sign in', () => {
    expect(duplicateRegistrationMessage('email', 'kwame@example.com', '+233', '0241234567')).toBe(
      'An account with the email "kwame@example.com" already exists. Please sign in with your email and password instead.'
    )
  })

  it('points phone duplicates back to phone sign in', () => {
    expect(duplicateRegistrationMessage('phone', null, '+233', '0241234567')).toBe(
      'An account with the phone number "+233 0241234567" already exists. Please sign in with your phone number and password instead.'
    )
  })
})
