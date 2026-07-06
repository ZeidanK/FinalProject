import PropTypes from 'prop-types'
import { Box, Button, Card, CardContent, Chip, Container, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import LogoMark from './LogoMark'
import AnimatedBackground from './AnimatedBackground'

export default function AuthShellLayout({ chipLabel, children }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 5, md: 8 },
        background:
          'radial-gradient(circle at 8% 12%, rgba(88, 166, 255, 0.24), transparent 36%), radial-gradient(circle at 90% 0%, rgba(66, 130, 255, 0.2), transparent 30%), linear-gradient(180deg, #070b14 0%, #091021 62%, #0b1324 100%)',
      }}
    >
      <AnimatedBackground density="low" />
      <Container
        maxWidth="md"
        disableGutters
        sx={{ px: { xs: 2, sm: 3, md: 4, xl: 5 }, width: '100%', position: 'relative', zIndex: 1 }}
      >
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <LogoMark />
              <Typography variant="h6" fontWeight={700}>
                ReconFlow
              </Typography>
            </Stack>
            <Button component={RouterLink} to="/" variant="text" color="inherit">
              Back to Home
            </Button>
          </Stack>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid rgba(129, 191, 255, 0.12)',
                background: 'rgba(14, 24, 45, 0.7)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 12px 48px rgba(0, 0, 0, 0.35), 0 0 24px rgba(88, 166, 255, 0.06)',
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <Stack spacing={2.5}>
                  <Chip
                    label={chipLabel}
                    sx={{
                      alignSelf: 'flex-start',
                      fontWeight: 600,
                      bgcolor: 'rgba(88, 166, 255, 0.16)',
                      border: '1px solid',
                      borderColor: 'rgba(129, 191, 255, 0.38)',
                      color: '#cde7ff',
                    }}
                  />
                  {children}
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Stack>
      </Container>
    </Box>
  )
}

AuthShellLayout.propTypes = {
  chipLabel: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}
