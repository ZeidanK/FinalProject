import { useState } from 'react';
import { Search, UserCheck, Star, Send, Trash2, Shield, Eye, Mail, Phone, Award } from 'lucide-react';

const ManageAccountants = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('connected'); // 'connected' or 'search'

  const [connectedAccountants] = useState([
    {
      id: 1,
      name: 'Jennifer Adams',
      firm: 'Adams & Associates CPA',
      email: 'jennifer@adamscpa.com',
      phone: '+1 (555) 111-2222',
      specialization: 'Tax & Compliance',
      rating: 4.9,
      reviews: 127,
      yearsExperience: 15,
      status: 'connected',
      accessLevel: 'full-access',
      connectedDate: '2023-06-15',
      lastActive: '2024-01-16 10:30'
    },
    {
      id: 2,
      name: 'Robert Martinez',
      firm: 'Martinez Financial Services',
      email: 'robert@martinezfs.com',
      phone: '+1 (555) 222-3333',
      specialization: 'Financial Analysis',
      rating: 4.7,
      reviews: 89,
      yearsExperience: 12,
      status: 'connected',
      accessLevel: 'view-only',
      connectedDate: '2023-11-20',
      lastActive: '2024-01-15 14:20'
    }
  ]);

  const [availableAccountants] = useState([
    {
      id: 3,
      name: 'Patricia Williams',
      firm: 'Williams & Partners',
      email: 'patricia@williamspartners.com',
      phone: '+1 (555) 333-4444',
      specialization: 'Forensic Accounting',
      rating: 4.8,
      reviews: 156,
      yearsExperience: 18,
      status: 'available',
      certifications: ['CPA', 'CFE']
    },
    {
      id: 4,
      name: 'Michael Chang',
      firm: 'Chang Accounting Group',
      email: 'michael@changaccounting.com',
      phone: '+1 (555) 444-5555',
      specialization: 'Small Business Accounting',
      rating: 4.9,
      reviews: 203,
      yearsExperience: 10,
      status: 'available',
      certifications: ['CPA', 'CMA']
    },
    {
      id: 5,
      name: 'Lisa Thompson',
      firm: 'Thompson Tax Solutions',
      email: 'lisa@thompsontax.com',
      phone: '+1 (555) 555-6666',
      specialization: 'Tax Planning',
      rating: 4.6,
      reviews: 78,
      yearsExperience: 8,
      status: 'available',
      certifications: ['EA', 'CPA']
    },
    {
      id: 6,
      name: 'David Kumar',
      firm: 'Kumar & Associates',
      email: 'david@kumarassociates.com',
      phone: '+1 (555) 666-7777',
      specialization: 'International Tax',
      rating: 4.9,
      reviews: 145,
      yearsExperience: 20,
      status: 'available',
      certifications: ['CPA', 'JD']
    },
    {
      id: 7,
      name: 'Sarah Mitchell',
      firm: 'Mitchell Financial Advisory',
      email: 'sarah@mitchellfa.com',
      phone: '+1 (555) 777-8888',
      specialization: 'CFO Services',
      rating: 4.8,
      reviews: 98,
      yearsExperience: 14,
      status: 'available',
      certifications: ['CPA', 'MBA']
    }
  ]);

  const filteredAccountants = availableAccountants.filter(accountant =>
    accountant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    accountant.firm.toLowerCase().includes(searchTerm.toLowerCase()) ||
    accountant.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendRequest = (accountantId) => {
    alert(`Access request sent to accountant ${accountantId}`);
  };

  const handleRevokeAccess = (accountantId) => {
    if (confirm('Are you sure you want to revoke access for this accountant?')) {
      alert(`Access revoked for accountant ${accountantId}`);
    }
  };

  const handleChangeAccessLevel = (accountantId, currentLevel) => {
    const newLevel = currentLevel === 'full-access' ? 'view-only' : 'full-access';
    alert(`Access level changed to ${newLevel} for accountant ${accountantId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Accountants</h1>
        <p className="text-gray-600 mt-1">
          Manage accountants who have access to your business account
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserCheck className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Connected Accountants</p>
              <p className="text-2xl font-bold text-gray-900">{connectedAccountants.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Shield className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Full Access</p>
              <p className="text-2xl font-bold text-gray-900">
                {connectedAccountants.filter(a => a.accessLevel === 'full-access').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Eye className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">View Only</p>
              <p className="text-2xl font-bold text-gray-900">
                {connectedAccountants.filter(a => a.accessLevel === 'view-only').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('connected')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'connected'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Connected ({connectedAccountants.length})
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'search'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Find Accountants
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Connected Accountants Tab */}
          {activeTab === 'connected' && (
            <div className="space-y-4">
              {connectedAccountants.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="mx-auto text-gray-400 mb-4" size={64} />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No accountants connected</h3>
                  <p className="text-gray-600 mb-4">Search and invite accountants to manage your business</p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Find Accountants
                  </button>
                </div>
              ) : (
                connectedAccountants.map((accountant) => (
                  <div
                    key={accountant.id}
                    className="border-2 border-green-200 bg-green-50 rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-green-100 rounded-full">
                          <UserCheck className="text-green-600" size={32} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{accountant.name}</h3>
                            <div className="flex items-center space-x-1">
                              <Star className="text-yellow-500 fill-yellow-500" size={16} />
                              <span className="text-sm font-medium text-gray-900">{accountant.rating}</span>
                              <span className="text-sm text-gray-600">({accountant.reviews})</span>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-gray-700">{accountant.firm}</p>
                          <p className="text-sm text-gray-600 mt-1">{accountant.specialization}</p>
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Mail size={14} />
                              <span>{accountant.email}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Phone size={14} />
                              <span>{accountant.phone}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        accountant.accessLevel === 'full-access'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {accountant.accessLevel === 'full-access' ? 'Full Access' : 'View Only'}
                      </span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-green-200 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Connected Since:</span>
                        <span className="ml-2 font-medium text-gray-900">{accountant.connectedDate}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Active:</span>
                        <span className="ml-2 font-medium text-gray-900">{accountant.lastActive}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Experience:</span>
                        <span className="ml-2 font-medium text-gray-900">{accountant.yearsExperience} years</span>
                      </div>
                    </div>

                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={() => handleChangeAccessLevel(accountant.id, accountant.accessLevel)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center space-x-2"
                      >
                        <Shield size={16} />
                        <span>Change Access Level</span>
                      </button>
                      <button className="px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm">
                        View Activity
                      </button>
                      <button
                        onClick={() => handleRevokeAccess(accountant.id)}
                        className="px-4 py-2 border border-red-300 text-red-600 bg-white rounded-lg hover:bg-red-50 transition-colors text-sm flex items-center space-x-2"
                      >
                        <Trash2 size={16} />
                        <span>Revoke Access</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Search Accountants Tab */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, firm, or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Accountant Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAccountants.map((accountant) => (
                  <div
                    key={accountant.id}
                    className="border-2 border-gray-200 bg-white rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <UserCheck className="text-blue-600" size={28} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{accountant.name}</h3>
                          <div className="flex items-center space-x-1">
                            <Star className="text-yellow-500 fill-yellow-500" size={16} />
                            <span className="text-sm font-medium text-gray-900">{accountant.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-700">{accountant.firm}</p>
                        <p className="text-sm text-gray-600 mt-1">{accountant.specialization}</p>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {accountant.certifications?.map((cert, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
                            >
                              {cert}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center space-x-4 mt-3 text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Award size={12} />
                            <span>{accountant.yearsExperience} years exp.</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star size={12} />
                            <span>{accountant.reviews} reviews</span>
                          </div>
                        </div>

                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={() => handleSendRequest(accountant.id)}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center space-x-2"
                          >
                            <Send size={16} />
                            <span>Send Request</span>
                          </button>
                          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                            View Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredAccountants.length === 0 && (
                <div className="text-center py-12">
                  <Search className="mx-auto text-gray-400 mb-4" size={64} />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No accountants found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Access Levels Explained</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-medium mb-1">Full Access</p>
            <p>Can view, upload, edit, and manage all transactions and reports</p>
          </div>
          <div>
            <p className="font-medium mb-1">View Only</p>
            <p>Can view transactions and reports but cannot make changes</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAccountants;
