import { useMutation } from '@tanstack/react-query'
import { loginUser, registerUser } from '../../services/auth'

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload) => loginUser(payload),
  })
}

export function useLoginWithSessionMutation(loginFn) {
  return useMutation({
    mutationFn: (payload) => loginFn(payload),
  })
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (payload) => registerUser(payload),
  })
}
