import { useState } from 'react';
import { Building2, Plus, CheckCircle, Trash2, RefreshCw } from 'lucide-react';

const BankAccounts = () => {
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      name: 'Chase Business Checking',
      bankName: 'JPMorgan Chase',
      accountNumber: '****4521',
      accountType: 'Checking',
      currency: 'USD',
      connected: true,
      lastSync: '2024-01-16 10:30',
      balance: 45234.50
    },
    {
      id: 2,
      name: 'American Express Business',
      bankName: 'American Express',
      accountNumber: '****8892',
      accountType: 'Credit Card',
      currency: 'USD',
      connected: true,
      lastSync: '2024-01-16 09:15',
      balance: -3421.30
    },
    {
      id: 3,
      name: 'Bank of America Savings',
      bankName: 'Bank of America',
      accountNumber: '****3344',
      accountType: 'Savings',
      currency: 'USD',
      connected: false,
      lastSync: null,
      balance: null
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);

  const handleSync = (id) => {
    alert(`Syncing account ${id}...`);
  };

  const handleDisconnect = (id) => {
    if (confirm('Are you sure you want to disconnect this account?')) {
      setAccounts(accounts.map(acc => 
        acc.id === id ? { ...acc, connected: false } : acc
      ));
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Bank Account</h2>
            <p className="text-gray-600 mb-6">
              Connect your bank account for automatic transaction synchronization
            </p>

            <div className="space-y-4 mb-6">
              <button className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
                <p className="font-medium text-gray-900">JPMorgan Chase</p>
                <p className="text-sm text-gray-600 mt-1">Personal & Business Banking</p>
              </button>
              <button className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
                <p className="font-medium text-gray-900">Bank of America</p>
                <p className="text-sm text-gray-600 mt-1">Checking, Savings, Credit Cards</p>
              </button>
              <button className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
                <p className="font-medium text-gray-900">Wells Fargo</p>
                <p className="text-sm text-gray-600 mt-1">Business & Personal Accounts</p>
              </button>
              <button className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
                <p className="font-medium text-gray-900">Other Bank</p>
                <p className="text-sm text-gray-600 mt-1">Search for your bank</p>
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Continue
              </button>
            </div>
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
