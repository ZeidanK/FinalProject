import { useState, useEffect } from 'react';
import { Building2, Plus, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import api from '../../services/api';

const BankAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const { activeCompany } = useCompany();

  useEffect(() => {
    if (!activeCompany?.id) return;
    setLoading(true);
    api.getBankAccounts(activeCompany.id)
      .then(data => setAccounts(data.map(a => ({
        id: a.id,
        name: a.account_name,
        bankName: a.bank_name,
        accountNumber: a.account_number ? `****${a.account_number.slice(-4)}` : '****',
        accountType: a.account_type,
        currency: a.currency || 'USD',
        connected: Boolean(a.is_active),
        lastSync: a.last_sync_date ? new Date(a.last_sync_date).toLocaleString() : null,
        balance: a.balance != null ? parseFloat(a.balance) : null,
      }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCompany?.id]);

  const handleSync = (id) => {
    alert(`Syncing account ${id}…`);
  };

  const handleDisconnect = async (id) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;
    try {
      await api.deleteBankAccount(id);
      setAccounts(prev => prev.filter(acc => acc.id !== id));
    } catch (err) {
      alert('Failed to remove: ' + (err.message || err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bank Accounts</h1>
          <p className="text-gray-600 mt-1">
            Manage your connected bank accounts and credit cards
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Add Account</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Connected Accounts</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {accounts.filter(a => a.connected).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Balance</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            $
            {accounts
              .filter(a => a.connected && a.balance)
              .reduce((sum, a) => sum + a.balance, 0)
              .toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Last Synced</p>
          <p className="text-lg font-semibold text-gray-900 mt-2">
            Just now
          </p>
        </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-4">
        {loading && <p className="text-center text-gray-500 py-8">Loading bank accounts…</p>}
        {!loading && accounts.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Building2 className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bank accounts</h3>
            <p className="text-gray-600">Add your first bank account to get started.</p>
          </div>
        )}
        {accounts.map((account) => (
          <div
            key={account.id}
            className={`bg-white rounded-lg shadow p-6 border-2 ${
              account.connected ? 'border-green-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  account.connected ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Building2 className={
                    account.connected ? 'text-green-600' : 'text-gray-400'
                  } size={24} />
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                    {account.connected && (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        <CheckCircle size={12} />
                        <span>Connected</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{account.bankName}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span>{account.accountType}</span>
                    <span>•</span>
                    <span>{account.accountNumber}</span>
                    <span>•</span>
                    <span>{account.currency}</span>
                  </div>
                  {account.connected && account.lastSync && (
                    <p className="text-xs text-gray-500 mt-2">
                      Last synced: {account.lastSync}
                    </p>
                  )}
                </div>
              </div>

              {account.balance !== null && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Balance</p>
                  <p className={`text-2xl font-bold mt-1 ${
                    account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${Math.abs(account.balance).toFixed(2)}
                    {account.balance < 0 && <span className="text-sm"> CR</span>}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-3">
              {account.connected ? (
                <>
                  <button
                    onClick={() => handleSync(account.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
                  >
                    <RefreshCw size={16} />
                    <span>Sync Now</span>
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    View Transactions
                  </button>
                  <button
                    onClick={() => handleDisconnect(account.id)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                  Connect Account
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Bank Account</h2>
            <AddAccountForm
              companyId={activeCompany?.id}
              onAdded={(newAcc) => {
                setAccounts(prev => [...prev, newAcc]);
                setShowAddModal(false);
              }}
              onCancel={() => setShowAddModal(false)}
            />
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Secure Connection</h3>
        <p className="text-blue-800 text-sm">
          We use bank-level encryption to protect your financial data. Your credentials are never stored on our servers.
          All connections use OAuth 2.0 and are read-only - we cannot initiate transactions.
        </p>
      </div>
    </div>
  );
};

export default BankAccounts;

function AddAccountForm({ companyId, onAdded, onCancel }) {
  const [form, setForm] = useState({
    account_name: '',
    bank_name: '',
    account_number: '',
    account_type: 'Checking',
    currency: 'USD',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyId) { alert('No active company selected'); return; }
    setSaving(true);
    try {
      const result = await api.createBankAccount({ ...form, company_id: companyId });
      onAdded({
        id:            result.id,
        name:          form.account_name,
        bankName:      form.bank_name,
        accountNumber: form.account_number ? `****${form.account_number.slice(-4)}` : '****',
        accountType:   form.account_type,
        currency:      form.currency,
        connected:     true,
        lastSync:      null,
        balance:       null,
      });
    } catch (err) {
      alert('Failed to add account: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { label: 'Account Name',   key: 'account_name',   type: 'text',  placeholder: 'Chase Business Checking' },
        { label: 'Bank Name',      key: 'bank_name',      type: 'text',  placeholder: 'JPMorgan Chase' },
        { label: 'Account Number', key: 'account_number', type: 'text',  placeholder: '•••• 4521' },
      ].map(({ label, key, type, placeholder }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
            required={key !== 'account_number'}
            type={type}
            placeholder={placeholder}
            value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
        <select
          value={form.account_type}
          onChange={e => setForm(f => ({ ...f, account_type: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {['Checking', 'Savings', 'Credit Card', 'Loan'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="flex space-x-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
          {saving ? 'Adding…' : 'Add Account'}
        </button>
      </div>
    </form>
  );
}
