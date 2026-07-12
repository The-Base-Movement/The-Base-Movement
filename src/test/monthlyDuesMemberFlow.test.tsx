import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter } from 'react-router-dom'

const {
  mockGetCurrentSettings,
  mockGetMyEnrollment,
  mockGetMyLatestConsent,
  mockGetMyPayments,
  mockEnsureMyObligation,
  mockEnroll,
  mockOptOut,
  mockInitiateCheckout,
} = vi.hoisted(() => ({
  mockGetCurrentSettings: vi.fn(),
  mockGetMyEnrollment: vi.fn(),
  mockGetMyLatestConsent: vi.fn(),
  mockGetMyPayments: vi.fn(),
  mockEnsureMyObligation: vi.fn(),
  mockEnroll: vi.fn(),
  mockOptOut: vi.fn(),
  mockInitiateCheckout: vi.fn(),
}))

vi.mock('@/services/monthlyDuesService', () => ({
  monthlyDuesService: {
    getCurrentSettings: mockGetCurrentSettings,
    getMyEnrollment: mockGetMyEnrollment,
    getMyLatestConsent: mockGetMyLatestConsent,
    getMyPayments: mockGetMyPayments,
    ensureMyObligation: mockEnsureMyObligation,
    enroll: mockEnroll,
    optOut: mockOptOut,
  },
}))

vi.mock('@/services/adminService', () => ({
  adminService: {
    getPersonalDonationHistory: vi.fn().mockResolvedValue([]),
    getMemberProfileByAuthId: vi.fn().mockResolvedValue({
      id: 'TBM-DS-260001',
      name: 'Jane Patriot',
      phone: '+12025550123',
      country: 'United States',
      platform: 'DIASPORA',
    }),
  },
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-a', email: 'jane@example.com' } },
  }),
}))

vi.mock('@/lib/sessionStore', () => ({
  sessionStore: { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() },
}))

vi.mock('@/components/SEO', () => ({
  default: () => null,
}))

vi.mock('@/components/payment/hubtelCheckout', () => ({
  initiateHubtelCheckout: mockInitiateCheckout,
}))

vi.mock('@/components/payment/HubtelPaymentModal', () => ({
  HubtelPaymentModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div>Hubtel checkout open</div> : null,
}))

const settings = {
  amount_ghs: 50,
  due_day: 28,
  grace_period_days: 7,
  recurring_enrollment_enabled: false,
  policy_version: 'v1',
  effective_from: '2026-01-01T00:00:00Z',
}

const enrollment = {
  id: 'enr-1',
  member_id: 'user-a',
  status: 'active',
  payment_mode: 'manual',
  hubtel_invoice_id: null,
  enrolled_at: '2026-01-01T00:00:00Z',
  opted_out_at: null,
  provider_cancelled_at: null,
}

function duesPayment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pay-1',
    member_id: 'user-a',
    dues_month: '2026-02-01',
    due_date: '2026-02-28',
    amount_ghs: 50,
    display_amount: 4.25,
    display_currency: 'USD',
    exchange_rate_to_ghs: 11.76,
    payment_mode: 'manual_hubtel',
    status: 'due',
    hubtel_reference: null,
    provider_transaction_id: null,
    paid_at: null,
    verified_by: null,
    verification_notes: null,
    receipt_number: null,
    created_at: '2026-02-01T00:00:00Z',
    ...overrides,
  }
}

async function renderDuesTab() {
  const { default: MonthlyDuesTab } = await import('@/components/dues/MonthlyDuesTab')
  render(
    <MemoryRouter>
      <MonthlyDuesTab />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetCurrentSettings.mockResolvedValue(settings)
  mockGetMyEnrollment.mockResolvedValue(enrollment)
  mockGetMyLatestConsent.mockResolvedValue({
    email_enabled: true,
    sms_enabled: false,
    dues_enrollment_enabled: true,
  })
  mockGetMyPayments.mockResolvedValue([duesPayment()])
  mockEnsureMyObligation.mockResolvedValue({ payment_id: 'pay-1', status: 'due' })
})

describe('MyDonations tabs', () => {
  it('shows Donations and Monthly Dues tabs and switches between them', async () => {
    const { default: MyDonations } = await import('@/pages/MyDonations')
    render(
      <HelmetProvider>
        <MemoryRouter>
          <MyDonations />
        </MemoryRouter>
      </HelmetProvider>
    )

    const duesTab = await screen.findByRole('button', { name: /monthly dues/i })
    expect(screen.getByRole('button', { name: /^donations$/i })).toBeInTheDocument()

    await userEvent.click(duesTab)
    expect(await screen.findByRole('button', { name: /pay this month/i })).toBeInTheDocument()
  })
})

describe('MonthlyDuesTab', () => {
  it('shows local and GHS amounts with a Pay this month action when due', async () => {
    await renderDuesTab()

    expect(await screen.findByRole('button', { name: /pay this month/i })).toBeInTheDocument()
    expect(screen.getAllByText(/4\.25/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/₵\s?50/).length).toBeGreaterThan(0)
  })

  it('shows the paid receipt state instead of a pay action once paid', async () => {
    mockGetMyPayments.mockResolvedValue([
      duesPayment({
        status: 'paid',
        paid_at: '2026-02-10T00:00:00Z',
        receipt_number: 'PAY00001',
      }),
    ])
    mockEnsureMyObligation.mockResolvedValue({ payment_id: 'pay-1', status: 'paid' })
    await renderDuesTab()

    expect(await screen.findAllByText(/paid/i)).not.toHaveLength(0)
    expect(screen.getAllByText('PAY00001').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /pay this month/i })).not.toBeInTheDocument()
  })

  it('offers a retry action for failed payments', async () => {
    mockGetMyPayments.mockResolvedValue([duesPayment({ status: 'failed' })])
    mockEnsureMyObligation.mockResolvedValue({ payment_id: 'pay-1', status: 'failed' })
    await renderDuesTab()

    const retryButtons = await screen.findAllByRole('button', { name: /retry payment/i })
    expect(retryButtons.length).toBeGreaterThan(0)
  })

  it('shows an enrollment call to action when the member is not enrolled', async () => {
    mockGetMyEnrollment.mockResolvedValue(null)
    mockGetMyPayments.mockResolvedValue([])
    await renderDuesTab()

    expect(await screen.findByRole('button', { name: /enroll/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /pay this month/i })).not.toBeInTheDocument()
  })

  it('initiates a Hubtel checkout with only the obligation reference', async () => {
    mockInitiateCheckout.mockResolvedValue('https://checkout.hubtel.com/x')
    await renderDuesTab()

    await userEvent.click(await screen.findByRole('button', { name: /pay this month/i }))

    expect(mockInitiateCheckout).toHaveBeenCalledTimes(1)
    const request = mockInitiateCheckout.mock.calls[0][0]
    expect(request.reference).toBe('pay-1')
    expect(request.metadata?.monthlyDuesPaymentId).toBe('pay-1')
    expect(await screen.findByText('Hubtel checkout open')).toBeInTheDocument()
  })
})
