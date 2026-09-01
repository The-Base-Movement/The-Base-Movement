import { Outlet } from 'react-router-dom'
import BackToTop from '@/components/BackToTop'
import { MaintenanceGate } from '@/components/MaintenanceGate'
import { useSiteMotion } from '@/hooks/useSiteMotion'
import { YouthNavbar } from './YouthNavbar'
import { YouthFooter } from './YouthFooter'
import { YW_SCOPE } from './theme'

/**
 * Shell for every /youth-wing route. Mirrors PublicLayout (maintenance gate,
 * skip link, sticky nav, motion, back-to-top) but swaps in the Youth Wing's own
 * navigation and footer, and applies the .yw-scope accent for the whole subtree
 * so individual pages no longer have to.
 */
export default function YouthLayout() {
  useSiteMotion()

  return (
    <MaintenanceGate>
      <div className={`public-layout ${YW_SCOPE} min-h-screen flex flex-col`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:px-4 focus:py-2 focus:rounded-md focus:font-semibold focus:text-white"
          style={{ background: 'hsl(var(--yw-accent))' }}
        >
          Skip to main content
        </a>
        <YouthNavbar />
        <main id="main-content" className="flex-1">
          <Outlet />
        </main>
        <YouthFooter />
        <BackToTop />
      </div>
    </MaintenanceGate>
  )
}
