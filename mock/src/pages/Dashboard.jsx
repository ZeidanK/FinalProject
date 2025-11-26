import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

const Dashboard = ({ userRole }) => {
  const { t } = useTranslation(['dashboard', 'common']);
  // Mock statistics
  const stats = {
    accountant: [
      { nameKey: 'accountant.stats.totalClients', value: '24', change: '+12%', trend: 'up', icon: FileText },
      { nameKey: 'accountant.stats.pendingReconciliations', value: '147', change: `23 ${t('accountant.stats.today')}`, trend: 'neutral', icon: Clock },
      { nameKey: 'accountant.stats.unclassifiedInvoices', value: '89', change: '-15%', trend: 'down', icon: AlertTriangle },
      { nameKey: 'accountant.stats.anomalyAlerts', value: '12', change: `3 ${t('accountant.stats.new')}`, trend: 'up', icon: AlertTriangle },
    ],
    'business-owner': [
      { nameKey: 'businessOwner.stats.totalTransactions', value: '1,234', change: '+18%', trend: 'up', icon: DollarSign },
      { nameKey: 'businessOwner.stats.pendingMatches', value: '56', change: `12 ${t('businessOwner.stats.today')}`, trend: 'neutral', icon: Clock },
      { nameKey: 'businessOwner.stats.reconciledThisMonth', value: '892', change: '+24%', trend: 'up', icon: CheckCircle },
      { nameKey: 'businessOwner.stats.exceptions', value: '8', change: `-3 ${t('businessOwner.stats.fromLastWeek')}`, trend: 'down', icon: AlertTriangle },
    ]
  };

  const recentActivity = [
    { id: 1, type: 'upload', title: 'Invoice #INV-2024-1234 uploaded', time: '5 minutes ago', status: 'success' },
    { id: 2, type: 'match', title: '23 transactions matched automatically', time: '1 hour ago', status: 'success' },
    { id: 3, type: 'alert', title: 'Anomaly detected in transaction #TRX-8821', time: '2 hours ago', status: 'warning' },
    { id: 4, type: 'export', title: 'Monthly report exported', time: '3 hours ago', status: 'success' },
    { id: 5, type: 'match', title: '15 invoices pending review', time: '5 hours ago', status: 'pending' },
  ];

  const quickActions = [
    { nameKey: 'quickActions.uploadInvoices', href: '/invoice-upload', icon: Upload, color: 'blue' },
    { nameKey: 'quickActions.importBankData', href: '/bank-import', icon: FileText, color: 'green' },
    { nameKey: 'quickActions.matchTransactions', href: '/matching', icon: GitCompare, color: 'purple' },
    { nameKey: 'quickActions.viewReports', href: '/reports', icon: Activity, color: 'orange' },
  ];

  const currentStats = stats[userRole] || stats.accountant;

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
              <p className="text-2xl font-bold text-red-900">3</p>
              <p className="text-sm text-red-700 mt-1">{t('alerts.requireImmediate')}</p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="text-yellow-600" size={20} />
                <span className="font-semibold text-yellow-900">{t('alerts.warning')}</span>
              </div>
              <p className="text-2xl font-bold text-yellow-900">9</p>
              <p className="text-sm text-yellow-700 mt-1">{t('alerts.needReview')}</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="text-blue-600" size={20} />
                <span className="font-semibold text-blue-900">{t('alerts.info')}</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">24</p>
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
