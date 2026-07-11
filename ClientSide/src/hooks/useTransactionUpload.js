import { useCallback, useState } from 'react'
import Papa from 'papaparse'
import { previewExcel } from '../services/transactions'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const EXCEL_EXTENSIONS = new Set(['xlsx', 'xls'])

function validateFile(file) {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'csv' && !EXCEL_EXTENSIONS.has(ext))
    return 'Only CSV and Excel (.xlsx, .xls) files are accepted.'
  if (file.size > MAX_FILE_SIZE) return 'File exceeds 10 MB limit.'
  return null
}

function parseCSVData(text, baseId = 0) {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header?.trim(),
  })

  const rows = Array.isArray(result.data) ? result.data : []

  return rows.map((raw, index) => {
    const transactionDate = raw.transactionDate || raw.date || raw.transaction_date || ''
    const description = raw.description || raw.memo || ''
    const amountValue = Number.parseFloat(raw.amount)
    const amount = Number.isNaN(amountValue) ? 0 : amountValue
    const transactionType = (raw.transactionType || raw.transaction_type || raw.type || 'debit').toLowerCase()
    const category = raw.category || ''
    const referenceNumber = raw.referenceNumber || raw.reference_number || ''
    const postedDate = raw.postedDate || raw.posted_date || ''
    const vendorName = raw.vendorName || raw.vendor_name || ''

    return {
      _rowId: baseId + index,
      transactionDate,
      description,
      amount,
      transactionType,
      category,
      referenceNumber,
      postedDate,
      vendorName,
      _valid: Boolean(transactionDate && description && amount !== 0),
      _source: 'csv',
    }
  })
}

export function useTransactionUpload({ activeCompanyId, token }) {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [parsedRows, setParsedRows] = useState([])
  const [parseError, setParseError] = useState('')
  const [previewing, setPreviewing] = useState(false)

  const handleFiles = useCallback(
    async (files) => {
      if (!activeCompanyId) {
        setParseError('Select an assigned company before uploading transactions.')
        return
      }

      setParseError('')
      setPreviewing(true)
      setParsedRows([])
      setUploadedFiles([])

      const newUploadedFiles = []
      const accumulatedRows = []
      const errors = []
      let nextRowId = 0

      for (const file of files) {
        const error = validateFile(file)
        if (error) {
          errors.push(`${file.name}: ${error}`)
          continue
        }

        const ext = file.name.split('.').pop()?.toLowerCase()
        const isExcel = EXCEL_EXTENSIONS.has(ext)
        const fileMeta = { name: file.name, size: file.size, isExcel, filePath: null }

        if (isExcel) {
          try {
            const data = await previewExcel(file, activeCompanyId, token)
            const txns = data?.extractionResult?.transactions || []
            const filePath = data?.filePath || data?.FilePath || null
            if (txns.length === 0) {
              errors.push(`${file.name}: No transactions could be extracted from the Excel file.`)
              continue
            }

            fileMeta.filePath = filePath
            const rows = txns.map((t) => ({
              _rowId: nextRowId++,
              transactionDate: t.transactionDate || '',
              description: t.description || '',
              amount: typeof t.amount === 'number' ? t.amount : Number.parseFloat(t.amount) || 0,
              transactionType: (t.transactionType || 'debit').toLowerCase(),
              category: t.category || '',
              referenceNumber: t.referenceNumber || '',
              postedDate: t.postedDate || '',
              vendorName: t.vendorName || '',
              _valid: !!(t.transactionDate && t.description && t.amount && t.amount !== 0),
              _source: 'excel',
            }))
            accumulatedRows.push(...rows)
          } catch (err) {
            errors.push(`${file.name}: ${err.message || 'Failed to process Excel file.'}`)
            continue
          }
        } else {
          try {
            const text = await file.text()
            const rows = parseCSVData(text, nextRowId)
            nextRowId += rows.length
            if (rows.length === 0) {
              errors.push(`${file.name}: CSV file contains no data rows.`)
              continue
            }
            accumulatedRows.push(...rows)
          } catch (err) {
            errors.push(`${file.name}: ${err.message || 'Failed to read file.'}`)
            continue
          }
        }

        newUploadedFiles.push(fileMeta)
      }

      setUploadedFiles(newUploadedFiles)
      setParsedRows(accumulatedRows)
      if (errors.length > 0) setParseError(errors.join(' '))
      setPreviewing(false)
    },
    [activeCompanyId, token],
  )

  const removeRow = useCallback((rowId) => {
    setParsedRows((prev) => prev.filter((r) => r._rowId !== rowId))
  }, [])

  const clearUpload = useCallback(() => {
    setUploadedFiles([])
    setParsedRows([])
    setParseError('')
  }, [])

  const clearParseError = useCallback(() => setParseError(''), [])

  return {
    uploadedFiles,
    parsedRows,
    parseError,
    previewing,
    handleFiles,
    removeRow,
    clearUpload,
    clearParseError,
    validCount: parsedRows.filter((r) => r._valid).length,
    invalidCount: parsedRows.length - parsedRows.filter((r) => r._valid).length,
  }
}
