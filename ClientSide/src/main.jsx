import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { CssBaseline, ThemeProvider } from '@mui/material'
import './index.css'
import App from './App.jsx'
import theme from './theme'
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
      <ThemeProvider theme={theme}>
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
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
