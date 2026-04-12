import { useMutation } from '@tanstack/react-query'
import { loginUser, registerUser } from '../../services/auth'

/**
 * Creates a mutation hook for user login.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for login.
 */
export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload) => loginUser(payload),
  })
}

/**
 * Creates a mutation hook for login using an existing session handler.
 *
 * @param {Function} loginFn - Session-aware login function provided by context or caller.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for session login.
 */
export function useLoginWithSessionMutation(loginFn) {
  return useMutation({
    mutationFn: (payload) => loginFn(payload),
  })
}

/**
 * Creates a mutation hook for user registration.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for registration.
 */
export function useRegisterMutation() {
  return useMutation({
    mutationFn: (payload) => registerUser(payload),
  })
}
