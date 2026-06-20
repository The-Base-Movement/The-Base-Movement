import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mocks = vi.hoisted(() => ({
  stepUpBiometric: vi.fn(),
  enrolBiometric: vi.fn(),
}))

vi.mock('@/services/deviceTrackingService', () => ({
  deviceTrackingService: mocks,
}))

import BiometricPrompt from '@/components/BiometricPrompt'

describe('BiometricPrompt reinstall recovery', () => {
  beforeEach(() => {
    mocks.stepUpBiometric.mockReset()
    mocks.enrolBiometric.mockReset()
  })

  it('offers an MFA-protected biometric rebind when the old Brave passkey is unavailable', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    mocks.stepUpBiometric.mockRejectedValue(new Error('credential unavailable'))
    mocks.enrolBiometric.mockResolvedValue(true)

    render(
      <BiometricPrompt
        result={{
          tracked: true,
          decision: 'step_up_required',
          device_id: 'device-1',
          fingerprint_hash: 'new-fingerprint',
          webauthn_required: true,
        }}
        onDone={onDone}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Verify with biometric' }))
    await user.click(await screen.findByRole('button', { name: 'Recover after Brave reinstall' }))

    expect(mocks.enrolBiometric).toHaveBeenCalledWith('device-1', {
      rebind: true,
      fingerprintHash: 'new-fingerprint',
    })
    expect(onDone).toHaveBeenCalled()
  })
})
