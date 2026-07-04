import { render, screen } from '@testing-library/react'
import PageSectionLayout from '../../components/PageSectionLayout'

describe('PageSectionLayout', () => {
  it('renders children', () => {
    render(
      <PageSectionLayout>
        <div>section content</div>
      </PageSectionLayout>
    )
    expect(screen.getByText('section content')).toBeInTheDocument()
  })
})
