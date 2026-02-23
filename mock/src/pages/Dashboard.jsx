import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Upload,
  GitCompare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import api from '../services/api';

const Dashboard = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const { user } = useAuth();
  const { activeCompany } = useCompany();
  const userRole = user?.role;

  const [apiStats, setApiStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!activeCompany?.id) return;
    setStatsLoading(true);
    api.getDashboardStats(activeCompany.id)
      .then(setApiStats)
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, [activeCompany?.id]);

  const buildStats = () => {
    if (apiStats) {
      const inv = apiStats.invoices || {};
      const trx = apiStats.transactions || {};
      const anom = apiStats.anomalies || {};
      const match = apiStats.matches || {};

      if (userRole === 'accountant') {
        return [
          { nameKey: 'accountant.stats.totalClients', value: String(inv.total_invoices ?? '—'), change: '', trend: 'neutral', icon: FileText },
          { nameKey: 'accountant.stats.pendingReconciliations', value: String(trx.unmatched_transactions ?? '—'), change: '', trend: 'neutral', icon: Clock },
          { nameKey: 'accountant.stats.unclassifiedInvoices', value: String(inv.pending_invoices ?? '—'), change: '', trend: 'neutral', icon: AlertTriangle },
          { nameKey: 'accountant.stats.anomalyAlerts', value: String(anom.open_anomalies ?? '—'), change: `${anom.critical_anomalies ?? 0} ${t('accountant.stats.new')}`, trend: 'up', icon: AlertTriangle },
        ];
      }
      return [
        { nameKey: 'businessOwner.stats.totalTransactions', value: String(trx.total_transactions ?? '—'), change: '', trend: 'up', icon: DollarSign },
        { nameKey: 'businessOwner.stats.pendingMatches', value: String(trx.unmatched_transactions ?? '—'), change: '', trend: 'neutral', icon: Clock },
        { nameKey: 'businessOwner.stats.reconciledThisMonth', value: String(match.total_matches ?? '—'), change: '', trend: 'up', icon: CheckCircle },
        { nameKey: 'businessOwner.stats.exceptions', value: String(anom.open_anomalies ?? '—'), change: '', trend: 'down', icon: AlertTriangle },
      ];
    }
    // Fallback placeholders while loading or no company
    const placeholder = { value: statsLoading ? '…' : '—', change: '', trend: 'neutral' };
    if (userRole === 'accountant') {
      return [
        { nameKey: 'accountant.stats.totalClients', ...placeholder, icon: FileText },
        { nameKey: 'accountant.stats.pendingReconciliations', ...placeholder, icon: Clock },
        { nameKey: 'accountant.stats.unclassifiedInvoices', ...placeholder, icon: AlertTriangle },
        { nameKey: 'accountant.stats.anomalyAlerts', ...placeholder, icon: AlertTriangle },
      ];
    }
    return [
      { nameKey: 'businessOwner.stats.totalTransactions', ...placeholder, icon: DollarSign },
      { nameKey: 'businessOwner.stats.pendingMatches', ...placeholder, icon: Clock },
      { nameKey: 'businessOwner.stats.reconciledThisMonth', ...placeholder, icon: CheckCircle },
      { nameKey: 'businessOwner.stats.exceptions', ...placeholder, icon: AlertTriangle },
    ];
  };

  const recentActivity = apiStats?.recentActivity || [];

  const alertCounts = apiStats
    ? {
        critical: apiStats.anomalies?.critical_anomalies ?? 0,
        warning: (apiStats.anomalies?.open_anomalies ?? 0) - (apiStats.anomalies?.critical_anomalies ?? 0),
        info: apiStats.anomalies?.total_anomalies ?? 0,
      }
    : { critical: '—', warning: '—', info: '—' };

  const quickActions = [
    { nameKey: 'quickActions.uploadInvoices', href: '/invoice-upload', icon: Upload, color: 'blue' },
    { nameKey: 'quickActions.importBankData', href: '/bank-import', icon: FileText, color: 'green' },
    { nameKey: 'quickActions.matchTransactions', href: '/matching', icon: GitCompare, color: 'purple' },
    { nameKey: 'quickActions.viewReports', href: '/reports', icon: Activity, color: 'orange' },
  ];

  const currentStats = buildStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {userRole === 'business-owner' ? t('businessOwner.title') : t('accountant.title')}
        </h1>
        <p className="text-gray-600 mt-1">
          {userRole === 'business-owner' ? t('businessOwner.welcomeBack') : t('accountant.welcomeBack')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {currentStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.nameKey} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${
                  stat.trend === 'up' ? 'bg-green-100' :
                  stat.trend === 'down' ? 'bg-red-100' :
                  'bg-blue-100'
                }`}>
                  <Icon className={
                    stat.trend === 'up' ? 'text-green-600' :
                    stat.trend === 'down' ? 'text-red-600' :
                    'text-blue-600'
                  } size={24} />
                </div>
                {stat.trend === 'up' && <TrendingUp className="text-green-500" size={20} />}
                {stat.trend === 'down' && <TrendingDown className="text-red-500" size={20} />}
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-gray-600 text-sm mt-1">{t(stat.nameKey)}</p>
              <p className={`text-sm mt-2 ${
                stat.trend === 'up' ? 'text-green-600' :
                stat.trend === 'down' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {stat.change}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('quickActions.title')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.nameKey}
                to={action.href}
                className={`p-4 rounded-lg border-2 border-${action.color}-200 hover:border-${action.color}-400 hover:bg-${action.color}-50 transition-all group`}
              >
                <Icon className={`text-${action.color}-600 mb-2`} size={32} />
                <p className="text-sm font-medium text-gray-900">{t(action.nameKey)}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{t('recentActivity.title')}</h2>
            <Link to="/processing-status" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              {t('recentActivity.viewAll')}
            </Link>
          </div>
          <div className="space-y-4">
            {statsLoading && (
              <p className="text-sm text-gray-500 text-center py-4">Loading activity…</p>
            )}
            {!statsLoading && recentActivity.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity.</p>
            )}
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0">
                <div className={`p-2 rounded-lg ${
                  activity.status === 'success' ? 'bg-green-100' :
                  activity.status === 'warning' ? 'bg-yellow-100' :
                  'bg-blue-100'
                }`}>
                  {activity.status === 'success' && <CheckCircle className="text-green-600" size={20} />}
                  {activity.status === 'warning' && <AlertTriangle className="text-yellow-600" size={20} />}
                  {activity.status === 'pending' && <Clock className="text-blue-600" size={20} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('alerts.title')}</h2>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="text-red-600" size={20} />
                <span className="font-semibold text-red-900">{t('alerts.critical')}</span>
              </div>
              <p className="text-2xl font-bold text-red-900">{alertCounts.critical}</p>
              <p className="text-sm text-red-700 mt-1">{t('alerts.requireImmediate')}</p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="text-yellow-600" size={20} />
                <span className="font-semibold text-yellow-900">{t('alerts.warning')}</span>
              </div>
              <p className="text-2xl font-bold text-yellow-900">{alertCounts.warning}</p>
              <p className="text-sm text-yellow-700 mt-1">{t('alerts.needReview')}</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="text-blue-600" size={20} />
                <span className="font-semibold text-blue-900">{t('alerts.info')}</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{alertCounts.info}</p>
              <p className="text-sm text-blue-700 mt-1">{t('alerts.forYourInfo')}</p>
            </div>

            <Link
              to="/anomalies"
              className="block w-full text-center py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {t('alerts.viewAllAlerts')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
