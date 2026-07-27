import { Box } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

export default function PageTransitionWrapper({ children }) {
  const { pathname } = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Box
        key={pathname}
        component={motion.div}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {children}
      </Box>
    </AnimatePresence>
  )
}

PageTransitionWrapper.propTypes = {
  children: PropTypes.node.isRequired,
}
