import React, { useState, useEffect } from 'react';
import { usePreferences } from '../contexts/PreferencesContext';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const supportedCurrencies = [
  { code: 'USD', label: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', label: 'Euro', locale: 'fr-FR' },
  { code: 'INR', label: 'Indian Rupee', locale: 'en-IN' },
  { code: 'GBP', label: 'British Pound', locale: 'en-GB' },
  { code: 'JPY', label: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'CNY', label: 'Chinese Yuan', locale: 'zh-CN' },
];

export const Settings: React.FC = () => {
  const { preferences, setPreferences } = usePreferences();
  const [currency, setCurrency] = useState(preferences.currency);
  const [locale, setLocale] = useState(preferences.locale);
  const [loading, setLoading] = useState(false);

  // Fetch preferences from backend on mount
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get('/user/preferences');
        if (res.data && res.data.currency && res.data.locale) {
          setCurrency(res.data.currency);
          setLocale(res.data.locale);
          setPreferences({ currency: res.data.currency, locale: res.data.locale });
        }
      } catch (e) {
        // fallback to local
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.post('/user/preferences', { currency, locale });
      setPreferences({ currency, locale });
      toast.success('Preferences saved!');
    } catch (e) {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Preferences</h2>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Currency</label>
        <select
          className="w-full border rounded p-2"
          value={currency}
          onChange={e => {
            const selected = supportedCurrencies.find(c => c.code === e.target.value);
            setCurrency(selected?.code || 'USD');
            setLocale(selected?.locale || 'en-US');
          }}
        >
          {supportedCurrencies.map(c => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>
      </div>
      <button
        className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-60"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
};
