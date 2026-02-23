import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, FileText, Calendar, DollarSign, Building, Download, Edit } from 'lucide-react';
import api from '../../services/api';

const InvoiceDetail = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getInvoice(id)
      .then(inv => setInvoice({
        id: inv.id,
        fileName: inv.file_path || `Invoice-${inv.id}`,
        vendor: {
          name:    inv.vendor_name || '',
          address: inv.vendor_address || '',
          taxId:   inv.vendor_tax_id || '',
          email:   inv.vendor_email || '',
        },
        invoiceNumber:       inv.invoice_number  || '',
        date:                inv.invoice_date    ? inv.invoice_date.split('T')[0] : '',
        dueDate:             inv.due_date        ? inv.due_date.split('T')[0]     : '',
        items:               inv.line_items      || [],
        subtotal:            parseFloat(inv.subtotal)    || 0,
        vatRate:             parseFloat(inv.vat_rate)    || 0,
        vatAmount:           parseFloat(inv.vat_amount)  || 0,
        total:               parseFloat(inv.total_amount)|| 0,
        currency:            inv.currency        || '',
        notes:               inv.notes           || '',
        extractedConfidence: inv.ocr_confidence  || null,
        status:              inv.status          || '',
        uploadDate:          inv.created_at      ? new Date(inv.created_at).toLocaleString()    : '',
        processedDate:       inv.updated_at      ? new Date(inv.updated_at).toLocaleString()    : '',
      }))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading invoice…</div>;
  if (!invoice) return <div className="p-8 text-center text-red-500">Invoice not found.</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/processing-status"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoice Details</h1>
            <p className="text-gray-600 mt-1">{invoice.fileName}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
            <Edit size={18} />
            <span>Edit</span>
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Download size={18} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Confidence Score */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-900">AI Extraction Confidence</p>
            <p className="text-xs text-green-700 mt-1">High confidence score - data verified</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-green-900">{invoice.extractedConfidence}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Invoice Number</p>
                <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <div className="flex items-center space-x-2">
                  <Calendar size={16} className="text-gray-400" />
                  <p className="font-semibold text-gray-900">{invoice.date}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Due Date</p>
                <div className="flex items-center space-x-2">
                  <Calendar size={16} className="text-gray-400" />
                  <p className="font-semibold text-gray-900">{invoice.dueDate}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Processed
                </span>
              </div>
            </div>
          </div>

          {/* Vendor Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Building size={20} />
              <span>Vendor Information</span>
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Company Name</p>
                <p className="font-semibold text-gray-900">{invoice.vendor.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="text-gray-900">{invoice.vendor.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Tax ID</p>
                  <p className="text-gray-900">{invoice.vendor.taxId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-900">{invoice.vendor.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Line Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Description</th>
                    <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">Qty</th>
                    <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">Unit Price</th>
                    <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-3 text-sm text-gray-900">{item.description}</td>
                      <td className="py-3 px-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="py-3 px-3 text-sm text-gray-900 text-right">
                        {invoice.currency}{item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-sm font-medium text-gray-900 text-right">
                        {invoice.currency}{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {invoice.currency}{invoice.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT ({invoice.vatRate}%)</span>
                <span className="font-medium text-gray-900">
                  {invoice.currency}{invoice.vatAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">
                  {invoice.currency}{invoice.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Notes</h2>
              <p className="text-gray-700">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Processing Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Processing Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Uploaded</p>
                  <p className="text-xs text-gray-600">{invoice.uploadDate}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">AI Processing</p>
                  <p className="text-xs text-gray-600">{invoice.uploadDate}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Completed</p>
                  <p className="text-xs text-gray-600">{invoice.processedDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                to="/matching"
                className="block w-full text-center py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Match with Transaction
              </Link>
              <button className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Flag for Review
              </button>
              <button className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Export Data
              </button>
            </div>
          </div>

          {/* Document Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Preview</h2>
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <FileText className="mx-auto text-gray-400 mb-2" size={48} />
              <p className="text-sm text-gray-600">PDF Preview</p>
              <button className="mt-3 text-sm text-blue-600 hover:text-blue-700">
                Open Full View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
