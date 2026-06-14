import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useBranding } from '@/hooks/useBranding'
import { MaintenancePage } from './MaintenancePage'

/**
 * Paths that must stay reachable even during maintenance so staff can still
 * authenticate and get to the (always-on) admin panel to switch it back off.
 */
const ALWAYS_ALLOWED = [
  '/login',
  '/admin-login',
  '/forgot-password',
  '/reset-password',
  '/verify-otp',
  '/change-password',
]

function isMaintenanceOn(value: unknown): boolean {
  return value === true || value === 'true'
}

interface MaintenanceGateProps {
  children: ReactNode
}

/**
 * Wraps a layout's content. When IT enables maintenance mode (the
 * `maintenance_mode` site setting), public visitors AND members see the
 * maintenance splash instead — no bypass. Only the admin backend (`/admin/*`,
 * which is never wrapped by this gate) and the auth routes stay reachable, so
 * staff can still log in and switch maintenance back off.
 */
export function MaintenanceGate({ children }: MaintenanceGateProps) {
  const { settings } = useBranding()
  const { pathname } = useLocation()

  const on = isMaintenanceOn(settings.maintenance_mode)
  const allowed = ALWAYS_ALLOWED.some((p) => pathname.startsWith(p))

  if (!on || allowed) return <>{children}</>

  const title =
    typeof settings.maintenance_title === 'string' ? settings.maintenance_title : undefined
  const message =
    typeof settings.maintenance_message === 'string' ? settings.maintenance_message : undefined

  return <MaintenancePage title={title} message={message} />
}
