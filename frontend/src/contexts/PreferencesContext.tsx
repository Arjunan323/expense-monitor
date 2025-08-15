import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getDefaultCurrency } from '../utils/formatters';

export interface Preferences {
  currency: string;
  locale: string;
}

interface PreferencesContextType {
  preferences: Preferences;
  setPreferences: (prefs: Preferences) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferences, setPreferencesState] = useState<Preferences>(() => {
    // Guard for non-browser (SSR/build) environments
    if (typeof window === 'undefined') {
      const def = getDefaultCurrency();
      return { currency: def.currency, locale: def.locale };
    }
    const stored = safeGetStored();
    if (stored) return stored;
    const def = getDefaultCurrency();
    return { currency: def.currency, locale: def.locale };
  });

  // Safe parse + migration for legacy shapes (e.g., just a currency string)
  function safeGetStored(): Preferences | null {
    try {
      const raw = localStorage.getItem('user-preferences');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Legacy: stored as plain string like "INR"
      if (typeof parsed === 'string') {
        const def = getDefaultCurrency();
        return { currency: parsed, locale: def.locale };
      }
      // Ensure required keys
      if (!parsed.currency) {
        const def = getDefaultCurrency();
        return { currency: def.currency, locale: parsed.locale || def.locale };
      }
      if (!parsed.locale) {
        const def = getDefaultCurrency();
        parsed.locale = def.locale;
      }
      return { currency: parsed.currency, locale: parsed.locale };
    } catch (e) {
      console.warn('Failed to parse stored preferences, using defaults', e);
      return null;
    }
  }

  useEffect(() => {
    try {
      localStorage.setItem('user-preferences', JSON.stringify(preferences));
    } catch (e) {
      console.warn('Failed to persist preferences', e);
    }
  }, [preferences]);

  // Listen to storage changes from other tabs/windows
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'user-preferences') {
        const updated = safeGetStored();
        if (updated && (updated.currency !== preferences.currency || updated.locale !== preferences.locale)) {
          setPreferencesState(updated);
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [preferences]);

  const setPreferences = (prefs: Preferences) => {
    setPreferencesState(prev => ({ ...prev, ...prefs }));
  };

  // Convenience updater (optional future use)
  const updateCurrency = (currency: string) => setPreferences({ currency, locale: preferences.locale });

  return (
    <PreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = (): PreferencesContextType => {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used within PreferencesProvider');
  return context;
};
