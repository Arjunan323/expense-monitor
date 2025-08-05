import { format, parseISO, isValid } from 'date-fns';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
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
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
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
    'Other': '#64748b',
  };
  return colors[category] || colors['Other'];
};

export const getTransactionTypeColor = (amount: number): string => {
  return amount >= 0 ? 'text-success-600' : 'text-danger-600';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};