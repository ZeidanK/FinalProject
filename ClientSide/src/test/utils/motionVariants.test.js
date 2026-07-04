import { describe, it, expect } from 'vitest'
import { containerVariants, itemVariants } from '../../utils/motionVariants'

describe('containerVariants', () => {
  it('has hidden state with opacity 0 and y 20', () => {
    expect(containerVariants.hidden).toEqual({ opacity: 0, y: 20 })
  })

  it('has show state with opacity 1 and staggered transition', () => {
    expect(containerVariants.show.opacity).toBe(1)
    expect(containerVariants.show.y).toBe(0)
    expect(containerVariants.show.transition.duration).toBe(0.5)
    expect(containerVariants.show.transition.ease).toBe('easeOut')
    expect(containerVariants.show.transition.staggerChildren).toBe(0.09)
  })
})

describe('itemVariants', () => {
  it('has hidden state with opacity 0 and y 14', () => {
    expect(itemVariants.hidden).toEqual({ opacity: 0, y: 14 })
  })

  it('has show state with opacity 1 and quick transition', () => {
    expect(itemVariants.show.opacity).toBe(1)
    expect(itemVariants.show.y).toBe(0)
    expect(itemVariants.show.transition.duration).toBe(0.35)
  })
})
