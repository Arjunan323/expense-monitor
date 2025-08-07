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
    const stored = localStorage.getItem('user-preferences');
    return stored ? JSON.parse(stored) : getDefaultCurrency();
  });

  useEffect(() => {
    localStorage.setItem('user-preferences', JSON.stringify(preferences));
  }, [preferences]);

  const setPreferences = (prefs: Preferences) => {
    setPreferencesState(prefs);
  };

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
