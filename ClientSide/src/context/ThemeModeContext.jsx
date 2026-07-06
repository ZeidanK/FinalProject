import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { ThemeProvider } from '@mui/material/styles'
import { darkTheme, lightTheme } from '../theme'

const ThemeModeContext = createContext()

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem('reconflow-theme-mode') || 'dark'
    } catch {
      return 'dark'
    }
  })

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem('reconflow-theme-mode', next) } catch {}
      return next
    })
  }, [])

  const setThemeMode = useCallback((newMode) => {
    setMode(newMode)
    try { localStorage.setItem('reconflow-theme-mode', newMode) } catch {}
  }, [])

  const theme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode])

  const value = useMemo(() => ({ mode, toggleTheme, setThemeMode }), [mode, toggleTheme, setThemeMode])

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}

ThemeModeProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export function useThemeMode() {
  return useContext(ThemeModeContext)
}
