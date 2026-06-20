import { render, screen } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  evaluateCurrentDevice: vi.fn(),
}))

vi.mock('@/services/adminService', () => ({
  adminService: {
    getCurrentUser: () => ({ role: 'FOUNDER' }),
    initialize: vi.fn(),
  },
}))

vi.mock('@/services/authService', () => ({
  authService: { logout: vi.fn() },
}))

vi.mock('@/services/deviceTrackingService', () => ({
  DEVICE_TRACKED_ROLES: ['FOUNDER'],
  isDeviceTrackedRole: (role: string) => role === 'FOUNDER',
  deviceTrackingService: {
    evaluateCurrentDevice: mocks.evaluateCurrentDevice,
  },
}))

vi.mock('@/components/BiometricPrompt', () => ({
  default: ({ result }: { result: { decision: string } }) => (
    <div>Biometric prompt: {result.decision}</div>
  ),
}))

vi.mock('react-router-dom', () => ({
  Outlet: () => <div>Admin content</div>,
}))

import AdminDeviceCapture from '@/components/AdminDeviceCapture'

describe('AdminDeviceCapture', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mocks.evaluateCurrentDevice.mockReset()
  })

  it('shows biometric verification instead of blocking a recoverable Brave step-up', async () => {
    mocks.evaluateCurrentDevice.mockResolvedValue({
      tracked: true,
      decision: 'step_up_required',
      device_id: 'device-1',
      fingerprint_hash: 'changed-fingerprint',
      webauthn_required: true,
      reason: 'fingerprint_mismatch',
    })

    render(<AdminDeviceCapture />)

    expect(await screen.findByText('Biometric prompt: step_up_required')).toBeInTheDocument()
    expect(screen.queryByText('Device blocked')).not.toBeInTheDocument()
  })

  it('continues to block browsers rejected by the Brave-only policy', async () => {
    mocks.evaluateCurrentDevice.mockResolvedValue({
      tracked: true,
      decision: 'blocked',
      reason: 'non_brave_browser',
    })

    render(<AdminDeviceCapture />)

    expect(await screen.findByText('Brave Browser Required')).toBeInTheDocument()
    expect(screen.queryByText(/Biometric prompt:/)).not.toBeInTheDocument()
  })
})
