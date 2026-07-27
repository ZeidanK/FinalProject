import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmProvider, useConfirm } from '../../components/ConfirmContext'

function TestButton() {
  const { confirm } = useConfirm()
  return <button onClick={() => confirm('Delete this item?', 'Are you sure?')}>Delete</button>
}

describe('ConfirmContext', () => {
  it('shows dialog when confirm is triggered', async () => {
    render(
      <ConfirmProvider>
        <TestButton />
      </ConfirmProvider>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    expect(screen.getByText('Delete this item?')).toBeInTheDocument()
  })

  it('closes dialog on cancel', async () => {
    render(
      <ConfirmProvider>
        <TestButton />
      </ConfirmProvider>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument()
  })

  it('closes dialog on confirm', async () => {
    render(
      <ConfirmProvider>
        <TestButton />
      </ConfirmProvider>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument()
  })

  it('throws when useConfirm is used outside provider', () => {
    expect(() => render(<TestButton />)).toThrow('useConfirm must be used within a ConfirmProvider')
  })
})
