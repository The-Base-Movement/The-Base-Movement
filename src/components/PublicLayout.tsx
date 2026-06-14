import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import BackToTop from './BackToTop'
import { MaintenanceGate } from './MaintenanceGate'

export default function PublicLayout() {
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
        <Navbar />
        <main id="main-content" className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <BackToTop />
      </div>
    </MaintenanceGate>
  )
}
