import { useState } from 'react';
import { Download, FileText, Filter, Calendar, CheckCircle } from 'lucide-react';

const ConsolidatedExport = () => {
  const [filters, setFilters] = useState({
    dateFrom: '2024-01-01',
    dateTo: '2024-01-31',
    status: 'all',
    vendor: 'all'
  });

  const [sortBy, setSortBy] = useState('date');
  const [exportFormat, setExportFormat] = useState('xlsx');

  const consolidatedData = [
    {
      id: 1,
      date: '2024-01-10',
      invoiceNumber: 'INV-2024-1234',
      vendor: 'Acme Corp',
      description: 'Professional Services',
      category: 'Services',
      amount: 1250.00,
      vat: 250.00,
      total: 1500.00,
      transactionId: 'TRX-101',
      bank: 'Chase',
      status: 'matched'
    },
    {
      id: 2,
      date: '2024-01-12',
      invoiceNumber: 'INV-2024-1235',
      vendor: 'Office Depot',
      description: 'Office Supplies',
      category: 'Supplies',
      amount: 74.58,
      vat: 14.92,
      total: 89.50,
      transactionId: 'TRX-102',
      bank: 'Chase',
      status: 'matched'
    },
    {
      id: 3,
      date: '2024-01-08',
      invoiceNumber: 'INV-2024-1236',
      vendor: 'Tech Services',
      description: 'IT Consulting',
      category: 'Services',
      amount: 2875.00,
      vat: 575.00,
      total: 3450.00,
      transactionId: 'TRX-103',
      bank: 'AmEx',
      status: 'matched'
    },
    {
      id: 4,
      date: '2024-01-15',
      invoiceNumber: 'INV-2024-1237',
      vendor: 'Marketing Co',
      description: 'Digital Marketing',
      category: 'Marketing',
      amount: 1750.00,
      vat: 350.00,
      total: 2100.00,
      transactionId: null,
      bank: null,
      status: 'unmatched'
    },
    {
      id: 5,
      date: '2024-01-05',
      invoiceNumber: 'INV-2024-1238',
      vendor: 'City Utilities',
      description: 'Monthly Utilities',
      category: 'Utilities',
      amount: 130.67,
      vat: 26.13,
      total: 156.80,
      transactionId: 'TRX-105',
      bank: 'Chase',
      status: 'matched'
    }
  ];

  const summary = {
    totalInvoices: consolidatedData.length,
    matchedCount: consolidatedData.filter(d => d.status === 'matched').length,
    totalAmount: consolidatedData.reduce((sum, d) => sum + d.amount, 0),
    totalVAT: consolidatedData.reduce((sum, d) => sum + d.vat, 0),
    totalValue: consolidatedData.reduce((sum, d) => sum + d.total, 0)
  };

  const handleExport = () => {
    // Mock export functionality
    alert(`Exporting data as ${exportFormat.toUpperCase()}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Consolidated Data & Export</h1>
        <p className="text-gray-600 mt-1">
          View, filter, and export your unified reconciliation data
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Records</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalInvoices}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Matched</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{summary.matchedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Net Amount</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">€{summary.totalAmount.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total VAT</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">€{summary.totalVAT.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">€{summary.totalValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters and Export Options */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Status</option>
                <option value="matched">Matched</option>
                <option value="unmatched">Unmatched</option>
              </select>
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Date</option>
              <option value="vendor">Vendor</option>
              <option value="amount">Amount</option>
              <option value="status">Status</option>
            </select>
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export As</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
              <option value="pdf">PDF Report</option>
              <option value="json">JSON Data</option>
            </select>
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-4 flex justify-end space-x-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Reset Filters
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Download size={18} />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Invoice #</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Vendor</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">VAT</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Bank</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {consolidatedData.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{row.date}</td>
                  <td className="py-3 px-4 text-sm font-medium text-blue-600">{row.invoiceNumber}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{row.vendor}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{row.description}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      {row.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right">€{row.amount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right">€{row.vat.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">€{row.total.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {row.bank || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="py-3 px-4">
                    {row.status === 'matched' ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        <CheckCircle size={12} />
                        <span>Matched</span>
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center space-x-2">
          <FileText size={20} />
          <span>Export Options</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-medium mb-2">Excel (.xlsx)</p>
            <p>Formatted spreadsheet with all data, formulas, and summaries</p>
          </div>
          <div>
            <p className="font-medium mb-2">CSV (.csv)</p>
            <p>Simple comma-separated values for import into other systems</p>
          </div>
          <div>
            <p className="font-medium mb-2">PDF Report</p>
            <p>Professional formatted report with charts and summaries</p>
          </div>
          <div>
            <p className="font-medium mb-2">JSON Data</p>
            <p>Raw data format for API integration and custom processing</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsolidatedExport;
