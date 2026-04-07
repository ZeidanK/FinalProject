import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import PageSectionLayout from '../components/PageSectionLayout'
import { itemVariants } from '../utils/motionVariants'
import { requirementCoverage, stackRationale, techStackSections } from './techStackData'

function TechStackEntryCard({ entry }) {
  return (
    <Card
      component={motion.div}
      variants={itemVariants}
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(145deg, rgba(14, 25, 45, 0.97), rgba(9, 17, 33, 0.95))',
      }}
    >
      <CardContent sx={{ p: { xs: 2.2, md: 2.5 }, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }}>
            {entry.name}
          </Typography>
          <Chip
            label="In Use"
            size="small"
            sx={{
              bgcolor: 'rgba(88, 166, 255, 0.15)',
              border: '1px solid',
              borderColor: 'rgba(129, 191, 255, 0.38)',
              color: '#cde7ff',
              fontWeight: 700,
            }}
          />
        </Stack>

        <Typography color="text.secondary">
          <strong>What it is:</strong> {entry.what}
        </Typography>
        <Typography color="text.secondary">
          <strong>Used for:</strong> {entry.usedFor}
        </Typography>
        <Typography color="text.secondary">
          <strong>Project example:</strong> {entry.projectExample}
        </Typography>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

        <Box>
          <Typography sx={{ fontWeight: 700, mb: 0.6 }}>Positives</Typography>
          <Stack component="ul" sx={{ m: 0, pl: 2.2, color: 'text.secondary', gap: 0.45 }}>
            {entry.positives.map((point) => (
              <Typography key={point} component="li" variant="body2">
                {point}
              </Typography>
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 700, mb: 0.6 }}>Improvements provided</Typography>
          <Stack component="ul" sx={{ m: 0, pl: 2.2, color: 'text.secondary', gap: 0.45 }}>
            {entry.improvements.map((point) => (
              <Typography key={point} component="li" variant="body2">
                {point}
              </Typography>
            ))}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}

TechStackEntryCard.propTypes = {
  entry: PropTypes.shape({
    name: PropTypes.string.isRequired,
    what: PropTypes.string.isRequired,
    usedFor: PropTypes.string.isRequired,
    projectExample: PropTypes.string.isRequired,
    positives: PropTypes.arrayOf(PropTypes.string).isRequired,
    improvements: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
}

export default function TechStackPage() {
  return (
    <PageSectionLayout>
      <Card
        component={motion.div}
        variants={itemVariants}
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, rgba(14,25,45,0.98), rgba(9,17,33,0.97))',
          boxShadow: '0 24px 54px rgba(0,0,0,0.42)',
        }}
      >
        <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
          <Stack spacing={1}>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', md: '1.9rem' } }}>
              Project Technology Reference
            </Typography>
            <Typography color="text.secondary">
              Internal reference page that explains the technologies used in this project, why
              they are used, and what improvements they provide.
            </Typography>
            <Chip
              label="Direct-link page: /tech-stack"
              size="small"
              sx={{
                alignSelf: 'flex-start',
                bgcolor: 'rgba(255, 200, 120, 0.14)',
                border: '1px solid',
                borderColor: 'rgba(255, 205, 140, 0.4)',
                color: '#ffe0b2',
                fontWeight: 700,
              }}
            />
          </Stack>
        </CardContent>
      </Card>

      {techStackSections.map((section) => (
        <Stack key={section.title} spacing={1.4} component={motion.div} variants={itemVariants}>
          <Box>
            <Typography variant="h5" sx={{ fontSize: { xs: '1.2rem', md: '1.45rem' } }}>
              {section.title}
            </Typography>
            <Typography color="text.secondary">{section.description}</Typography>
          </Box>

          <Grid container spacing={2}>
            {section.entries.map((entry) => (
              <Grid key={entry.name} size={{ xs: 12, md: 6 }}>
                <TechStackEntryCard entry={entry} />
              </Grid>
            ))}
          </Grid>
        </Stack>
      ))}

      <Card
        component={motion.div}
        variants={itemVariants}
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(145deg, rgba(14, 25, 45, 0.97), rgba(9, 17, 33, 0.95))',
        }}
      >
        <CardContent sx={{ p: { xs: 2.2, md: 2.8 } }}>
          <Stack spacing={1.3}>
            <Typography variant="h5" sx={{ fontSize: { xs: '1.2rem', md: '1.4rem' } }}>
              Project Requirements Coverage
            </Typography>
            <Stack spacing={1}>
              {requirementCoverage.map((item) => (
                <Box
                  key={item.requirement}
                  sx={{
                    p: 1.4,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'rgba(255,255,255,0.08)',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Typography sx={{ fontWeight: 700 }}>{item.requirement}</Typography>
                    <Chip
                      label={item.status}
                      size="small"
                      sx={{
                        bgcolor:
                          item.status === 'Covered'
                            ? 'rgba(93, 204, 126, 0.18)'
                            : 'rgba(255, 200, 120, 0.16)',
                        border: '1px solid',
                        borderColor:
                          item.status === 'Covered'
                            ? 'rgba(140, 230, 165, 0.45)'
                            : 'rgba(255, 205, 140, 0.4)',
                        color: item.status === 'Covered' ? '#cbf5d5' : '#ffe0b2',
                        fontWeight: 700,
                      }}
                    />
                  </Stack>
                  <Typography color="text.secondary" sx={{ mt: 0.8 }}>
                    {item.proof}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card
        component={motion.div}
        variants={itemVariants}
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(145deg, rgba(14, 25, 45, 0.97), rgba(9, 17, 33, 0.95))',
        }}
      >
        <CardContent sx={{ p: { xs: 2.2, md: 2.8 } }}>
          <Stack spacing={1.2}>
            <Typography variant="h5" sx={{ fontSize: { xs: '1.2rem', md: '1.4rem' } }}>
              Why This Stack Was Chosen
            </Typography>
            <Stack component="ul" sx={{ m: 0, pl: 2.2, gap: 0.6, color: 'text.secondary' }}>
              {stackRationale.map((point) => (
                <Typography key={point} component="li" variant="body2">
                  {point}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </PageSectionLayout>
  )
}
