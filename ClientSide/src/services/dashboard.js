import { getDashboardReport } from './reports'
import { getInvoicesByCompany } from './invoices'
import { getMatchesByCompany } from './matches'
import { getAnomaliesByCompany } from './anomalies'

/**
 * Convert a value to a finite number, falling back to a default when invalid.
 *
 * @param {unknown} value - Value to convert.
 * @param {number} [fallback=0] - Default number when conversion fails.
 * @returns {number} Parsed number or fallback.
 */
const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * Fetch dashboard statistics for the given company.
 *
 * @param {{companyId: string|number, token: string}} params - Dashboard request parameters.
 * @returns {Promise<any>} Dashboard report payload.
 */
export async function getDashboardStats({ companyId, token }) {
  return getDashboardReport(companyId, token)
}

/**
 * Build a recent activity feed from invoices, matches, and anomalies.
 *
 * @param {{companyId: string|number, token: string}} params - Activity request parameters.
 * @returns {Promise<Array<{date: string, text: string}>>} Recent activity items.
 */
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

  return items.slice(0, 5)
}


/**
 * Map raw dashboard stats into KPI cards.
 *
 * @param {object} stats - Raw dashboard statistics payload.
 * @returns {Array<{title: string, value: string, subtitle: string}>} KPI card data.
 */
export function mapDashboardStatsToKpis(stats) {
  const safeStats = stats || {}

  return [
    {
      title: 'Pending Matches',
      value: String(toNumber(safeStats.unmatchedTransactions, 0)),
      subtitle: `Transactions awaiting review${safeStats.transactionsWithoutInvoice > 0 ? ` (${safeStats.transactionsWithoutInvoice} without invoices)` : ''}`,
    },
    {
      title: 'Pending Invoice Matches',
      value: String(toNumber(safeStats.unmatchedInvoices, 0)),
      subtitle: 'Invoices awaiting review',
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
