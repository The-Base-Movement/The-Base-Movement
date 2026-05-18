import { hydrateRoot, createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { initSentry } from './lib/sentry'
import App from './App.tsx'
import './index.css'

initSentry()

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

// Use hydrateRoot if the page is prerendered, otherwise use createRoot
if (container.hasChildNodes()) {
  hydrateRoot(container, rootElement)
} else {
  createRoot(container).render(rootElement)
}
