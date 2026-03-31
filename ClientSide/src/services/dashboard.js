import { getDashboardReport } from './reports'
import { getInvoicesByCompany } from './invoices'
import { getMatchesByCompany } from './matches'
import { getAnomaliesByCompany } from './anomalies'

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function getDashboardStats({ companyId, token }) {
  return getDashboardReport(companyId, token)
}

export async function getRecentActivity({ companyId, token }) {
  const [invoices, matches, anomalies] = await Promise.allSettled([
    getInvoicesByCompany(companyId, {}, token),
    getMatchesByCompany(companyId, token),
    getAnomaliesByCompany(companyId, {}, token),
  ])

  const items = []

  if (invoices.status === 'fulfilled' && Array.isArray(invoices.value)) {
    for (const inv of invoices.value.slice(0, 5)) {
      items.push({
        date: inv.createdAt || inv.invoiceDate,
        text: `Invoice ${inv.invoiceNumber || `#${inv.id}`} from ${inv.vendorName || 'unknown vendor'} — ${inv.status || 'uploaded'}`,
      })
    }
  }

  if (matches.status === 'fulfilled' && Array.isArray(matches.value)) {
    for (const m of matches.value.slice(0, 5)) {
      items.push({
        date: m.createdAt,
        text: `Match: Invoice ${m.invoiceNumber || `#${m.invoiceId}`} ↔ ${m.transactionDescription || `Transaction #${m.transactionId}`} (${m.matchMethod || 'manual'})`,
      })
    }
  }

  if (anomalies.status === 'fulfilled' && Array.isArray(anomalies.value)) {
    for (const a of anomalies.value.slice(0, 5)) {
      items.push({
        date: a.createdAt,
        text: `Anomaly: ${a.title || a.anomalyType || 'Issue detected'} — ${a.severity || 'medium'} severity`,
      })
    }
  }

  items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))

  return items.slice(0, 8)
}

export function mapDashboardStatsToKpis(stats) {
  const safeStats = stats || {}

  return [
    {
      title: 'Open Runs',
      value: String(toNumber(safeStats.processingInvoices, 0)),
      subtitle: 'Reconciliation batches in progress',
    },
    {
      title: 'Pending Matches',
      value: String(toNumber(safeStats.unmatchedTransactions, 0)),
      subtitle: 'Transactions awaiting review',
    },
    {
      title: 'Exceptions',
      value: String(toNumber(safeStats.openAnomalies, 0)),
      subtitle: 'Items with anomalies detected',
    },
    {
      title: 'Total Matches',
      value: String(toNumber(safeStats.totalMatches, 0)),
      subtitle: 'Approved invoice to transaction links',
    },
  ]
}
