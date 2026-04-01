import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, Download, Calendar, Edit3, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCompany } from '../../context/CompanyContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const BankImport = () => {
  const { t } = useTranslation(['banking', 'common']);
  const [importing, setImporting] = useState(false);
  const [showTransactionTable, setShowTransactionTable] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [importedFiles, setImportedFiles] = useState([]);
  const [currentFileName, setCurrentFileName] = useState('');
  const { activeCompany } = useCompany();
  const { user } = useAuth();

  // Simple CSV → transaction row parser
  const parseCsv = (text) => {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const find = (...keys) => headers.findIndex(h => keys.some(k => h.includes(k)));
    const dateIdx   = find('date');
    const descIdx   = find('description', 'memo', 'details', 'narrative');
    const amountIdx = find('amount');
    const debitIdx  = find('debit');
    const creditIdx = find('credit');

    return lines.slice(1).map((line, i) => {
      const cols = line.split(',').map(c => c.trim().replace(/"/g, ''));
      let amount = 0;
      if (amountIdx >= 0) {
        amount = parseFloat((cols[amountIdx] || '0').replace(/[^0-9.-]/g, '')) || 0;
      } else if (debitIdx >= 0 || creditIdx >= 0) {
        const debit  = parseFloat((cols[debitIdx]  || '0').replace(/[^0-9.-]/g, '')) || 0;
        const credit = parseFloat((cols[creditIdx] || '0').replace(/[^0-9.-]/g, '')) || 0;
        amount = credit - debit;
      }
      return {
        id: i + 1,
        date: dateIdx >= 0 ? cols[dateIdx] : '',
        description: descIdx >= 0 ? cols[descIdx] : `Transaction ${i + 1}`,
        amount,
        category: '',
        confidence: 0.8,
        isDuplicate: false,
        selected: true,
        editable: false,
      };
    }).filter(t => t.date || t.description);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCurrentFileName(file.name);
    setImporting(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCsv(ev.target.result);
      setTransactions(parsed);
      setShowTransactionTable(true);
      setImporting(false);
    };
    reader.onerror = () => setImporting(false);
    reader.readAsText(file);
  };

  const toggleSelectAll = () => {
    const allSelected = transactions.every(t => t.selected || t.isDuplicate);
    setTransactions(transactions.map(t => ({
      ...t,
      selected: t.isDuplicate ? false : !allSelected
    })));
  };

  const toggleTransaction = (id) => {
    setTransactions(transactions.map(t =>
      t.id === id ? { ...t, selected: !t.selected } : t
    ));
  };

  const toggleEdit = (id) => {
    setTransactions(transactions.map(t =>
      t.id === id ? { ...t, editable: !t.editable } : t
    ));
  };

  const updateTransaction = (id, field, value) => {
    setTransactions(transactions.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleConfirmTransactions = async () => {
    const selected = transactions.filter(t => t.selected);
    if (selected.length === 0) {
      alert('Please select at least one transaction to import');
      return;
    }

    const rows = selected.map(t => ({
      transaction_date: t.date,
      description: t.description,
      amount: t.amount,
      category: t.category || null,
    }));

    try {
      setImporting(true);
      await api.bulkCreateTransactions(activeCompany?.id, rows, user?.id);
      
      // Attempt batch auto-matching after successful import
      try {
        const matchResult = await api.autoMatchBatch(activeCompany?.id, 70);
        const matchedCount = matchResult?.successfulMatches || 0;
        
        const newFile = {
          id: Date.now(),
          name: currentFileName || `bank_import_${new Date().toISOString().split('T')[0]}.csv`,
          bank: 'Manual Upload',
          date: new Date().toISOString().split('T')[0],
          transactions: selected.length,
          status: 'completed',
        };
        setImportedFiles([newFile, ...importedFiles]);
        setShowTransactionTable(false);
        setTransactions([]);
        
        if (matchedCount > 0) {
          alert(`✓ ${selected.length} transactions imported and ${matchedCount} invoice(s) automatically matched!`);
        } else {
          alert(`${selected.length} transactions imported successfully!`);
        }
      } catch (matchErr) {
        // Auto-match failed, but import succeeded - show import success
        console.warn('Auto-match failed:', matchErr);
        const newFile = {
          id: Date.now(),
          name: currentFileName || `bank_import_${new Date().toISOString().split('T')[0]}.csv`,
          bank: 'Manual Upload',
          date: new Date().toISOString().split('T')[0],
          transactions: selected.length,
          status: 'completed',
        };
        setImportedFiles([newFile, ...importedFiles]);
        setShowTransactionTable(false);
        setTransactions([]);
        alert(`${selected.length} transactions imported successfully!`);
      }
    } catch (err) {
      alert('Failed to import transactions: ' + (err.message || err));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-600 mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* Manual Upload */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('manualUpload.title')}</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <FileSpreadsheet className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('manualUpload.subtitle')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('manualUpload.description')}
          </p>
          <label className="inline-block">
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".csv,.xls,.xlsx,.ofx"
              disabled={importing}
            />
            <span className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block">
              {importing ? t('manualUpload.importing') : t('manualUpload.selectFile')}
            </span>
          </label>
        </div>

        {/* Import Progress */}
        {importing && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-blue-900 font-medium">Processing bank statement...</span>
            </div>
            <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}
      </div>

      {/* Transaction Preview Table */}
      {showTransactionTable && transactions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t('transactionPreview.title', { count: transactions.length })}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t('transactionPreview.subtitle')}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {t('transactionPreview.selected')}: <span className="font-semibold">{transactions.filter(t => t.selected).length}</span>
              </span>
            </div>
          </div>

          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">{t('transactionPreview.reviewWarning')}</p>
              <p>{t('transactionPreview.warningText')}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={transactions.every(t => t.selected || t.isDuplicate)}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('transactionPreview.date')}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('transactionPreview.description')}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{t('transactionPreview.amount')}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('transactionPreview.category')}</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{t('transactionPreview.confidence')}</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{t('transactionPreview.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      transaction.isDuplicate ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={transaction.selected}
                        onChange={() => toggleTransaction(transaction.id)}
                        disabled={transaction.isDuplicate}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {transaction.editable ? (
                        <input
                          type="date"
                          value={transaction.date}
                          onChange={(e) => updateTransaction(transaction.id, 'date', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{transaction.date}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {transaction.editable ? (
                        <input
                          type="text"
                          value={transaction.description}
                          onChange={(e) => updateTransaction(transaction.id, 'description', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{transaction.description}</span>
                      )}
                      {transaction.isDuplicate && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                          {t('transactionPreview.possibleDuplicate')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {transaction.editable ? (
                        <input
                          type="number"
                          step="0.01"
                          value={transaction.amount}
                          onChange={(e) => updateTransaction(transaction.id, 'amount', parseFloat(e.target.value))}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                        />
                      ) : (
                        <span className={`text-sm font-medium ${
                          transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ₪{Math.abs(transaction.amount).toFixed(2)}
                          {transaction.amount < 0 && ' DR'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {transaction.editable ? (
                        <input
                          type="text"
                          value={transaction.category}
                          onChange={(e) => updateTransaction(transaction.id, 'category', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <span className="text-sm text-gray-700">{transaction.category}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.confidence >= 0.9
                          ? 'bg-green-100 text-green-800'
                          : transaction.confidence >= 0.7
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(transaction.confidence * 100)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleEdit(transaction.id)}
                        className="p-1 text-blue-600 hover:text-blue-700"
                        title={transaction.editable ? 'Save' : 'Edit'}
                      >
                        <Edit3 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <p>
                {t('transactionPreview.selectionSummary', { 
                  selected: transactions.filter(t => t.selected).length,
                  total: transactions.length 
                })}
              </p>
              {transactions.some(t => t.isDuplicate) && (
                <p className="text-red-600 mt-1">
                  {t('transactionPreview.duplicatesDetected', { count: transactions.filter(t => t.isDuplicate).length })}
                </p>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowTransactionTable(false);
                  setTransactions([]);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirmTransactions}
                disabled={transactions.filter(t => t.selected).length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <CheckCircle size={18} />
                <span>{t('transactionPreview.confirmImport', { count: transactions.filter(t => t.selected).length })}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Imported Files History */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{t('importHistory.title')}</h2>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            {t('importHistory.viewAll')}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('importHistory.fileName')}</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('importHistory.bankSource')}</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('importHistory.date')}</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('importHistory.transactions')}</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('importHistory.status')}</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('importHistory.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {importedFiles.map((file) => (
                <tr key={file.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <FileSpreadsheet className="text-green-600" size={20} />
                      <span className="text-sm text-gray-900">{file.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{file.bank}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <Calendar size={16} />
                      <span>{file.date}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{file.transactions}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      file.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {file.status === 'completed' ? t('importHistory.completed') : t('importHistory.processing')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-blue-600 hover:text-blue-700 p-1">
                      <Download size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">{t('instructions.title')}</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>{t('instructions.step1')}</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>{t('instructions.step2')}</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>{t('instructions.step3')}</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>{t('instructions.step4')}</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>{t('instructions.step5')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default BankImport;
