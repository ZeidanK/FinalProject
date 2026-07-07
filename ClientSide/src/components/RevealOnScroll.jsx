import { Box } from '@mui/material'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import PropTypes from 'prop-types'

const DIR_OFFSET = {
  up: { y: 30 },
  down: { y: -30 },
  left: { x: 30 },
  right: { x: -30 },
}

export default function RevealOnScroll({ children, delay = 0, direction = 'up', sx }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  const offset = DIR_OFFSET[direction] || DIR_OFFSET.up

  return (
    <Box
      ref={ref}
      component={motion.div}
      initial={{ opacity: 0, ...offset }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      sx={sx}
    >
      {children}
    </Box>
  )
}

RevealOnScroll.propTypes = {
  children: PropTypes.node.isRequired,
  delay: PropTypes.number,
  direction: PropTypes.oneOf(['up', 'down', 'left', 'right']),
}
