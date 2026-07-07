import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUserById, updateUser, changePassword, uploadProfilePicture, deleteUserAccount } from '../../services/users'
import { getCompaniesByUser, createCompany, updateCompany, deleteCompany } from '../../services/companies'
import { profileKeys } from '../../queries/queryKeys'

/**
 * Fetches the authenticated user's profile.
 *
 * @param {Object} params - Query parameters.
 * @param {string|number} params.userId - User identifier for profile retrieval.
 * @param {string} params.token - Authentication token for the request.
 * @param {boolean} [params.enabled=true] - Whether the query should be enabled.
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query result for user profile.
 */
export function useUserProfileQuery({ userId, token, enabled = true }) {
  return useQuery({
    queryKey: profileKeys.user(userId),
    queryFn: () => getUserById(userId, token),
    enabled: Boolean(userId) && Boolean(token) && enabled,
  })
}

/**
 * Fetches companies associated with the current user.
 *
 * @param {Object} params - Query parameters.
 * @param {string|number} params.userId - User identifier for company retrieval.
 * @param {string} params.token - Authentication token for the request.
 * @param {boolean} [params.enabled=true] - Whether the query should be enabled.
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query result for user companies.
 */
export function useUserCompaniesQuery({ userId, token, enabled = true }) {
  return useQuery({
    queryKey: profileKeys.companies(userId),
    queryFn: () => getCompaniesByUser(userId, token),
    enabled: Boolean(userId) && Boolean(token) && enabled,
  })
}

/**
 * Updates the user's profile and invalidates the cached profile query.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string|number} params.userId - User identifier for profile updates.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for updating the user profile.
 */
export function useUpdateProfileMutation({ userId, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => updateUser(userId, payload, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.user(userId) })
    },
  })
}

/**
 * Uploads a profile picture and refreshes the cached user profile.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string|number} params.userId - User identifier for profile picture upload.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for uploading a profile picture.
 */
export function useUploadProfilePictureMutation({ userId, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file) => uploadProfilePicture(userId, file, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.user(userId) })
    },
  })
}

/**
 * Changes the authenticated user's password.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string|number} params.userId - User identifier for password change.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for password updates.
 */
export function useChangePasswordMutation({ userId, token }) {
  return useMutation({
    mutationFn: (payload) => changePassword(userId, payload, token),
  })
}

/**
 * Creates a new company for the authenticated user and refreshes their companies list.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string|number} params.userId - User identifier for company creation cache invalidation.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for company creation.
 */
export function useCreateCompanyMutation({ userId, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => createCompany(payload, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.companies(userId) })
    },
  })
}

/**
 * Updates an existing company and refreshes the user's company list cache.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string|number} params.userId - User identifier for company list cache invalidation.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for company updates.
 */
export function useUpdateCompanyMutation({ userId, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ companyId, payload }) => updateCompany(companyId, payload, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.companies(userId) })
    },
  })
}

/**
 * Deletes an existing company and refreshes the cached company list for the user.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string|number} params.userId - User identifier for company list cache invalidation.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for company deletion.
 */
export function useDeleteCompanyMutation({ userId, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (companyId) => deleteCompany(companyId, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.companies(userId) })
    },
  })
}

export function useDeleteAccountMutation({ token }) {
  return useMutation({
    mutationFn: (userId) => deleteUserAccount(userId, token),
  })
}
