const API_BASE_URL = '/api';

class ApiService {
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

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
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
  }

  // Users endpoints
  async getUsers() {
    return this.request('/users');
  }

  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  // Companies endpoints
  async getCompanies() {
    return this.request('/companies');
  }

  async getCompany(id) {
    return this.request(`/companies/${id}`);
  }

  // Invoices endpoints
  async getInvoices(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/invoices?${params}`);
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

  // Transactions endpoints
  async getTransactions(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/transactions?${params}`);
  }

  async createTransaction(transactionData) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  async bulkCreateTransactions(transactions) {
    return this.request('/transactions/bulk', {
      method: 'POST',
      body: JSON.stringify({ transactions }),
    });
  }

  // Matches endpoints
  async getMatches() {
    return this.request('/matches');
  }

  async createMatch(matchData) {
    return this.request('/matches', {
      method: 'POST',
      body: JSON.stringify(matchData),
    });
  }

  // Anomalies endpoints
  async getAnomalies(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/anomalies?${params}`);
  }

  // Reports endpoints
  async getDashboardStats() {
    return this.request('/reports/dashboard');
  }

  async getVATReports() {
    return this.request('/reports/vat');
  }
}

export default new ApiService();
