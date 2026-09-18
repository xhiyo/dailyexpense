import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';
import { loadLanguage, saveLanguage } from '../utils/storage';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => loadLanguage());

  const setLanguage = (newLang) => {
    if (newLang === 'en' || newLang === 'id') {
      setLanguageState(newLang);
      saveLanguage(newLang);
      document.documentElement.lang = newLang;
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  /**
   * Helper to fetch translated text with deep key dot-notation and interpolation.
   * Example: t('summary.totalSpentToday')
   * Example with params: t('settings.currencySample', { sample: '$ 15.00' })
   */
  const t = (keyPath, params = null) => {
    if (!keyPath) return '';

    const keys = keyPath.split('.');
    let value = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        value = null;
        break;
      }
    }

    // Fallback to English if key missing in current language
    if (value === null && language !== 'en') {
      let fallbackValue = translations.en;
      for (const k of keys) {
        if (fallbackValue && typeof fallbackValue === 'object' && k in fallbackValue) {
          fallbackValue = fallbackValue[k];
        } else {
          fallbackValue = null;
          break;
        }
      }
      value = fallbackValue;
    }

    if (typeof value !== 'string') {
      return keyPath;
    }

    if (params && typeof params === 'object') {
      return Object.keys(params).reduce((str, paramKey) => {
        return str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(params[paramKey]));
      }, value);
    }

    return value;
  };

  /**
   * Localizes default category name based on active language,
   * while keeping custom category names intact.
   */
  const localizeCategoryName = (cat) => {
    if (!cat) return '';
    const catId = typeof cat === 'string' ? cat : cat.id;
    if (catId && translations[language]?.categoryNames?.[catId]) {
      return translations[language].categoryNames[catId];
    }
    return typeof cat === 'object' ? (cat.name || '') : cat;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, localizeCategoryName }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
