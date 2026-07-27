import { Component } from 'react'
import { Box, Button, Collapse, Stack, Typography } from '@mui/material'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('ClientSide UI crashed:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            background: 'radial-gradient(circle at 20% 30%, rgba(88,166,255,0.15), transparent 50%), radial-gradient(circle at 80% 70%, rgba(130,80,220,0.1), transparent 50%), linear-gradient(180deg, #070b14 0%, #091021 62%, #0b1324 100%)',
          }}
        >
          <Stack
            spacing={2.5}
            alignItems="center"
            sx={{
              maxWidth: 480,
              p: 4,
              background: 'rgba(14, 24, 45, 0.65)',
              backdropFilter: 'blur(16px)',
              borderRadius: 4,
              border: '1px solid rgba(129, 191, 255, 0.12)',
              boxShadow: '0 12px 48px rgba(0, 0, 0, 0.35)',
              textAlign: 'center',
            }}
          >
            <ErrorOutlineRoundedIcon sx={{ fontSize: 56, color: 'error.main' }} />
            <Typography variant="h5" fontWeight={700}>
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary">
              An unexpected error occurred. Please try refreshing the page.
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                startIcon={<RefreshRoundedIcon />}
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
              <Button
                variant="outlined"
                startIcon={<HomeRoundedIcon />}
                onClick={() => { window.location.href = '/' }}
              >
                Go Home
              </Button>
            </Stack>
            {error && (
              <>
                <Button
                  size="small"
                  variant="text"
                  color="inherit"
                  onClick={() => this.setState({ showDetails: !showDetails })}
                  sx={{ textTransform: 'none', opacity: 0.5 }}
                >
                  {showDetails ? 'Hide' : 'Show'} error details
                </Button>
                <Collapse in={showDetails} sx={{ width: '100%' }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'rgba(0,0,0,0.3)',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      textAlign: 'left',
                      maxHeight: 200,
                      overflow: 'auto',
                      wordBreak: 'break-all',
                    }}
                  >
                    <Typography variant="caption" component="div" sx={{ color: 'error.light', mb: 0.5 }}>
                      {error?.message || 'Unknown error'}
                    </Typography>
                    {errorInfo?.componentStack && (
                      <Typography variant="caption" component="div" sx={{ color: 'text.disabled', whiteSpace: 'pre-wrap' }}>
                        {errorInfo.componentStack}
                      </Typography>
                    )}
                  </Box>
                </Collapse>
              </>
            )}
          </Stack>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
