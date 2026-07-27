import PropTypes from 'prop-types'
import { Box, useMediaQuery, useTheme } from '@mui/material'
import { useEffect, useRef } from 'react'

const ORB_COLORS = [
  'rgba(88, 166, 255, 0.15)',
  'rgba(130, 80, 220, 0.12)',
  'rgba(0, 210, 200, 0.10)',
  'rgba(255, 100, 150, 0.08)',
]

export default function AnimatedBackground({ density = 'medium' }) {
  const theme = useTheme()
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const canvasRef = useRef(null)
  const orbsRef = useRef([])
  const frameRef = useRef(null)

  const orbCount = { low: 3, medium: 5, high: 8 }[density] || 5

  useEffect(() => {
    if (prefersReduced) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w, h

    const resize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    orbsRef.current = Array.from({ length: orbCount }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: 120 + Math.random() * 180,
      color: ORB_COLORS[i % ORB_COLORS.length],
      phase: Math.random() * Math.PI * 2,
    }))

    const animate = (time) => {
      ctx.clearRect(0, 0, w, h)
      for (const orb of orbsRef.current) {
        orb.x += orb.vx + Math.sin(time * 0.0005 + orb.phase) * 0.15
        orb.y += orb.vy + Math.cos(time * 0.0004 + orb.phase) * 0.15
        if (orb.x < -orb.radius) orb.x = w + orb.radius
        if (orb.x > w + orb.radius) orb.x = -orb.radius
        if (orb.y < -orb.radius) orb.y = h + orb.radius
        if (orb.y > h + orb.radius) orb.y = -orb.radius

        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius)
        gradient.addColorStop(0, orb.color)
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2)
        ctx.fill()
      }
      frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(frameRef.current)
    }
  }, [orbCount, prefersReduced])

  if (prefersReduced) return null

  return (
    <Box
      ref={canvasRef}
      component="canvas"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.6,
      }}
    />
  )
}

AnimatedBackground.propTypes = {
  density: PropTypes.oneOf(['low', 'medium', 'high']),
}
