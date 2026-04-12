import PropTypes from 'prop-types'
import { Box, Container, Stack } from '@mui/material'
import { motion } from 'framer-motion'
import { containerVariants } from '../utils/motionVariants'

/**
 * Render a page section wrapper with background styling and animated content.
 *
 * @param {{children: import('react').ReactNode}} props
 * @param {import('react').ReactNode} props.children - Section content to render inside the layout.
 * @returns {JSX.Element}
 */
export default function PageSectionLayout({ children }) {
  return (
    <Box
      sx={{
        py: { xs: 4, md: 6 },
        background:
          'radial-gradient(circle at 0% 5%, rgba(88,166,255,0.25), transparent 34%), radial-gradient(circle at 100% 0%, rgba(66,130,255,0.16), transparent 28%), linear-gradient(180deg, #070b14 0%, #091021 62%, #0b1324 100%)',
      }}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{ px: { xs: 2, sm: 3, md: 4, xl: 5 }, width: '100%' }}
      >
        <Stack
          component={motion.div}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          spacing={3}
        >
          {children}
        </Stack>
      </Container>
    </Box>
  )
}

PageSectionLayout.propTypes = {
  children: PropTypes.node.isRequired,
}
