import { useState } from 'react';
import { Search, Book, MessageCircle, Mail, Phone, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const HelpSupport = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const categories = [
    { id: 1, name: 'Getting Started', icon: Book, count: 12, color: 'blue' },
    { id: 2, name: 'Invoice Upload', icon: HelpCircle, count: 8, color: 'green' },
    { id: 3, name: 'Bank Integration', icon: HelpCircle, count: 15, color: 'purple' },
    { id: 4, name: 'Matching & Reconciliation', icon: HelpCircle, count: 10, color: 'orange' },
    { id: 5, name: 'Reports & Compliance', icon: HelpCircle, count: 7, color: 'red' },
    { id: 6, name: 'Troubleshooting', icon: HelpCircle, count: 18, color: 'gray' }
  ];

  const faqs = [
    {
      id: 1,
      category: 'Getting Started',
      question: 'How do I upload my first invoice?',
      answer: 'Navigate to the Invoice Upload page from the sidebar menu. You can either drag and drop files or click the "Select Files" button. The system supports PDF, JPG, and PNG formats up to 10MB per file.'
    },
    {
      id: 2,
      category: 'Getting Started',
      question: 'What file formats are supported?',
      answer: 'For invoices, we support PDF, JPG, JPEG, and PNG files. For bank statements, we support CSV, XLS, XLSX, and OFX formats. All files should be under 10MB in size.'
    },
    {
      id: 3,
      category: 'Bank Integration',
      question: 'How do I connect my bank account?',
      answer: 'Go to Settings > Bank Accounts and click "Add Account". Select your bank from the list and follow the OAuth authentication process. Your credentials are never stored on our servers.'
    },
    {
      id: 4,
      category: 'Bank Integration',
      question: 'Is my financial data secure?',
      answer: 'Yes! We use bank-level 256-bit encryption for all data transmission and storage. Connections are read-only and use OAuth 2.0. We cannot initiate transactions on your behalf.'
    },
    {
      id: 5,
      category: 'Matching & Reconciliation',
      question: 'How does automatic matching work?',
      answer: 'Our AI system compares invoices with bank transactions based on amount, date proximity, vendor name similarity, and transaction descriptions. Matches above your confidence threshold are automatically paired.'
    },
    {
      id: 6,
      category: 'Matching & Reconciliation',
      question: 'Can I manually match transactions?',
      answer: 'Absolutely! On the Matching & Reconciliation page, select an invoice and a transaction, then click "Match Items". You can also unmatch automatic matches if they\'re incorrect.'
    },
    {
      id: 7,
      category: 'Reports & Compliance',
      question: 'How do I generate a VAT report?',
      answer: 'Navigate to Reports > VAT Report. Select your date range and click "Generate". The report shows VAT by rate, category breakdown, and can be exported in multiple formats including HMRC MTD.'
    },
    {
      id: 8,
      category: 'Reports & Compliance',
      question: 'What export formats are available?',
      answer: 'Reports can be exported as Excel (.xlsx), CSV, PDF, or JSON. The Consolidated Export page offers additional formatting options for specific accounting software.'
    },
    {
      id: 9,
      category: 'Troubleshooting',
      question: 'Why is my invoice not being processed?',
      answer: 'Check that the file format is supported and under 10MB. Ensure the invoice is clearly readable - blurry or rotated images may fail. Check Processing Status page for error details.'
    },
    {
      id: 10,
      category: 'Troubleshooting',
      question: 'What do I do with low confidence extractions?',
      answer: 'Invoices with confidence below your threshold appear in Processing Status. Review the extracted data, make corrections, and save. The AI learns from your corrections.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-600 mt-2">
          Find answers, guides, and get assistance
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search for help articles, FAQs, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
          />
        </div>
      </div>

      {/* Quick Contact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <button className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-all border-2 border-gray-200 hover:border-blue-400">
          <MessageCircle className="mx-auto text-blue-600 mb-3" size={32} />
          <p className="font-semibold text-gray-900">Live Chat</p>
          <p className="text-sm text-gray-600 mt-1">Chat with support now</p>
        </button>
        <button className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-all border-2 border-gray-200 hover:border-blue-400">
          <Mail className="mx-auto text-green-600 mb-3" size={32} />
          <p className="font-semibold text-gray-900">Email Support</p>
          <p className="text-sm text-gray-600 mt-1">support@finrecon.com</p>
        </button>
        <button className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-all border-2 border-gray-200 hover:border-blue-400">
          <Phone className="mx-auto text-purple-600 mb-3" size={32} />
          <p className="font-semibold text-gray-900">Phone Support</p>
          <p className="text-sm text-gray-600 mt-1">+1 (555) 123-4567</p>
        </button>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                className={`p-4 rounded-lg border-2 border-gray-200 hover:border-${category.color}-400 hover:bg-${category.color}-50 transition-all text-center`}
              >
                <Icon className={`mx-auto text-${category.color}-600 mb-2`} size={24} />
                <p className="font-medium text-gray-900 text-sm">{category.name}</p>
                <p className="text-xs text-gray-500 mt-1">{category.count} articles</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors"
            >
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start space-x-3 text-left">
                  <HelpCircle className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">{faq.question}</p>
                    <p className="text-xs text-gray-500 mt-1">{faq.category}</p>
                  </div>
                </div>
                {expandedFaq === faq.id ? (
                  <ChevronUp className="text-gray-400 flex-shrink-0" size={20} />
                ) : (
                  <ChevronDown className="text-gray-400 flex-shrink-0" size={20} />
                )}
              </button>
              {expandedFaq === faq.id && (
                <div className="p-4 bg-white border-t border-gray-200">
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredFaqs.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No results found. Try a different search term.</p>
          </div>
        )}
      </div>

      {/* Popular Articles */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="#" className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all">
            <p className="font-medium text-gray-900 mb-2">Getting Started Guide</p>
            <p className="text-sm text-gray-600">Complete walkthrough for new users</p>
          </a>
          <a href="#" className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all">
            <p className="font-medium text-gray-900 mb-2">Bank Connection Setup</p>
            <p className="text-sm text-gray-600">How to securely connect your accounts</p>
          </a>
          <a href="#" className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all">
            <p className="font-medium text-gray-900 mb-2">Understanding AI Matching</p>
            <p className="text-sm text-gray-600">How automatic reconciliation works</p>
          </a>
          <a href="#" className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all">
            <p className="font-medium text-gray-900 mb-2">VAT Compliance Guide</p>
            <p className="text-sm text-gray-600">Generating tax-compliant reports</p>
          </a>
        </div>
      </div>

      {/* Video Tutorials */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Video Tutorials</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <div className="bg-gray-200 rounded-lg h-32 mb-3 flex items-center justify-center">
              <Book className="text-gray-400" size={48} />
            </div>
            <p className="font-medium text-gray-900">Quick Start (5 min)</p>
            <p className="text-sm text-gray-600 mt-1">Get up and running quickly</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="bg-gray-200 rounded-lg h-32 mb-3 flex items-center justify-center">
              <Book className="text-gray-400" size={48} />
            </div>
            <p className="font-medium text-gray-900">Advanced Features (12 min)</p>
            <p className="text-sm text-gray-600 mt-1">Master the platform</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="bg-gray-200 rounded-lg h-32 mb-3 flex items-center justify-center">
              <Book className="text-gray-400" size={48} />
            </div>
            <p className="font-medium text-gray-900">Tips & Tricks (8 min)</p>
            <p className="text-sm text-gray-600 mt-1">Work more efficiently</p>
          </div>
        </div>
      </div>

      {/* Still Need Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Still need help?</h3>
        <p className="text-blue-800 mb-4">
          Our support team is available 24/7 to assist you
        </p>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Contact Support Team
        </button>
      </div>
    </div>
  );
};

export default HelpSupport;
