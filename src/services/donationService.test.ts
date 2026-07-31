import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

vi.mock('./authService', () => ({
  authService: {
    getUser: vi.fn(() => null),
    isAuthenticated: vi.fn(() => false),
  },
}))

let mapDonationRow: typeof import('./donationService').mapDonationRow

beforeAll(async () => {
  ;({ mapDonationRow } = await import('./donationService'))
})

describe('mapDonationRow', () => {
  it('falls back when payment_method is null', () => {
    const donation = mapDonationRow({
      id: 'abcdef123456',
      created_at: '2026-07-31T00:00:00.000Z',
      amount: 50,
      payment_method: null,
      status: 'Pending',
      full_name: 'Test Donor',
      phone: null,
      country: null,
      reference: null,
      donation_campaigns: null,
      users: null,
    })

    expect(donation.method).toBe('Unknown')
    expect(donation.reference).toBe('ABCDEF12')
    expect(donation.country).toBe('Unknown')
  })
})
