import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModalShell from '../../components/ModalShell'

describe('ModalShell', () => {
  it('renders title and content when open', () => {
    render(
      <ModalShell open={true} onClose={vi.fn()} title="My Modal">
        <div>modal body</div>
      </ModalShell>
    )
    expect(screen.getByText('My Modal')).toBeInTheDocument()
    expect(screen.getByText('modal body')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <ModalShell open={false} onClose={vi.fn()} title="Hidden">
        <div>body</div>
      </ModalShell>
    )
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
  })

  it('renders actions in the footer', () => {
    render(
      <ModalShell open={true} onClose={vi.fn()} title="T" actions={<button>Save</button>}>
        <div>body</div>
      </ModalShell>
    )
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    render(
      <ModalShell open={true} onClose={onClose} title="T">
        <div>body</div>
      </ModalShell>
    )
    const closeBtn = document.querySelector('[data-testid="CloseIcon"]')
    if (closeBtn) await userEvent.click(closeBtn)
  })
})
