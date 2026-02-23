import { Link } from 'react-router-dom';
import { FileText, TrendingUp, TrendingDown, Calendar, Download, BarChart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCompany } from '../../context/CompanyContext';
import api from '../../services/api';

const ReportsDashboard = () => {
  const [period, setPeriod] = useState('monthly');
  const [reconciliationData, setReconciliationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { activeCompany } = useCompany();

  useEffect(() => {
    if (!activeCompany?.id) return;
    setLoading(true);
    api.getReconciliationReport(activeCompany.id)
      .then(data => setReconciliationData(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCompany?.id]);

  const totalExpenses  = reconciliationData.reduce((s, r) => s + (parseFloat(r.invoice_amount) || 0), 0);
  const totalMatched   = reconciliationData.filter(r => r.is_matched).length;
  const totalUnmatched = reconciliationData.filter(r => !r.is_matched).length;

  const reportTypes = [
    {
      id: 1,
      name: 'VAT Report',
      description: 'Value Added Tax summary and calculations',
      icon: FileText,
      color: 'blue',
      link: '/reports/vat',
      lastGenerated: '2024-01-15',
      status: 'ready'
    },
    {
      id: 2,
      name: 'Expense Summary',
      description: 'Categorized expense breakdown',
      icon: BarChart,
      color: 'green',
      link: '/reports',
      lastGenerated: '2024-01-14',
      status: 'ready'
    },
    {
      id: 3,
      name: 'Reconciliation Report',
      description: 'Matched and unmatched transactions',
      icon: FileText,
      color: 'purple',
      link: '/reports',
      lastGenerated: '2024-01-13',
      status: 'ready'
    },
    {
      id: 4,
      name: 'Vendor Analysis',
      description: 'Spending by vendor and category',
      icon: FileText,
      color: 'orange',
      link: '/reports',
      lastGenerated: '2024-01-12',
      status: 'generating'
    }
  ];

  const metrics = [
    { label: 'Total Expenses',     value: loading ? '…' : `€${totalExpenses.toFixed(2)}`,   change: '', trend: 'up' },
    { label: 'Invoices Processed', value: loading ? '…' : String(reconciliationData.length), change: '', trend: 'up' },
    { label: 'Matched',            value: loading ? '…' : String(totalMatched),               change: '', trend: 'up' },
    { label: 'Pending Items',      value: loading ? '…' : String(totalUnmatched),             change: '', trend: 'down' },
  ];

  const recentReports = [
    { name: 'January_2024_VAT_Report.pdf', date: '2024-01-15', size: '1.2 MB', type: 'VAT' },
    { name: 'Q4_2023_Reconciliation.xlsx', date: '2024-01-10', size: '3.4 MB', type: 'Reconciliation' },
    { name: 'December_Expense_Summary.pdf', date: '2024-01-05', size: '890 KB', type: 'Expenses' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Financial insights and tax compliance reports
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="quarterly">This Quarter</option>
            <option value="yearly">This Year</option>
          </select>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">{metric.label}</p>
              {metric.trend === 'up' ? (
                <TrendingUp className="text-green-500" size={20} />
              ) : (
                <TrendingDown className="text-red-500" size={20} />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            <p className={`text-sm mt-1 ${
              metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {metric.change}
            </p>
          </div>
        ))}
      </div>

      {/* Report Types */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Link
                key={report.id}
                to={report.link}
                className="p-6 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg bg-${report.color}-100`}>
                    <Icon className={`text-${report.color}-600`} size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {report.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                      </div>
                      {report.status === 'generating' && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          Generating
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-3 text-xs text-gray-500">
                      <Calendar size={14} />
                      <span>Last generated: {report.lastGenerated}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Reports</h2>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All
          </button>
        </div>
        <div className="space-y-3">
          {recentReports.map((report, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <FileText className="text-blue-600" size={24} />
                <div>
                  <p className="font-medium text-gray-900">{report.name}</p>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-xs text-gray-500">{report.date}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">{report.size}</span>
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {report.type}
                    </span>
                  </div>
                </div>
              </div>
              <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                <Download size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="p-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-left">
          <FileText className="mb-3" size={32} />
          <h3 className="font-semibold text-lg">Generate Custom Report</h3>
          <p className="text-sm text-blue-100 mt-1">Create a report with custom parameters</p>
        </button>
        
        <button className="p-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-left">
          <Download className="mb-3" size={32} />
          <h3 className="font-semibold text-lg">Bulk Export</h3>
          <p className="text-sm text-green-100 mt-1">Download multiple reports at once</p>
        </button>
        
        <button className="p-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-left">
          <Calendar className="mb-3" size={32} />
          <h3 className="font-semibold text-lg">Schedule Reports</h3>
          <p className="text-sm text-purple-100 mt-1">Automate report generation</p>
        </button>
      </div>
    </div>
  );
};

export default ReportsDashboard;
