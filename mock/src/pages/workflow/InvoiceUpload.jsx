import { useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Edit3, Save } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const InvoiceUpload = () => {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [currentVerification, setCurrentVerification] = useState(null);
  const { activeCompany } = useCompany();
  const { user } = useAuth();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  // Map OCR server response to the editable extraction format used by the modal
  const mapOcrToExtracted = (extracted) => ({
    vendorName:    { value: extracted.vendor_name    || '',   confidence: 0.85 },
    invoiceNumber: { value: extracted.invoice_number || '',   confidence: 0.90 },
    invoiceDate:   { value: extracted.invoice_date   || '',   confidence: 0.85 },
    dueDate:       { value: extracted.due_date       || '',   confidence: 0.80 },
    subtotal:      { value: extracted.subtotal        ?? '',  confidence: 0.85 },
    vatRate:       { value: extracted.vat_rate        ?? '',  confidence: extracted.vat_rate != null ? 0.85 : 0.50 },
    vatAmount:     { value: extracted.vat_amount      ?? '',  confidence: 0.85 },
    totalAmount:   { value: extracted.total_amount    ?? '',  confidence: 0.90 },
    currency:      { value: 'USD',                            confidence: 0.99 },
    lineItems: (extracted.line_items || []).map(item => ({
      description: item.description || '',
      qty:         item.qty         ?? 1,
      unitPrice:   item.unitPrice   ?? 0,
      total:       item.total       ?? 0,
      confidence:  item.confidence  ?? 0.70,
    }))
  });

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList).map((file, index) => ({
      id: Date.now() + index,
      file,                          // keep the real File object for upload
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      type: file.type,
      status: 'uploaded',
      progress: 100,
      extractedData: null
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id) => {
    setFiles(files.filter(file => file.id !== id));
  };

  const processFiles = () => {
    const unprocessed = files.filter(f => f.status === 'uploaded');
    if (!unprocessed.length) return;

    // Mark all as processing
    setFiles(prev => prev.map(f =>
      f.status === 'uploaded' ? { ...f, status: 'processing', progress: 0 } : f
    ));

    unprocessed.forEach((fileEntry) => {
      api.uploadInvoiceFile(fileEntry.file)
        .then((response) => {
          const extractedData = response.ocr_skipped
            ? mapOcrToExtracted({})   // PDF: no OCR data
            : mapOcrToExtracted(response.extracted || {});
          setFiles(prev => prev.map(f =>
            f.id === fileEntry.id
              ? { ...f, status: 'completed', progress: 100, extractedData, serverFile: response.file }
              : f
          ));
        })
        .catch(() => {
          setFiles(prev => prev.map(f =>
            f.id === fileEntry.id ? { ...f, status: 'error', progress: 0 } : f
          ));
        });
    });
  };
      0

  const handleVerifyFile = (file) => {
    setCurrentVerification({
      ...file,
      editableData: JSON.parse(JSON.stringify(file.extractedData))
    });
    setShowVerificationModal(true);
  };

  const handleSaveVerification = async () => {
    if (activeCompany?.id) {
      const d = currentVerification.editableData;
      try {
        await api.createInvoice({
          company_id:           activeCompany.id,
          invoice_number:       d.invoiceNumber?.value || '',
          vendor_name:          d.vendorName?.value    || '',
          invoice_date:         d.invoiceDate?.value   || null,
          due_date:             d.dueDate?.value        || null,
          subtotal:             parseFloat(d.subtotal?.value)    || 0,
          vat_rate:             parseFloat(d.vatRate?.value)     || null,
          vat_amount:           parseFloat(d.vatAmount?.value)   || 0,
          total_amount:         parseFloat(d.totalAmount?.value) || 0,
          currency:             d.currency?.value       || 'USD',
          file_path:            currentVerification.serverFile?.filename || '',
          status:               'uploaded',
          uploaded_by_user_id:  user?.id,
          line_items: (d.lineItems || []).map((item, idx) => ({
            line_number:  idx + 1,
            description:  item.description || '',
            quantity:     item.qty         ?? 1,
            unit_price:   item.unitPrice   ?? 0,
            total_amount: item.total       ?? 0,
          })),
        });

        setFiles(files.map(f =>
          f.id === currentVerification.id
            ? { ...f, extractedData: currentVerification.editableData, verified: true }
            : f
        ));
        setShowVerificationModal(false);
        setCurrentVerification(null);
        alert('Invoice saved successfully!');
      } catch (err) {
        console.error('Failed to save invoice:', err);
        alert('Failed to save invoice. Please try again.');
      }
    } else {
      alert('No active company selected. Please select a company first.');
    }
  };

  const updateVerificationField = (field, value) => {
    setCurrentVerification(prev => {
      const updated = {
        ...prev.editableData,
        [field]: { ...prev.editableData[field], value }
      };

      // When vatRate changes, recompute vatAmount and totalAmount from subtotal
      if (field === 'vatRate') {
        const sub = parseFloat(updated.subtotal?.value) || 0;
        const rate = parseFloat(value) || 0;
        if (sub > 0 && rate > 0) {
          const computedVat = (sub * rate / 100).toFixed(2);
          updated.vatAmount = { ...updated.vatAmount, value: computedVat };
          updated.totalAmount = { ...updated.totalAmount, value: (sub + parseFloat(computedVat)).toFixed(2) };
        }
      }

      // When subtotal or vatAmount changes, recompute totalAmount
      if (field === 'subtotal' || field === 'vatAmount') {
        const sub = parseFloat(field === 'subtotal' ? value : updated.subtotal?.value) || 0;
        const vat = parseFloat(field === 'vatAmount' ? value : updated.vatAmount?.value) || 0;
        if (sub > 0 || vat > 0) {
          updated.totalAmount = { ...updated.totalAmount, value: (sub + vat).toFixed(2) };
        }
      }

      return { ...prev, editableData: updated };
    });
  };

  const updateLineItem = (index, field, value) => {
    setCurrentVerification(prev => {
      const newLineItems = [...prev.editableData.lineItems];
      newLineItems[index] = {
        ...newLineItems[index],
        [field]: value
      };
      return {
        ...prev,
        editableData: {
          ...prev.editableData,
          lineItems: newLineItems
        }
      };
    });
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-100';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Invoices</h1>
        <p className="text-gray-600 mt-1">
          Upload digital or scanned invoices for automatic processing
        </p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Drop files here or click to upload
          </h3>
          <p className="text-gray-600 mb-4">
            Support for PDF, JPG, PNG files up to 10MB
          </p>
          <label className="inline-block">
            <input
              type="file"
              multiple
              onChange={handleChange}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <span className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block">
              Select Files
            </span>
          </label>
        </div>
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Uploaded Files ({files.length})
            </h2>
            <button
              onClick={processFiles}
              disabled={files.some(f => f.status === 'processing')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Process All
            </button>
          </div>

          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-lg ${
                  file.status === 'completed' ? 'bg-green-100' :
                  file.status === 'error' ? 'bg-red-100' :
                  file.status === 'processing' ? 'bg-blue-100' :
                  'bg-gray-100'
                }`}>
                  {file.status === 'completed' && <CheckCircle className="text-green-600" size={24} />}
                  {file.status === 'error' && <AlertCircle className="text-red-600" size={24} />}
                  {file.status === 'processing' && <FileText className="text-blue-600 animate-pulse" size={24} />}
                  {file.status === 'uploaded' && <FileText className="text-gray-600" size={24} />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <span className="text-sm text-gray-500">{file.size}</span>
                  </div>
                  
                  {file.status === 'processing' && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                  
                  {file.status !== 'processing' && (
                    <p className="text-sm text-gray-500">
                      {file.status === 'completed' && !file.verified && 'Ready for verification'}
                      {file.status === 'completed' && file.verified && 'Verified ✓'}
                      {file.status === 'error' && 'Processing failed'}
                      {file.status === 'uploaded' && 'Ready to process'}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {file.status === 'completed' && file.extractedData && (
                    <button
                      onClick={() => handleVerifyFile(file)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        file.verified 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <Edit3 size={16} className="inline mr-1" />
                      {file.verified ? 'Edit' : 'Verify'}
                    </button>
                  )}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && currentVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Verify Extracted Data</h2>
                  <p className="text-gray-600 mt-1">{currentVerification.name}</p>
                </div>
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Main Invoice Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Name
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getConfidenceColor(currentVerification.editableData.vendorName.confidence)}`}>
                      {Math.round(currentVerification.editableData.vendorName.confidence * 100)}%
                    </span>
                  </label>
                  <input
                    type="text"
                    value={currentVerification.editableData.vendorName.value}
                    onChange={(e) => updateVerificationField('vendorName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Number
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getConfidenceColor(currentVerification.editableData.invoiceNumber.confidence)}`}>
                      {Math.round(currentVerification.editableData.invoiceNumber.confidence * 100)}%
                    </span>
                  </label>
                  <input
                    type="text"
                    value={currentVerification.editableData.invoiceNumber.value}
                    onChange={(e) => updateVerificationField('invoiceNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Date
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getConfidenceColor(currentVerification.editableData.invoiceDate.confidence)}`}>
                      {Math.round(currentVerification.editableData.invoiceDate.confidence * 100)}%
                    </span>
                  </label>
                  <input
                    type="date"
                    value={currentVerification.editableData.invoiceDate.value}
                    onChange={(e) => updateVerificationField('invoiceDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getConfidenceColor(currentVerification.editableData.dueDate.confidence)}`}>
                      {Math.round(currentVerification.editableData.dueDate.confidence * 100)}%
                    </span>
                  </label>
                  <input
                    type="date"
                    value={currentVerification.editableData.dueDate.value}
                    onChange={(e) => updateVerificationField('dueDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getConfidenceColor(currentVerification.editableData.currency.confidence)}`}>
                      {Math.round(currentVerification.editableData.currency.confidence * 100)}%
                    </span>
                  </label>
                  <select
                    value={currentVerification.editableData.currency.value}
                    onChange={(e) => updateVerificationField('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    VAT Rate (%)
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getConfidenceColor(currentVerification.editableData.vatRate.confidence)}`}>
                      {Math.round(currentVerification.editableData.vatRate.confidence * 100)}%
                    </span>
                  </label>
                  <input
                    type="number"
                    value={currentVerification.editableData.vatRate.value}
                    onChange={(e) => updateVerificationField('vatRate', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Line Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Description</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Qty</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Unit Price</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Total</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentVerification.editableData.lineItems.map((item, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) => updateLineItem(index, 'qty', parseFloat(e.target.value))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value))}
                              className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2 font-medium">${item.total.toFixed(2)}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded text-xs ${getConfidenceColor(item.confidence)}`}>
                              {Math.round(item.confidence * 100)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Subtotal:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${getConfidenceColor(currentVerification.editableData.subtotal.confidence)}`}>
                      {Math.round(currentVerification.editableData.subtotal.confidence * 100)}%
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={currentVerification.editableData.subtotal.value}
                      onChange={(e) => updateVerificationField('subtotal', parseFloat(e.target.value))}
                      className="w-32 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">VAT Amount:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${getConfidenceColor(currentVerification.editableData.vatAmount.confidence)}`}>
                      {Math.round(currentVerification.editableData.vatAmount.confidence * 100)}%
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={currentVerification.editableData.vatAmount.value}
                      onChange={(e) => updateVerificationField('vatAmount', parseFloat(e.target.value))}
                      className="w-32 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${getConfidenceColor(currentVerification.editableData.totalAmount.confidence)}`}>
                      {Math.round(currentVerification.editableData.totalAmount.confidence * 100)}%
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={currentVerification.editableData.totalAmount.value}
                      onChange={(e) => updateVerificationField('totalAmount', parseFloat(e.target.value))}
                      className="w-32 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowVerificationModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVerification}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Save size={18} />
                <span>Save & Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Upload Instructions</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Ensure invoices are clearly scanned or in high-quality digital format</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Supported formats: PDF, JPG, PNG (max 10MB per file)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>AI will automatically extract invoice details including amounts, dates, and VAT</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Processed invoices will appear in the Processing Status page</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default InvoiceUpload;
