import { Box, Chip, Grid, Skeleton, Stack, Typography, useTheme } from '@mui/material'
import GlassCard from './GlassCard'
import { fmtShekel } from '../utils/formatters'

const chipPalette = {
  success: { bg: 'rgba(55, 214, 122, 0.18)', text: '#37d67a', border: 'rgba(55, 214, 122, 0.4)' },
  warning: { bg: 'rgba(245, 158, 11, 0.18)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.4)' },
  error:   { bg: 'rgba(255, 107, 107, 0.18)', text: '#ff6b6b', border: 'rgba(255, 107, 107, 0.4)' },
  info:    { bg: 'rgba(88, 166, 255, 0.18)', text: '#58a6ff', border: 'rgba(88, 166, 255, 0.4)' },
  default: { bg: 'rgba(148, 163, 184, 0.18)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.4)' },
}

function StatusChip({ label, count, color }) {
  const p = chipPalette[color] || chipPalette.default
  return (
    <Chip
      label={`${label}: ${count}`}
      size="small"
      sx={{
        color: p.text,
        borderColor: p.border,
        bgcolor: p.bg,
        fontWeight: 600,
      }}
      variant="outlined"
    />
  )
}

export default function TransactionSummaryVendors({ topVendors, status, loading }) {
  const theme = useTheme()

  if (loading) {
    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard variant="default" sx={{ p: 2.8 }}>
            <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" width="100%" height={180} />
          </GlassCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard variant="default" sx={{ p: 2.8 }}>
            <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" width="100%" height={180} />
          </GlassCard>
        </Grid>
      </Grid>
    )
  }

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <GlassCard variant="default" sx={{ p: { xs: 2.2, md: 2.8 }, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Top Vendors</Typography>
          {!topVendors?.length ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No vendor data</Typography>
          ) : (
            <Stack spacing={1}>
              {topVendors.map((v, i) => (
                <Stack key={v.vendorName} direction="row" alignItems="center" spacing={1.5}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.disabled, minWidth: 20, fontWeight: 700 }}>
                    {i + 1}
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap>{v.vendorName}</Typography>
                    <Typography variant="caption" color="text.secondary">{v.count} transaction{v.count !== 1 ? 's' : ''}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {fmtShekel(v.sumAmount)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </GlassCard>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <GlassCard variant="default" sx={{ p: { xs: 2.2, md: 2.8 }, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Status Overview</Typography>
          {!status ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No status data</Typography>
          ) : (
            <Stack spacing={1.5}>
              <StatusChip label="Matched" count={status.matchedCount} color="success" />
              <StatusChip label="Anomalies" count={status.anomalyCount} color="warning" />
              <StatusChip label="Duplicates" count={status.duplicateCount} color="error" />
              <StatusChip label="Requires Invoice" count={status.requiresInvoiceCount} color="info" />
              <StatusChip label="No Invoice Needed" count={status.withoutInvoiceCount} color="default" />
            </Stack>
          )}
        </GlassCard>
      </Grid>
    </Grid>
  )
}
