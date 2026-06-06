import { useState, useEffect, useCallback } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import { getPublicAccountants, sendAccountantRequest } from '../services/accountants'

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
  : ''

const cardSx = {
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3.5,
  background:
    'linear-gradient(135deg, rgba(14, 22, 40, 0.92) 0%, rgba(10, 17, 33, 0.96) 100%)',
}

export default function FindAccountant() {
  const { token } = useAuth()
  const { activeCompanyId } = useCompany()

  const [accountants, setAccountants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sendingId, setSendingId] = useState(null)
  const [sendMsg, setSendMsg] = useState(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await getPublicAccountants(activeCompanyId || null, token)
      setAccountants(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load accountants.')
    } finally {
      setLoading(false)
    }
  }, [token, activeCompanyId])

  useEffect(() => {
    load()
  }, [load])

  const handleSendRequest = async (accountantId) => {
    if (!activeCompanyId) return
    setSendingId(accountantId)
    setSendMsg(null)
    try {
      await sendAccountantRequest(accountantId, activeCompanyId, token)
      setAccountants((prev) =>
        prev.map((a) =>
          a.id === accountantId ? { ...a, requestStatus: 'pending' } : a,
        ),
      )
      setSendMsg({ type: 'success', text: 'Request sent! The accountant will be notified.' })
    } catch (err) {
      setSendMsg({ type: 'error', text: err.message || 'Failed to send request.' })
    } finally {
      setSendingId(null)
    }
  }

  const filtered = accountants.filter(
    (a) =>
      !search ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{ px: { xs: 2, sm: 3, md: 4, xl: 5 }, py: 3, width: '100%' }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <PersonSearchRoundedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight={800}>
          Find an Accountant
        </Typography>
      </Stack>

      {sendMsg && (
        <Alert
          severity={sendMsg.type}
          sx={{ mb: 2 }}
          onClose={() => setSendMsg(null)}
        >
          {sendMsg.text}
        </Alert>
      )}

      <TextField
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 3, maxWidth: 420 }}
        fullWidth
      />

      {loading ? (
        <Stack spacing={2}>
          {[1, 2, 3].map((k) => (
            <Skeleton key={k} variant="rounded" height={96} />
          ))}
        </Stack>
      ) : error ? (
        <Alert severity="error" variant="outlined">
          {error}
        </Alert>
      ) : filtered.length === 0 ? (
        <Card elevation={0} sx={cardSx}>
          <CardContent>
            <Typography color="text.secondary" textAlign="center" py={4}>
              {search
                ? 'No accountants match your search.'
                : 'No public accountants are available at the moment.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {filtered.map((accountant) => (
            <Card key={accountant.id} elevation={0} sx={cardSx}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar
                      src={
                        accountant.profilePicture
                          ? `${API_BASE}/${accountant.profilePicture}`
                          : undefined
                      }
                      sx={{
                        width: 52,
                        height: 52,
                        bgcolor: 'primary.main',
                        color: '#041229',
                        fontWeight: 800,
                        fontSize: '1.2rem',
                      }}
                    >
                      {(accountant.name || 'A')[0].toUpperCase()}
                    </Avatar>
                    <Stack spacing={0.25}>
                      <Typography fontWeight={700}>{accountant.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {accountant.email}
                      </Typography>
                      {accountant.phone && (
                        <Typography variant="body2" color="text.secondary">
                          {accountant.phone}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>

                  <Box>
                    {accountant.requestStatus === 'active' ? (
                      <Chip
                        label="Working Together"
                        color="success"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    ) : accountant.requestStatus === 'pending' ? (
                      <Chip
                        label="Request Sent"
                        color="warning"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={
                          sendingId === accountant.id ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : (
                            <SendRoundedIcon />
                          )
                        }
                        disabled={sendingId === accountant.id}
                        onClick={() => handleSendRequest(accountant.id)}
                      >
                        Send Request
                      </Button>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  )
}
