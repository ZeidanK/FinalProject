import { useState } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Button,
  Checkbox,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded'
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded'
import ModalShell from './ModalShell'
import { fmtAmount, fmtDate } from '../utils/formatters'

export default function AutoMatchPreviewModal({
  open,
  onClose,
  onConfirm,
  previewData,
  loading,
}) {
  const [selected, setSelected] = useState([])

  const items = Array.isArray(previewData) ? previewData : []

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

  const handleConfirm = () => {
    const selectedItems = selected.map((i) => items[i])
    onConfirm(selectedItems)
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
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirm}
            disabled={selected.length === 0 || loading}
            startIcon={<AutoFixHighRoundedIcon />}
          >
            Match {selected.length > 0 ? `(${selected.length})` : ''}
          </Button>
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
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Checkbox
              size="small"
              checked={selected.length === items.length && items.length > 0}
              indeterminate={selected.length > 0 && selected.length < items.length}
              onChange={handleSelectAll}
            />
            <Typography variant="body2" color="text.secondary">
              {selected.length} of {items.length} selected
            </Typography>
          </Stack>

          <Stack spacing={1.5}>
            {items.map((item, index) => (
              <Box key={index} sx={{ position: 'relative' }}>
                <Checkbox
                  size="small"
                  checked={selected.includes(index)}
                  onChange={() => handleToggle(index)}
                  sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}
                />
                <Box sx={{ ml: 4, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: selected.includes(index) ? 'rgba(55,214,122,0.3)' : 'rgba(255,255,255,0.08)', bgcolor: 'rgba(255,255,255,0.02)' }}>
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
                  <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Confidence: {item.confidence ? `${Math.round(item.confidence * 100)}%` : '\u2014'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Amount: {item.amount ? fmtAmount(item.amount) : '\u2014'}
                    </Typography>
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
  onConfirm: PropTypes.func.isRequired,
  previewData: PropTypes.array,
  loading: PropTypes.bool,
}
