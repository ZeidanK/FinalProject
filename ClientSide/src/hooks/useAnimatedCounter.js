import { useEffect, useRef, useState } from 'react'

export default function useAnimatedCounter({ end, duration = 1000, enabled = true, formatter }) {
  const [value, setValue] = useState(0)
  const startTime = useRef(null)
  const frameRef = useRef(null)
  const startValue = useRef(0)

  useEffect(() => {
    if (!enabled) {
      setValue(end)
      return
    }

    startValue.current = 0
    startTime.current = null

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp
      const elapsed = timestamp - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      const current = eased * end
      setValue(current)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [end, duration, enabled])

  return formatter ? formatter(value) : Math.round(value)
}
