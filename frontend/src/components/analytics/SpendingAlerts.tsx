import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, CheckCircle, X, Filter, Eye, TrendingUp, CreditCard, MapPin } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { usePreferences } from '../../contexts/PreferencesContext';

interface SpendingAlert {
  id: string;
  type: 'large_transaction' | 'new_merchant' | 'frequency' | 'category_spike';
  severity: 'moderate' | 'critical';
  title: string;
  description: string;
  amount: number;
  merchant: string;
  category: string;
  date: string;
  reason: string;
  acknowledged: boolean;
}

export const SpendingAlerts: React.FC = () => {
  const { preferences } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<SpendingAlert[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  useEffect(() => {
    // Mock data - replace with API call
    setAlerts([
      {
        id: '1',
        type: 'large_transaction',
        severity: 'critical',
        title: 'Large Transaction Detected',
        description: 'Transaction amount is 150% higher than your usual spending',
        amount: 25000,
        merchant: 'Apple Store Online',
        category: 'Shopping',
        date: '2024-08-15',
        reason: '150% higher than usual',
        acknowledged: false
      },
      {
        id: '2',
        type: 'new_merchant',
        severity: 'moderate',
        title: 'New Merchant Detected',
        description: 'First time transaction with this merchant',
        amount: 3500,
        merchant: 'Zomato Gold Membership',
        category: 'Food',
        date: '2024-08-14',
        reason: 'New merchant detected',
        acknowledged: false
      },
      {
        id: '3',
        type: 'frequency',
        severity: 'moderate',
        title: 'Unusual Frequency',
        description: 'Multiple transactions in short time period',
        amount: 1200,
        merchant: 'Starbucks Coffee',
        category: 'Food',
        date: '2024-08-13',
        reason: '5 transactions in 2 days',
        acknowledged: true
      },
      {
        id: '4',
        type: 'category_spike',
        severity: 'critical',
        title: 'Category Spending Spike',
        description: 'Entertainment spending is 200% above monthly average',
        amount: 8500,
        merchant: 'BookMyShow',
        category: 'Entertainment',
        date: '2024-08-12',
        reason: '200% above monthly average',
        acknowledged: false
      }
    ]);
    setTimeout(() => setLoading(false), 800);
  }, []);

  const getSeverityIcon = (severity: string) => {
    return severity === 'critical' ? (
      <AlertTriangle className="w-5 h-5 text-red-500" />
    ) : (
      <Bell className="w-5 h-5 text-yellow-500" />
    );
  };

  const getSeverityColor = (severity: string) => {
    return severity === 'critical' 
      ? 'border-red-200 bg-red-50' 
      : 'border-yellow-200 bg-yellow-50';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'large_transaction': return <CreditCard className="w-4 h-4" />;
      case 'new_merchant': return <MapPin className="w-4 h-4" />;
      case 'frequency': return <TrendingUp className="w-4 h-4" />;
      case 'category_spike': return <BarChart3 className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, acknowledged: true } : alert
    ));
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const filteredAlerts = alerts.filter(alert => {
    if (!showAcknowledged && alert.acknowledged) return false;
    if (filterType === 'all') return true;
    return alert.type === filterType;
  });

  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
  const moderateCount = alerts.filter(a => a.severity === 'moderate' && !a.acknowledged).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-heading font-bold gradient-text mb-3">Spending Alerts</h1>
          <p className="text-brand-gray-600 text-lg">Monitor unusual spending patterns and get notified of anomalies</p>
        </div>

        {/* Alert Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stat-card border-red-200 bg-red-50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">CRITICAL</span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Critical Alerts</h3>
            <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
            <p className="text-sm text-brand-gray-500">Require immediate attention</p>
          </div>

          <div className="stat-card border-yellow-200 bg-yellow-50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">MODERATE</span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Moderate Alerts</h3>
            <p className="text-3xl font-bold text-yellow-600">{moderateCount}</p>
            <p className="text-sm text-brand-gray-500">Worth reviewing</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-green rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-brand-green-600 bg-brand-green-100 px-2 py-1 rounded-full">RESOLVED</span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Acknowledged</h3>
            <p className="text-3xl font-bold text-brand-green-600">{alerts.filter(a => a.acknowledged).length}</p>
            <p className="text-sm text-brand-gray-500">This month</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-brand-gray-100 p-6 shadow-funky">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Alerts', icon: '🔔' },
              { key: 'large_transaction', label: 'Large Transactions', icon: '💳' },
              { key: 'new_merchant', label: 'New Merchants', icon: '🏪' },
              { key: 'frequency', label: 'Frequency', icon: '⚡' },
              { key: 'category_spike', label: 'Category Spikes', icon: '📈' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setFilterType(filter.key)}
                className={`px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 ${
                  filterType === filter.key
                    ? 'bg-gradient-green text-white shadow-glow-green'
                    : 'bg-white border-2 border-brand-gray-200 text-brand-gray-700 hover:border-brand-green-400'
                }`}
              >
                <span className="mr-2">{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setShowAcknowledged(!showAcknowledged)}
            className="flex items-center space-x-2 text-sm text-brand-gray-600 hover:text-brand-green-600 transition-colors duration-300"
          >
            {showAcknowledged ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showAcknowledged ? 'Hide' : 'Show'} acknowledged</span>
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-brand-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">No alerts to show</h3>
            <p className="text-brand-gray-600">Your spending patterns look normal. Keep up the good work!</p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className={`card border-2 transition-all duration-300 ${
                alert.acknowledged 
                  ? 'opacity-60 border-brand-gray-200 bg-brand-gray-50' 
                  : getSeverityColor(alert.severity)
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-lg font-heading font-bold text-brand-gray-900">{alert.title}</h4>
                      <div className="flex items-center space-x-1 text-brand-gray-500">
                        {getTypeIcon(alert.type)}
                        <span className="text-xs font-medium capitalize">{alert.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                    
                    <p className="text-brand-gray-700 mb-3">{alert.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-brand-gray-500 font-medium">Amount:</span>
                        <p className="font-bold text-brand-gray-900">{formatCurrency(alert.amount, undefined, preferences)}</p>
                      </div>
                      <div>
                        <span className="text-brand-gray-500 font-medium">Merchant:</span>
                        <p className="font-bold text-brand-gray-900">{alert.merchant}</p>
                      </div>
                      <div>
                        <span className="text-brand-gray-500 font-medium">Category:</span>
                        <p className="font-bold text-brand-gray-900">{alert.category}</p>
                      </div>
                      <div>
                        <span className="text-brand-gray-500 font-medium">Date:</span>
                        <p className="font-bold text-brand-gray-900">{formatDate(alert.date)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-white/60 rounded-2xl">
                      <p className="text-sm text-brand-gray-700">
                        <span className="font-semibold">Reason:</span> {alert.reason}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  {!alert.acknowledged ? (
                    <>
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="bg-brand-green-100 hover:bg-brand-green-200 text-brand-green-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105"
                      >
                        <CheckCircle className="w-4 h-4 mr-2 inline" />
                        Acknowledge
                      </button>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="bg-brand-gray-100 hover:bg-brand-gray-200 text-brand-gray-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105"
                      >
                        <X className="w-4 h-4 mr-2 inline" />
                        Dismiss
                      </button>
                    </>
                  ) : (
                    <span className="bg-brand-green-100 text-brand-green-700 px-4 py-2 rounded-2xl font-semibold text-sm">
                      ✅ Acknowledged
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recommendations Sidebar */}
      <div className="card bg-gradient-to-br from-brand-blue-50 to-brand-green-50 border-brand-blue-200">
        <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-6">💡 Smart Recommendations</h3>
        <div className="space-y-4">
          <div className="p-4 bg-white/60 rounded-2xl">
            <h4 className="font-semibold text-brand-gray-900 mb-2">🎯 Set Spending Limits</h4>
            <p className="text-sm text-brand-gray-700">Consider setting monthly limits for Shopping and Entertainment categories to avoid future spikes.</p>
          </div>
          
          <div className="p-4 bg-white/60 rounded-2xl">
            <h4 className="font-semibold text-brand-gray-900 mb-2">📱 Enable Notifications</h4>
            <p className="text-sm text-brand-gray-700">Get real-time alerts when transactions exceed your normal patterns.</p>
          </div>
          
          <div className="p-4 bg-white/60 rounded-2xl">
            <h4 className="font-semibold text-brand-gray-900 mb-2">📊 Review Weekly</h4>
            <p className="text-sm text-brand-gray-700">Check your alerts weekly to stay on top of your spending habits.</p>
          </div>
          
          <div className="p-4 bg-white/60 rounded-2xl">
            <h4 className="font-semibold text-brand-gray-900 mb-2">💳 Merchant Whitelist</h4>
            <p className="text-sm text-brand-gray-700">Add trusted merchants to reduce false alerts for regular purchases.</p>
          </div>
        </div>
      </div>
    </div>
  );
};