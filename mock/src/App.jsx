import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Main Layout
import Layout from './components/Layout';

// Dashboard
import Dashboard from './pages/Dashboard';

// Core Workflow Pages
import InvoiceUpload from './pages/workflow/InvoiceUpload';
import BankImport from './pages/workflow/BankImport';
import ProcessingStatus from './pages/workflow/ProcessingStatus';
import MatchingReconciliation from './pages/workflow/MatchingReconciliation';
import ConsolidatedExport from './pages/workflow/ConsolidatedExport';
import InvoiceDetail from './pages/workflow/InvoiceDetail';

// Reports & Compliance
import ReportsDashboard from './pages/reports/ReportsDashboard';
import VATReport from './pages/reports/VATReport';
import AnomalyAlerts from './pages/reports/AnomalyAlerts';
import ExceptionDetail from './pages/reports/ExceptionDetail';

// Settings & Configuration
import UserProfile from './pages/settings/UserProfile';
import AISettings from './pages/settings/AISettings';

// Extra Features
import HelpSupport from './pages/extra/HelpSupport';
import Tutorial from './pages/extra/Tutorial';

// Account Management
import ManageBusinesses from './pages/accountant/ManageBusinesses';
import ManageAccountants from './pages/business/ManageAccountants';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('accountant'); // 'accountant', 'business-owner', or 'admin'

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('accountant');
  };

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Layout userRole={userRole} onLogout={handleLogout}>
                <Routes>
                  <Route path="/dashboard" element={
                    userRole === 'admin' ? <AdminDashboard /> : <Dashboard userRole={userRole} />
                  } />
                  
                  {/* Admin Routes */}
                  {userRole === 'admin' && (
                    <Route path="/admin" element={<AdminDashboard />} />
                  )}
                  
                  {/* Account Management Routes */}
                  <Route path="/accountant/businesses" element={<ManageBusinesses />} />
                  <Route path="/business/accountants" element={<ManageAccountants />} />
                  
                  {/* Workflow Routes */}
                  <Route path="/invoice-upload" element={<InvoiceUpload />} />
                  <Route path="/bank-import" element={<BankImport />} />
                  <Route path="/processing-status" element={<ProcessingStatus />} />
                  <Route path="/invoice-detail/:id" element={<InvoiceDetail />} />
                  <Route path="/matching" element={<MatchingReconciliation />} />
                  <Route path="/export" element={<ConsolidatedExport />} />
                  
                  {/* Reports Routes */}
                  <Route path="/reports" element={<ReportsDashboard />} />
                  <Route path="/reports/vat" element={<VATReport />} />
                  <Route path="/anomalies" element={<AnomalyAlerts />} />
                  <Route path="/anomalies/:id" element={<ExceptionDetail />} />
                  
                  {/* Settings Routes */}
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/ai-settings" element={<AISettings />} />
                  
                  {/* Extra Features */}
                  <Route path="/help" element={<HelpSupport />} />
                  <Route path="/tutorial" element={<Tutorial />} />
                  
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
