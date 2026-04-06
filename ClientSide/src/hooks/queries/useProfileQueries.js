import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUserById, updateUser, changePassword, uploadProfilePicture } from '../../services/users'
import { getCompaniesByUser, createCompany, updateCompany, deleteCompany } from '../../services/companies'
import { profileKeys } from '../../queries/queryKeys'

export function useUserProfileQuery({ userId, token, enabled = true }) {
  return useQuery({
    queryKey: profileKeys.user(userId),
    queryFn: () => getUserById(userId, token),
    enabled: Boolean(userId) && Boolean(token) && enabled,
  })
}

export function useUserCompaniesQuery({ userId, token, enabled = true }) {
  return useQuery({
    queryKey: profileKeys.companies(userId),
    queryFn: () => getCompaniesByUser(userId, token),
    enabled: Boolean(userId) && Boolean(token) && enabled,
  })
}

export function useUpdateProfileMutation({ userId, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => updateUser(userId, payload, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.user(userId) })
    },
  })
}

export function useUploadProfilePictureMutation({ userId, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file) => uploadProfilePicture(userId, file, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.user(userId) })
    },
  })
}

export function useChangePasswordMutation({ userId, token }) {
  return useMutation({
    mutationFn: (payload) => changePassword(userId, payload, token),
  })
}

export function useCreateCompanyMutation({ userId, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => createCompany(payload, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.companies(userId) })
    },
  })
}

export function useUpdateCompanyMutation({ userId, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ companyId, payload }) => updateCompany(companyId, payload, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.companies(userId) })
    },
  })
}

export function useDeleteCompanyMutation({ userId, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (companyId) => deleteCompany(companyId, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.companies(userId) })
    },
  })
}
