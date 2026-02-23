import { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Download,
  Search,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  Settings
} from 'lucide-react';
import api from '../../services/api';

const AdminDashboard = () => {
  const [dateRange, setDateRange] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');
  const [adminStats, setAdminStats] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    setLoadingStats(true);
    Promise.all([
      api.getAdminStats(),
      api.getAdminUsers({ page: 1, limit: 5 }),
      api.getSystemLogs({ limit: 4 }),
    ]).then(([stats, users, logs]) => {
      setAdminStats(stats);
      setAdminUsers(users.users || users || []);
      setSystemLogs(logs.logs || logs || []);
    }).catch(console.error).finally(() => setLoadingStats(false));
  }, []);

  const s = adminStats || {};

  // System-wide statistics
  const systemStats = [
    {
      name: 'Total Users',
      value: loadingStats ? '…' : String(s.users ?? '—'),
      change: '',
      trend: 'up',
      icon: Users,
      color: 'blue',
      breakdown: { accountants: s.accountants ?? '—', businesses: s.businesses ?? '—' }
    },
    {
      name: 'Active Businesses',
      value: loadingStats ? '…' : String(s.companies ?? '—'),
      change: '',
      trend: 'up',
      icon: Building2,
      color: 'green',
      breakdown: { active: s.companies ?? '—', pending: '—' }
    },
    {
      name: 'Total Transactions',
      value: loadingStats ? '…' : String(s.transactions ?? '—'),
      change: '',
      trend: 'up',
      icon: DollarSign,
      color: 'purple',
      breakdown: { processed: String(s.matches ?? '—'), pending: '—' }
    },
    {
      name: 'Anomalies',
      value: loadingStats ? '…' : String(s.anomalies ?? '—'),
      change: '',
      trend: 'up',
      icon: Activity,
      color: 'orange',
      breakdown: { open: String(s.anomalies ?? '—'), resolved: '—' }
    }
  ];

  // Recent users from API
  const recentUsers = adminUsers.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || 'User',
    company: u.company_name || '—',
    lastActive: u.last_login ? new Date(u.last_login).toLocaleString() : '—',
    status: u.is_active ? 'online' : 'offline',
  }));

  // System alerts from logs
  const systemAlerts = systemLogs.map(l => ({
    id: l.id,
    type: l.level === 'error' ? 'critical' : l.level === 'warn' ? 'warning' : 'info',
    message: l.message,
    time: l.created_at ? new Date(l.created_at).toLocaleString() : '',
    resolved: false,
  }));

  // Business growth data — static placeholder until dedicated endpoint exists
  const businessGrowth = [
    { month: 'Jan', businesses: 720, revenue: 1.2 },
    { month: 'Feb', businesses: 750, revenue: 1.3 },
    { month: 'Mar', businesses: 780, revenue: 1.4 },
    { month: 'Apr', businesses: 820, revenue: 1.6 },
    { month: 'May', businesses: 860, revenue: 1.8 },
    { month: 'Jun', businesses: 895, revenue: 2.0 },
    { month: 'Jul', businesses: 920, revenue: 2.2 },
    { month: 'Aug', businesses: 942, revenue: 2.4 }
  ];

  // Top performing accountants — static placeholder
  const topAccountants = [
    { id: 1, name: 'Michael Chen', clients: 28, transactions: 12450, accuracy: 98.5 },
    { id: 2, name: 'David Wilson', clients: 24, transactions: 11200, accuracy: 97.8 },
    { id: 3, name: 'John Smith', clients: 22, transactions: 10800, accuracy: 97.2 },
    { id: 4, name: 'Lisa Anderson', clients: 20, transactions: 9500, accuracy: 96.9 },
    { id: 5, name: 'Robert Taylor', clients: 18, transactions: 8900, accuracy: 96.5 }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">System-wide overview and management</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="year">This year</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={20} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* System Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`text-${stat.color}-600`} size={24} />
                </div>
                {stat.trend === 'up' && <TrendingUp className="text-green-500" size={20} />}
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-gray-600 text-sm mt-1">{stat.name}</p>
              <p className="text-green-600 text-sm mt-2 font-medium">{stat.change}</p>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-xs text-gray-600">
                  {Object.entries(stat.breakdown).map(([key, value]) => (
                    <span key={key}>
                      {key}: <span className="font-semibold">{value}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {['overview', 'users', 'businesses', 'activity', 'reports'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Business Growth Chart */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Growth & Revenue</h3>
                <div className="h-64 flex items-end space-x-4">
                  {businessGrowth.map((data) => (
                    <div key={data.month} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-blue-200 rounded-t" style={{ height: `${(data.businesses / 1000) * 100}%` }}>
                        <div className="w-full bg-blue-600 rounded-t" style={{ height: `${(data.revenue / 2.4) * 100}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center space-x-6 mt-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                    <span className="text-sm text-gray-600">Revenue (₪M)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-200 rounded"></div>
                    <span className="text-sm text-gray-600">Businesses</span>
                  </div>
                </div>
              </div>

              {/* Top Performing Accountants */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Accountants</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rank</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Clients</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Transactions</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Accuracy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topAccountants.map((accountant, index) => (
                        <tr key={accountant.id} className="border-t border-gray-100">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                              index === 0 ? 'bg-yellow-100 text-yellow-700' :
                              index === 1 ? 'bg-gray-100 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-50 text-blue-700'
                            } font-semibold`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{accountant.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{accountant.clients}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{accountant.transactions.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              accountant.accuracy >= 98 ? 'bg-green-100 text-green-800' :
                              accountant.accuracy >= 97 ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {accountant.accuracy}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent User Activity</h3>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Filter size={20} className="text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Company</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Last Active</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((user) => (
                      <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(user.status)}`}></div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'Accountant' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{user.company}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.lastActive}</td>
                        <td className="px-4 py-3">
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts & Activity</h3>
              <div className="space-y-3">
                {systemAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-2 ${
                      alert.type === 'critical' ? 'border-red-200 bg-red-50' :
                      alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                      'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className={
                          alert.type === 'critical' ? 'text-red-600' :
                          alert.type === 'warning' ? 'text-yellow-600' :
                          'text-blue-600'
                        } size={20} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                          <p className="text-xs text-gray-600 mt-1">{alert.time}</p>
                        </div>
                      </div>
                      {alert.resolved ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Resolved
                        </span>
                      ) : (
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'businesses' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Management</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-900">892</p>
                      <p className="text-sm text-green-700">Active Businesses</p>
                    </div>
                    <CheckCircle className="text-green-600" size={32} />
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-yellow-900">50</p>
                      <p className="text-sm text-yellow-700">Pending Approval</p>
                    </div>
                    <Clock className="text-yellow-600" size={32} />
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-900">342</p>
                      <p className="text-sm text-blue-700">Accountants</p>
                    </div>
                    <Users className="text-blue-600" size={32} />
                  </div>
                </div>
              </div>
              <p className="text-gray-600">Detailed business management interface coming soon...</p>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Reports</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
                  <BarChart3 className="text-blue-600 mb-3" size={32} />
                  <h4 className="font-semibold text-gray-900">Transaction Report</h4>
                  <p className="text-sm text-gray-600 mt-1">Complete transaction analytics</p>
                </button>
                <button className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
                  <PieChart className="text-purple-600 mb-3" size={32} />
                  <h4 className="font-semibold text-gray-900">User Activity Report</h4>
                  <p className="text-sm text-gray-600 mt-1">User engagement metrics</p>
                </button>
                <button className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
                  <FileText className="text-green-600 mb-3" size={32} />
                  <h4 className="font-semibold text-gray-900">Revenue Report</h4>
                  <p className="text-sm text-gray-600 mt-1">Financial performance overview</p>
                </button>
                <button className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
                  <Settings className="text-orange-600 mb-3" size={32} />
                  <h4 className="font-semibold text-gray-900">System Health Report</h4>
                  <p className="text-sm text-gray-600 mt-1">Technical metrics and logs</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
