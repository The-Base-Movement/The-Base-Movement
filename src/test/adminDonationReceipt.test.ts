import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/authService', () => ({
  authService: {
    getUser: vi.fn(),
    isAuthenticated: vi.fn(() => false),
  },
}))

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: { invoke },
  },
}))

import { adminService } from '@/services/adminService'

describe('admin donation receipt retry', () => {
  beforeEach(() => {
    invoke.mockReset()
    vi.spyOn(adminService, 'logAction').mockResolvedValue()
  })

  it('invokes receipt delivery and audits success', async () => {
    invoke.mockResolvedValue({ error: null })

    await expect(adminService.retryDonationReceipt('donation-1')).resolves.toBe(true)
    expect(invoke).toHaveBeenCalledWith('send-donation-receipt', {
      body: { donationId: 'donation-1' },
    })
    expect(adminService.logAction).toHaveBeenCalledWith(
      'DONATION_RECEIPT_RETRY',
      'DONATIONS/donation-1',
      'Success'
    )
  })

  it('returns false when invocation fails', async () => {
    invoke.mockResolvedValue({ error: new Error('failed') })
    await expect(adminService.retryDonationReceipt('donation-1')).resolves.toBe(false)
  })
})
