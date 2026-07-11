/**
 * PublicLayout Component
 * -------------------------------------------------------------
 * Shell layout for all public-facing pages (`/`, /about, /blog, etc.).
 * Wraps the route `<Outlet />` with:
 * - `MaintenanceGate`: hides the public site when maintenance mode is on
 * - `Navbar`: sticky top navigation bar
 * - Skip-to-content anchor for keyboard / screen-reader accessibility
 * - `Footer`: site-wide footer
 * - `BackToTop`: floating scroll-to-top button
 *
 * The admin panel is never wrapped by this layout.
 */

import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import BackToTop from './BackToTop'
import { MaintenanceGate } from './MaintenanceGate'

export default function PublicLayout() {
  const { pathname } = useLocation()
  const isAuthPage = pathname === '/login'

  return (
    <MaintenanceGate>
      <div className="public-layout min-h-screen flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:px-4 focus:py-2 focus:rounded-md focus:font-semibold focus:text-white"
          style={{ background: 'hsl(var(--primary))' }}
        >
          Skip to main content
        </a>
        {!isAuthPage && <Navbar />}
        <main id="main-content" className="flex-1">
          <Outlet />
        </main>
        {!isAuthPage && <Footer />}
        {!isAuthPage && <BackToTop />}
      </div>
    </MaintenanceGate>
  )
}
