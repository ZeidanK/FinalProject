const API_BASE_URL = '/api';

class ApiService {
  // ── Core request helper ────────────────────────────────────────────────

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  /** For multipart file uploads — no Content-Type header (browser sets boundary) */
  async upload(endpoint, formData) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');

    const response = await fetch(url, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Upload failed: ${response.status}`);
    return data;
  }

  // ── Auth ───────────────────────────────────────────────────────────────

  async login(email, password, role) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeCompanyId');
  }

  // ── Users ──────────────────────────────────────────────────────────────

  async getUsers() {
    return this.request('/users');
  }

  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // ── Companies ──────────────────────────────────────────────────────────

  async getCompanies() {
    return this.request('/companies');
  }

  async getCompaniesByUser(userId) {
    return this.request(`/companies/user/${userId}`);
  }

  async getCompany(id) {
    return this.request(`/companies/${id}`);
  }

  async createCompany(companyData) {
    return this.request('/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
  }

  async updateCompany(id, companyData) {
    return this.request(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
  }

  // ── Bank Accounts ──────────────────────────────────────────────────────

  async getBankAccounts(companyId) {
    return this.request(`/bank-accounts/company/${companyId}`);
  }

  async getBankAccount(id) {
    return this.request(`/bank-accounts/${id}`);
  }

  async createBankAccount(accountData) {
    return this.request('/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  }

  async updateBankAccount(id, accountData) {
    return this.request(`/bank-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(accountData),
    });
  }

  async deleteBankAccount(id) {
    return this.request(`/bank-accounts/${id}`, { method: 'DELETE' });
  }

  // ── Invoices ───────────────────────────────────────────────────────────

  async getInvoices(companyId, filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/invoices/company/${companyId}?${params}`);
  }

  async getInvoice(id) {
    return this.request(`/invoices/${id}`);
  }

  async createInvoice(invoiceData) {
    return this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  async updateInvoiceStatus(id, status) {
    return this.request(`/invoices/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  /** Upload an invoice file and run OCR. Returns { file, extracted } */
  async uploadInvoiceFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.upload('/invoices/upload', formData);
  }

  // ── Transactions ───────────────────────────────────────────────────────

  async getTransactions(companyId, filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/transactions/company/${companyId}?${params}`);
  }

  async getTransaction(id) {
    return this.request(`/transactions/${id}`);
  }

  async createTransaction(transactionData) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  async bulkCreateTransactions(companyId, transactions, createdByUserId) {
    return this.request('/transactions/bulk', {
      method: 'POST',
      body: JSON.stringify({ company_id: companyId, transactions, created_by_user_id: createdByUserId }),
    });
  }

  // ── Matches ────────────────────────────────────────────────────────────

  async getMatches(companyId, filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/matches/company/${companyId}?${params}`);
  }

  async getMatch(id) {
    return this.request(`/matches/${id}`);
  }

  async createMatch(matchData) {
    return this.request('/matches', {
      method: 'POST',
      body: JSON.stringify(matchData),
    });
  }

  async updateMatch(id, updateData) {
    return this.request(`/matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // ── Anomalies ──────────────────────────────────────────────────────────

  async getAnomalies(companyId, filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/anomalies/company/${companyId}?${params}`);
  }

  async getAnomaly(id) {
    return this.request(`/anomalies/${id}`);
  }

  async resolveAnomaly(id, notes) {
    return this.request(`/anomalies/${id}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ resolution_notes: notes }),
    });
  }

  // ── Reports ────────────────────────────────────────────────────────────

  async getDashboardStats(companyId) {
    return this.request(`/reports/dashboard/company/${companyId}`);
  }

  async getVATReport(companyId, filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/reports/vat/company/${companyId}?${params}`);
  }

  async getReconciliationReport(companyId, filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/reports/reconciliation/company/${companyId}?${params}`);
  }

  // ── Admin ──────────────────────────────────────────────────────────────

  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async getAdminUsers(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/admin/users?${params}`);
  }

  async toggleUserActive(id) {
    return this.request(`/admin/users/${id}/toggle-active`, { method: 'PUT' });
  }

  async getSystemLogs(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/admin/logs?${params}`);
  }

  async getAuditLogs(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/admin/audit?${params}`);
  }
}

export default new ApiService();
