import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCompanyById,
  getCompaniesByUser,
  getAllCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  grantCompanyAccess,
} from '../../services/companies'

const originalFetch = globalThis.fetch

describe('companies service', () => {
  beforeEach(() => { globalThis.fetch = vi.fn() })
  afterEach(() => { globalThis.fetch = originalFetch })

  it('getCompanyById fetches single', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { id: 1, name: 'Acme' } }) })
    expect(await getCompanyById(1, 'token')).toEqual({ id: 1, name: 'Acme' })
  })

  it('getCompaniesByUser fetches list', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: [{ id: 1 }] }) })
    expect(await getCompaniesByUser(1, 'token')).toEqual([{ id: 1 }])
  })

  it('getAllCompanies fetches all', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: [{ id: 1 }, { id: 2 }] }) })
    expect(await getAllCompanies('token')).toEqual([{ id: 1 }, { id: 2 }])
  })

  it('createCompany sends POST', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { id: 1 } }) })
    expect(await createCompany({ name: 'NewCo' }, 'token')).toEqual({ id: 1 })
  })

  it('updateCompany sends PUT', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { id: 1 } }) })
    expect(await updateCompany(1, { name: 'Updated' }, 'token')).toEqual({ id: 1 })
  })

  it('deleteCompany sends DELETE', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: null }) })
    await expect(deleteCompany(1, 'token')).resolves.toBeNull()
  })

  it('grantCompanyAccess sends POST', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { access: true } }) })
    expect(await grantCompanyAccess(1, 'token')).toEqual({ access: true })
  })
})
