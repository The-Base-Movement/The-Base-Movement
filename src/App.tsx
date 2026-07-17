import { Suspense } from 'react'
import { useRoutes } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import ReadingProgressBar from './components/ReadingProgressBar'
import { LoadingScreen } from './components/LoadingScreen'
import { PerformanceProvider } from './context/PerformanceContext'
import { BrandingProvider } from './context/BrandingContext'
import { AuthProvider } from '@/context/AuthContext'
import { routes } from './routes'
import { Toaster as SonnerToaster } from 'sonner'
import { Toaster } from './components/buttons/ui/toaster'
import { useIsClient } from '@/hooks/useIsClient'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Analytics } from './components/Analytics'
import { VersionChecker } from './components/VersionChecker'

export default function App() {
  const content = useRoutes(routes)
  const isClient = useIsClient()

  return (
    <ErrorBoundary>
      <PerformanceProvider>
        <BrandingProvider>
          <AuthProvider>
            <Analytics />
            <ScrollToTop />
            <ReadingProgressBar />
            <Toaster />
            {isClient && (
              <>
                <SonnerToaster position="top-right" richColors />
                <VersionChecker />
              </>
            )}
            <Suspense fallback={<LoadingScreen />}>{content}</Suspense>
          </AuthProvider>
        </BrandingProvider>
      </PerformanceProvider>
    </ErrorBoundary>
  )
}
