import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('framer-motion', () => {
  const React = require('react')
  return {
    motion: {
      div: ({ children, ...props }) => {
        const { initial, animate, exit, transition, layout, ...rest } = props
        return React.createElement('div', rest, children)
      },
    },
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
    useInView: () => true,
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
    useMotionValue: (v) => ({ get: () => v, set: vi.fn() }),
    useTransform: (v) => v,
  }
})

class MockIntersectionObserver {
  constructor(callback) { this.callback = callback }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}
window.IntersectionObserver = MockIntersectionObserver

HTMLCanvasElement.prototype.getContext = function () {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    createRadialGradient: () => ({ addColorStop: vi.fn() }),
    fillStyle: '',
    fill: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
  }
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

window.scrollTo = vi.fn()
