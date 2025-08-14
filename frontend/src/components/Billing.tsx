import React, { useState, useEffect } from 'react';
// Helper to load Razorpay script
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
}
import { 
  CreditCard, 
  Check, 
  Star, 
  Upload, 
  BarChart3,
  Shield,
  Zap,
  Crown,
  X,
  AlertTriangle,
  FileText,
  TrendingUp
} from 'lucide-react';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { UsageStats } from '../types';
import { apiCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import toast from 'react-hot-toast';

interface PlanFeature {
  name: string;
  included: boolean;
  description?: string;
}

interface Plan {
  id: 'FREE' | 'PRO' | 'PREMIUM';
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  statementsLimit: number | 'unlimited';
  pagesPerStatement: number | 'unlimited';
  features: PlanFeature[];
  popular?: boolean;
  buttonText: string;
  buttonVariant: 'secondary' | 'primary' | 'premium';
}


// Plan type for API
interface ApiPlan {
  id: number;
  planType: 'FREE' | 'PRO' | 'PREMIUM';
  amount: number;
  statementsPerMonth: number;
  pagesPerStatement: number;
  features: string; // comma-separated or JSON string
  currency: string; // e.g. '₹', '$', '€'
}

type UiPlan = ApiPlan & {
  name: string;
  period: string;
  description: string;
  buttonText: string;
  buttonVariant: 'secondary' | 'primary' | 'premium';
  popular?: boolean;
  price: number;
  currency: string;
  statementsLimit: string;
  pagesPerStatementUi: string;
  featuresUi: PlanFeature[];
};

const PLAN_LABELS: Record<string, { name: string; period: string; description: string; buttonText: string; buttonVariant: 'secondary' | 'primary' | 'premium'; popular?: boolean; } > = {
  FREE: {
    name: 'Free Plan',
    period: 'forever',
    description: 'Ideal for casual users or those wanting to try out the service',
    buttonText: 'Current Plan',
    buttonVariant: 'secondary',
  },
  PRO: {
    name: 'Pro Plan',
    period: 'month',
    description: 'Perfect for power users tracking multiple accounts or statement-heavy banks',
    buttonText: 'Upgrade to Pro',
    buttonVariant: 'primary',
    popular: true,
  },
  PREMIUM: {
    name: 'Premium Plan',
    period: 'month',
    description: 'Best for business, heavy users, or those who want no limits',
    buttonText: 'Upgrade to Premium',
    buttonVariant: 'premium',
  },
};


function parseFeatures(features: string): PlanFeature[] {
  // Try to parse as JSON, fallback to comma-separated
  try {
    const arr = JSON.parse(features);
    if (Array.isArray(arr)) return arr;
  } catch {}
  return features.split(',').map((f: string) => ({ name: f.trim(), included: true }));
}

export const Billing: React.FC = () => {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [plans, setPlans] = useState<UiPlan[]>([]);

  // Helper: fetchUsageStats
  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      const data = await apiCall<UsageStats>('GET', '/user/usage');
      setUsage(data);
    } catch (error: any) {
      // JWT expired error handling
      if (error && error.message &&
        (error.message.includes('JWT expired') || error.message.includes('ExpiredJwtException') || error.message.includes('jwt expired'))
      ) {
        toast.error('Your session has expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        return;
      }
      console.error('Usage stats error:', error);
      // Set default values if API fails
      setUsage({
        statementsThisMonth: 0,
        statementLimit: 3,
        planType: 'FREE',
        pagesThisMonth: 0,
        pageLimit: 10,
        canUpload: true
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageStats();
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      // 1. Try region from preferences
      let region = '';
      if (preferences && preferences.locale && preferences.locale.includes('-')) {
        region = preferences.locale.split('-')[1].toUpperCase();
      }
      // 2. Fallback to browser locale
      if (!region && typeof navigator !== 'undefined' && navigator.language && navigator.language.includes('-')) {
        region = navigator.language.split('-')[1].toUpperCase();
      }
      // 3. Default to IN
      if (!region) region = 'IN';

      const data = await apiCall<ApiPlan[]>('GET', `/plans?region=${region}`);
      // Merge API data with UI labels and parse features
      const merged: UiPlan[] = data.map((plan) => {
        const label = PLAN_LABELS[plan.planType] || {};
        return {
          ...plan,
          ...label,
          price: plan.amount,
          currency: plan.currency || '₹',
          statementsLimit: plan.statementsPerMonth === -1 ? 'unlimited' : String(plan.statementsPerMonth),
          pagesPerStatementUi: plan.pagesPerStatement === -1 ? 'unlimited' : String(plan.pagesPerStatement),
          featuresUi: parseFeatures(plan.features),
        };
      });
      setPlans(merged);
    } catch (error) {
      toast.error('Failed to load plans');
    }
  };

  const getUsagePercentage = (used: number, limit: number | 'unlimited') => {
    if (limit === 'unlimited') return 0;
    return (used / limit) * 100;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-danger-600';
    if (percentage >= 80) return 'bg-warning-500';
    return 'bg-primary-600';
  };


  // Show upgrade prompt if subscription is expired
  const isExpired = usage && usage['status'] === 'EXPIRED';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Helper: getCurrentPlan

  const getCurrentPlan = () => {
    if (!usage) return plans[0];
    return plans.find(plan => plan.planType === usage.planType) || plans[0];
  };
  const currentPlan = getCurrentPlan();
  const statementsPercentage = usage ? getUsagePercentage(usage.statementsThisMonth, usage.statementLimit) : 0;
  const pagesPercentage = usage ? getUsagePercentage(usage.pagesThisMonth, usage.pageLimit) : 0;

  // Helper: handleUpgrade
  const handleUpgrade = async (planId: string) => {
    if (planId === 'FREE') return;
    try {
      setUpgrading(planId);
      await loadRazorpayScript();
      // Call backend to create Razorpay order
      const response = await apiCall<any>('POST', '/payment/order', {
        planType: planId
      });
      if (response && response.orderId && response.key && response.amount && response.currency) {
        const options = {
          key: response.key,
          amount: response.amount,
          currency: response.currency,
          name: 'Expense Monitor',
          description: `${planId} Plan Subscription`,
          order_id: response.orderId,
          handler: function (rzpResponse: any) {
            toast.success('Payment successful!');
            fetchUsageStats();
          },
          prefill: {
            email: user?.email || '',
          },
          theme: { color: '#6366f1' },
          modal: {
            ondismiss: function () {
              toast.error('Payment cancelled. No changes made.');
            }
          },
          // Listen for payment failure
          "callback_url": undefined,
        };
        // @ts-ignore
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          toast.error('Payment failed. Please try again.');
        });
        rzp.open();
      } else {
        toast.error('Failed to create payment order');
      }
    } catch (error: any) {
      toast.error('Failed to initiate upgrade process');
    } finally {
      setUpgrading(null);
    }
  };

  // Map ISO currency code to symbol
  const currencySymbol = (code: string) => {
    switch (code) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return code;
    }
  };


  return (
    <div className="space-y-8 animate-fade-in">
      {isExpired && (
        <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <div>
            <div className="font-semibold text-yellow-900">Your subscription has expired</div>
            <div className="text-yellow-800 text-sm">Upgrade to Pro or Premium to restore access to premium features.</div>
          </div>
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Plans</h1>
        <p className="text-gray-600">
          Choose the plan that fits your needs. Upgrade or downgrade anytime.
        </p>
      </div>

      {/* Current Usage Overview */}
      {usage && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Current Usage</h2>
                <p className="text-sm text-gray-600">Your activity this month</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{currentPlan.name}</div>
              <div className="text-xs text-gray-500">
                {Number(currentPlan.price) > 0 ? `${currentPlan.currency}${currentPlan.price}/${currentPlan.period}` : 'Free'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Statements Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Statements Uploaded</span>
                <span className="text-sm font-semibold text-gray-900">
                  {usage.statementsThisMonth} / {usage.statementLimit === -1 ? '∞' : usage.statementLimit}
                </span>
              </div>
              {usage.statementLimit !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(statementsPercentage)}`}
                    style={{ width: `${Math.min(statementsPercentage, 100)}%` }}
                  />
                </div>
              )}
              {statementsPercentage >= 80 && usage.statementLimit !== -1 && (
                <p className="text-xs text-yellow-700 mt-1">
                  {statementsPercentage >= 100 ? 'Limit reached!' : 'Approaching limit'}
                </p>
              )}
            </div>

            {/* Pages Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Pages Processed</span>
                <span className="text-sm font-semibold text-gray-900">
                  {usage.pagesThisMonth} / {usage.pageLimit === -1 ? '∞' : usage.pageLimit}
                </span>
              </div>
              {usage.pageLimit !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(pagesPercentage)}`}
                    style={{ width: `${Math.min(pagesPercentage, 100)}%` }}
                  />
                </div>
              )}
              {pagesPercentage >= 80 && usage.pageLimit !== -1 && (
                <p className="text-xs text-yellow-700 mt-1">
                  {pagesPercentage >= 100 ? 'Limit reached!' : 'Approaching limit'}
                </p>
              )}
            </div>
          </div>

          {/* Upgrade Alert */}
          {!usage.canUpload && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Upload limit reached</p>
                  <p className="text-xs text-yellow-700">
                    You've reached your monthly limit. Upgrade to continue uploading statements.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Plans Comparison */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
          <p className="text-gray-600">Select the plan that best fits your needs</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-6 ${
                plan.popular
                  ? 'border-primary-500 bg-primary-50'
                  : currentPlan.planType === plan.planType
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white'
              } transition-all duration-200 hover:shadow-lg`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-600 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {currentPlan.planType === plan.planType && !plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                    <Check className="w-3 h-3 mr-1" />
                    Current Plan
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-gray-900">{currencySymbol(plan.currency)}{(plan.price / 100).toFixed(0)}</span>
                  {Number(plan.price) > 0 && <span className="text-gray-500">/{plan.period}</span>}
                </div>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </div>

              {/* Plan Limits */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Statements/month</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {plan.statementsLimit === 'unlimited' ? '∞' : plan.statementsLimit}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Pages per statement</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {plan.pagesPerStatementUi === 'unlimited' ? '∞' : `up to ${plan.pagesPerStatementUi}`}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div className="mb-6">
                <ul className="space-y-2">
                  {plan.featuresUi.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <span className={`text-sm ${feature.included ? 'text-gray-900' : 'text-gray-400'}`}>
                          {feature.name}
                        </span>
                        {feature.description && (
                          <p className="text-xs text-gray-500">{feature.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleUpgrade(plan.planType)}
                disabled={isExpired ? plan.planType === 'FREE' || upgrading === plan.planType : currentPlan.planType === plan.planType || upgrading === plan.planType}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 ${
                  plan.buttonVariant === 'primary'
                    ? 'bg-primary-600 hover:bg-primary-700 text-white'
                    : plan.buttonVariant === 'premium'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                } ${isExpired ? (plan.planType === 'FREE' ? 'cursor-not-allowed' : '') : (currentPlan.planType === plan.planType ? 'cursor-not-allowed' : '')}`}
              >
                {upgrading === plan.planType ? (
                  <LoadingSpinner size="sm" className="text-white" />
                ) : currentPlan.planType === plan.planType ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Current Plan</span>
                  </>
                ) : plan.planType === 'PREMIUM' ? (
                  <>
                    <Crown className="w-4 h-4" />
                    <span>{plan.buttonText}</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    <span>{plan.buttonText}</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">What happens if I exceed my limits?</h4>
            <p className="text-sm text-gray-600">
              You'll receive a notification when approaching your limits. Once reached, you'll need to upgrade to continue uploading statements.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Can I change plans anytime?</h4>
            <p className="text-sm text-gray-600">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">What's included in Priority Support?</h4>
            <p className="text-sm text-gray-600">
              Priority support includes faster response times, dedicated support channels, and priority in our support queue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};