import { Link } from 'react-router-dom';
import { FileText, CheckCircle, Clock, AlertCircle, Eye, Search } from 'lucide-react';
import { useState } from 'react';

const ProcessingStatus = () => {
  const [filter, setFilter] = useState('all'); // all, processing, completed, error
  const [searchQuery, setSearchQuery] = useState('');

  const documents = [
    {
      id: 'INV-2024-1234',
      name: 'Invoice_Acme_Corp_Jan2024.pdf',
      uploadDate: '2024-01-15 10:30',
      status: 'completed',
      vendor: 'Acme Corporation',
      amount: '€1,250.00',
      confidence: 98,
      extractedData: {
        invoiceNumber: 'INV-2024-1234',
        date: '2024-01-10',
        vat: '€250.00',
        total: '€1,250.00'
      }
    },
    {
      id: 'INV-2024-1235',
      name: 'Receipt_Office_Supplies.jpg',
      uploadDate: '2024-01-15 11:45',
      status: 'processing',
      vendor: 'Office Depot',
      amount: '€89.50',
      confidence: null,
      extractedData: null
    },
    {
      id: 'INV-2024-1236',
      name: 'Invoice_Tech_Services.pdf',
      uploadDate: '2024-01-15 09:15',
      status: 'completed',
      vendor: 'Tech Services Ltd',
      amount: '€3,450.00',
      confidence: 95,
      extractedData: {
        invoiceNumber: 'TS-5678',
        date: '2024-01-08',
        vat: '€690.00',
        total: '€3,450.00'
      }
    },
    {
      id: 'INV-2024-1237',
      name: 'Scanned_Invoice_012.jpg',
      uploadDate: '2024-01-15 14:20',
      status: 'error',
      vendor: null,
      amount: null,
      confidence: null,
      extractedData: null
    },
    {
      id: 'INV-2024-1238',
      name: 'Invoice_Marketing_Agency.pdf',
      uploadDate: '2024-01-15 15:00',
      status: 'completed',
      vendor: 'Creative Marketing Co',
      amount: '€2,100.00',
      confidence: 97,
      extractedData: {
        invoiceNumber: 'CMC-9012',
        date: '2024-01-12',
        vat: '€420.00',
        total: '€2,100.00'
      }
    },
    {
      id: 'INV-2024-1239',
      name: 'Utilities_Bill_January.pdf',
      uploadDate: '2024-01-16 08:30',
      status: 'processing',
      vendor: 'City Utilities',
      amount: '€156.80',
      confidence: null,
      extractedData: null
    }
  ];

  const filteredDocuments = documents.filter(doc => {
    const matchesFilter = filter === 'all' || doc.status === filter;
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.vendor && doc.vendor.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    all: documents.length,
    processing: documents.filter(d => d.status === 'processing').length,
    completed: documents.filter(d => d.status === 'completed').length,
    error: documents.filter(d => d.status === 'error').length
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'processing':
        return <Clock className="text-blue-600 animate-pulse" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-600" size={20} />;
      default:
        return <FileText className="text-gray-600" size={20} />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      error: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Processing Status</h1>
        <p className="text-gray-600 mt-1">
          Track AI-powered document processing and data extraction
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-lg border-2 transition-all text-left ${
            filter === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-600">Total Documents</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.all}</p>
        </button>
        <button
          onClick={() => setFilter('processing')}
          className={`p-4 rounded-lg border-2 transition-all text-left ${
            filter === 'processing' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-600">Processing</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.processing}</p>
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`p-4 rounded-lg border-2 transition-all text-left ${
            filter === 'completed' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
        </button>
        <button
          onClick={() => setFilter('error')}
          className={`p-4 rounded-lg border-2 transition-all text-left ${
            filter === 'error' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-600">Errors</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.error}</p>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by invoice number, vendor, or filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Invoice ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Document</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Vendor</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Confidence</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Upload Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(doc.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(doc.status)}`}>
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{doc.id}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="text-gray-400" size={18} />
                      <span className="text-sm text-gray-900">{doc.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {doc.vendor || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">
                    {doc.amount || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="py-3 px-4">
                    {doc.confidence ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-12 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              doc.confidence >= 95 ? 'bg-green-600' :
                              doc.confidence >= 80 ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${doc.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-700">{doc.confidence}%</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{doc.uploadDate}</td>
                  <td className="py-3 px-4">
                    <Link
                      to={`/invoice-detail/${doc.id}`}
                      className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                    >
                      <Eye size={18} />
                      <span className="text-sm">View</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Processing Info */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">AI-Powered Data Extraction</h3>
        <p className="text-gray-700 mb-3">
          Our system uses advanced OCR and machine learning to automatically extract:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Invoice Numbers</p>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Dates & Due Dates</p>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Amounts & VAT</p>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Vendor Details</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingStatus;
