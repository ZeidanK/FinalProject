import { useState, useCallback, useMemo, useRef } from 'react'
import {
  Box,
  Dialog,
  DialogContent,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import WorkspacesRoundedIcon from '@mui/icons-material/WorkspacesRounded'
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const ROUTE_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: DashboardRoundedIcon, roles: ['accountant', 'business_owner', 'accountant_business_owner'] },
  { path: '/invoices', label: 'Invoices', icon: ReceiptLongRoundedIcon, roles: ['accountant', 'business_owner', 'accountant_business_owner'] },
  { path: '/transactions', label: 'Transactions', icon: AccountBalanceRoundedIcon, roles: ['accountant', 'business_owner', 'accountant_business_owner'] },
  { path: '/matches', label: 'Matches', icon: CompareArrowsRoundedIcon, roles: ['accountant', 'business_owner', 'accountant_business_owner'] },
  { path: '/anomalies', label: 'Anomalies', icon: ErrorOutlineRoundedIcon, roles: ['accountant', 'business_owner', 'accountant_business_owner'] },
  { path: '/reports', label: 'Reports', icon: AssessmentRoundedIcon, roles: ['accountant', 'business_owner', 'accountant_business_owner'] },
  { path: '/profile', label: 'Profile', icon: PersonRoundedIcon, roles: ['accountant', 'business_owner', 'accountant_business_owner', 'admin'] },
  { path: '/admin', label: 'Admin Portal', icon: AdminPanelSettingsRoundedIcon, roles: ['admin'] },
  { path: '/accountant-workspace', label: 'My Workspace', icon: WorkspacesRoundedIcon, roles: ['accountant', 'accountant_business_owner'] },
  { path: '/find-accountant', label: 'Find an Accountant', icon: PersonSearchRoundedIcon, roles: ['business_owner', 'accountant_business_owner'] },
]

const ACTION_ITEMS = [
  { id: 'refresh', label: 'Refresh current page', icon: RefreshRoundedIcon },
  { id: 'new-invoice', label: 'Create new invoice', icon: AddRoundedIcon },
  { id: 'upload-transactions', label: 'Upload transactions', icon: CloudUploadRoundedIcon },
]

function searchScore(query, label) {
  const q = query.toLowerCase()
  const l = label.toLowerCase()
  if (l === q) return 100
  if (l.startsWith(q)) return 80
  if (l.includes(q)) return 60
  const words = q.split(/\s+/)
  const matches = words.filter(w => l.includes(w)).length
  if (matches > 0) return 20 + (matches / words.length) * 30
  return 0
}

function highlightText(text, query) {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <Box key={i} component="span" sx={{ color: 'primary.light', fontWeight: 700 }}>{part}</Box>
      : part
  )
}

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const userRole = user?.role

  const routeItems = useMemo(() => {
    if (!userRole) return []
    return ROUTE_ITEMS.filter(r => r.roles.includes(userRole))
  }, [userRole])

  const actionItems = useMemo(() => {
    if (!userRole) return []
    return ACTION_ITEMS.filter(() => true)
  }, [userRole])

  const executeItem = useCallback((item) => {
    onClose()
    if (item.type === 'route') {
      navigate(item.path)
    } else if (item.id === 'refresh') {
      window.location.reload()
    } else if (item.id === 'new-invoice') {
      navigate('/invoices')
    } else if (item.id === 'upload-transactions') {
      navigate('/transactions')
    }
  }, [navigate, onClose])

  const flatItems = useMemo(() => {
    const results = []
    for (const route of routeItems) {
      const score = searchScore(query, route.label)
      if (score > 0) results.push({ ...route, type: 'route', score })
    }
    for (const action of actionItems) {
      const score = searchScore(query, action.label)
      if (score > 0) results.push({ ...action, type: 'action', score })
    }
    results.sort((a, b) => b.score - a.score)
    return results
  }, [query, routeItems, actionItems])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, flatItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = flatItems[selectedIndex]
      if (item) executeItem(item)
    }
  }, [flatItems, selectedIndex, executeItem])

  const handleInputRef = useCallback((node) => {
    if (node && open) {
      node.focus()
    }
    inputRef.current = node
  }, [open])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3.5,
            border: '1px solid rgba(129, 191, 255, 0.12)',
            background: 'rgba(14, 24, 45, 0.92)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            mt: { xs: 0, sm: 8 },
            height: { xs: '100%', sm: 'auto' },
            maxHeight: { xs: '100%', sm: 520 },
          },
        },
      }}
    >
      <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
        <TextField
          inputRef={handleInputRef}
          fullWidth
          variant="standard"
          placeholder="Search pages, actions..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
          onKeyDown={handleKeyDown}
          slotProps={{
            input: {
              disableUnderline: true,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: 'rgba(129, 191, 255, 0.5)', fontSize: 22 }} />
                </InputAdornment>
              ),
              sx: {
                fontSize: '1.05rem',
                py: 0.5,
                color: '#fff',
                '&::placeholder': { color: 'rgba(255,255,255,0.3)', opacity: 1 },
              },
            },
          }}
        />
      </Box>

      <Box sx={{ px: 1.5, pb: 0.5 }}>
        <Box sx={{ height: '1px', background: 'rgba(129, 191, 255, 0.08)' }} />
      </Box>

      <DialogContent sx={{ p: 0, overflow: 'auto' }}>
        {flatItems.length > 0 ? (
          <List dense disablePadding>
            {flatItems.map((item, idx) => {
              const Icon = item.icon
              const isSelected = idx === selectedIndex
              return (
                <ListItemButton
                  key={item.type === 'route' ? item.path : item.id}
                  selected={isSelected}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    mb: 0.25,
                    py: 1,
                    px: 1.5,
                    '&.Mui-selected': { bgcolor: 'rgba(129, 191, 255, 0.12)' },
                    '&:hover:not(.Mui-selected)': { bgcolor: 'rgba(129, 191, 255, 0.06)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Icon sx={{ fontSize: 20, color: isSelected ? 'primary.light' : 'rgba(255,255,255,0.4)' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={highlightText(item.label, query)}
                    primaryTypographyProps={{
                      sx: { fontSize: '0.9rem', fontWeight: isSelected ? 600 : 400, color: isSelected ? '#fff' : 'rgba(255,255,255,0.75)' },
                    }}
                  />
                  {item.type === 'route' && (
                    <Box
                      component="span"
                      sx={{
                        fontSize: '0.7rem',
                        color: 'rgba(255,255,255,0.2)',
                        fontFamily: 'monospace',
                        ml: 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.path}
                    </Box>
                  )}
                </ListItemButton>
              )
            })}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 5, color: 'rgba(255,255,255,0.3)' }}>
            <SearchOffRoundedIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2">No results found</Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
