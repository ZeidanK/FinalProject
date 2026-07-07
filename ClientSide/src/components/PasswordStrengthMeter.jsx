import { useMemo } from 'react'
import { Box, LinearProgress, Typography, useTheme } from '@mui/material'
import PropTypes from 'prop-types'

const WEAK_RULES = [
  { test: (pw) => pw.length >= 8, label: 'At least 8 characters' },
  { test: (pw) => /[A-Z]/.test(pw), label: 'One uppercase letter' },
  { test: (pw) => /[a-z]/.test(pw), label: 'One lowercase letter' },
  { test: (pw) => /\d/.test(pw), label: 'One number' },
  { test: (pw) => /[!@#$%^&*(),.?":{}|<>]/.test(pw), label: 'One special character' },
]

export default function PasswordStrengthMeter({ password }) {
  const theme = useTheme()

  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'transparent', barColor: 'transparent' }
    const passed = WEAK_RULES.filter((r) => r.test(password)).length
    const score = Math.round((passed / WEAK_RULES.length) * 100)
    if (score <= 20) return { score, label: 'Weak', color: theme.palette.error.main, barColor: 'error' }
    if (score <= 40) return { score, label: 'Fair', color: theme.palette.warning.main, barColor: 'warning' }
    if (score <= 60) return { score, label: 'Good', color: theme.palette.info.main, barColor: 'info' }
    if (score <= 80) return { score, label: 'Strong', color: theme.palette.success.light, barColor: 'success' }
    return { score, label: 'Very Strong', color: theme.palette.success.main, barColor: 'success' }
  }, [password, theme])

  if (!password) return null

  const passedRules = WEAK_RULES.filter((r) => r.test(password))
  const failedRules = WEAK_RULES.filter((r) => !r.test(password))

  return (
    <Box sx={{ mt: 0.5 }}>
      <LinearProgress
        variant="determinate"
        value={strength.score}
        color={strength.barColor}
        sx={{ height: 4, borderRadius: 2, mb: 0.8, bgcolor: 'rgba(255,255,255,0.06)' }}
      />
      <Typography variant="caption" sx={{ color: strength.color, fontWeight: 600 }}>
        {strength.label}
      </Typography>
      <Box sx={{ mt: 0.3 }}>
        {passedRules.map((r) => (
          <Typography key={r.label} variant="caption" sx={{ display: 'block', color: theme.palette.success.main, fontSize: '0.65rem', lineHeight: 1.5 }}>
            ✓ {r.label}
          </Typography>
        ))}
        {failedRules.map((r) => (
          <Typography key={r.label} variant="caption" sx={{ display: 'block', color: theme.palette.text.disabled, fontSize: '0.65rem', lineHeight: 1.5 }}>
            ○ {r.label}
          </Typography>
        ))}
      </Box>
    </Box>
  )
}

PasswordStrengthMeter.propTypes = {
  password: PropTypes.string,
}
