import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { initSentry } from './lib/sentry'
import App from './App.tsx'
import './index.css'

initSentry()

const PRELOAD_RELOAD_KEY = 'the_base_preload_error_reload_at'

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()

  try {
    const lastReloadAt = Number(sessionStorage.getItem(PRELOAD_RELOAD_KEY) || '0')
    const now = Date.now()
    if (now - lastReloadAt < 30000) return

    sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(now))
  } catch {
    // Continue with a reload even if storage is unavailable.
  }

  window.location.reload()
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
