import { createTheme } from '@mui/material/styles'

export const getDesignTokens = () => ({
  palette: {
    mode: 'dark',
    primary: { main: '#58a6ff', light: '#79b8ff', dark: '#388bfd', contrastText: '#0d1117' },
    secondary: { main: '#7dd3fc', light: '#bae6fd', dark: '#38bdf8', contrastText: '#0c1929' },
    background: { default: '#070b14', paper: '#0e1628', elevated: '#141e33' },
    text: { primary: '#edf4ff', secondary: '#8b9dbb', disabled: '#3d4d66' },
    success: { main: '#37d67a', light: '#5ee99a', dark: '#22b06a' },
    warning: { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
    error: { main: '#f87171', light: '#fca5a5', dark: '#ef4444' },
    info: { main: '#58a6ff', light: '#79b8ff', dark: '#388bfd' },
    divider: 'rgba(43,54,81,0.6)',
    border: 'rgba(43,54,81,0.8)',
    chart: ['#58a6ff', '#37d67a', '#f59e0b', '#f87171', '#a78bfa', '#34d399', '#fb923c', '#67e8f9'],
  },
  typography: {
    fontFamily: '"Inter", "Montserrat", "Segoe UI", system-ui, sans-serif',
    h1: { fontWeight: 800, fontSize: '2.5rem', lineHeight: 1.1, letterSpacing: '-0.03em' },
    h2: { fontWeight: 700, fontSize: '2rem', lineHeight: 1.15, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.2, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.3 },
    h5: { fontWeight: 600, fontSize: '1.1rem', lineHeight: 1.35 },
    h6: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.4 },
    subtitle1: { fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.5 },
    subtitle2: { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.5 },
    body1: { fontSize: '1rem', lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },
    overline: { fontSize: '0.675rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
  },
  shape: { borderRadius: 12 },
})

export const getComponentOverrides = () => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarWidth: 'thin',
        scrollbarColor: '#2b3651 transparent',
        '&::-webkit-scrollbar': { width: 6, height: 6 },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': {
          borderRadius: 3,
          backgroundColor: '#2b3651',
        },
      },
    },
  },
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: {
        borderRadius: 10,
        padding: '8px 18px',
        transition: 'all 0.2s ease',
        '&:active': { transform: 'scale(0.97)' },
      },
      contained: {
        boxShadow: '0 4px 14px rgba(88,166,255,0.25)',
        '&:hover': { boxShadow: '0 6px 20px rgba(88,166,255,0.35)' },
      },
      outlined: {
        borderWidth: 1.5,
        '&:hover': { borderWidth: 1.5 },
      },
      sizeLarge: { padding: '10px 24px', fontSize: '1rem' },
      sizeSmall: { padding: '4px 12px', fontSize: '0.8125rem' },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        border: '1px solid',
        borderColor: 'rgba(43,54,81,0.5)',
        backgroundImage: 'none',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {},
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { backgroundImage: 'none' },
      elevation1: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      },
      elevation8: {
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
      },
    },
  },
  MuiTextField: {
    defaultProps: { variant: 'outlined' },
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 10,
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(88,166,255,0.15)',
          },
        },
      },
    },
  },
  MuiSelect: {
    styleOverrides: {
      root: { borderRadius: 10 },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 8, fontWeight: 600 },
      sizeSmall: { borderRadius: 6, fontSize: '0.6875rem' },
      outlined: { borderWidth: 1.5 },
    },
  },
  MuiTable: {
    styleOverrides: {
      root: { borderCollapse: 'separate', borderSpacing: 0 },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: '1px solid',
        borderColor: 'rgba(43,54,81,0.3)',
        padding: '12px 16px',
      },
      head: {
        fontWeight: 700,
        fontSize: '0.75rem',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: '#8b9dbb',
        backgroundColor: 'rgba(255,255,255,0.02)',
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        transition: 'background-color 0.15s ease',
        '&:hover': {
          backgroundColor: 'rgba(88,166,255,0.04)',
        },
      },
    },
  },
  MuiTableSortLabel: {
    styleOverrides: {
      root: { '&.Mui-active': { color: 'inherit', fontWeight: 700 } },
    },
  },
  MuiTablePagination: {
    styleOverrides: {
      root: { borderTop: '1px solid', borderColor: 'rgba(43,54,81,0.3)' },
      toolbar: { minHeight: 48 },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 16,
        backgroundImage: 'none',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: { root: { fontWeight: 700, fontSize: '1.15rem' } },
  },
  MuiAlert: {
    styleOverrides: {
      root: { borderRadius: 10, fontWeight: 500 },
      standardSuccess: {
        backgroundColor: 'rgba(55,214,122,0.12)',
        color: '#5ee99a',
      },
      standardError: {
        backgroundColor: 'rgba(248,113,113,0.12)',
        color: '#fca5a5',
      },
      standardWarning: {
        backgroundColor: 'rgba(245,158,11,0.12)',
        color: '#fbbf24',
      },
      standardInfo: {
        backgroundColor: 'rgba(88,166,255,0.12)',
        color: '#79b8ff',
      },
    },
  },
  MuiSnackbar: {
    styleOverrides: {
      root: { '& .MuiPaper-root': { borderRadius: 12 } },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        borderRadius: 8,
        padding: '6px 12px',
        fontSize: '0.75rem',
        fontWeight: 500,
        backgroundColor: '#1e293b',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        border: 'none',
        backgroundImage: 'none',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: { backgroundImage: 'none' },
    },
  },
  MuiSkeleton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        backgroundColor: 'rgba(20, 30, 55, 0.5)',
        '&::after': {
          background: 'linear-gradient(90deg, transparent, rgba(129, 191, 255, 0.06), transparent)',
        },
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      root: { '& .MuiSwitch-thumb': { boxShadow: 'none' } },
      track: {
        borderRadius: 12,
        backgroundColor: 'rgba(43,54,81,0.6)',
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      indicator: {
        height: 3,
        borderRadius: '3px 3px 0 0',
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
        minHeight: 48,
        '&.Mui-selected': {
          fontWeight: 700,
        },
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: { borderRadius: 6 },
      bar: { borderRadius: 6 },
    },
  },
  MuiCircularProgress: {
    styleOverrides: {
      root: { '&.MuiCircularProgress-colorInherit': { color: 'inherit' } },
    },
  },
  MuiBackdrop: {
    styleOverrides: {
      root: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: { fontWeight: 700 },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: { borderColor: 'rgba(43,54,81,0.5)' },
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        textTransform: 'none',
        fontWeight: 600,
        borderWidth: 1.5,
        '&.Mui-selected': {
          borderWidth: 1.5,
        },
      },
    },
  },
  MuiToggleButtonGroup: {
    styleOverrides: {
      root: { gap: 0 },
      grouped: { '&:not(:last-of-type)': { borderTopRightRadius: 10, borderBottomRightRadius: 10 } },
    },
  },
})

const theme = createTheme({
  ...getDesignTokens(),
  components: getComponentOverrides(),
})

export default theme
