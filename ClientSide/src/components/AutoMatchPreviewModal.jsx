import { useState } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded'
import NotInterestedRoundedIcon from '@mui/icons-material/NotInterestedRounded'
import ModalShell from './ModalShell'
import { fmtAmount, fmtDate } from '../utils/formatters'

export default function AutoMatchPreviewModal({
  open,
  onClose,
  onConfirm,
  onUnmatch,
  previewData,
  loading,
}) {
  const [selected, setSelected] = useState([])

  const items = Array.isArray(previewData) ? previewData : []

  const hasMatched = items.some((i) => i.alreadyMatched)
  const selectedMatched = selected.filter((i) => items[i]?.alreadyMatched)
  const selectedPending = selected.filter((i) => !items[i]?.alreadyMatched)

  const handleToggle = (index) => {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    )
  }

  const handleSelectAll = () => {
    if (selected.length === items.length) {
      setSelected([])
    } else {
      setSelected(items.map((_, i) => i))
    }
  }

  const handleMatch = () => {
    const selectedItems = selectedPending.map((i) => items[i])
    onConfirm(selectedItems)
  }

  const handleUnmatch = () => {
    const selectedItems = selectedMatched.map((i) => items[i])
    onUnmatch(selectedItems)
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidth="md"
      title={
        <Stack direction="row" alignItems="center" spacing={1}>
          <AutoFixHighRoundedIcon sx={{ color: '#58a6ff' }} />
          <Typography variant="h6">Auto-Match Preview</Typography>
        </Stack>
      }
      headerAction={
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
      }
      actions={
        <Stack direction="row" spacing={1.5} sx={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          {selectedMatched.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleUnmatch}
              disabled={loading}
              startIcon={<NotInterestedRoundedIcon />}
            >
              Unmatch ({selectedMatched.length})
            </Button>
          )}
          {selectedPending.length > 0 && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleMatch}
              disabled={loading}
              startIcon={<AutoFixHighRoundedIcon />}
            >
              Match ({selectedPending.length})
            </Button>
          )}
        </Stack>
      }
    >
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {items.length === 0 && !loading && (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <Typography color="text.secondary">No auto-match candidates found.</Typography>
        </Stack>
      )}

      {items.length > 0 && (
        <>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, ml: 0.5 }}>
            <Checkbox
              size="small"
              checked={selected.length === items.length && items.length > 0}
              indeterminate={selected.length > 0 && selected.length < items.length}
              onChange={handleSelectAll}
            />
            <Typography variant="body2" color="text.secondary">
              {selected.length} of {items.length} selected
              {hasMatched && ` (${items.filter((i) => i.alreadyMatched).length} already matched)`}
            </Typography>
          </Stack>

          <Stack spacing={1.5}>
            {items.map((item, index) => (
              <Box
                key={index}
                onClick={() => handleToggle(index)}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: selected.includes(index)
                    ? 'rgba(55,214,122,0.3)'
                    : 'rgba(255,255,255,0.08)',
                  bgcolor: selected.includes(index)
                    ? 'rgba(55,214,122,0.08)'
                    : item.alreadyMatched
                      ? 'rgba(55,214,122,0.05)'
                      : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                }}
              >
                <Checkbox
                  size="small"
                  checked={selected.includes(index)}
                  sx={{ mr: 1, mt: -0.5, ml: -0.5 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {item.invoice?.invoice_number || `#${item.invoice?.id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fmtAmount(item.invoice?.total_amount ?? item.amount)} &middot; {fmtDate(item.invoice?.invoice_date)}
                      </Typography>
                    </Box>
                    <CompareArrowsRoundedIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {item.transaction?.description || `#${item.transaction?.id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fmtAmount(item.transaction?.amount ?? item.amount)} &middot; {fmtDate(item.transaction?.transaction_date)}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={2} sx={{ mt: 0.5 }} alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      Confidence: {item.confidence ? `${Math.round(item.confidence * 100)}%` : '\u2014'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Match: {item.amount ? fmtAmount(item.amount) : '\u2014'}
                    </Typography>
                    {item.message && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }} noWrap>
                        {item.message}
                      </Typography>
                    )}
                    {item.alreadyMatched && (
                      <Chip icon={<CheckCircleOutlineRoundedIcon />} label="Matched" size="small" color="success" variant="outlined" sx={{ height: 20, '& .MuiChip-icon': { fontSize: 14, ml: 0.5 } }} />
                    )}
                  </Stack>
                </Box>
              </Box>
            ))}
          </Stack>
        </>
      )}
    </ModalShell>
  )
}

AutoMatchPreviewModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
  onUnmatch: PropTypes.func,
  previewData: PropTypes.array,
  loading: PropTypes.bool,
}
