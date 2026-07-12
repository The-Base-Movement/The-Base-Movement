import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const {
  mockGetFinanceSettings,
  mockSaveFinanceSettings,
  mockListFinancePayments,
  mockListFinanceEnrollments,
  mockVerifyOfflinePayment,
  mockGetMemberConsentHistory,
} = vi.hoisted(() => ({
  mockGetFinanceSettings: vi.fn(),
  mockSaveFinanceSettings: vi.fn(),
  mockListFinancePayments: vi.fn(),
  mockListFinanceEnrollments: vi.fn(),
  mockVerifyOfflinePayment: vi.fn(),
  mockGetMemberConsentHistory: vi.fn(),
}))

vi.mock('@/services/monthlyDuesService', () => ({
  monthlyDuesService: {
    getFinanceSettings: mockGetFinanceSettings,
    saveFinanceSettings: mockSaveFinanceSettings,
    listFinancePayments: mockListFinancePayments,
    listFinanceEnrollments: mockListFinanceEnrollments,
    verifyOfflinePayment: mockVerifyOfflinePayment,
    getMemberConsentHistory: mockGetMemberConsentHistory,
  },
}))

import { computeDuesKpis } from '@/services/financeAnalyticsService'
import { getNavGroups } from '@/components/layouts/admin/navConfig'

function payment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pay-1',
    member_id: 'user-a',
    member_name: 'Jane Patriot',
    member_reg_no: 'TBM-GH-260001',
    dues_month: '2026-06-01',
    due_date: '2026-06-28',
    amount_ghs: 50,
    display_amount: 50,
    display_currency: 'GHS',
    exchange_rate_to_ghs: 1,
    payment_mode: 'manual_hubtel',
    status: 'due',
    hubtel_reference: null,
    provider_transaction_id: null,
    paid_at: null,
    verified_by: null,
    verification_notes: null,
    receipt_number: null,
    created_at: '2026-06-01T00:00:00Z',
    ...overrides,
  }
}

const enrollments = [
  { id: 'e1', member_id: 'user-a', status: 'active' },
  { id: 'e2', member_id: 'user-b', status: 'active' },
  { id: 'e3', member_id: 'user-c', status: 'opted_out' },
]

const payments = [
  payment(),
  payment({
    id: 'pay-2',
    member_id: 'user-b',
    member_name: 'Kofi Mensah',
    member_reg_no: 'TBM-GH-260002',
    status: 'paid',
    paid_at: '2026-06-10T00:00:00Z',
    provider_transaction_id: 'txn-1',
    receipt_number: 'PAY00002',
  }),
  payment({
    id: 'pay-3',
    member_id: 'user-a',
    dues_month: '2026-05-01',
    due_date: '2026-05-28',
    status: 'overdue',
  }),
]

async function renderPanel() {
  const { default: MonthlyDuesPanel } = await import('@/components/admin/finance/MonthlyDuesPanel')
  render(<MonthlyDuesPanel />)
  await screen.findAllByText('Jane Patriot')
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetFinanceSettings.mockResolvedValue({
    id: 's1',
    amount_ghs: 50,
    due_day: 28,
    grace_period_days: 7,
    recurring_enrollment_enabled: false,
    policy_version: 'v1',
    is_active: true,
    effective_from: '2026-01-01T00:00:00Z',
  })
  mockListFinancePayments.mockResolvedValue(payments)
  mockListFinanceEnrollments.mockResolvedValue(enrollments)
  mockVerifyOfflinePayment.mockResolvedValue(undefined)
  mockSaveFinanceSettings.mockResolvedValue(undefined)
  mockGetMemberConsentHistory.mockResolvedValue([])
})

describe('permission gating', () => {
  it('gates the finance dashboard behind MANAGE_DONATIONS:DONATIONS', () => {
    const items = getNavGroups(0, 0).flatMap((g) => g.items)
    const dashboard = items.find((i) => i.to === '/admin/finance-dashboard')
    expect(dashboard?.permission).toEqual({ action: 'MANAGE_DONATIONS', resource: 'DONATIONS' })
  })
})

describe('computeDuesKpis', () => {
  it('computes the six finance KPIs', () => {
    expect(computeDuesKpis(enrollments, payments)).toEqual({
      enrolled: 2,
      paid: 1,
      due: 1,
      overdue: 1,
      optedOut: 1,
      collectedGhs: 50,
    })
  })
})

describe('MonthlyDuesPanel', () => {
  it('renders the six KPI values', async () => {
    await renderPanel()

    for (const label of ['Enrolled', 'Paid', 'Due', 'Overdue', 'Opted Out', 'Collected']) {
      expect(screen.getAllByText(new RegExp(`^${label}`, 'i')).length).toBeGreaterThan(0)
    }
  })

  it('filters the table by search and status', async () => {
    await renderPanel()

    await userEvent.type(screen.getByRole('textbox', { name: /search/i }), 'Kofi')
    expect(screen.queryAllByText('Jane Patriot')).toHaveLength(0)
    expect(screen.getAllByText('Kofi Mensah').length).toBeGreaterThan(0)

    await userEvent.clear(screen.getByRole('textbox', { name: /search/i }))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /status/i }), 'overdue')
    expect(screen.getAllByText('Jane Patriot').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Kofi Mensah')).toHaveLength(0)
  })

  it('requires notes before verifying an offline payment', async () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('')
    await renderPanel()

    const verifyButtons = screen.getAllByRole('button', { name: /verify offline/i })
    await userEvent.click(verifyButtons[0])
    expect(mockVerifyOfflinePayment).not.toHaveBeenCalled()

    promptSpy.mockReturnValue('Cash received at office')
    await userEvent.click(verifyButtons[0])
    await waitFor(() =>
      expect(mockVerifyOfflinePayment).toHaveBeenCalledWith(
        expect.any(String),
        'Cash received at office'
      )
    )
    promptSpy.mockRestore()
  })

  it('never offers manual verification for provider payments', async () => {
    await renderPanel()

    const paidRow = screen.getAllByText('Kofi Mensah')[0].closest('tr') as HTMLElement
    expect(within(paidRow).queryByRole('button', { name: /verify offline/i })).toBeNull()
  })
})

describe('MonthlyDuesSettings', () => {
  it('validates settings before saving', async () => {
    const { default: MonthlyDuesSettings } =
      await import('@/components/admin/finance/MonthlyDuesSettings')
    render(<MonthlyDuesSettings />)

    const amount = await screen.findByRole('spinbutton', { name: /amount/i })
    await userEvent.clear(amount)
    await userEvent.type(amount, '0')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(mockSaveFinanceSettings).not.toHaveBeenCalled()

    await userEvent.clear(amount)
    await userEvent.type(amount, '75')
    const dueDay = screen.getByRole('spinbutton', { name: /due day/i })
    await userEvent.clear(dueDay)
    await userEvent.type(dueDay, '31')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(mockSaveFinanceSettings).not.toHaveBeenCalled()

    await userEvent.clear(dueDay)
    await userEvent.type(dueDay, '15')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() =>
      expect(mockSaveFinanceSettings).toHaveBeenCalledWith(
        expect.objectContaining({ amount_ghs: 75, due_day: 15 })
      )
    )
  })
})
