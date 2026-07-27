import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RegisterPage from '../../pages/Register'

const mockMutateAsync = vi.fn()

vi.mock('../../hooks/queries/useAuthQueries', () => ({
  useRegisterMutation: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}))

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

async function fillValidForm(user) {
  await user.type(screen.getByRole('textbox', { name: /full name/i }), 'John Doe')
  await user.type(screen.getByRole('textbox', { name: /email/i }), 'john@example.com')
  await user.type(screen.getByLabelText(/^Password/i), 'StrongP@ss1')
  await user.type(screen.getByLabelText(/^Confirm Password/i), 'StrongP@ss1')
  await user.click(screen.getByRole('checkbox', { name: /terms of service/i }))
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders registration heading', () => {
    renderPage()
    expect(screen.getByText('Get started free')).toBeInTheDocument()
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
    const user = userEvent.setup()
    renderPage()
    const passwordInput = screen.getByLabelText(/^Password/)
    expect(passwordInput).toHaveAttribute('type', 'password')
    const toggleBtn = screen.getAllByTestId('VisibilityOutlinedIcon')[0].closest('button')
    await user.click(toggleBtn)
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('switches role on toggle click', async () => {
    const user = userEvent.setup()
    renderPage()
    const accountantBtn = screen.getByRole('button', { name: /accountant/i })
    await user.click(accountantBtn)
    expect(accountantBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows error alert when terms are not accepted', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByRole('textbox', { name: /full name/i }), 'John Doe')
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'john@example.com')
    await user.type(screen.getByLabelText(/^Password/i), 'StrongP@ss1')
    await user.type(screen.getByLabelText(/^Confirm Password/i), 'StrongP@ss1')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))
    expect(screen.getByText('You must accept the terms and conditions to register.')).toBeInTheDocument()
  })

  it('shows password mismatch error', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/^Password/i), 'StrongP@ss1')
    await user.type(screen.getByLabelText(/^Confirm Password/i), 'DifferentP@ss1')
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
  })

  it('calls mutateAsync with form values on valid submit', async () => {
    mockMutateAsync.mockResolvedValue({ userId: 1 })
    const user = userEvent.setup()
    renderPage()
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Create Account' }))
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongP@ss1',
        role: 'business_owner',
      })
    })
  })

  it('displays error alert on mutation failure', async () => {
    mockMutateAsync.mockRejectedValue(new Error('A user with this email already exists.'))
    const user = userEvent.setup()
    renderPage()
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Create Account' }))
    await waitFor(() => {
      expect(screen.getByText('A user with this email already exists.')).toBeInTheDocument()
    })
  })
})
