export const COLUMN_COLORS = {
  unmatched: {
    border: 'rgba(245, 158, 11, 0.3)',
    header: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.04)',
    badge: 'rgba(245, 158, 11, 0.15)',
  },
  review: {
    border: 'rgba(88, 166, 255, 0.3)',
    header: '#58a6ff',
    bg: 'rgba(88, 166, 255, 0.04)',
    badge: 'rgba(88, 166, 255, 0.15)',
  },
  matched: {
    border: 'rgba(55, 214, 122, 0.3)',
    header: '#37d67a',
    bg: 'rgba(55, 214, 122, 0.04)',
    badge: 'rgba(55, 214, 122, 0.15)',
  },
}

export const CONFIDENCE_COLORS = {
  high: { color: '#37d67a', bg: 'rgba(55, 214, 122, 0.12)' },
  medium: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' },
  low: { color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)' },
}

export const METHOD_COLORS = {
  manual: { color: '#58a6ff', bg: 'rgba(88, 166, 255, 0.12)' },
  auto: { color: '#37d67a', bg: 'rgba(55, 214, 122, 0.12)' },
  simple: { color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)' },
  installment_simple: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' },
}
