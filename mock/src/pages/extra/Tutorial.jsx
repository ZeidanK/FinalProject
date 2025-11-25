import { useState } from 'react';
import { X, CheckCircle, ArrowRight, Upload, GitCompare, FileText, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Tutorial = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showModal, setShowModal] = useState(true);

  const steps = [
    {
      id: 1,
      title: 'Welcome to Financial Reconciliation',
      description: 'Let\'s take a quick tour of the platform and get you started with automated invoice matching.',
      icon: CheckCircle,
      color: 'blue',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            This tutorial will guide you through:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start space-x-2">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
              <span>Uploading and processing invoices</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
              <span>Connecting your bank accounts</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
              <span>Matching transactions automatically</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
              <span>Generating compliance reports</span>
            </li>
          </ul>
          <p className="text-sm text-gray-600 mt-4">
            This tutorial takes approximately 5 minutes. You can skip it and access it later from the Help menu.
          </p>
        </div>
      )
    },
    {
      id: 2,
      title: 'Step 1: Upload Your Invoices',
      description: 'Start by uploading invoices - our AI will automatically extract all the important data.',
      icon: Upload,
      color: 'green',
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <Upload className="mx-auto text-green-600 mb-3" size={48} />
            <p className="text-center font-medium text-gray-900">Invoice Upload</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-semibold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Navigate to Invoice Upload</p>
                <p className="text-sm text-gray-600">Find it in the Workflow section of the sidebar</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-semibold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Upload files</p>
                <p className="text-sm text-gray-600">Drag & drop or click to select PDF, JPG, or PNG files</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-semibold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">AI processes automatically</p>
                <p className="text-sm text-gray-600">Extracts amounts, dates, vendor info, and VAT</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: 'Step 2: Connect Your Bank',
      description: 'Link your bank accounts for automatic transaction import and synchronization.',
      icon: Settings,
      color: 'purple',
      content: (
        <div className="space-y-4">
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
            <Settings className="mx-auto text-purple-600 mb-3" size={48} />
            <p className="text-center font-medium text-gray-900">Bank Connection</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-semibold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Go to Bank Accounts</p>
                <p className="text-sm text-gray-600">Settings → Bank Accounts</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-semibold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Select your bank</p>
                <p className="text-sm text-gray-600">Choose from supported institutions</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-semibold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Secure authentication</p>
                <p className="text-sm text-gray-600">OAuth connection - your credentials stay with your bank</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Secure:</strong> Read-only access with bank-level encryption. We cannot initiate transactions.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: 'Step 3: Match Transactions',
      description: 'AI automatically matches invoices with bank transactions. Review and approve matches.',
      icon: GitCompare,
      color: 'orange',
      content: (
        <div className="space-y-4">
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
            <GitCompare className="mx-auto text-orange-600 mb-3" size={48} />
            <p className="text-center font-medium text-gray-900">Smart Matching</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-semibold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">AI suggests matches</p>
                <p className="text-sm text-gray-600">Based on amount, date, vendor name, and description</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-semibold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Review confidence scores</p>
                <p className="text-sm text-gray-600">High confidence matches can be auto-approved</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-semibold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Manual matching available</p>
                <p className="text-sm text-gray-600">Select items from both lists and click "Match"</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              <strong>Pro Tip:</strong> The AI learns from your corrections to improve future matches!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: 'Step 4: Generate Reports',
      description: 'Create comprehensive reports for VAT, expenses, and compliance requirements.',
      icon: FileText,
      color: 'red',
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <FileText className="mx-auto text-red-600 mb-3" size={48} />
            <p className="text-center font-medium text-gray-900">Reports & Export</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 font-semibold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Access Reports Dashboard</p>
                <p className="text-sm text-gray-600">View all available report types</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 font-semibold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Generate VAT reports</p>
                <p className="text-sm text-gray-600">Select period, view breakdown by rate and category</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 font-semibold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Export in multiple formats</p>
                <p className="text-sm text-gray-600">Excel, PDF, CSV, or accounting software formats</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: 'You\'re All Set!',
      description: 'Congratulations! You\'re ready to start using the Financial Reconciliation System.',
      icon: CheckCircle,
      color: 'green',
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center">
            <CheckCircle className="mx-auto text-green-600 mb-4" size={64} />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Tutorial Complete!</h3>
            <p className="text-gray-700">You're now ready to streamline your financial reconciliation process.</p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-3">Next Steps:</h4>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/invoice-upload')}
                className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <p className="font-medium text-blue-900">Upload your first invoice</p>
                <p className="text-sm text-blue-700">Start with invoice processing</p>
              </button>
              <button
                onClick={() => navigate('/bank-accounts')}
                className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <p className="font-medium text-purple-900">Connect a bank account</p>
                <p className="text-sm text-purple-700">Enable automatic transaction import</p>
              </button>
              <button
                onClick={() => navigate('/help')}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <p className="font-medium text-gray-900">Visit Help Center</p>
                <p className="text-sm text-gray-700">Learn more tips and tricks</p>
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-800">
              You can revisit this tutorial anytime from Help & Support → Tutorial
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowModal(false);
      navigate('/dashboard');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setShowModal(false);
    navigate('/dashboard');
  };

  if (!showModal) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <CheckCircle className="mx-auto text-green-600 mb-6" size={64} />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Tutorial Completed</h2>
        <p className="text-gray-600 mb-8">You can restart the tutorial anytime from this page.</p>
        <button
          onClick={() => {
            setCurrentStep(0);
            setShowModal(true);
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Restart Tutorial
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Tutorial Progress</span>
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Tutorial Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className={`bg-${currentStepData.color}-600 p-6 text-white`}>
          <div className="flex items-center justify-between mb-4">
            <Icon size={48} />
            <button
              onClick={handleSkip}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <h2 className="text-2xl font-bold mb-2">{currentStepData.title}</h2>
          <p className="text-blue-100">{currentStepData.description}</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {currentStepData.content}
        </div>

        {/* Navigation */}
        <div className="border-t border-gray-200 p-6 flex items-center justify-between bg-gray-50">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex items-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-blue-600 w-8' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>{currentStep === steps.length - 1 ? 'Finish' : 'Next'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Skip Tutorial Link */}
      <div className="text-center mt-6">
        <button
          onClick={handleSkip}
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          Skip tutorial and go to dashboard
        </button>
      </div>
    </div>
  );
};

export default Tutorial;
