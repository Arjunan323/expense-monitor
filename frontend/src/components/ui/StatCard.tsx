import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { usePreferences } from '../../contexts/PreferencesContext';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  format?: 'currency' | 'number';
  className?: string;
  subtitle?: string;
  showPerBank?: boolean;
  bankData?: { [bankName: string]: number };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  format = 'currency',
  className = '',
  subtitle,
  showPerBank = false,
  bankData,
}) => {
  const { preferences } = usePreferences();
  const formattedValue = format === 'currency'
    ? formatCurrency(value, undefined, preferences)
    : (typeof value === 'number' && !isNaN(value) ? value.toLocaleString(preferences.locale) : 'N/A');

  return (
    <div className={`card-hover ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{formattedValue}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {showPerBank && bankData && (
            <div className="mt-3 space-y-1">
              {Object.entries(bankData).map(([bank, amount]) => (
                <div key={bank} className="flex justify-between text-xs">
                  <span className="text-gray-600">{bank}</span>
                  <span className="font-medium text-gray-900">
                    {format === 'currency' 
                      ? formatCurrency(amount, undefined, preferences)
                      : amount.toLocaleString(preferences.locale)
                    }
                  </span>
                </div>
              ))}
            </div>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className="ml-4">
          <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </div>
    </div>
  );
};