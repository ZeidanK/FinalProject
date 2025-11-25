import { useState } from 'react';
import { Building2, Check, ChevronDown } from 'lucide-react';

const BusinessSwitcher = ({ userRole }) => {
  const [showBusinesses, setShowBusinesses] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  // Mock businesses data - in production this would come from API
  const businesses = [
    { id: 1, name: 'Acme Corporation', status: 'active', type: 'LLC' },
    { id: 2, name: 'TechStart Solutions', status: 'active', type: 'Inc' },
    { id: 3, name: 'Green Energy Co.', status: 'active', type: 'Corp' },
    { id: 4, name: 'Retail Masters Ltd', status: 'active', type: 'Ltd' },
    { id: 5, name: 'Consulting Partners', status: 'pending', type: 'Partnership' },
    { id: 6, name: 'Global Traders Inc', status: 'active', type: 'Inc' }
  ];

  // Only show for accountants
  if (userRole !== 'accountant') {
    return null;
  }

  const handleSelectBusiness = (business) => {
    setSelectedBusiness(business);
    setShowBusinesses(false);
    // Here you would typically trigger a context update or state change
    // to filter all data by the selected business
  };

  const activeBusinesses = businesses.filter(b => b.status === 'active');
  const currentBusiness = selectedBusiness || { name: 'All Businesses', id: null };

  return (
    <div className="relative">
      <button
        onClick={() => setShowBusinesses(!showBusinesses)}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
        title="Switch Business"
      >
        <Building2 size={20} className="text-gray-600" />
        <div className="text-left">
          <p className="text-xs text-gray-500">Viewing</p>
          <p className="text-sm font-semibold text-gray-900">{currentBusiness.name}</p>
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
                {activeBusinesses.length} active businesses
              </p>
            </div>

            {/* All Businesses Option */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => handleSelectBusiness(null)}
                className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                  !selectedBusiness ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Building2 size={20} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">All Businesses</p>
                    <p className="text-xs text-gray-500">View consolidated data</p>
                  </div>
                </div>
                {!selectedBusiness && (
                  <Check size={20} className="text-blue-600" />
                )}
              </button>
            </div>

            {/* Business List */}
            <div className="overflow-y-auto flex-1">
              {activeBusinesses.map((business) => (
                <button
                  key={business.id}
                  onClick={() => handleSelectBusiness(business)}
                  className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                    selectedBusiness?.id === business.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-600">
                        {business.name.charAt(0)}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{business.name}</p>
                      <p className="text-xs text-gray-500">{business.type}</p>
                    </div>
                  </div>
                  {selectedBusiness?.id === business.id && (
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
                  // Navigate to manage businesses page
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
