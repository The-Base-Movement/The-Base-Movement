import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { initSentry } from './lib/sentry'
import App from './App.tsx'
import './index.css'

initSentry()

const PRELOAD_RELOAD_KEY = 'the_base_preload_error_reload_at'

// Reload at most once per 30s so a genuinely-broken chunk can't loop forever.
function reloadForStaleChunk() {
  try {
    const lastReloadAt = Number(sessionStorage.getItem(PRELOAD_RELOAD_KEY) || '0')
    const now = Date.now()
    if (now - lastReloadAt < 30000) return
    sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(now))
  } catch {
    // Continue with a reload even if storage is unavailable.
  }
  window.location.reload()
}

// Vite's preload helper failing (dependency of a lazy chunk 404s after a deploy).
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  reloadForStaleChunk()
})

// A lazy-route import() that rejects outside the preload helper never fires
// vite:preloadError, so React leaves the <Suspense> fallback up and the page
// looks "stuck until refresh". Catch that rejection and recover the same way.
const CHUNK_ERROR =
  /dynamically imported module|imported module script failed|failed to fetch dynamically imported/i
window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason
  const message = String((reason && (reason.message || reason)) || '')
  if (CHUNK_ERROR.test(message)) {
    event.preventDefault()
    reloadForStaleChunk()
  }
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300000,
      retry: 3,
      networkMode: 'always',
    },
  },
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

const container = document.getElementById('root')!

const rootElement = (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </QueryClientProvider>
  </BrowserRouter>
)

createRoot(container).render(rootElement)
