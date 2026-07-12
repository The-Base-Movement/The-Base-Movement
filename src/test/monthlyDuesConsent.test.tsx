import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { mockGetMyLatestConsent, mockSetConsent } = vi.hoisted(() => ({
  mockGetMyLatestConsent: vi.fn(),
  mockSetConsent: vi.fn(),
}))

vi.mock('@/services/monthlyDuesService', () => ({
  monthlyDuesService: {
    getMyLatestConsent: mockGetMyLatestConsent,
    setConsent: mockSetConsent,
  },
}))

async function renderSettings() {
  const { default: MonthlyDuesNotificationSettings } =
    await import('@/components/settings/MonthlyDuesNotificationSettings')
  render(<MonthlyDuesNotificationSettings />)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetMyLatestConsent.mockResolvedValue({
    id: 'c-1',
    member_id: 'user-a',
    email_enabled: true,
    sms_enabled: false,
    dues_enrollment_enabled: true,
    recurring_payment_authorized: false,
    policy_version: 'v1',
    source: 'enrollment',
    recorded_at: '2026-06-01T10:00:00Z',
  })
  mockSetConsent.mockResolvedValue('c-2')
})

describe('MonthlyDuesNotificationSettings', () => {
  it('reflects the latest consent state in independent toggles', async () => {
    await renderSettings()

    const email = await screen.findByRole('checkbox', { name: /email/i })
    const sms = screen.getByRole('checkbox', { name: /sms/i })
    expect(email).toBeChecked()
    expect(sms).not.toBeChecked()
  })

  it('records an email opt-out without touching the SMS preference', async () => {
    await renderSettings()

    await userEvent.click(await screen.findByRole('checkbox', { name: /email/i }))

    await waitFor(() =>
      expect(mockSetConsent).toHaveBeenCalledWith(false, false, 'profile_settings')
    )
  })

  it('records an SMS opt-in without touching the email preference', async () => {
    await renderSettings()

    await userEvent.click(await screen.findByRole('checkbox', { name: /sms/i }))

    await waitFor(() => expect(mockSetConsent).toHaveBeenCalledWith(true, true, 'profile_settings'))
  })

  it('shows when consent was last recorded and explains the effect', async () => {
    await renderSettings()

    expect(await screen.findByText(/1 jun(e)? 2026/i)).toBeInTheDocument()
    expect(screen.getByText(/immediately stops/i)).toBeInTheDocument()
  })

  it('renders defaults when the member has never recorded consent', async () => {
    mockGetMyLatestConsent.mockResolvedValue(null)
    await renderSettings()

    const email = await screen.findByRole('checkbox', { name: /email/i })
    expect(email).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: /sms/i })).not.toBeChecked()
  })
})
