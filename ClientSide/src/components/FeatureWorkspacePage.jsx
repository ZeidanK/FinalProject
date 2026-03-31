import { Box, Card, CardContent, Chip, Container, Grid, Stack, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import EmptyState from './EmptyState'
import { useAuth } from '../context/AuthContext'

const roleLabels = {
  accountant: 'Accountant',
  business_owner: 'Business Owner',
  accountant_business_owner: 'Accountant + Business Owner',
}

const animationVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: 'easeOut',
      staggerChildren: 0.07,
    },
  },
}

function FeatureWorkspacePage({
  title,
  description,
  statusLabel,
  highlights,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
}) {
  const { user } = useAuth()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 1, md: 2 },
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Stack
          spacing={2.5}
          component={motion.div}
          variants={animationVariants}
          initial="hidden"
          animate="show"
        >
          <Card
            elevation={0}
            component={motion.div}
            variants={animationVariants}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background:
                'linear-gradient(145deg, rgba(13, 23, 42, 0.98), rgba(9, 16, 31, 0.96))',
            }}
          >
            <CardContent sx={{ p: { xs: 2.1, md: 2.8 } }}>
              <Stack spacing={1.5}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  justifyContent="space-between"
                  spacing={1.2}
                >
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '1.9rem' } }}>
                    {title}
                  </Typography>

                  <Chip
                    label={statusLabel}
                    sx={{
                      bgcolor: 'rgba(88, 166, 255, 0.16)',
                      border: '1px solid',
                      borderColor: 'rgba(129, 191, 255, 0.38)',
                      color: '#cde7ff',
                      fontWeight: 700,
                    }}
                  />
                </Stack>

                <Typography color="text.secondary">{description}</Typography>

                <Typography variant="body2" color="text.secondary">
                  Signed in as {user?.name || 'Unknown User'} ({roleLabels[user?.role] || 'Unknown role'})
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Grid container spacing={2} component={motion.div} variants={animationVariants}>
            {highlights.map((item) => (
              <Grid key={item.title} size={{ xs: 12, md: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    background:
                      'linear-gradient(160deg, rgba(14, 24, 42, 0.96), rgba(10, 18, 34, 0.96))',
                  }}
                >
                  <CardContent>
                    <Stack spacing={1.2}>
                      <Box>{item.icon}</Box>
                      <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.text}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={emptyActionLabel}
          />
        </Stack>
      </Container>
    </Box>
  )
}

export default FeatureWorkspacePage
