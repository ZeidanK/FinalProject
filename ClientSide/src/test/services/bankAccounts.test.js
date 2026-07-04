import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getBankAccountsByCompany, getBankAccountById, createBankAccount, updateBankAccount, deleteBankAccount } from '../../services/bankAccounts'

const originalFetch = globalThis.fetch

describe('bankAccounts service', () => {
  beforeEach(() => { globalThis.fetch = vi.fn() })
  afterEach(() => { globalThis.fetch = originalFetch })

  it('getBankAccountsByCompany fetches', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: [{ id: 1 }] }) })
    expect(await getBankAccountsByCompany(1, 'token')).toEqual([{ id: 1 }])
  })

  it('getBankAccountById fetches single', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { id: 1 } }) })
    expect(await getBankAccountById(1, 'token')).toEqual({ id: 1 })
  })

  it('createBankAccount sends POST', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { id: 1 } }) })
    expect(await createBankAccount({ bankName: 'BOA' }, 'token')).toEqual({ id: 1 })
  })

  it('updateBankAccount sends PUT', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { id: 1 } }) })
    expect(await updateBankAccount(1, { bankName: 'Chase' }, 'token')).toEqual({ id: 1 })
  })

  it('deleteBankAccount sends DELETE', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: null }) })
    await expect(deleteBankAccount(1, 'token')).resolves.toBeNull()
  })
})
