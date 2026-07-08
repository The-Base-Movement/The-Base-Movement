import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useBranding } from '@/hooks/useBranding'
import { isAllowedDuringMaintenance } from '@/lib/maintenanceMode'
import { MaintenancePage } from './MaintenancePage'

function isMaintenanceOn(value: unknown): boolean {
  return value === true || value === 'true'
}

interface MaintenanceGateProps {
  children: ReactNode
}

/**
 * Wraps the public site's content. When IT enables maintenance mode (the
 * `maintenance_mode` site setting), only the public frontend is replaced with
 * the maintenance splash. Auth routes stay reachable so staff can still log in
 * and switch maintenance back off.
 */
export function MaintenanceGate({ children }: MaintenanceGateProps) {
  const { settings } = useBranding()
  const { pathname } = useLocation()

  const on = isMaintenanceOn(settings.maintenance_mode)
  const allowed = isAllowedDuringMaintenance(pathname)

  if (!on || allowed) return <>{children}</>

  const title =
    typeof settings.maintenance_title === 'string' ? settings.maintenance_title : undefined
  const message =
    typeof settings.maintenance_message === 'string' ? settings.maintenance_message : undefined

  return <MaintenancePage title={title} message={message} />
}
