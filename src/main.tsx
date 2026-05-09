import { hydrateRoot, createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import { ChaptersProvider } from './context/ChaptersContext'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300000,
      retry: 3,
      networkMode: 'always',
    },
  },
})

const container = document.getElementById('root')!

const rootElement = (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ChaptersProvider>
          <App />
        </ChaptersProvider>
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
