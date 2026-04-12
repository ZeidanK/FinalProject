/**
 * Shared motion variants for container animations.
 *
 * `containerVariants` is intended for parent motion elements that animate in
 * children using a staggered entrance.
 */
export const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', staggerChildren: 0.09 },
  },
}

/**
 * Shared motion variants for individual item animations.
 *
 * `itemVariants` is intended for children inside a staggered container.
 */
export const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}
