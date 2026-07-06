import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { CssBaseline } from '@mui/material'
import './index.css'
import App from './App.jsx'
import { ThemeModeProvider } from './context/ThemeModeContext'
import { AuthProvider } from './context/AuthContext'
import { CompanyProvider } from './context/CompanyContext'
import { NotificationProvider } from './context/NotificationContext'
import { RealtimeProvider } from './context/RealtimeContext'
import GlobalNotifications from './components/GlobalNotifications'
import ErrorBoundary from './components/ErrorBoundary'
import { ConfirmProvider } from './components/ConfirmContext'
import { queryClient } from './queries/queryClient'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <CssBaseline />
        <AuthProvider>
          <CompanyProvider>
            <NotificationProvider>
              <RealtimeProvider>
                <ErrorBoundary>
                  <ConfirmProvider>
                    <App />
                  </ConfirmProvider>
                  <GlobalNotifications />
                </ErrorBoundary>
              </RealtimeProvider>
            </NotificationProvider>
          </CompanyProvider>
        </AuthProvider>
      </ThemeModeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
