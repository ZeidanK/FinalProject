import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CollapsibleSection from '../../components/CollapsibleSection'

describe('CollapsibleSection', () => {
  it('renders title with count', () => {
    render(
      <CollapsibleSection title="Test Items" count={5} open onToggle={() => {}}>
        <div>child content</div>
      </CollapsibleSection>,
    )
    expect(screen.getByText('Test Items (5)')).toBeInTheDocument()
  })

  it('shows children when open', () => {
    render(
      <CollapsibleSection title="Test Items" count={5} open onToggle={() => {}}>
        <div>child content</div>
      </CollapsibleSection>,
    )
    expect(screen.getByText('child content')).toBeInTheDocument()
  })

  it('hides children when closed', () => {
    render(
      <CollapsibleSection title="Test Items" count={5} open={false} onToggle={() => {}}>
        <div>child content</div>
      </CollapsibleSection>,
    )
    expect(screen.queryByText('child content')).not.toBeInTheDocument()
  })

  it('calls onToggle when toggle button clicked', async () => {
    const onToggle = vi.fn()
    render(
      <CollapsibleSection title="Test Items" count={5} open onToggle={onToggle}>
        <div>child content</div>
      </CollapsibleSection>,
    )
    await userEvent.click(screen.getByRole('button', { name: /collapse test items/i }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
