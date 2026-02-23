import { useState, useEffect } from 'react';
import { User, Mail, Building, Phone, Save, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const UserProfile = () => {
  const { user: authUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [saving, setSaving] = useState(false);

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    anomalyAlerts: true,
    weeklyReports: true,
    monthlyReports: false,
    marketingEmails: false
  });

  useEffect(() => {
    if (!authUser?.id) return;
    api.getCurrentUser().then(u => {
      setFormData({
        name:    u.name    || '',
        email:   u.email   || '',
        phone:   u.phone   || '',
        company: u.company_name || '',
        role:    u.role    || '',
        address: u.address || '',
        city:    u.city    || '',
        state:   u.state   || '',
        zipCode: u.zip_code || '',
        country: u.country || '',
      });
    }).catch(console.error);
  }, [authUser?.id]);

  const handleSave = async () => {
    if (!authUser?.id) return;
    setSaving(true);
    try {
      await api.updateUser(authUser.id, {
        name:  formData.name,
        phone: formData.phone,
      });
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to save: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
        <p className="text-gray-600 mt-1">
          Manage your personal information and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture & Basic Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h2>
          <div className="text-center">
            <div className="inline-block relative">
              <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="text-blue-600" size={48} />
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                <Camera size={18} />
              </button>
            </div>
            <p className="mt-4 font-semibold text-gray-900">{formData.name}</p>
            
            <p className="text-sm text-gray-500 mt-1">{formData.company}</p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Account Type</h3>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              formData.role === 'accountant' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {formData.role === 'accountant' ? 'Accountant' : 'Business Owner'}
            </span>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Subscription</h3>
            <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <p className="font-medium text-gray-900">Professional Plan</p>
              <p className="text-xs text-gray-600 mt-1">Valid until Jan 31, 2025</p>
            </div>
            <button className="mt-2 w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Personal Information */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">Address</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State/Province
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ZIP/Postal Code
              </label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">Notification Preferences</h3>
          
          <div className="space-y-3">
            {Object.entries(notifications).map(([key, value]) => (
              <label key={key} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
            <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:bg-gray-400"
            >
              <Save size={18} />
              <span>{saving ? 'Saving…' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <button className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
              <p className="font-medium text-gray-900">Change Password</p>
              <p className="text-sm text-gray-600 mt-1">Update your account password</p>
            </button>
          </div>
          <div>
            <button className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600 mt-1">Add an extra layer of security</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
