import { useState, useEffect } from 'react';
import { GitCompare, CheckCircle, X, AlertTriangle, Search, Filter } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const MatchingReconciliation = () => {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [matches, setMatches] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { activeCompany } = useCompany();
  const { user } = useAuth();

  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [transactionSearch, setTransactionSearch] = useState('');

  useEffect(() => {
    if (!activeCompany?.id) return;
    setLoading(true);
    Promise.all([
      api.getInvoices(activeCompany.id, { is_matched: false }),
      api.getTransactions(activeCompany.id, { is_matched: false }),
      api.getMatches(activeCompany.id),
    ]).then(([inv, trx, mat]) => {
      setInvoices(inv.map(i => ({
        id: i.id,
        number: i.invoice_number,
        vendor: i.vendor_name,
        date: i.invoice_date ? i.invoice_date.split('T')[0] : '',
        amount: parseFloat(i.total_amount) || 0,
        status: i.is_matched ? 'matched' : 'unmatched',
      })));
      setTransactions(trx.map(t => ({
        id: t.id,
        date: t.transaction_date ? t.transaction_date.split('T')[0] : '',
        description: t.description,
        amount: parseFloat(t.amount) || 0,
        bank: t.bank_account_id || '',
        status: t.is_matched ? 'matched' : 'unmatched',
      })));
      setMatches(mat.filter(m => m.status === 'active').map(m => ({
        id: m.id,
        invoice:     { id: m.invoice_id,     number: m.invoice_number, vendor: m.vendor_name,      amount: parseFloat(m.invoice_amount) || 0 },
        transaction: { id: m.transaction_id, description: m.transaction_description, amount: parseFloat(m.transaction_amount) || 0 },
        matchedAt: m.created_at,
      })));
    }).catch(console.error).finally(() => setLoading(false));
  }, [activeCompany?.id]);

  const handleMatch = async () => {
    if (!selectedInvoice || !selectedTransaction) return;
    try {
      const inv = invoices.find(i => i.id === selectedInvoice);
      const trx = transactions.find(t => t.id === selectedTransaction);
      const result = await api.createMatch({
        invoice_id: inv.id,
        transaction_id: trx.id,
        matched_amount: Math.min(Math.abs(inv.amount), Math.abs(trx.amount)),
        match_confidence: 1.0,
        matched_by_user_id: user?.id,
      });
      setMatches(prev => [...prev, { id: result.id || Date.now(), invoice: inv, transaction: trx, matchedAt: new Date().toISOString() }]);
      setInvoices(prev => prev.filter(i => i.id !== inv.id));
      setTransactions(prev => prev.filter(t => t.id !== trx.id));
      setSelectedInvoice(null);
      setSelectedTransaction(null);
    } catch (err) {
      alert('Failed to create match: ' + (err.message || err));
    }
  };

  const unmatch = async (matchId) => {
    try {
      await api.updateMatch(matchId, { status: 'cancelled' });
      setMatches(prev => prev.filter(m => m.id !== matchId));
    } catch (err) {
      alert('Failed to unmatch: ' + (err.message || err));
    }
  };

  const filteredInvoices = invoices.filter(i =>
    i.status === 'unmatched' &&
    (i.vendor?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
     i.number?.toLowerCase().includes(invoiceSearch.toLowerCase()))
  );

  const filteredTransactions = transactions.filter(t =>
    t.status === 'unmatched' &&
    t.description?.toLowerCase().includes(transactionSearch.toLowerCase())
  );

  const aiSuggestions = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Match & Reconcile</h1>
        <p className="text-gray-600 mt-1">
          Smart comparison and matching of invoices against bank transactions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Pending Invoices</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {invoices.filter(i => i.status === 'unmatched').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Unmatched Transactions</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {transactions.filter(t => t.status === 'unmatched').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Matched Today</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{matches.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">AI Suggestions</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{aiSuggestions.length}</p>
        </div>
      </div>

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <GitCompare className="text-blue-600" size={20} />
            <span>AI-Suggested Matches</span>
          </h2>
          <div className="space-y-3">
            {aiSuggestions.map((suggestion, index) => (
              <div key={index} className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-12 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${suggestion.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      {suggestion.confidence}% Match
                    </span>
                  </div>
                  <button className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                    Accept Match
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Invoice: {suggestion.invoice.number}</p>
                    <p className="font-medium text-gray-900">{suggestion.invoice.vendor}</p>
                    <p className="text-gray-600">€{suggestion.invoice.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Transaction {suggestion.transaction.id}</p>
                    <p className="font-medium text-gray-900">{suggestion.transaction.description}</p>
                    <p className="text-gray-600">€{Math.abs(suggestion.transaction.amount).toFixed(2)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2 italic">{suggestion.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Matching Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoices Panel */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Filter size={18} />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search invoices..."
                value={invoiceSearch}
                onChange={e => setInvoiceSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {loading && <p className="text-sm text-gray-500 text-center py-4">Loading…</p>}
            {!loading && filteredInvoices.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No unmatched invoices.</p>}
            {filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                onClick={() => setSelectedInvoice(invoice.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedInvoice === invoice.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{invoice.number}</p>
                    <p className="text-sm text-gray-600">{invoice.vendor}</p>
                  </div>
                  <p className="font-bold text-gray-900">€{invoice.amount.toFixed(2)}</p>
                </div>
                <p className="text-xs text-gray-500">{invoice.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions Panel */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Bank Transactions</h2>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Filter size={18} />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={transactionSearch}
                onChange={e => setTransactionSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {loading && <p className="text-sm text-gray-500 text-center py-4">Loading…</p>}
            {!loading && filteredTransactions.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No unmatched transactions.</p>}
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                onClick={() => setSelectedTransaction(transaction.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTransaction === transaction.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-600">{transaction.bank}</p>
                  </div>
                  <p className="font-bold text-red-600">€{Math.abs(transaction.amount).toFixed(2)}</p>
                </div>
                <p className="text-xs text-gray-500">{transaction.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Match Button */}
      {(selectedInvoice || selectedTransaction) && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Selected Invoice</p>
                <p className="font-semibold text-gray-900">
                  {selectedInvoice ? invoices.find(i => i.id === selectedInvoice)?.number : 'None'}
                </p>
              </div>
              <GitCompare className="text-gray-400" size={32} />
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Selected Transaction</p>
                <p className="font-semibold text-gray-900">
                  {selectedTransaction ? `TRX-${selectedTransaction}` : 'None'}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedInvoice(null);
                  setSelectedTransaction(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Selection
              </button>
              <button
                onClick={handleMatch}
                disabled={!selectedInvoice || !selectedTransaction}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <CheckCircle size={18} />
                <span>Match Items</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Matched Items */}
      {matches.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recently Matched ({matches.length})</h2>
          <div className="space-y-3">
            {matches.map((match) => (
              <div key={match.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-6">
                  <CheckCircle className="text-green-600" size={24} />
                  <div>
                    <p className="font-medium text-gray-900">{match.invoice.number} ↔ TRX-{match.transaction.id}</p>
                    <p className="text-sm text-gray-600">
                      {match.invoice.vendor} • €{match.invoice.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => unmatch(match.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchingReconciliation;
