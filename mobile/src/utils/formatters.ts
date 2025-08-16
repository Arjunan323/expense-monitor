import { format, parseISO, isValid } from 'date-fns';
import { Preferences } from '../contexts/PreferencesContext';

export const formatCurrency = (amount: number, currencyOrPrefs?: string | Preferences): string => {
  let currency = 'USD';
  let locale = 'en-US';
  if (typeof currencyOrPrefs === 'string') {
    currency = currencyOrPrefs;
    locale = currency === 'INR' ? 'en-IN' : (currency === 'GBP' ? 'en-GB' : 'en-US');
  } else if (currencyOrPrefs) {
    currency = currencyOrPrefs.currency || 'USD';
    locale = currencyOrPrefs.locale || (currency === 'INR' ? 'en-IN' : 'en-US');
  }
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export const formatDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid Date';
    return format(dateObj, 'MMM dd, yyyy');
  } catch {
    return 'Invalid Date';
  }
};

export const formatDateTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid Date';
    return format(dateObj, 'MMM dd, yyyy HH:mm');
  } catch {
    return 'Invalid Date';
  }
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Food': '#ef4444',
    'Travel': '#3b82f6',
    'Utilities': '#f59e0b',
    'Salary': '#22c55e',
    'Shopping': '#8b5cf6',
    'Rent': '#06b6d4',
    'Bank Fee': '#6b7280',
    'Entertainment': '#ec4899',
    'Healthcare': '#10b981',
    'Education': '#f97316',
    'Loan Payment': '#7c3aed', // purple variant
    'Transfer': '#0891b2', // cyan variant
    'Business Services': '#0d9488', // teal
    'ATM Withdrawal': '#dc2626', // red variant
    'Health & Wellness': '#16a34a', // green variant
    'Payment': '#f59e0b',
    'Investment': '#4f46e5', // indigo variant
    'Dividend': '#8b5cf6',
    'Other': '#64748b',
  };
  return colors[category] || colors['Other'];
};

export const getTransactionTypeColor = (amount: number): string => {
  return amount >= 0 ? '#22c55e' : '#ef4444';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};