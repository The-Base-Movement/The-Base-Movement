import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.tsx'
import { ChaptersProvider } from './context/ChaptersContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ChaptersProvider>
          <App />
        </ChaptersProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
