const ALWAYS_ALLOWED_DURING_MAINTENANCE = [
  '/admin',
  '/dashboard',
  '/command',
  '/api',
  '/rest',
  '/functions',
  '/storage',
  '/auth',
  '/login',
  '/admin-login',
  '/forgot-password',
  '/reset-password',
  '/verify-otp',
  '/change-password',
]

export function isAllowedDuringMaintenance(pathname: string): boolean {
  return ALWAYS_ALLOWED_DURING_MAINTENANCE.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
}
