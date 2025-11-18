import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import translations, { supportedLanguages } from '../translations';

type LanguageCode = 'en' | 'hi' | 'te' | 'ta' | 'gu' | 'mr' | 'bn' | 'pa' | 'kn' | 'ml' | 'od';

interface TranslationContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  t: (key: string, params?: Record<string, string>) => string;
  availableLanguages: typeof supportedLanguages;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'selected_language';

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language from AsyncStorage
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && supportedLanguages.find(lang => lang.code === savedLanguage)) {
        setLanguageState(savedLanguage as LanguageCode);
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = useCallback(async (lang: LanguageCode) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }, []);

  // Translation function with parameter support
  const t = useCallback((key: string, params?: Record<string, string>): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    // Navigate through nested keys
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key itself if not found in fallback
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') {
      return key; // Return key if final value is not a string
    }

    // Replace parameters in the string
    if (params) {
      return Object.keys(params).reduce((str, param) => {
        return str.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
      }, value);
    }

    return value;
  }, [language]);

  const contextValue: TranslationContextType = {
    language,
    setLanguage,
    t,
    availableLanguages: supportedLanguages,
    isLoading,
  };

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

// Utility function to get current language direction (useful for RTL languages if needed in future)
export const getLanguageDirection = (language: LanguageCode): 'ltr' | 'rtl' => {
  // All Indian languages currently supported use LTR
  // Can be extended for Arabic, Urdu etc. in future
  return 'ltr';
};

export default TranslationProvider;