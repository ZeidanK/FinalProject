import { useState } from 'react';
import { Search, Building, TrendingUp, Eye, Trash2, CheckCircle, Clock, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const ManageBusinesses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [businesses] = useState([
    {
      id: 1,
      companyName: 'Tech Innovations LLC',
      contactPerson: 'John Smith',
      email: 'john@techinnovations.com',
      phone: '+1 (555) 123-4567',
      accessGrantedDate: '2024-01-10',
      pendingInvoices: 23,
      unmatchedTransactions: 45,
      totalTransactions: 1234,
      lastActivity: '2024-01-16 14:30',
      status: 'active',
      accessLevel: 'full-access'
    },
    {
      id: 2,
      companyName: 'Green Energy Solutions',
      contactPerson: 'Sarah Johnson',
      email: 'sarah@greenenergy.com',
      phone: '+1 (555) 234-5678',
      accessGrantedDate: '2023-11-15',
      pendingInvoices: 12,
      unmatchedTransactions: 28,
      totalTransactions: 892,
      lastActivity: '2024-01-16 09:15',
      status: 'active',
      accessLevel: 'full-access'
    },
    {
      id: 3,
      companyName: 'Urban Retail Group',
      contactPerson: 'Michael Chen',
      email: 'michael@urbanretail.com',
      phone: '+1 (555) 345-6789',
      accessGrantedDate: '2024-01-05',
      pendingInvoices: 8,
      unmatchedTransactions: 15,
      totalTransactions: 456,
      lastActivity: '2024-01-15 16:45',
      status: 'active',
      accessLevel: 'view-only'
    },
    {
      id: 4,
      companyName: 'Coastal Construction Co.',
      contactPerson: 'Emily Rodriguez',
      email: 'emily@coastalconstruction.com',
      phone: '+1 (555) 456-7890',
      accessGrantedDate: '2024-01-12',
      pendingInvoices: 0,
      unmatchedTransactions: 3,
      totalTransactions: 234,
      lastActivity: '2024-01-14 11:20',
      status: 'pending',
      accessLevel: 'pending'
    },
    {
      id: 5,
      companyName: 'Digital Marketing Pro',
      contactPerson: 'David Lee',
      email: 'david@digitalmarketingpro.com',
      phone: '+1 (555) 567-8901',
      accessGrantedDate: '2023-09-20',
      pendingInvoices: 34,
      unmatchedTransactions: 67,
      totalTransactions: 2156,
      lastActivity: '2024-01-16 08:00',
      status: 'active',
      accessLevel: 'full-access'
    }
  ]);

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || business.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    totalBusinesses: businesses.length,
    activeBusinesses: businesses.filter(b => b.status === 'active').length,
    pendingRequests: businesses.filter(b => b.status === 'pending').length,
    totalPendingInvoices: businesses.reduce((sum, b) => sum + b.pendingInvoices, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Business Accounts</h1>
        <p className="text-gray-600 mt-1">
          Manage all business accounts you have access to
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Businesses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBusinesses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeBusinesses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Work</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPendingInvoices}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by company name, contact, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({businesses.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active ({stats.activeBusinesses})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({stats.pendingRequests})
            </button>
          </div>
        </div>
      </div>

      {/* Business Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBusinesses.map((business) => (
          <div
            key={business.id}
            className={`bg-white rounded-lg shadow p-6 border-2 ${
              business.status === 'active' ? 'border-green-200' : 'border-yellow-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  business.status === 'active' ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  <Building className={
                    business.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                  } size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{business.companyName}</h3>
                  <p className="text-sm text-gray-600 mt-1">{business.contactPerson}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Mail size={14} className="text-gray-400" />
                    <p className="text-sm text-gray-600">{business.email}</p>
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                business.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {business.status === 'active' ? 'Active' : 'Pending Approval'}
              </span>
            </div>

            {/* Stats Grid */}
            {business.status === 'active' && (
              <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{business.pendingInvoices}</p>
                  <p className="text-xs text-gray-600 mt-1">Pending Invoices</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{business.unmatchedTransactions}</p>
                  <p className="text-xs text-gray-600 mt-1">Unmatched</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{business.totalTransactions}</p>
                  <p className="text-xs text-gray-600 mt-1">Total Transactions</p>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="space-y-2 mb-4 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Access Level:</span>
                <span className="font-medium text-gray-900 capitalize">{business.accessLevel.replace('-', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Access Granted:</span>
                <span className="font-medium text-gray-900">{business.accessGrantedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Activity:</span>
                <span className="font-medium text-gray-900">{business.lastActivity}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-4 border-t border-gray-200">
              {business.status === 'active' ? (
                <>
                  <Link
                    to="/dashboard"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                  >
                    <Eye size={16} />
                    <span>View Dashboard</span>
                  </Link>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    Settings
                  </button>
                  <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                    Accept Request
                  </button>
                  <button className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm">
                    Decline
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredBusinesses.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Building className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No businesses found</h3>
          <p className="text-gray-600">
            {searchTerm
              ? 'Try adjusting your search criteria'
              : 'You don\'t have any business accounts yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ManageBusinesses;
