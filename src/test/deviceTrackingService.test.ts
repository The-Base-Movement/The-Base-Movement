import { ROLE_CATALOG } from '@/lib/roleCatalog'
import { DEVICE_TRACKED_ROLES, isDeviceTrackedRole } from '@/services/deviceTrackingService'

describe('deviceTrackingService', () => {
  it('tracks every Board role for elevated device capture', () => {
    ROLE_CATALOG.filter((entry) => entry.parentGroup === 'BOARD').forEach((entry) => {
      expect(DEVICE_TRACKED_ROLES).toContain(entry.role)
      expect(isDeviceTrackedRole(entry.role)).toBe(true)
    })
  })
})
