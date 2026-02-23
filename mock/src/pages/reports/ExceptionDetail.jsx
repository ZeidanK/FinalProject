import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, FileText, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../services/api';

const ExceptionDetail = () => {
  const { id } = useParams();
  const [resolution, setResolution] = useState('');
  const [notes, setNotes] = useState('');
  const [exception, setException] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getAnomaly(id)
      .then(a => setException({
        id:          a.id,
        severity:    a.severity    || 'info',
        title:       a.anomaly_type || 'Anomaly',
        description: a.description || '',
        date:        a.detected_at ? new Date(a.detected_at).toLocaleString() : '',
        status:      a.status      || 'open',
        type:        a.anomaly_type || '',
        details:     { invoice: null, transactions: [] },
        timeline:    [],
        suggestedActions: [],
      }))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleResolve = async (action) => {
    if (!exception) return;
    setResolving(true);
    try {
      await api.resolveAnomaly(exception.id, notes);
      setException(prev => ({ ...prev, status: 'resolved' }));
      alert(`Exception resolved: ${action}`);
    } catch (err) {
      alert('Failed to resolve: ' + (err.message || err));
    } finally {
      setResolving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading exception…</div>;
  if (!exception) return <div className="p-8 text-center text-red-500">Exception not found.</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/anomalies"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Exception Detail</h1>
            <p className="text-gray-600 mt-1">ID: {exception.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
            exception.severity === 'critical' ? 'bg-red-100 text-red-800' :
            exception.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {exception.severity.toUpperCase()}
          </span>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
            exception.status === 'open' ? 'bg-red-100 text-red-800' :
            exception.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {exception.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Alert Summary */}
      <div className={`rounded-lg border-2 p-6 ${
        exception.severity === 'critical' ? 'bg-red-50 border-red-300' :
        exception.severity === 'warning' ? 'bg-yellow-50 border-yellow-300' :
        'bg-blue-50 border-blue-300'
      }`}>
        <div className="flex items-start space-x-4">
          <AlertTriangle className={
            exception.severity === 'critical' ? 'text-red-600' :
            exception.severity === 'warning' ? 'text-yellow-600' :
            'text-blue-600'
          } size={32} />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{exception.title}</h2>
            <p className="text-gray-700 mb-3">{exception.description}</p>
            <p className="text-sm text-gray-600">Detected on {exception.date}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <FileText size={20} />
              <span>Invoice Information</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Invoice Number</p>
                <p className="font-semibold text-gray-900">{exception.details.invoice.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Vendor</p>
                <p className="font-semibold text-gray-900">{exception.details.invoice.vendor}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold text-gray-900">{exception.details.invoice.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-semibold text-gray-900">€{exception.details.invoice.amount.toFixed(2)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-gray-900">{exception.details.invoice.description}</p>
              </div>
            </div>
          </div>

          {/* Matching Transactions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <DollarSign size={20} />
              <span>Related Transactions ({exception.details.transactions.length})</span>
            </h3>
            <div className="space-y-3">
              {exception.details.transactions.map((txn) => (
                <div key={txn.id} className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">{txn.id}</p>
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      Duplicate
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{txn.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{txn.date}</span>
                    <span className="text-gray-600">{txn.bank}</span>
                    <span className="font-semibold text-gray-900">€{Math.abs(txn.amount).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested Actions</h3>
            <ul className="space-y-2">
              {exception.suggestedActions.map((action, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-gray-700">{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Resolution Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolution</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Action
                </label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select action...</option>
                  <option value="mark-duplicate">Mark as Duplicate</option>
                  <option value="valid-transactions">Both Transactions Valid</option>
                  <option value="unmatch">Unmatch One Transaction</option>
                  <option value="investigate">Requires Further Investigation</option>
                  <option value="false-positive">False Positive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add notes about how this exception was resolved..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleResolve('resolved')}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <CheckCircle size={18} />
                  <span>Mark as Resolved</span>
                </button>
                <button
                  onClick={() => handleResolve('dismissed')}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <XCircle size={18} />
                  <span>Dismiss</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-4">
              {exception.timeline.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.event}</p>
                    <p className="text-xs text-gray-600 mt-1">{item.date}</p>
                    <p className="text-xs text-gray-500">{item.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to={`/invoice-detail/${exception.details.invoice.id}`}
                className="block w-full text-center py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                View Invoice
              </Link>
              <button className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                View Bank Statement
              </button>
              <button className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Contact Vendor
              </button>
              <button className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Export Details
              </button>
            </div>
          </div>

          {/* Related Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Need Help?</h3>
            <p className="text-xs text-blue-800 mb-3">
              Check our knowledge base for common exception scenarios and resolution steps.
            </p>
            <Link
              to="/help"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View Help Articles →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExceptionDetail;
