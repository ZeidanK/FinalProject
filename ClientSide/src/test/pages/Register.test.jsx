import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RegisterPage from '../../pages/Register'

vi.mock('../../hooks/queries/useAuthQueries', () => ({
  useRegisterMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

describe('RegisterPage', () => {
  const renderPage = () => render(<MemoryRouter><RegisterPage /></MemoryRouter>)

  it('renders registration heading', () => {
    renderPage()
    expect(screen.getByText('Register in seconds')).toBeInTheDocument()
  })

  it('renders form fields', () => {
    renderPage()
    expect(screen.getByRole('textbox', { name: /full name/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Confirm Password/)).toBeInTheDocument()
  })

  it('renders role toggle buttons', () => {
    renderPage()
    expect(screen.getByText('Accountant')).toBeInTheDocument()
    expect(screen.getByText('Business Owner')).toBeInTheDocument()
  })

  it('renders Create Account button', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
  })

  it('renders link to login', () => {
    renderPage()
    const link = screen.getByText('Log in').closest('a')
    expect(link).toHaveAttribute('href', '/login')
  })

  it('toggles password visibility', async () => {
    renderPage()
    const passwordInput = screen.getByLabelText(/^Password/)
    expect(passwordInput).toHaveAttribute('type', 'password')
    const toggleBtn = screen.getAllByTestId('VisibilityOutlinedIcon')[0].closest('button')
    await userEvent.click(toggleBtn)
    expect(passwordInput).toHaveAttribute('type', 'text')
  })
})
