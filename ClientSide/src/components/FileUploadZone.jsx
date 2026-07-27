import PropTypes from 'prop-types'
import { Card, CardContent, Typography } from '@mui/material'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import { useRef, useState } from 'react'

export default function FileUploadZone({ onFiles, accept = 'application/pdf', multiple = true, maxSizeMB = 10, disabled, helperText }) {
  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (disabled) return
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length > 0) onFiles?.(files)
  }

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) onFiles?.(files)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '2px dashed',
        borderColor: dragActive ? 'primary.main' : 'divider',
        bgcolor: dragActive ? 'rgba(88,166,255,0.06)' : 'transparent',
        transition: 'all 0.2s',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
      onDragEnter={disabled ? undefined : handleDrag}
      onDragOver={disabled ? undefined : handleDrag}
      onDragLeave={disabled ? undefined : handleDrag}
      onDrop={disabled ? undefined : handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <CardContent sx={{ py: { xs: 4, md: 6 }, textAlign: 'center' }}>
        <CloudUploadRoundedIcon
          sx={{ fontSize: 48, color: dragActive ? 'primary.main' : 'text.secondary', mb: 1.5 }}
        />
        <Typography variant="h6" sx={{ mb: 0.5 }}>
          {dragActive ? 'Drop files here' : 'Drop files here or click to browse'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {helperText || `${accept.replace('/*', '/')} files only — up to ${maxSizeMB} MB each`}
        </Typography>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          hidden
          onChange={handleFileInput}
        />
      </CardContent>
    </Card>
  )
}

FileUploadZone.propTypes = {
  onFiles: PropTypes.func.isRequired,
  accept: PropTypes.string,
  multiple: PropTypes.bool,
  maxSizeMB: PropTypes.number,
  disabled: PropTypes.bool,
  helperText: PropTypes.string,
}
