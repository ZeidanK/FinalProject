import { Link } from 'react-router-dom';
import { AlertTriangle, AlertCircle, Info, Search, Filter, Eye } from 'lucide-react';
import { useState } from 'react';

const AnomalyAlerts = () => {
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const anomalies = [
    {
      id: 1,
      severity: 'critical',
      title: 'Duplicate Transaction Detected',
      description: 'Invoice INV-2024-1234 matches transaction TRX-8821 and TRX-8822',
      date: '2024-01-16 14:30',
      amount: 1250.00,
      status: 'open',
      invoiceId: 'INV-2024-1234',
      type: 'duplicate'
    },
    {
      id: 2,
      severity: 'warning',
      title: 'Amount Mismatch',
      description: 'Invoice amount (€1,150.00) differs from transaction amount (€1,125.00)',
      date: '2024-01-16 11:20',
      amount: 1150.00,
      status: 'open',
      invoiceId: 'INV-2024-1237',
      type: 'mismatch'
    },
    {
      id: 3,
      severity: 'critical',
      title: 'Missing VAT Information',
      description: 'Invoice INV-2024-1240 does not contain required VAT breakdown',
      date: '2024-01-15 16:45',
      amount: 3200.00,
      status: 'open',
      invoiceId: 'INV-2024-1240',
      type: 'missing-data'
    },
    {
      id: 4,
      severity: 'warning',
      title: 'Date Discrepancy',
      description: 'Transaction date (2024-01-10) is 5 days after invoice date (2024-01-05)',
      date: '2024-01-15 09:30',
      amount: 780.00,
      status: 'investigating',
      invoiceId: 'INV-2024-1238',
      type: 'date-mismatch'
    },
    {
      id: 5,
      severity: 'info',
      title: 'Unusual Vendor Pattern',
      description: 'First transaction with new vendor "Tech Solutions Inc"',
      date: '2024-01-14 13:15',
      amount: 4500.00,
      status: 'resolved',
      invoiceId: 'INV-2024-1235',
      type: 'pattern'
    },
    {
      id: 6,
      severity: 'critical',
      title: 'Unmatched Large Transaction',
      description: 'Bank transaction of €12,500.00 has no corresponding invoice',
      date: '2024-01-14 10:00',
      amount: 12500.00,
      status: 'open',
      invoiceId: null,
      type: 'unmatched'
    },
    {
      id: 7,
      severity: 'warning',
      title: 'Low OCR Confidence',
      description: 'Invoice data extracted with only 65% confidence - manual review needed',
      date: '2024-01-13 15:40',
      amount: 890.00,
      status: 'open',
      invoiceId: 'INV-2024-1233',
      type: 'low-confidence'
    },
    {
      id: 8,
      severity: 'info',
      title: 'Currency Conversion Applied',
      description: 'Transaction in USD converted to EUR at rate 1.12',
      date: '2024-01-13 11:20',
      amount: 2240.00,
      status: 'resolved',
      invoiceId: 'INV-2024-1232',
      type: 'currency'
    }
  ];

  const stats = {
    total: anomalies.length,
    critical: anomalies.filter(a => a.severity === 'critical').length,
    warning: anomalies.filter(a => a.severity === 'warning').length,
    info: anomalies.filter(a => a.severity === 'info').length,
    open: anomalies.filter(a => a.status === 'open').length
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
