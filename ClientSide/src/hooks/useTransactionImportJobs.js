import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getUploadJobStatus } from '../services/uploadJobs'
import { useRealtime } from '../context/useRealtime'
import { useNotification } from '../context/useNotification'
import { transactionKeys } from '../queries/queryKeys'

const POLL_INTERVAL_MS = 4000

export function useTransactionImportJobs({ activeCompanyId, token }) {
  const queryClient = useQueryClient()
  const { subscribe: subscribeRealtime } = useRealtime()
  const { notify } = useNotification()

  const pollingTimers = useRef({})
  const [importingJobs, setImportingJobs] = useState([])
  const txSessionKey = activeCompanyId ? `transaction_upload_jobs_${activeCompanyId}` : null

  const saveTxJobToSession = useCallback(
    (jobId, fileName) => {
      if (!txSessionKey) return
      try {
        const stored = JSON.parse(sessionStorage.getItem(txSessionKey) || '[]')
        if (!stored.find((j) => j.jobId === jobId))
          stored.push({ jobId, fileName })
        sessionStorage.setItem(txSessionKey, JSON.stringify(stored))
      } catch { /* ignore */ }
    },
    [txSessionKey],
  )

  const removeTxJobFromSession = useCallback(
    (jobId) => {
      if (!txSessionKey) return
      try {
        const stored = JSON.parse(sessionStorage.getItem(txSessionKey) || '[]')
        sessionStorage.setItem(txSessionKey, JSON.stringify(stored.filter((j) => j.jobId !== jobId)))
      } catch { /* ignore */ }
    },
    [txSessionKey],
  )

  const upsertImportingJob = useCallback((jobId, patch) => {
    setImportingJobs((prev) => {
      const idx = prev.findIndex((j) => j.jobId === jobId)
      if (idx === -1) return [...prev, { jobId, progress: 0, status: 'queued', fileName: '', ...patch }]
      const next = [...prev]
      next[idx] = { ...next[idx], ...patch }
      return next
    })
  }, [])

  const stopTxPolling = useCallback((jobId) => {
    if (pollingTimers.current[jobId]) {
      clearTimeout(pollingTimers.current[jobId])
      delete pollingTimers.current[jobId]
    }
  }, [])

  const startTxPolling = useCallback(
    (jobId, fileName) => {
      const poll = async () => {
        try {
          const job = await getUploadJobStatus(jobId, token)

          if (job.status === 'completed') {
            stopTxPolling(jobId)
            removeTxJobFromSession(jobId)
            const result = (() => { try { return JSON.parse(job.resultJson || 'null') } catch { return null } })()
            upsertImportingJob(jobId, { status: 'completed', progress: 100 })
            setImportingJobs((prev) => prev.filter((j) => j.jobId !== jobId))

            if (result?.isDuplicate) {
              notify({
                message: 'Duplicate Excel file detected. This file has already been imported and was skipped — check the Anomalies page for details.',
                severity: 'warning',
              })
              return
            }

            const count = result?.count ?? 0
            notify({ message: `Successfully imported ${count} transaction(s) from ${fileName}.`, severity: 'success' })
            queryClient.invalidateQueries({ queryKey: transactionKeys.byCompany(activeCompanyId) })
            return
          }

          if (job.status === 'failed' || job.status === 'canceled') {
            stopTxPolling(jobId)
            removeTxJobFromSession(jobId)
            upsertImportingJob(jobId, { status: 'failed', progress: 0 })
            notify({ message: job.errorMessage || `Import failed for ${fileName}.`, severity: 'error' })
            setImportingJobs((prev) => prev.filter((j) => j.jobId !== jobId))
            return
          }

          upsertImportingJob(jobId, { progress: Math.min(90, job.progressPercent || 30), status: job.status })
          pollingTimers.current[jobId] = setTimeout(poll, POLL_INTERVAL_MS)
        } catch {
          pollingTimers.current[jobId] = setTimeout(poll, POLL_INTERVAL_MS * 2)
        }
      }
      pollingTimers.current[jobId] = setTimeout(poll, POLL_INTERVAL_MS)
    },
    [token, stopTxPolling, removeTxJobFromSession, upsertImportingJob, queryClient, activeCompanyId, notify],
  )

  useEffect(() => {
    if (!txSessionKey || !token) return
    let stored = []
    try { stored = JSON.parse(sessionStorage.getItem(txSessionKey) || '[]') } catch { return }
    if (stored.length === 0) return
    stored.forEach(({ jobId, fileName }) => {
      getUploadJobStatus(jobId, token).then((job) => {
        const jStatus = (job?.status ?? '').toLowerCase()
        if (jStatus === 'completed' || jStatus === 'failed' || jStatus === 'canceled') {
          removeTxJobFromSession(jobId)
          if (jStatus === 'completed' && activeCompanyId) {
            queryClient.invalidateQueries({ queryKey: transactionKeys.byCompany(activeCompanyId) })
          }
        } else {
          upsertImportingJob(jobId, { status: jStatus || 'processing', progress: Math.min(90, job?.progressPercent ?? job?.ProgressPercent ?? 50), fileName })
          startTxPolling(jobId, fileName)
        }
      }).catch(() => {
        upsertImportingJob(jobId, { status: 'processing', progress: 50, fileName })
        startTxPolling(jobId, fileName)
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txSessionKey, token])

  useEffect(() => {
    return () => {
      Object.values(pollingTimers.current).forEach(clearTimeout)
      pollingTimers.current = {}
    }
  }, [])

  useEffect(() => {
    if (!subscribeRealtime) return
    const unsub = subscribeRealtime('uploadJobUpdated', (job) => {
      const jobId = job?.id ?? job?.Id
      if (!jobId) return
      const status = (job?.status ?? '').toLowerCase()
      if (status === 'completed' || status === 'failed' || status === 'canceled') {
        stopTxPolling(jobId)
        removeTxJobFromSession(jobId)
        upsertImportingJob(jobId, { status, progress: status === 'completed' ? 100 : 0 })
        setImportingJobs((prev) => prev.filter((j) => j.jobId !== jobId))
      } else {
        upsertImportingJob(jobId, { status, progress: Math.min(90, job?.progressPercent ?? job?.ProgressPercent ?? 30) })
      }
    })
    return unsub
  }, [subscribeRealtime, stopTxPolling, removeTxJobFromSession, upsertImportingJob])

  return { importingJobs, saveTxJobToSession, startTxPolling, upsertImportingJob }
}
