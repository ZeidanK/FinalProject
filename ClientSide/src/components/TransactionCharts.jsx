import { Box, Grid, Skeleton, Typography, useTheme } from '@mui/material'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import GlassCard from './GlassCard'
import { fmtShekel } from '../utils/formatters'

const COLORS = ['#58a6ff', '#37d67a', '#f59e0b', '#ff9ff3', '#ff6b6b', '#a9d5ff', '#b7ffd2', '#ffd0aa', '#c084fc', '#94a3b8']

function pieChartData(byCategory) {
  if (!byCategory?.length) return []
  const sorted = [...byCategory].sort((a, b) => b.sumAmount - a.sumAmount)
  const top = sorted.slice(0, 8)
  const rest = sorted.slice(8)
  if (rest.length > 0) {
    top.push({
      category: 'Other',
      count: rest.reduce((s, c) => s + c.count, 0),
      sumAmount: rest.reduce((s, c) => s + c.sumAmount, 0),
    })
  }
  return top
}

function barChartData(monthly) {
  if (!monthly?.length) return []
  const sorted = [...monthly].sort((a, b) => a.year - b.year || a.month - b.month)
  return sorted.slice(-12).map((m) => ({
    label: `${m.year}-${String(m.month).padStart(2, '0')}`,
    amount: m.sumAmount,
    count: m.count,
  }))
}

export default function TransactionCharts({ byCategory, monthly, loading }) {
  const theme = useTheme()
  const pieData = pieChartData(byCategory)
  const barData = barChartData(monthly)

  if (loading) {
    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard variant="default" sx={{ p: 2.8 }}>
            <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" width="100%" height={220} />
          </GlassCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard variant="default" sx={{ p: 2.8 }}>
            <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" width="100%" height={220} />
          </GlassCard>
        </Grid>
      </Grid>
    )
  }

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <GlassCard variant="default" sx={{ p: { xs: 2.2, md: 2.8 }, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Spending by Category</Typography>
          {pieData.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>No category data</Typography>
          ) : (
            <Box sx={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="sumAmount" nameKey="category" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={2}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => fmtShekel(value)}
                    contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          )}
        </GlassCard>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <GlassCard variant="default" sx={{ p: { xs: 2.2, md: 2.8 }, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Monthly Trend</Typography>
          {barData.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>No monthly data</Typography>
          ) : (
            <Box sx={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={barData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="label" stroke={theme.palette.text.disabled} tick={{ fontSize: 11 }} />
                  <YAxis stroke={theme.palette.text.disabled} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => fmtShekel(value)}
                    contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }}
                  />
                  <Bar dataKey="amount" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </GlassCard>
      </Grid>
    </Grid>
  )
}
