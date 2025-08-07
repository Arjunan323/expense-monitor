import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Check, 
  Star, 
  Upload, 
  BarChart3,
  Shield,
  Zap,
  Crown
} from 'lucide-react';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { UsageStats } from '../types';
import { apiCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const Billing: React.FC = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      const data = await apiCall<UsageStats>('GET', '/user/usage');
      setUsage(data);
    } catch (error: any) {
      console.error('Usage stats error:', error);
      // Set default values if API fails
      setUsage({
        statementsThisMonth: 0,
        statementLimit: 3,
        isFreePlan: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      const response = await apiCall<{ url: string }>('POST', '/payments/subscribe', {
        userEmail: user?.email
      });
      
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error: any) {
      toast.error('Failed to initiate upgrade process');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isFreePlan = !user?.isSubscribed && !user?.isPremium;
  const usagePercentage = usage ? (usage.statementsThisMonth / usage.statementLimit) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing & Usage</h1>
        <p className="text-gray-600">
          Manage your subscription and view usage statistics
        </p>
      </div>

      {/* Current Plan */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
          {!isFreePlan && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              <Crown className="w-4 h-4 mr-1" />
              Premium
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isFreePlan ? 'Free Plan' : 'Premium Plan'}
            </h3>
            <p className="text-gray-600 mb-4">
              {isFreePlan 
                ? 'Perfect for trying out our service' 
                : 'Unlimited access to all features'
              }
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-success-600" />
                <span className="text-sm text-gray-700">
                  {isFreePlan ? '3 statements per month' : 'Unlimited statements'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-success-600" />
                <span className="text-sm text-gray-700">AI-powered transaction extraction</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-success-600" />
                <span className="text-sm text-gray-700">Automatic categorization</span>
              </div>
              {!isFreePlan && (
                <>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success-600" />
                    <span className="text-sm text-gray-700">Priority support</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success-600" />
                    <span className="text-sm text-gray-700">Advanced analytics (coming soon)</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {usage && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Usage This Month</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Statements Uploaded</span>
                    <span className="text-sm font-medium text-gray-900">
                      {usage.statementsThisMonth} / {isFreePlan ? usage.statementLimit : '∞'}
                    </span>
                  </div>
                  {isFreePlan && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          usagePercentage >= 100 ? 'bg-danger-600' : 
                          usagePercentage >= 80 ? 'bg-warning-500' : 'bg-primary-600'
                        }`}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                
                {isFreePlan && usagePercentage >= 80 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      {usagePercentage >= 100 
                        ? 'You\'ve reached your monthly limit. Upgrade to continue uploading statements.'
                        : 'You\'re approaching your monthly limit. Consider upgrading for unlimited access.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Section */}
      {isFreePlan && (
        <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Star className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Upgrade to Premium
            </h2>
            <p className="text-gray-600 mb-6">
              Get unlimited statement uploads and priority access to new features
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="flex items-center space-x-3">
                <Upload className="w-5 h-5 text-primary-600" />
                <span className="text-sm text-gray-700">Unlimited statements</span>
              </div>
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                <span className="text-sm text-gray-700">Advanced analytics</span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-primary-600" />
                <span className="text-sm text-gray-700">Priority support</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold text-gray-900 mb-1">₹299</div>
              <div className="text-sm text-gray-600">per month</div>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="btn-primary flex items-center space-x-2 mx-auto"
            >
              {upgrading ? (
                <LoadingSpinner size="sm" className="text-white" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              <span>{upgrading ? 'Processing...' : 'Upgrade Now'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Premium Features Preview */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isFreePlan ? 'Premium Features' : 'Your Premium Benefits'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Unlimited Uploads</h4>
              <p className="text-sm text-gray-600 mt-1">
                Upload as many bank statements as you need without monthly limits
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Advanced Analytics</h4>
              <p className="text-sm text-gray-600 mt-1">
                Detailed spending insights, budgets, and forecasting (coming soon)
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Priority Processing</h4>
              <p className="text-sm text-gray-600 mt-1">
                Your statements get processed faster with priority queue access
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Priority Support</h4>
              <p className="text-sm text-gray-600 mt-1">
                Get faster responses and dedicated support for any issues
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};