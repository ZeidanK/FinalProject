import { useContext } from 'react'
import { CompanyContext } from './CompanyContextProvider'

export function useCompany() {
  const context = useContext(CompanyContext)

  if (!context) {
    throw new Error('useCompany must be used inside CompanyProvider.')
  }

  return context
}
