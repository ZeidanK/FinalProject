import { useState } from 'react';
import { Download, Calendar, FileText, TrendingUp, PieChart } from 'lucide-react';

const VATReport = () => {
  const [period, setPeriod] = useState({
    from: '2024-01-01',
    to: '2024-01-31'
  });

  const vatSummary = {
    outputVAT: 12450.00,  // VAT on sales
    inputVAT: 9046.90,     // VAT on purchases
    netVAT: 3403.10        // Amount to pay/reclaim
  };

  const vatRates = [
    { rate: '20%', transactions: 145, netAmount: 32500.00, vat: 6500.00, total: 39000.00 },
    { rate: '10%', transactions: 78, netAmount: 15600.00, vat: 1560.00, total: 17160.00 },
    { rate: '5%', transactions: 34, netAmount: 8900.00, vat: 445.00, total: 9345.00 },
    { rate: '0%', transactions: 12, netAmount: 5200.00, vat: 0.00, total: 5200.00 }
  ];

  const categoryBreakdown = [
    { category: 'Professional Services', netAmount: 18400.00, vat: 3680.00, percentage: 35 },
    { category: 'Office Supplies', netAmount: 12300.00, vat: 2460.00, percentage: 24 },
    { category: 'IT & Software', netAmount: 9800.00, vat: 1960.00, percentage: 19 },
    { category: 'Marketing', netAmount: 7200.00, vat: 1440.00, percentage: 14 },
    { category: 'Utilities', netAmount: 4500.00, vat: 900.00, percentage: 8 }
  ];

  const transactions = [
    {
      id: 1,
      date: '2024-01-15',
      invoice: 'INV-2024-1234',
      vendor: 'Acme Corp',
      description: 'Professional Services',
      netAmount: 1250.00,
      vatRate: '20%',
      vatAmount: 250.00,
      total: 1500.00
    },
    {
      id: 2,
      date: '2024-01-12',
      invoice: 'INV-2024-1235',
      vendor: 'Office Depot',
      description: 'Office Supplies',
      netAmount: 74.58,
      vatRate: '20%',
      vatAmount: 14.92,
      total: 89.50
    },
    {
      id: 3,
      date: '2024-01-10',
      invoice: 'INV-2024-1236',
      vendor: 'Tech Services Ltd',
      description: 'IT Consulting',
      netAmount: 2875.00,
      vatRate: '20%',
      vatAmount: 575.00,
      total: 3450.00
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">VAT Report</h1>
          <p className="text-gray-600 mt-1">
            Value Added Tax summary and detailed breakdown
          </p>
        </div>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Download size={18} />
          <span>Export Report</span>
        </button>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Period From</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                value={period.from}
                onChange={(e) => setPeriod({ ...period, from: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Period To</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                value={period.to}
                onChange={(e) => setPeriod({ ...period, to: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="pt-7">
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* VAT Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-900">Output VAT (Sales)</p>
            <TrendingUp className="text-blue-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-blue-900">€{vatSummary.outputVAT.toFixed(2)}</p>
          <p className="text-sm text-blue-700 mt-2">VAT charged on sales</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-green-900">Input VAT (Purchases)</p>
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-green-900">€{vatSummary.inputVAT.toFixed(2)}</p>
          <p className="text-sm text-green-700 mt-2">VAT paid on purchases</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-purple-900">Net VAT</p>
            <FileText className="text-purple-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-purple-900">€{vatSummary.netVAT.toFixed(2)}</p>
          <p className="text-sm text-purple-700 mt-2">Amount to pay</p>
        </div>
      </div>

      {/* VAT by Rate */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">VAT by Rate</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">VAT Rate</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Transactions</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Net Amount</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">VAT Amount</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {vatRates.map((rate, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900">{rate.rate}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">{rate.transactions}</td>
                  <td className="py-3 px-4 text-right text-gray-900">€{rate.netAmount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-medium text-blue-600">€{rate.vat.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">€{rate.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <PieChart size={20} />
            <span>VAT by Category</span>
          </h2>
          <div className="space-y-4">
            {categoryBreakdown.map((category, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{category.category}</span>
                  <span className="text-sm font-semibold text-gray-900">€{category.vat.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {category.percentage}% of total VAT • Net: €{category.netAmount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {transactions.map((txn) => (
              <div key={txn.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{txn.vendor}</p>
                    <p className="text-xs text-gray-600 mt-1">{txn.invoice} • {txn.date}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {txn.vatRate}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{txn.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Net: €{txn.netAmount.toFixed(2)}</span>
                  <span className="text-blue-600 font-medium">VAT: €{txn.vatAmount.toFixed(2)}</span>
                  <span className="font-semibold text-gray-900">Total: €{txn.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Export Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button className="px-4 py-3 bg-white border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left">
            <p className="font-medium text-gray-900">PDF Report</p>
            <p className="text-xs text-gray-600 mt-1">Formatted for printing</p>
          </button>
          <button className="px-4 py-3 bg-white border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left">
            <p className="font-medium text-gray-900">Excel Spreadsheet</p>
            <p className="text-xs text-gray-600 mt-1">Full data with calculations</p>
          </button>
          <button className="px-4 py-3 bg-white border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left">
            <p className="font-medium text-gray-900">HMRC MTD Format</p>
            <p className="text-xs text-gray-600 mt-1">Ready for submission</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VATReport;
