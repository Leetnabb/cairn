import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import nb from './locales/nb.json';
import en from './locales/en.json';

const STORAGE_KEY = 'cairn-language';

const savedLang = localStorage.getItem(STORAGE_KEY) || 'nb';

i18n.use(initReactI18next).init({
  resources: {
    nb: { translation: nb },
    en: { translation: en },
  },
  lng: savedLang,
  fallbackLng: 'nb',
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  document.documentElement.lang = lng;
});

// Set initial lang attribute
document.documentElement.lang = savedLang;

export default i18n;
