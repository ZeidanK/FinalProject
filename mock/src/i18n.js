import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enCommon from './locales/en/common.json';
import enInvoice from './locales/en/invoice.json';
import enBanking from './locales/en/banking.json';

import arCommon from './locales/ar/common.json';
import arInvoice from './locales/ar/invoice.json';
import arBanking from './locales/ar/banking.json';

import heCommon from './locales/he/common.json';
import heInvoice from './locales/he/invoice.json';
import heBanking from './locales/he/banking.json';

import enDashboard from './locales/en/dashboard.json';
import arDashboard from './locales/ar/dashboard.json';
import heDashboard from './locales/he/dashboard.json';

import enAuth from './locales/en/auth.json';
import arAuth from './locales/ar/auth.json';
import heAuth from './locales/he/auth.json';

const resources = {
  en: {
    common: enCommon,
    invoice: enInvoice,
    banking: enBanking,
    dashboard: enDashboard,
    auth: enAuth
  },
  ar: {
    common: arCommon,
    invoice: arInvoice,
    banking: arBanking,
    dashboard: arDashboard,
    auth: arAuth
  },
  he: {
    common: heCommon,
    invoice: heInvoice,
    banking: heBanking,
    dashboard: heDashboard,
    auth: heAuth
  }
};

// Get saved language from localStorage or use English as default
const savedLanguage = localStorage.getItem('language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false
    }
  });

// Update HTML direction when language changes
i18n.on('languageChanged', (lng) => {
  const dir = lng === 'ar' || lng === 'he' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
  localStorage.setItem('language', lng);
});

// Set initial direction
const initialDir = savedLanguage === 'ar' || savedLanguage === 'he' ? 'rtl' : 'ltr';
document.documentElement.dir = initialDir;
document.documentElement.lang = savedLanguage;

export default i18n;
