import { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Alert, Box, Card, CardContent, CircularProgress, Typography,
} from '@mui/material'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'

export default function TransactionUploadZone({ activeCompanyId, onFiles, previewing, parseError, onDismissError }) {
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : []
    if (files.length > 0) onFiles(files)
  }

  const handleFileInput = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length > 0) onFiles(files)
    e.target.value = ''
  }

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3.5,
        border: '1px solid rgba(129, 191, 255, 0.12)',
        background: 'rgba(14, 24, 45, 0.65)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
      }}
    >
      <CardContent>
        {!activeCompanyId && (
          <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
            Select a company from your assigned companies before uploading or importing transactions.
          </Alert>
        )}

        <Box
          sx={{
            border: '2px dashed',
            borderColor: dragActive ? 'primary.main' : 'divider',
            borderRadius: 2,
            bgcolor: dragActive ? 'rgba(88,166,255,0.06)' : 'transparent',
            transition: 'all 0.2s',
            cursor: 'pointer',
            py: { xs: 4, md: 5 },
            textAlign: 'center',
          }}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CloudUploadRoundedIcon
            sx={{ fontSize: 44, color: dragActive ? 'primary.main' : 'text.secondary', mb: 1 }}
          />
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Drop one or more CSV or Excel files here or click to browse
          </Typography>
          <Typography variant="body2" color="text.secondary">
            CSV (.csv) and Excel (.xlsx, .xls) files — up to 10 MB each
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            multiple
            hidden
            onChange={handleFileInput}
          />
          {previewing && (
            <Box sx={{ mt: 2 }}>
              <CircularProgress size={28} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Processing Excel file…
              </Typography>
            </Box>
          )}
        </Box>

        {parseError && (
          <Alert severity="error" variant="outlined" sx={{ mt: 2 }} onClose={onDismissError}>
            {parseError}
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

TransactionUploadZone.propTypes = {
  activeCompanyId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onFiles: PropTypes.func.isRequired,
  previewing: PropTypes.bool,
  parseError: PropTypes.string,
  onDismissError: PropTypes.func,
}
