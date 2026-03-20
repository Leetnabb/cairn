import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './i18n'
import './index.css'
import App from './App.tsx'
import CairnLanding from './components/landing/CairnLanding.tsx'
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx'
import { AuthProvider } from './providers/AuthProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<CairnLanding />} />
            <Route path="/app/*" element={<App />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
