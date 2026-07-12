const { mockRpc } = vi.hoisted(() => ({ mockRpc: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: mockRpc },
}))

import { royaltyPointsService } from '@/services/royaltyPointsService'

const adminPayload = {
  settings: {
    referral_registration_points: 50,
    referral_verification_points: 25,
    store_points_per_ghs: 1,
    monthly_dues_points_per_ghs: 1,
    donation_points_per_ghs: 2,
    updated_at: '2026-07-12T00:00:00Z',
  },
  summary: {
    total_points: 425,
    members_with_points: 3,
    points_this_month: 100,
    manual_adjustments: 1,
  },
  balances: [
    {
      user_id: 'u1',
      full_name: 'Jane Patriot',
      registration_number: 'TBM-GH-260001',
      balance: 300,
      last_activity: '2026-07-10T00:00:00Z',
    },
  ],
  ledger: [
    {
      id: 'l1',
      user_id: 'u1',
      full_name: 'Jane Patriot',
      registration_number: 'TBM-GH-260001',
      points: -20,
      source_type: 'manual_adjustment',
      source_reference: null,
      reason: 'Correction',
      awarded_by: 'admin-1',
      created_at: '2026-07-11T00:00:00Z',
    },
  ],
}

beforeEach(() => {
  mockRpc.mockReset()
})

describe('royaltyPointsService', () => {
  it('loads and maps the admin payload from get_royalty_points_admin', async () => {
    mockRpc.mockResolvedValue({ data: adminPayload, error: null })

    const data = await royaltyPointsService.getAdminData()

    expect(mockRpc).toHaveBeenCalledWith('get_royalty_points_admin')
    expect(data.settings?.donationPointsPerGhs).toBe(2)
    expect(data.summary.totalPoints).toBe(425)
    expect(data.balances[0]).toMatchObject({
      userId: 'u1',
      name: 'Jane Patriot',
      registrationNumber: 'TBM-GH-260001',
      balance: 300,
    })
    expect(data.ledger[0]).toMatchObject({
      points: -20,
      sourceType: 'manual_adjustment',
      reason: 'Correction',
    })
  })

  it('sends the five rates to update_royalty_points_settings', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })

    await royaltyPointsService.updateSettings({
      referralRegistrationPoints: 60,
      referralVerificationPoints: 30,
      storePointsPerGhs: 1,
      monthlyDuesPointsPerGhs: 1.5,
      donationPointsPerGhs: 2,
    })

    expect(mockRpc).toHaveBeenCalledWith('update_royalty_points_settings', {
      p_referral_registration: 60,
      p_referral_verification: 30,
      p_store_per_ghs: 1,
      p_dues_per_ghs: 1.5,
      p_donation_per_ghs: 2,
    })
  })

  it('sends signed adjustments to adjust_member_royalty_points', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })

    await royaltyPointsService.adjustMemberPoints('u1', -20, 'Duplicate award correction')

    expect(mockRpc).toHaveBeenCalledWith('adjust_member_royalty_points', {
      p_member_id: 'u1',
      p_points: -20,
      p_reason: 'Duplicate award correction',
    })
  })

  it('surfaces RPC errors', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('Permission denied') })

    await expect(royaltyPointsService.getAdminData()).rejects.toThrow('Permission denied')
  })
})
