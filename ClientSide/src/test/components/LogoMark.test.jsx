import { render } from '@testing-library/react'
import LogoMark from '../../components/LogoMark'

describe('LogoMark', () => {
  it('renders without crashing', () => {
    const { container } = render(<LogoMark />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders with custom sx styles without crashing', () => {
    const { container } = render(<LogoMark sx={{ bgcolor: 'error.main' }} />)
    expect(container.firstChild).toBeInTheDocument()
  })
})
