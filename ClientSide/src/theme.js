import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#58a6ff',
    },
    secondary: {
      main: '#7dd3fc',
    },
    background: {
      default: '#070b14',
      paper: '#0e1628',
    },
    text: {
      primary: '#edf4ff',
      secondary: '#a8b7d6',
    },
    divider: '#2b3651',
    success: {
      main: '#37d67a',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Montserrat", "Segoe UI", sans-serif',
    h1: {
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 700,
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#070b14',
          color: '#edf4ff',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 20,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#0e1628',
          borderColor: '#2b3651',
        },
      },
    },
  },
})

export default theme
