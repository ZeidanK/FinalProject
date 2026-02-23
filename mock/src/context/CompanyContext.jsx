import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompanyState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load companies whenever the user logs in\n  useEffect(() => {\n    if (!isAuthenticated || !user?.id) {\n      setCompanies([]);\n      setActiveCompanyState(null);\n      return;\n    }\n    fetchCompanies();\n  }, [isAuthenticated, user?.id]);

  const fetchCompanies = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCompaniesByUser(user.id);
      const list = Array.isArray(data) ? data : [];
      setCompanies(list);

      // Restore previously selected company from localStorage
      const stored = localStorage.getItem('activeCompanyId');
      if (stored) {
        const found = list.find(c => String(c.id) === stored);
        if (found) {
          setActiveCompanyState(found);
          return;
        }
      }

      // Default: first company that belongs to / is accessible by this user
      if (list.length > 0) {
        setActiveCompanyState(list[0]);
        localStorage.setItem('activeCompanyId', String(list[0].id));
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const setActiveCompany = useCallback((company) => {
    setActiveCompanyState(company);
    if (company) {
      localStorage.setItem('activeCompanyId', String(company.id));
    } else {
      localStorage.removeItem('activeCompanyId');
    }
  }, []);

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompany,
        setActiveCompany,
        loading,
        error,
        refetch: fetchCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used inside <CompanyProvider>');
  return ctx;
}
