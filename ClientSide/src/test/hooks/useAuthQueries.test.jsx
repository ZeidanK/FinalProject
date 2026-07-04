import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockLoginUser = vi.fn()
const mockRegisterUser = vi.fn()

vi.mock('../../services/auth', () => ({
  loginUser: (...args) => mockLoginUser(...args),
  registerUser: (...args) => mockRegisterUser(...args),
}))

import {
  useLoginMutation,
  useLoginWithSessionMutation,
  useRegisterMutation,
} from '../../hooks/queries/useAuthQueries'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useLoginMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls loginUser with the payload and returns data on success', async () => {
    const payload = { email: 'test@example.com', password: 'secret' }
    mockLoginUser.mockResolvedValue({ token: 'abc123' })

    const { result } = renderHook(() => useLoginMutation(), {
      wrapper: createWrapper(),
    })

    const data = await result.current.mutateAsync(payload)

    expect(mockLoginUser).toHaveBeenCalledTimes(1)
    expect(mockLoginUser).toHaveBeenCalledWith(payload)
    expect(data).toEqual({ token: 'abc123' })
  })

  it('rejects when loginUser fails', async () => {
    mockLoginUser.mockRejectedValue(new Error('Invalid credentials'))

    const { result } = renderHook(() => useLoginMutation(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.mutateAsync({})).rejects.toThrow('Invalid credentials')
  })
})

describe('useLoginWithSessionMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls the provided loginFn with the payload', async () => {
    const mockLoginFn = vi.fn().mockResolvedValue({ user: { id: 1 } })

    const { result } = renderHook(() => useLoginWithSessionMutation(mockLoginFn), {
      wrapper: createWrapper(),
    })

    const data = await result.current.mutateAsync({ code: 'auth-code' })

    expect(mockLoginFn).toHaveBeenCalledTimes(1)
    expect(mockLoginFn).toHaveBeenCalledWith({ code: 'auth-code' })
    expect(data).toEqual({ user: { id: 1 } })
  })
})

describe('useRegisterMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls registerUser with the payload and returns data on success', async () => {
    const payload = { email: 'new@example.com', password: 'secret' }
    mockRegisterUser.mockResolvedValue({ id: 1 })

    const { result } = renderHook(() => useRegisterMutation(), {
      wrapper: createWrapper(),
    })

    const data = await result.current.mutateAsync(payload)

    expect(mockRegisterUser).toHaveBeenCalledTimes(1)
    expect(mockRegisterUser).toHaveBeenCalledWith(payload)
    expect(data).toEqual({ id: 1 })
  })

  it('rejects when registerUser fails', async () => {
    mockRegisterUser.mockRejectedValue(new Error('Email taken'))

    const { result } = renderHook(() => useRegisterMutation(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.mutateAsync({})).rejects.toThrow('Email taken')
  })
})
