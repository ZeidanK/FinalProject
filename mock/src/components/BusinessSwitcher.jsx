import { useState } from 'react';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';

const BusinessSwitcher = () => {
  const [showBusinesses, setShowBusinesses] = useState(false);
  const { companies, activeCompany, setActiveCompany, loading } = useCompany();
  const { user } = useAuth();

  // For business owners: show their active company name as a read-only badge (no switching)
  if (user?.role === 'business-owner') {
    if (!activeCompany) return null;
    return (
      <div className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-200 bg-gray-50">
        <Building2 size={20} className="text-gray-600" />
        <div className="text-left">
          <p className="text-xs text-gray-500">Company</p>
          <p className="text-sm font-semibold text-gray-900">{activeCompany.name}</p>
        </div>
      </div>
    );
  }

  // Only show switcher for accountants
  if (user?.role !== 'accountant') {
    return null;
  }

  const handleSelectBusiness = (company) => {
    setActiveCompany(company);
    setShowBusinesses(false);
  };

  const activeCompanies = companies.filter(c => c.is_active);
  const currentDisplay = activeCompany ? activeCompany.name : 'Select Company';

  return (
    <div className="relative">
      <button
        onClick={() => setShowBusinesses(!showBusinesses)}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
        title="Switch Business"
        disabled={loading}
      >
        <Building2 size={20} className="text-gray-600" />
        <div className="text-left">
          <p className="text-xs text-gray-500">Viewing</p>
          <p className="text-sm font-semibold text-gray-900">{currentDisplay}</p>
        </div>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {showBusinesses && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowBusinesses(false)}
          />
          <div className="absolute top-full mt-2 ltr:left-0 rtl:right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-96 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Select Business</h3>
              <p className="text-xs text-gray-500 mt-1">
                {activeCompanies.length} active businesses
              </p>
            </div>

            {/* Business List */}
            <div className="overflow-y-auto flex-1">
              {activeCompanies.length === 0 && (
                <p className="p-4 text-sm text-gray-500 text-center">No companies found</p>
              )}
              {activeCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleSelectBusiness(company)}
                  className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                    activeCompany?.id === company.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-600">
                        {company.name.charAt(0)}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{company.name}</p>
                      <p className="text-xs text-gray-500">{company.currency || 'USD'}</p>
                    </div>
                  </div>
                  {activeCompany?.id === company.id && (
                    <Check size={20} className="text-blue-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowBusinesses(false);
                  window.location.href = '/accountant/businesses';
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Manage Businesses
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BusinessSwitcher;
