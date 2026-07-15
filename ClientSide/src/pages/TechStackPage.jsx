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
import { stackRationale, systemCapabilities, techStackSections } from './techStackData'

/**
 * Renders a single technology stack entry card.
 *
 * @param {Object} props
 * @param {Object} props.entry - The technology stack item to display.
 * @param {string} props.entry.name - The name of the technology.
 * @param {string} props.entry.what - What the technology is.
 * @param {string} props.entry.usedFor - The technology's usage in the project.
 * @param {string} props.entry.projectExample - A concrete project example for the technology.
 * @param {string[]} props.entry.positives - Positive aspects of using the technology.
 * @param {string[]} props.entry.improvements - Improvements enabled by the technology.
 * @returns {JSX.Element} The rendered stack entry card.
 */
function TechStackEntryCard({ entry }) {
  return (
    <Card
      component={motion.div}
      variants={itemVariants}
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 3.5,
        border: '1px solid rgba(129, 191, 255, 0.12)',
        background: 'rgba(14, 24, 45, 0.65)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
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

/**
 * Renders a product-readable capability with implementation evidence.
 *
 * @param {Object} props
 * @param {Object} props.capability - System capability content.
 * @param {string} props.capability.title - Capability title.
 * @param {string} props.capability.audienceBenefit - User-facing benefit.
 * @param {string} props.capability.implementationProof - Technical proof point.
 * @param {string[]} props.capability.evidence - Short evidence chips.
 * @returns {JSX.Element} The rendered capability card.
 */
function SystemCapabilityCard({ capability }) {
  return (
    <Card
      component={motion.div}
      variants={itemVariants}
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 3.5,
        border: '1px solid rgba(129, 191, 255, 0.12)',
        background: 'rgba(14, 24, 45, 0.65)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
      }}
    >
      <CardContent sx={{ p: { xs: 2.2, md: 2.5 }, display: 'flex', flexDirection: 'column', gap: 1.4 }}>
        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.08rem' } }}>
          {capability.title}
        </Typography>

        <Typography color="text.secondary">
          {capability.audienceBenefit}
        </Typography>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

        <Typography variant="body2" color="text.secondary">
          <strong>Implementation evidence:</strong> {capability.implementationProof}
        </Typography>

        <Stack direction="row" useFlexGap flexWrap="wrap" spacing={0.8}>
          {capability.evidence.map((item) => (
            <Chip
              key={item}
              label={item}
              size="small"
              sx={{
                bgcolor: 'rgba(93, 204, 126, 0.14)',
                border: '1px solid',
                borderColor: 'rgba(140, 230, 165, 0.32)',
                color: '#d5f7dc',
                fontWeight: 700,
              }}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

SystemCapabilityCard.propTypes = {
  capability: PropTypes.shape({
    title: PropTypes.string.isRequired,
    audienceBenefit: PropTypes.string.isRequired,
    implementationProof: PropTypes.string.isRequired,
    evidence: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
}

/**
 * Displays the project technology reference section with tech stack cards,
 * capabilities and stack rationale.
 *
 * @returns {JSX.Element} The rendered technology reference page.
 */
export default function TechStackPage() {
  return (
    <PageSectionLayout>
        <Card
          component={motion.div}
          variants={itemVariants}
          elevation={0}
          sx={{
            borderRadius: 3.5,
            border: '1px solid rgba(129, 191, 255, 0.12)',
            background: 'rgba(14, 24, 45, 0.65)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
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

      <Stack spacing={1.4} component={motion.div} variants={itemVariants}>
        <Box>
          <Typography variant="h5" sx={{ fontSize: { xs: '1.2rem', md: '1.45rem' } }}>
            System Capabilities
          </Typography>
          <Typography color="text.secondary">
            What the reconciliation platform can do today, with the implementation proof behind each capability.
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {systemCapabilities.map((capability) => (
            <Grid key={capability.title} size={{ xs: 12, md: 6 }}>
              <SystemCapabilityCard capability={capability} />
            </Grid>
          ))}
        </Grid>
      </Stack>

      <Card
        component={motion.div}
        variants={itemVariants}
        elevation={0}
        sx={{
          borderRadius: 3.5,
          border: '1px solid rgba(129, 191, 255, 0.12)',
          background: 'rgba(14, 24, 45, 0.65)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
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
