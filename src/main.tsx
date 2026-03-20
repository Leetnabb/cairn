import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './i18n'
import './index.css'
import App from './App.tsx'
import CairnLanding from './components/landing/CairnLanding.tsx'
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx'
import { AuthProvider } from './providers/AuthProvider'
import { Login } from './pages/Login'
import { useAuth } from './providers/AuthProvider'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<CairnLanding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/app/*" element={<RequireAuth><App /></RequireAuth>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
