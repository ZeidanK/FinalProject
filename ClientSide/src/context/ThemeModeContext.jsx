import { createContext, useContext } from 'react'
import PropTypes from 'prop-types'
import { ThemeProvider } from '@mui/material/styles'
import darkTheme from '../theme'

const ThemeModeContext = createContext()

export function ThemeModeProvider({ children }) {
  return (
    <ThemeModeContext.Provider value={{ mode: 'dark' }}>
      <ThemeProvider theme={darkTheme}>
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
