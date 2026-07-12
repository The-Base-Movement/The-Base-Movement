import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { mockGetAdminData, mockUpdateSettings, mockAdjustMemberPoints, mockSearchMembers } =
  vi.hoisted(() => ({
    mockGetAdminData: vi.fn(),
    mockUpdateSettings: vi.fn(),
    mockAdjustMemberPoints: vi.fn(),
    mockSearchMembers: vi.fn(),
  }))

vi.mock('@/services/royaltyPointsService', () => ({
  royaltyPointsService: {
    getAdminData: mockGetAdminData,
    updateSettings: mockUpdateSettings,
    adjustMemberPoints: mockAdjustMemberPoints,
    searchMembers: mockSearchMembers,
  },
}))

import RoyaltyPoints from '@/pages/admin/RoyaltyPoints'
import { getNavGroups } from '@/components/layouts/admin/navConfig'

const adminData = {
  settings: {
    referralRegistrationPoints: 50,
    referralVerificationPoints: 25,
    storePointsPerGhs: 1,
    monthlyDuesPointsPerGhs: 1,
    donationPointsPerGhs: 1,
    updatedAt: '2026-07-12T00:00:00Z',
  },
  summary: {
    totalPoints: 425,
    membersWithPoints: 3,
    pointsThisMonth: 100,
    manualAdjustments: 1,
  },
  balances: [
    {
      userId: 'u1',
      name: 'Jane Patriot',
      registrationNumber: 'TBM-GH-260001',
      balance: 300,
      lastActivity: '2026-07-10T00:00:00Z',
    },
  ],
  ledger: [
    {
      id: 'l1',
      userId: 'u1',
      name: 'Jane Patriot',
      registrationNumber: 'TBM-GH-260001',
      points: 300,
      sourceType: 'donation' as const,
      sourceReference: 'd1',
      reason: null,
      createdAt: '2026-07-10T00:00:00Z',
    },
    {
      id: 'l2',
      userId: 'u1',
      name: 'Jane Patriot',
      registrationNumber: 'TBM-GH-260001',
      points: -20,
      sourceType: 'manual_adjustment' as const,
      sourceReference: null,
      reason: 'Correction',
      createdAt: '2026-07-11T00:00:00Z',
    },
  ],
}

beforeEach(() => {
  mockGetAdminData.mockReset().mockResolvedValue(adminData)
  mockUpdateSettings.mockReset().mockResolvedValue(undefined)
  mockAdjustMemberPoints.mockReset().mockResolvedValue(undefined)
  mockSearchMembers.mockReset().mockResolvedValue([])
})

describe('RoyaltyPoints page', () => {
  it('renders KPIs, rates, balances, and the ledger', async () => {
    render(<RoyaltyPoints />)

    await waitFor(() => expect(mockGetAdminData).toHaveBeenCalled())

    expect(await screen.findByText('425')).toBeInTheDocument()
    expect(screen.getByText('Members with points')).toBeInTheDocument()
    expect(screen.getByLabelText('Referral registration (pts)')).toHaveValue(50)
    expect(screen.getByLabelText('Donations (pts per GH₵)')).toHaveValue(1)
    expect(screen.getAllByText('Jane Patriot').length).toBeGreaterThan(0)
    expect(screen.getByText('+300')).toBeInTheDocument()
    expect(screen.getByText('-20')).toBeInTheDocument()
    expect(screen.getByText('Correction')).toBeInTheDocument()
  })

  it('rejects negative rates without calling the service', async () => {
    const user = userEvent.setup()
    render(<RoyaltyPoints />)
    expect(await screen.findByText('425')).toBeInTheDocument()

    const field = screen.getByLabelText('Store (pts per GH₵)')
    fireEvent.change(field, { target: { value: '-1' } })
    await user.click(screen.getByRole('button', { name: /save rates/i }))

    expect(mockUpdateSettings).not.toHaveBeenCalled()
    expect(await screen.findByText('All rates must be zero or greater.')).toBeInTheDocument()
  })

  it('blocks zero-point and reason-less manual adjustments', async () => {
    const user = userEvent.setup()
    render(<RoyaltyPoints />)
    await waitFor(() => expect(mockGetAdminData).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: /manual adjustment/i }))
    const dialog = screen.getByRole('dialog', { name: /manual points adjustment/i })
    expect(dialog).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /apply adjustment/i }))
    expect(screen.getByText('Select a member first.')).toBeInTheDocument()
    expect(mockAdjustMemberPoints).not.toHaveBeenCalled()
  })

  it('applies a valid manual adjustment', async () => {
    mockSearchMembers.mockResolvedValue([
      { id: 'u2', name: 'Kofi Mensah', registrationNumber: 'TBM-GH-260002' },
    ])
    const user = userEvent.setup()
    render(<RoyaltyPoints />)
    await waitFor(() => expect(mockGetAdminData).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: /manual adjustment/i }))
    await user.type(screen.getByLabelText('Search member'), 'Kofi')
    await user.click(await screen.findByRole('button', { name: /kofi mensah/i }))
    await user.type(screen.getByLabelText('Points'), '-15')
    await user.type(screen.getByLabelText('Reason'), 'Refunded donation')
    await user.click(screen.getByRole('button', { name: /apply adjustment/i }))

    await waitFor(() =>
      expect(mockAdjustMemberPoints).toHaveBeenCalledWith('u2', -15, 'Refunded donation')
    )
  })

  it('registers the Finance nav item with the finance permission', () => {
    const groups = getNavGroups(0, 0, 0)
    const finance = groups.find((g) => g.label === 'Finance')
    const item = finance?.items.find((i) => i.to === '/admin/finance/royalty-points')
    expect(item).toBeDefined()
    expect(item?.permission).toEqual({ action: 'MANAGE_DONATIONS', resource: 'DONATIONS' })
  })
})
