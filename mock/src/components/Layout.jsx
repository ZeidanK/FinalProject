import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  CreditCard,
  Activity,
  GitCompare,
  Download,
  FileText,
  AlertTriangle,
  User,
  Settings,
  HelpCircle,
  BookOpen,
  LogOut,
  Menu,
  X,
  Briefcase,
  Users
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationDropdown from './NotificationDropdown';
import BusinessSwitcher from './BusinessSwitcher';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { t } = useTranslation();
  const { user, logout: onLogout } = useAuth();
  const userRole = user?.role;

  const navigation = userRole === 'admin' 
    ? [
        { name: t('navigation.dashboard'), href: '/dashboard', icon: LayoutDashboard },
        { name: 'Admin Panel', href: '/admin', icon: Settings },
      ]
    : [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    {
      name: t('navigation.accountManagement'),
      items: userRole === 'accountant' 
        ? [{ name: t('navigation.myBusinesses'), href: '/accountant/businesses', icon: Briefcase }]
        : [{ name: t('navigation.myAccountants'), href: '/business/accountants', icon: Users }]
    },
    {
      name: t('navigation.workflow'),
      items: [
        { name: t('navigation.uploadInvoices'), href: '/invoice-upload', icon: Upload },
        { name: t('navigation.importBankData'), href: '/bank-import', icon: CreditCard },
        { name: t('navigation.processingStatus'), href: '/processing-status', icon: Activity },
        { name: t('navigation.matchReconcile'), href: '/matching', icon: GitCompare },
        { name: t('navigation.exportData'), href: '/export', icon: Download },
      ]
    },
    {
      name: t('navigation.reportsCompliance'),
      items: [
        { name: t('navigation.reportsDashboard'), href: '/reports', icon: FileText },
        { name: t('navigation.vatReports'), href: '/reports/vat', icon: FileText },
        { name: t('navigation.anomalyAlerts'), href: '/anomalies', icon: AlertTriangle },
      ]
    },
    {
      name: t('navigation.settings'),
      items: [
        { name: t('navigation.profile'), href: '/profile', icon: User },
        { name: t('navigation.aiSettings'), href: '/ai-settings', icon: Settings },
      ]
    },
    {
      name: t('navigation.help'),
      items: [
        { name: t('navigation.helpSupport'), href: '/help', icon: HelpCircle },
        { name: t('navigation.tutorial'), href: '/tutorial', icon: BookOpen },
      ]
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Logo and Toggle */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">FR</span>
              </div>
              <span className="font-semibold text-gray-900">FinRecon</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* User Role Badge */}
        {sidebarOpen && (
          <div className={`px-4 py-3 border-b border-gray-200 ${
            userRole === 'admin' ? 'bg-purple-50' : 'bg-blue-50'
          }`}>
            <p className="text-xs text-gray-600">{t('auth.loggedInAs')}</p>
            <p className={`text-sm font-semibold capitalize ${
              userRole === 'admin' ? 'text-purple-600' : 'text-blue-600'
            }`}>
              {userRole === 'business-owner' ? t('auth.businessOwner') : 
               userRole === 'admin' ? t('auth.admin') : 
               t('auth.accountant')}
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigation.map((section) => (
            <div key={section.name} className="mb-4">
              {section.href ? (
                <Link
                  to={section.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(section.href)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <section.icon size={20} />
                  {sidebarOpen && <span className="text-sm font-medium">{section.name}</span>}
                </Link>
              ) : (
                <>
                  {sidebarOpen && (
                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {section.name}
                    </p>
                  )}
                  {section.items?.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.href)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon size={20} />
                      {sidebarOpen && <span className="text-sm">{item.name}</span>}
                    </Link>
                  ))}
                </>
              )}
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm font-medium">{t('navigation.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar with BusinessSwitcher, Notifications, and Language Switcher */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          {userRole !== 'admin' && (
            <div>
              <BusinessSwitcher />
            </div>
          )}
          {userRole === 'admin' && <div></div>}
          <div className="flex items-center space-x-2">
            <NotificationDropdown />
            <LanguageSwitcher />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
