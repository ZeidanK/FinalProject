import PropTypes from 'prop-types'
import { Box, Card, CardContent, Typography, useTheme, useMediaQuery } from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

const MOCK_DATA = [
  { name: 'Mon', matches: 12, anomalies: 2 },
  { name: 'Tue', matches: 18, anomalies: 1 },
  { name: 'Wed', matches: 24, anomalies: 3 },
  { name: 'Thu', matches: 15, anomalies: 0 },
  { name: 'Fri', matches: 28, anomalies: 4 },
  { name: 'Sat', matches: 8, anomalies: 1 },
  { name: 'Sun', matches: 5, anomalies: 0 },
]

export default function DashboardChart({ data = MOCK_DATA }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const chartData = Array.isArray(data) && data.length > 0 ? data : MOCK_DATA

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3.5,
        border: '1px solid rgba(129, 191, 255, 0.12)',
        background: 'rgba(14, 24, 45, 0.65)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
      }}
    >
      <CardContent sx={{ p: { xs: 2.2, md: 2.8 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom>
          Weekly Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Match and anomaly activity over the last 7 days.
        </Typography>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', width: '100%' }}>
          <Box sx={{ width: '100%', height: isMobile ? 200 : 260 }}>
            <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="matchGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis dataKey="name" stroke={theme.palette.text.disabled} tick={{ fontSize: 12 }} />
              <YAxis stroke={theme.palette.text.disabled} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                }}
              />
              <Area
                type="monotone"
                dataKey="matches"
                stroke={theme.palette.primary.main}
                fill="url(#matchGrad)"
                strokeWidth={2}
                name="Matches"
              />
              <Area
                type="monotone"
                dataKey="anomalies"
                stroke={theme.palette.warning.main}
                fill="url(#anomalyGrad)"
                strokeWidth={2}
                name="Anomalies"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

DashboardChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      matches: PropTypes.number,
      anomalies: PropTypes.number,
    }),
  ),
  loading: PropTypes.bool,
}
