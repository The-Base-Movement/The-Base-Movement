import { Suspense } from 'react'
import { useRoutes } from 'react-router-dom'
import { StoreProvider } from './types/StoreProvider'
import ScrollToTop from './components/ScrollToTop'
import ReadingProgressBar from './components/ReadingProgressBar'
import { LoadingScreen } from './components/LoadingScreen'
import { PerformanceProvider } from './context/PerformanceContext'
import { BrandingProvider } from './context/BrandingContext'
import { routes } from './routes'
import { Toaster as SonnerToaster } from 'sonner'
import { Toaster } from './components/ui/toaster'
import { useIsClient } from '@/hooks/useIsClient'


export default function App() {
  const content = useRoutes(routes);
  const isClient = useIsClient();

  return (
    <PerformanceProvider>
      <BrandingProvider>
        <StoreProvider>
          <ScrollToTop />
          <ReadingProgressBar />
          <Toaster />
          {isClient && (
            <>
              <SonnerToaster position="top-right" richColors />
            </>
          )}
          <Suspense fallback={<LoadingScreen />}>
            {content}
          </Suspense>
        </StoreProvider>
      </BrandingProvider>
    </PerformanceProvider>
  )
}
