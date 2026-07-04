import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockGetUserById = vi.fn()
const mockUpdateUser = vi.fn()
const mockUploadProfilePicture = vi.fn()
const mockChangePassword = vi.fn()
const mockGetCompaniesByUser = vi.fn()
const mockCreateCompany = vi.fn()
const mockUpdateCompany = vi.fn()
const mockDeleteCompany = vi.fn()

vi.mock('../../services/users', () => ({
  getUserById: (...args) => mockGetUserById(...args),
  updateUser: (...args) => mockUpdateUser(...args),
  uploadProfilePicture: (...args) => mockUploadProfilePicture(...args),
  changePassword: (...args) => mockChangePassword(...args),
}))

vi.mock('../../services/companies', () => ({
  getCompaniesByUser: (...args) => mockGetCompaniesByUser(...args),
  createCompany: (...args) => mockCreateCompany(...args),
  updateCompany: (...args) => mockUpdateCompany(...args),
  deleteCompany: (...args) => mockDeleteCompany(...args),
}))

import {
  useUserProfileQuery,
  useUserCompaniesQuery,
  useUpdateProfileMutation,
  useUploadProfilePictureMutation,
  useChangePasswordMutation,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
} from '../../hooks/queries/useProfileQueries'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useUserProfileQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns user profile on success', async () => {
    const profile = { id: 1, name: 'John', email: 'john@example.com' }
    mockGetUserById.mockResolvedValue(profile)

    const { result } = renderHook(
      () => useUserProfileQuery({ userId: 1, token: 'tok', enabled: true }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(profile)
    expect(mockGetUserById).toHaveBeenCalledWith(1, 'tok')
  })

  it('is not enabled when userId is missing', () => {
    const { result } = renderHook(
      () => useUserProfileQuery({ userId: null, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useUserCompaniesQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns user companies on success', async () => {
    const companies = [{ id: 1, name: 'Acme' }]
    mockGetCompaniesByUser.mockResolvedValue(companies)

    const { result } = renderHook(
      () => useUserCompaniesQuery({ userId: 1, token: 'tok', enabled: true }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(companies)
    expect(mockGetCompaniesByUser).toHaveBeenCalledWith(1, 'tok')
  })
})

describe('useUpdateProfileMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls updateUser with userId, payload, and token', async () => {
    mockUpdateUser.mockResolvedValue({ id: 1, name: 'Jane' })

    const { result } = renderHook(
      () => useUpdateProfileMutation({ userId: 1, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync({ name: 'Jane' })

    expect(mockUpdateUser).toHaveBeenCalledWith(1, { name: 'Jane' }, 'tok')
    expect(data).toEqual({ id: 1, name: 'Jane' })
  })
})

describe('useUploadProfilePictureMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls uploadProfilePicture with userId, file, and token', async () => {
    mockUploadProfilePicture.mockResolvedValue({ url: 'http://example.com/pic.jpg' })

    const { result } = renderHook(
      () => useUploadProfilePictureMutation({ userId: 1, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const file = new File([''], 'avatar.jpg')
    const data = await result.current.mutateAsync(file)

    expect(mockUploadProfilePicture).toHaveBeenCalledWith(1, file, 'tok')
    expect(data).toEqual({ url: 'http://example.com/pic.jpg' })
  })
})

describe('useChangePasswordMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls changePassword with userId, payload, and token', async () => {
    mockChangePassword.mockResolvedValue({ success: true })

    const { result } = renderHook(
      () => useChangePasswordMutation({ userId: 1, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync({ oldPassword: 'old', newPassword: 'new' })

    expect(mockChangePassword).toHaveBeenCalledWith(1, { oldPassword: 'old', newPassword: 'new' }, 'tok')
    expect(data).toEqual({ success: true })
  })
})

describe('useCreateCompanyMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls createCompany with payload and token', async () => {
    mockCreateCompany.mockResolvedValue({ id: 1, name: 'NewCo' })

    const { result } = renderHook(
      () => useCreateCompanyMutation({ userId: 1, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync({ name: 'NewCo' })

    expect(mockCreateCompany).toHaveBeenCalledWith({ name: 'NewCo' }, 'tok')
    expect(data).toEqual({ id: 1, name: 'NewCo' })
  })
})

describe('useUpdateCompanyMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls updateCompany with companyId, payload, and token', async () => {
    mockUpdateCompany.mockResolvedValue({ id: 1, name: 'UpdatedCo' })

    const { result } = renderHook(
      () => useUpdateCompanyMutation({ userId: 1, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync({ companyId: 1, payload: { name: 'UpdatedCo' } })

    expect(mockUpdateCompany).toHaveBeenCalledWith(1, { name: 'UpdatedCo' }, 'tok')
    expect(data).toEqual({ id: 1, name: 'UpdatedCo' })
  })
})

describe('useDeleteCompanyMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls deleteCompany with companyId and token', async () => {
    mockDeleteCompany.mockResolvedValue({ id: 1 })

    const { result } = renderHook(
      () => useDeleteCompanyMutation({ userId: 1, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync(1)

    expect(mockDeleteCompany).toHaveBeenCalledWith(1, 'tok')
    expect(data).toEqual({ id: 1 })
  })
})
