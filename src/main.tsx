import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { ChaptersProvider } from './context/ChaptersContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300000, // 5 minutes
      retry: 3,
      networkMode: 'always',
    },
  },
})

const rootElement = document.getElementById('root')!
createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <ChaptersProvider>
            <App />
          </ChaptersProvider>
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  </StrictMode>,
)

// Firing event for static prerendering
if (import.meta.env.PROD) {
  setTimeout(() => {
    document.dispatchEvent(new Event('render-event'));
  }, 2000);
}
