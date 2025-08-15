import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

export interface Preferences {
  currency: string;
  locale: string;
}

interface PreferencesContextType {
  preferences: Preferences;
  setPreferences: (prefs: Preferences) => void;
  refreshPreferences: () => Promise<void>;
  loading: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
  currency: 'USD',
  locale: 'en-US'
};

const detectDefaults = (): Preferences => {
  try {
    // Try to infer device locale
    const locale = (Intl as any)?.DateTimeFormat?.().resolvedOptions?.().locale || 'en-US';
    const map: Record<string,string> = {
      'en-US': 'USD',
      'en-GB': 'GBP',
      'en-IN': 'INR',
      'fr-FR': 'EUR',
      'de-DE': 'EUR',
      'ja-JP': 'JPY',
      'zh-CN': 'CNY'
    };
    const currency = map[locale] || 'USD';
    return { currency, locale };
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

const STORAGE_KEY = 'user-preferences';

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferences, setPreferencesState] = useState<Preferences>(detectDefaults());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.currency && parsed.locale) {
            setPreferencesState(parsed);
          }
        }
      } catch (_) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (prefs: Preferences) => {
    setPreferencesState(prefs);
    try { await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(prefs)); } catch (_) { /* ignore */ }
  };

  const refreshPreferences = async () => {
    try {
      const resp = await fetch(process.env.EXPO_PUBLIC_API_BASE_URL + '/user/preferences', { headers: { 'Content-Type': 'application/json' }});
      if (!resp.ok) return;
      const data = await resp.json();
      if (data && data.currency) {
        const updated: Preferences = { currency: data.currency, locale: data.locale || preferences.locale };
        await persist(updated);
      }
    } catch (_) { /* ignore */ }
  };

  return (
  <PreferencesContext.Provider value={{ preferences, setPreferences: persist, refreshPreferences, loading }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = (): PreferencesContextType => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
};
