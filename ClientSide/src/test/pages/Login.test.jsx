import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '../../pages/Login'

vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({ login: vi.fn(), logout: vi.fn() }),
}))

vi.mock('../../hooks/queries/useAuthQueries', () => ({
  useLoginWithSessionMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

describe('Login', () => {
  const renderPage = () => render(<MemoryRouter><Login /></MemoryRouter>)

  it('renders welcome heading', () => {
    renderPage()
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
  })

  it('renders email and password fields', () => {
    renderPage()
    const emailInput = screen.getByRole('textbox', { name: /email/i })
    expect(emailInput).toBeInTheDocument()
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument()
  })

  it('renders Log In button', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument()
  })

  it('renders link to register', () => {
    renderPage()
    const link = screen.getByText('Register').closest('a')
    expect(link).toHaveAttribute('href', '/register')
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
