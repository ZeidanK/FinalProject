import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import NavigateBeforeRoundedIcon from '@mui/icons-material/NavigateBeforeRounded'
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded'
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded'
import ZoomOutRoundedIcon from '@mui/icons-material/ZoomOutRounded'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { downloadInvoicePdf } from '../services/invoices'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

function isPdfDocument(fileType, fileName, localFile) {
  if (localFile?.type === 'application/pdf') return true
  if ((fileType || '').toLowerCase().includes('pdf')) return true
  return (fileName || '').toLowerCase().endsWith('.pdf')
}

export default function InvoicePdfPreview(props) {
  const open = props.open
  const invoiceId = props.invoiceId
  const token = props.token
  const fileType = props.fileType
  const fileName = props.fileName
  const localFile = props.localFile

  const [sourceUrl, setSourceUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [scale, setScale] = useState(1)

  const containerRef = useRef(null)
  const [pageWidth, setPageWidth] = useState(0)

  const canPreviewPdf = useMemo(
    () => isPdfDocument(fileType, fileName, localFile),
    [fileType, fileName, localFile],
  )

  useEffect(() => {
    if (!open || !canPreviewPdf) return undefined

    let revokedUrl = null
    let canceled = false

    const loadPdf = async () => {
      setLoading(true)
      setError('')
      setPageNumber(1)
      setPageCount(0)

      try {
        if (localFile) {
          const objectUrl = URL.createObjectURL(localFile)
          if (canceled) {
            URL.revokeObjectURL(objectUrl)
            return
          }
          revokedUrl = objectUrl
          setSourceUrl(objectUrl)
          return
        }

        if (!invoiceId || !token) {
          setError('No invoice file is available to preview.')
          setSourceUrl(null)
          return
        }

        const { blob } = await downloadInvoicePdf(invoiceId, token)
        const objectUrl = URL.createObjectURL(blob)
        if (canceled) {
          URL.revokeObjectURL(objectUrl)
          return
        }

        revokedUrl = objectUrl
        setSourceUrl(objectUrl)
      } catch (err) {
        if (canceled) return
        let message = err.message || 'Unable to load PDF preview.'
        if (err.status === 404) message = 'No saved file was found for this invoice.'
        if (err.status === 403) message = 'You are not allowed to view this invoice file.'
        setError(message)
        setSourceUrl(null)
      } finally {
        if (!canceled) setLoading(false)
      }
    }

    loadPdf()

    return () => {
      canceled = true
      setSourceUrl(null)
      if (revokedUrl) URL.revokeObjectURL(revokedUrl)
    }
  }, [open, invoiceId, token, localFile, canPreviewPdf])

  useEffect(() => {
    if (!open) return undefined

    const updateWidth = () => {
      const width = containerRef.current?.clientWidth || 0
      setPageWidth(Math.max(280, width - 16))
    }

    updateWidth()
    globalThis.addEventListener('resize', updateWidth)

    return () => {
      globalThis.removeEventListener('resize', updateWidth)
    }
  }, [open])

  const openInNewTab = useCallback(() => {
    if (!sourceUrl) return
    globalThis.open(sourceUrl, '_blank', 'noopener,noreferrer')
  }, [sourceUrl])

  const goPrevPage = useCallback(() => {
    setPageNumber((prev) => Math.max(1, prev - 1))
  }, [])

  const goNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(pageCount, prev + 1))
  }, [pageCount])

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(2.2, +(prev + 0.15).toFixed(2)))
  }, [])

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(0.6, +(prev - 0.15).toFixed(2)))
  }, [])

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'rgba(255,255,255,0.02)',
        minHeight: 0,
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap>
            PDF Preview
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {fileName || 'Invoice file'}
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.5} alignItems="center">
          <IconButton
            size="small"
            onClick={zoomOut}
            disabled={loading || !!error || !sourceUrl}
            aria-label="Zoom out"
          >
            <ZoomOutRoundedIcon fontSize="small" />
          </IconButton>
          <Typography variant="caption" sx={{ width: 40, textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </Typography>
          <IconButton
            size="small"
            onClick={zoomIn}
            disabled={loading || !!error || !sourceUrl}
            aria-label="Zoom in"
          >
            <ZoomInRoundedIcon fontSize="small" />
          </IconButton>
          <Button
            size="small"
            variant="outlined"
            startIcon={<OpenInNewRoundedIcon />}
            onClick={openInNewTab}
            disabled={!sourceUrl}
          >
            Open
          </Button>
        </Stack>
      </Stack>

      {canPreviewPdf ? null : (
        <Box sx={{ p: 2 }}>
          <Alert severity="info" variant="outlined">
            This attachment is not a PDF file, so inline preview is unavailable.
          </Alert>
        </Box>
      )}

      {canPreviewPdf ? (
        <Box ref={containerRef} sx={{ p: 1, flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'auto' }}>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', minHeight: 420 }}>
              <CircularProgress size={28} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                Loading PDF preview...
              </Typography>
            </Stack>
          ) : null}

          {!loading && error ? (
            <Alert severity="error" variant="outlined">
              {error}
            </Alert>
          ) : null}

          {!loading && !error && sourceUrl ? (
            <Stack spacing={1.5} alignItems="center">
              <Document
                file={sourceUrl}
                onLoadSuccess={({ numPages }) => {
                  setPageCount(numPages)
                  setPageNumber(1)
                }}
                onLoadError={() => {
                  setError('Failed to render this PDF file.')
                }}
                loading={null}
              >
                <Page
                  pageNumber={pageNumber}
                  width={pageWidth}
                  scale={scale}
                  renderTextLayer
                  renderAnnotationLayer
                />
              </Document>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ pb: 1 }}>
                <IconButton
                  size="small"
                  onClick={goPrevPage}
                  disabled={pageNumber <= 1}
                  aria-label="Previous page"
                >
                  <NavigateBeforeRoundedIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" color="text.secondary">
                  Page {pageNumber} of {pageCount || 1}
                </Typography>
                <IconButton
                  size="small"
                  onClick={goNextPage}
                  disabled={pageNumber >= pageCount}
                  aria-label="Next page"
                >
                  <NavigateNextRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          ) : null}
        </Box>
      ) : null}
    </Box>
  )
}

InvoicePdfPreview.propTypes = {
  open: PropTypes.bool,
  invoiceId: PropTypes.number,
  token: PropTypes.string,
  fileType: PropTypes.string,
  fileName: PropTypes.string,
  localFile: PropTypes.instanceOf(File),
}

InvoicePdfPreview.defaultProps = {
  open: false,
  invoiceId: null,
  token: null,
  fileType: null,
  fileName: null,
  localFile: null,
}
