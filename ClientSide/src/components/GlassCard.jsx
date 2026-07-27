import PropTypes from 'prop-types'
import { Card, CardContent } from '@mui/material'
import { motion } from 'framer-motion'

const variantStyles = {
  default: {
    background: 'rgba(14, 24, 45, 0.65)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(129, 191, 255, 0.12)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
  },
  elevated: {
    background: 'rgba(16, 28, 52, 0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(129, 191, 255, 0.18)',
    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(129, 191, 255, 0.05)',
  },
  interactive: {
    background: 'rgba(14, 24, 45, 0.6)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(129, 191, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.2s',
    cursor: 'pointer',
    '&:hover': {
      borderColor: 'rgba(129, 191, 255, 0.35)',
      boxShadow: '0 12px 48px rgba(0, 0, 0, 0.35), 0 0 20px rgba(88, 166, 255, 0.08)',
      transform: 'translateY(-2px)',
    },
  },
  glow: {
    background: 'rgba(14, 24, 45, 0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(129, 191, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 24px rgba(88, 166, 255, 0.06)',
  },
}

export default function GlassCard({ variant = 'default', children, motionProps, sx, ...props }) {
  const styles = variantStyles[variant] || variantStyles.default

  const card = (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        ...styles,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  )

  if (motionProps) {
    return <motion.div {...motionProps}>{card}</motion.div>
  }

  return card
}

GlassCard.propTypes = {
  variant: PropTypes.oneOf(['default', 'elevated', 'interactive', 'glow']),
  children: PropTypes.node,
  motionProps: PropTypes.object,
  sx: PropTypes.object,
}
