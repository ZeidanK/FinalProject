import { useState } from 'react';
import { Link2, CheckCircle, Settings, Key, RefreshCw } from 'lucide-react';

const AccountingIntegration = () => {
  const [integrations] = useState([
    {
      id: 1,
      name: 'QuickBooks Online',
      description: 'Sync invoices and transactions with QuickBooks',
      logo: '💼',
      connected: true,
      lastSync: '2024-01-16 10:30',
      features: ['Automatic invoice sync', 'Expense categorization', 'Real-time updates']
    },
    {
      id: 2,
      name: 'Xero',
      description: 'Connect with Xero accounting software',
      logo: '📊',
      connected: false,
      lastSync: null,
      features: ['Invoice management', 'Bank reconciliation', 'Financial reporting']
    },
    {
      id: 3,
      name: 'Sage Business Cloud',
      description: 'Integrate with Sage accounting platform',
      logo: '🌿',
      connected: false,
      lastSync: null,
      features: ['Automated bookkeeping', 'Tax compliance', 'Multi-currency support']
    },
    {
      id: 4,
      name: 'FreshBooks',
      description: 'Sync with FreshBooks invoicing system',
      logo: '📱',
      connected: false,
      lastSync: null,
      features: ['Invoice tracking', 'Expense management', 'Time tracking']
    },
    {
      id: 5,
      name: 'Wave Accounting',
      description: 'Connect to Wave financial software',
      logo: '🌊',
      connected: false,
      lastSync: null,
      features: ['Free accounting', 'Receipt scanning', 'Payment processing']
    },
    {
      id: 6,
      name: 'Zoho Books',
      description: 'Integrate with Zoho Books platform',
      logo: '📚',
      connected: false,
      lastSync: null,
      features: ['Inventory management', 'Project tracking', 'Client portal']
    }
  ]);

  const handleConnect = (id) => {
    alert(`Connecting to integration ${id}...`);
  };

  const handleSync = (id) => {
    alert(`Syncing integration ${id}...`);
  };

  const handleConfigure = (id) => {
    alert(`Opening configuration for integration ${id}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Accounting Integration</h1>
        <p className="text-gray-600 mt-1">
          Connect with your favorite accounting software for seamless data synchronization
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Active Integrations</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {integrations.filter(i => i.connected).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Available Platforms</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {integrations.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Data Synced</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            1,234
          </p>
        </div>
      </div>

      {/* Connected Integration */}
      {integrations.filter(i => i.connected).length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Connected</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {integrations.filter(i => i.connected).map((integration) => (
              <div
                key={integration.id}
                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow border-2 border-green-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl">{integration.logo}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                        <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          <CheckCircle size={12} />
                          <span>Active</span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2">Features:</p>
                  <div className="flex flex-wrap gap-2">
                    {integration.features.map((feature, index) => (
                      <span key={index} className="px-2 py-1 bg-white text-gray-700 text-xs rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {integration.lastSync && (
                  <p className="text-xs text-gray-600 mb-4">Last synced: {integration.lastSync}</p>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSync(integration.id)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                  >
                    <RefreshCw size={16} />
                    <span>Sync Now</span>
                  </button>
                  <button
                    onClick={() => handleConfigure(integration.id)}
                    className="px-3 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={16} />
                  </button>
                  <button className="px-3 py-2 border border-red-300 text-red-600 bg-white rounded-lg hover:bg-red-50 transition-colors text-sm">
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.filter(i => !i.connected).map((integration) => (
            <div
              key={integration.id}
              className="bg-white rounded-lg shadow p-6 border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
            >
              <div className="text-center mb-4">
                <div className="text-5xl mb-3">{integration.logo}</div>
                <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                <p className="text-sm text-gray-600 mt-2">{integration.description}</p>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2">Features:</p>
                <ul className="space-y-1">
                  {integration.features.map((feature, index) => (
                    <li key={index} className="text-xs text-gray-700 flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleConnect(integration.id)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Link2 size={16} />
                <span>Connect</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Integration */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Key className="text-purple-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom API Integration</h3>
            <p className="text-gray-600 mb-4">
              Don't see your accounting software? Use our REST API to build a custom integration.
            </p>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
                View API Documentation
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Generate API Key
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How Integrations Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-medium mb-1">1. Secure Connection</p>
            <p>Connect using OAuth 2.0 authentication for maximum security</p>
          </div>
          <div>
            <p className="font-medium mb-1">2. Automatic Sync</p>
            <p>Data syncs automatically in real-time or on a schedule you set</p>
          </div>
          <div>
            <p className="font-medium mb-1">3. Two-Way Updates</p>
            <p>Changes sync both ways to keep all systems up to date</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountingIntegration;
