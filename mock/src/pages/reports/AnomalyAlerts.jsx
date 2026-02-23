import { Link } from 'react-router-dom';
import { AlertTriangle, AlertCircle, Info, Search, Filter, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCompany } from '../../context/CompanyContext';
import api from '../../services/api';

const AnomalyAlerts = () => {
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(false);
  const { activeCompany } = useCompany();

  useEffect(() => {
    if (!activeCompany?.id) return;
    setLoading(true);
    api.getAnomalies(activeCompany.id)
      .then(data => setAnomalies(data.map(a => ({
        id: a.id,
        severity: a.severity || 'info',
        title: a.anomaly_type || 'Anomaly',
        description: a.description || '',
        date: a.detected_at ? new Date(a.detected_at).toLocaleString() : '',
        amount: parseFloat(a.amount) || 0,
        status: a.status || 'open',
        invoiceId: a.invoice_id ? String(a.invoice_id) : null,
        type: a.anomaly_type || '',
      }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCompany?.id]);

  const stats = {
    total: anomalies.length,
    critical: anomalies.filter(a => a.severity === 'critical').length,
    warning: anomalies.filter(a => a.severity === 'warning').length,
    info: anomalies.filter(a => a.severity === 'info').length,
    open: anomalies.filter(a => a.status === 'open').length,
  };

  const filteredAnomalies = anomalies.filter(anomaly => {
    const matchesSeverity = filterSeverity === 'all' || anomaly.severity === filterSeverity;
    const matchesSearch =
      anomaly.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      anomaly.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (anomaly.invoiceId && anomaly.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSeverity && matchesSearch;
  });

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="text-red-600" size={24} />;
      case 'warning':
        return <AlertCircle className="text-yellow-600" size={24} />;
      case 'info':
        return <Info className="text-blue-600" size={24} />;
      default:
        return <Info className="text-gray-600" size={24} />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300';
      case 'warning':
        return 'bg-yellow-100 border-yellow-300';
      case 'info':
        return 'bg-blue-100 border-blue-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-red-100 text-red-800',
      investigating: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Anomaly Alerts</h1>
        <p className="text-gray-600 mt-1">
          Real-time detection and resolution of reconciliation anomalies
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button
          onClick={() => setFilterSeverity('all')}
          className={`p-4 rounded-lg border-2 transition-all text-left ${
            filterSeverity === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-600">Total Alerts</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </button>
        <button
          onClick={() => setFilterSeverity('critical')}
          className={`p-4 rounded-lg border-2 transition-all text-left ${
            filterSeverity === 'critical' ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-600">Critical</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.critical}</p>
        </button>
        <button
          onClick={() => setFilterSeverity('warning')}
          className={`p-4 rounded-lg border-2 transition-all text-left ${
            filterSeverity === 'warning' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-600">Warning</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.warning}</p>
        </button>
        <button
          onClick={() => setFilterSeverity('info')}
          className={`p-4 rounded-lg border-2 transition-all text-left ${
            filterSeverity === 'info' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-600">Info</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.info}</p>
        </button>
        <div className="p-4 rounded-lg border-2 border-gray-200 bg-white">
          <p className="text-sm text-gray-600">Open</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{stats.open}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search alerts by title, description, or invoice ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
            <Filter size={18} />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">Loading alerts…</p>
          </div>
        )}
        {filteredAnomalies.map((anomaly) => (
          <div
            key={anomaly.id}
            className={`rounded-lg border-2 p-6 transition-all hover:shadow-md ${getSeverityColor(anomaly.severity)}`}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {getSeverityIcon(anomaly.severity)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{anomaly.title}</h3>
                    <p className="text-sm text-gray-700 mt-1">{anomaly.description}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(anomaly.status)}`}>
                    {anomaly.status.charAt(0).toUpperCase() + anomaly.status.slice(1)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{anomaly.date}</span>
                    {anomaly.invoiceId && (
                      <>
                        <span>•</span>
                        <span className="font-medium text-blue-600">{anomaly.invoiceId}</span>
                      </>
                    )}
                    {anomaly.amount && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-gray-900">€{anomaly.amount.toFixed(2)}</span>
                      </>
                    )}
                  </div>
                  
                  <Link
                    to={`/anomalies/${anomaly.id}`}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 text-sm font-medium"
                  >
                    <Eye size={16} />
                    <span>Review</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAnomalies.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No alerts found</h3>
          <p className="text-gray-600">Try adjusting your filters or search query</p>
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">About Anomaly Detection</h3>
        <p className="text-blue-800 mb-4">
          Our AI-powered system continuously monitors your reconciliation process to identify potential issues in real-time.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Duplicate Detection</p>
            <p className="text-xs text-gray-600 mt-1">Identifies potential duplicate transactions or invoices</p>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Amount Verification</p>
            <p className="text-xs text-gray-600 mt-1">Compares invoice and transaction amounts for discrepancies</p>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Pattern Analysis</p>
            <p className="text-xs text-gray-600 mt-1">Detects unusual spending patterns or new vendors</p>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Data Quality</p>
            <p className="text-xs text-gray-600 mt-1">Flags missing information or low confidence extractions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnomalyAlerts;
