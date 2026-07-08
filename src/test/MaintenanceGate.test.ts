import { describe, expect, it } from 'vitest'
import { isAllowedDuringMaintenance } from '@/lib/maintenanceMode'

describe('MaintenanceGate', () => {
  it('keeps backend and staff routes reachable during maintenance', () => {
    expect(isAllowedDuringMaintenance('/admin/it-department/system')).toBe(true)
    expect(isAllowedDuringMaintenance('/dashboard')).toBe(true)
    expect(isAllowedDuringMaintenance('/command')).toBe(true)
    expect(isAllowedDuringMaintenance('/api/health')).toBe(true)
    expect(isAllowedDuringMaintenance('/about')).toBe(false)
  })
})
