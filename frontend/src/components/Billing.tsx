import React, { useState, useEffect } from 'react';
// Extend window typing for Razorpay injected script
declare global {
  interface Window {
    Razorpay?: any;
  }
}
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
  features: string;
  currency: string;
  billingPeriod: 'MONTHLY' | 'YEARLY';
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
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [plans, setPlans] = useState<UiPlan[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [showPlanComparison, setShowPlanComparison] = useState(false);

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
  }, [billingPeriod]);

  const fetchPlans = async () => {
    try {
      // Determine region ONLY from browser locale (not user preferences)
      let region = 'IN';
      if (typeof navigator !== 'undefined' && navigator.language && navigator.language.includes('-')) {
        region = navigator.language.split('-')[1].toUpperCase();
      }
      const data = await apiCall<ApiPlan[]>(
        'GET',
        `/plans?region=${region}&billingPeriod=${billingPeriod}`
      );
      const normalizeCurrency = (c: string) => {
        if (c === '₹' || c === 'INR') return 'INR';
        if (c === '$' || c === 'USD') return 'USD';
        return c; // leave others unchanged
      };
      const merged: UiPlan[] = data.map(variant => {
        const label = PLAN_LABELS[variant.planType] || {};
        return {
          ...variant,
          ...label,
          price: variant.amount,
          currency: normalizeCurrency(variant.currency || 'INR'),
          statementsLimit: variant.statementsPerMonth === -1 ? 'unlimited' : String(variant.statementsPerMonth),
          pagesPerStatementUi: variant.pagesPerStatement === -1 ? 'unlimited' : String(variant.pagesPerStatement),
          featuresUi: parseFeatures(variant.features)
        } as UiPlan;
      });
  const rank: Record<string, number> = { FREE: 0, PRO: 1, PREMIUM: 2 };
  merged.sort((a, b) => (rank[a.planType] ?? 99) - (rank[b.planType] ?? 99));
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
  const pagesPercentage = usage ? getUsagePercentage(usage.pagesThisMonth, usage.statementLimit * usage.pageLimit) : 0;

  // Helper: handleUpgrade
  const handleUpgrade = async (planId: string) => {
    if (planId === 'FREE') return;
    try {
      setUpgrading(planId);
      await loadRazorpayScript();
      // Call backend to create Razorpay order
      const response = await apiCall<any>('POST', '/payment/order', {
        planType: planId,
        billingPeriod
      });
      if (response && response.orderId && response.key && response.amount && response.currency) {
        const options = {
          key: response.key,
          amount: response.amount,
          currency: response.currency,
          name: 'CutTheSpend',
          description: `${planId} Plan Subscription (${billingPeriod === 'YEARLY' ? 'Annual' : 'Monthly'})`,
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
        
        {/* Enhanced Billing Period Toggle */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-2xl border-2 border-brand-gray-200 overflow-hidden shadow-funky bg-white p-1">
          {(['MONTHLY','YEARLY'] as const).map(p => (
            <button
              key={p}
              onClick={() => {
                setBillingPeriod(p);
                fetchPlans();
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${p===billingPeriod? 'bg-primary-600 text-white':'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              {p === 'MONTHLY' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>
        {billingPeriod === 'YEARLY' && (
          <div className="mt-2 text-xs text-green-600">Yearly plans ≈ 2 months free (10× monthly price)</div>
        )}
      </div>

      {/* Current Usage Overview */}
      {usage && (
        <div className="card-funky bg-gradient-to-br from-brand-blue-50 via-white to-brand-green-50 border-brand-blue-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-gradient-funky rounded-3xl flex items-center justify-center shadow-glow-green animate-float">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-heading font-bold gradient-text">💳 Current Usage</h2>
                <p className="text-sm text-brand-gray-600">Your activity this month</p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-brand-gray-200 shadow-funky">
                <div className="w-3 h-3 bg-brand-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm font-bold text-brand-gray-900">{currentPlan?.name}</span>
              </div>
              <div className="text-xs text-brand-gray-500 mt-1">
                {Number(currentPlan?.price) > 0 ? `${currencySymbol(currentPlan?.currency)}${(currentPlan?.price/100).toFixed(0)}/${billingPeriod === 'YEARLY' ? 'year' : currentPlan?.period}` : 'Free'}
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
                  {usage.pagesThisMonth} / {usage.pageLimit === -1 ? '∞' : usage.statementLimit * usage.pageLimit}
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
          <h2 className="text-4xl font-heading font-bold gradient-text mb-4">💰 Choose Your Plan</h2>
          <p className="text-brand-gray-600 text-lg">Select the plan that best fits your needs</p>
          
          {/* Enhanced Billing Period Toggle */}
          <div className="mt-8 flex justify-center">
            <div className="relative inline-flex rounded-3xl border-2 border-brand-gray-200 overflow-hidden shadow-funky bg-white p-2">
              <div className="absolute inset-0 bg-gradient-funky opacity-10 rounded-3xl"></div>
              {(['MONTHLY','YEARLY'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setBillingPeriod(p)}
                  className={`relative z-10 px-8 py-4 text-sm font-bold rounded-2xl transition-all duration-300 ${
                    p === billingPeriod 
                      ? 'bg-gradient-green text-white shadow-glow-green transform scale-105 shadow-xl' 
                      : 'text-brand-gray-600 hover:text-brand-green-600 hover:bg-brand-green-50 hover:scale-102'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{p === 'MONTHLY' ? '📅' : '🎯'}</span>
                    <span>{p === 'MONTHLY' ? 'Monthly' : 'Yearly'}</span>
                  </div>
                  {p === 'YEARLY' && (
                    <div className="absolute -top-2 -right-2 bg-accent-500 text-brand-gray-900 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                      Save 17% 🎉
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Savings Highlight */}
          {billingPeriod === 'YEARLY' && (
            <div className="mt-6 animate-fade-in">
              <div className="inline-flex items-center bg-gradient-to-r from-accent-100 to-brand-green-100 border border-accent-300 text-accent-800 px-6 py-3 rounded-full text-sm font-bold shadow-glow-yellow">
                <Sparkles className="w-4 h-4 mr-2 animate-wiggle" />
                <span>🎉 Yearly plans = 2 months FREE! Save 17% instantly! 💰</span>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setShowPlanComparison(!showPlanComparison)}
              className="btn-secondary flex items-center space-x-2 shadow-funky hover:shadow-funky-lg"
            >
              <BarChart3 className="w-4 h-4" />
              <span>{showPlanComparison ? 'Hide' : 'Show'} Feature Comparison</span>
            </button>
          </div>
        </div>

        {/* Feature Comparison Table */}
        {showPlanComparison && (
          <div className="mb-12 animate-slide-up">
            <div className="card-funky overflow-hidden">
              <div className="bg-gradient-funky text-white p-6 text-center">
                <h3 className="text-2xl font-heading font-bold mb-2">📊 Feature Comparison</h3>
                <p className="text-white/90">See what's included in each plan</p>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-gray-200">
                        <th className="text-left py-4 px-4 font-semibold text-brand-gray-900">Features</th>
                        <th className="text-center py-4 px-4 font-semibold text-brand-gray-900">Free</th>
                        <th className="text-center py-4 px-4 font-semibold text-brand-green-600">Pro</th>
                        <th className="text-center py-4 px-4 font-semibold text-purple-600">Premium</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { feature: '🤖 AI Parsing & Categorization', free: true, pro: true, premium: true },
                        { feature: '📊 Basic Dashboard (3mo)', free: true, pro: false, premium: false },
                        { feature: '📈 Advanced Analytics (12mo)', free: false, pro: true, premium: true },
                        { feature: '🎯 Budget Tracking & Alerts', free: false, pro: true, premium: true },
                        { feature: '📉 Spending Trends', free: true, pro: true, premium: true },
                        { feature: '🔮 Cash Flow Forecasting', free: false, pro: false, premium: true },
                        { feature: '🏆 Goal Tracking', free: false, pro: false, premium: true },
                        { feature: '📋 Tax Categorization', free: false, pro: false, premium: true },
                        { feature: '⚡ Priority Support', free: false, pro: true, premium: true },
                        { feature: '🚀 Early Access Features', free: false, pro: false, premium: true },
                      ].map((row, index) => (
                        <tr key={index} className="border-b border-brand-gray-100 hover:bg-brand-gray-50 transition-colors duration-200">
                          <td className="py-4 px-4 font-medium text-brand-gray-900">{row.feature}</td>
                          <td className="text-center py-4 px-4">
                            {row.free ? (
                              <CheckCircle className="w-5 h-5 text-brand-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-brand-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="text-center py-4 px-4">
                            {row.pro ? (
                              <CheckCircle className="w-5 h-5 text-brand-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-brand-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="text-center py-4 px-4">
                            {row.premium ? (
                              <CheckCircle className="w-5 h-5 text-purple-600 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-brand-gray-300 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative card-funky p-8 flex flex-col transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? 'border-brand-green-400 ring-4 ring-brand-green-200 shadow-glow-green'
                  : currentPlan.planType === plan.planType
                  ? 'border-accent-400 ring-4 ring-accent-200 shadow-glow-yellow'
                  : 'border-brand-gray-200 hover:border-brand-green-300 hover:shadow-funky-lg'
              }`}
            >
              {/* Savings Badge for Yearly */}
              {billingPeriod === 'YEARLY' && plan.planType !== 'FREE' && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-accent-400 to-accent-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-glow-yellow animate-pulse z-20">
                  2 Months FREE! 🎁
                </div>
              )}

              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-green text-white text-sm font-bold px-4 py-2 rounded-full shadow-glow-green animate-bounce-gentle">
                  <Star className="w-4 h-4 mr-1 inline" />
                    Most Popular
                </div>
              )}

              {/* Current Plan Badge */}
              {currentPlan.planType === plan.planType && !plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-yellow text-brand-gray-900 text-sm font-bold px-4 py-2 rounded-full shadow-glow-yellow">
                  <Check className="w-4 h-4 mr-1 inline" />
                    Current Plan
                </div>
              )}

              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-funky rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow-green animate-float">
                  {plan.planType === 'FREE' && <Zap className="w-8 h-8 text-white" />}
                  {plan.planType === 'PRO' && <Target className="w-8 h-8 text-white" />}
                  {plan.planType === 'PREMIUM' && <Crown className="w-8 h-8 text-white" />}
                </div>
                <h3 className="text-3xl font-heading font-bold text-brand-gray-900 mb-3">{plan.name}</h3>
                <p className="text-brand-gray-600">{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                <div className="mb-2">
                  <div className="flex items-end justify-center mb-2">
                    <span className="text-3xl font-bold text-brand-gray-600">{currencySymbol(plan.currency)}</span>
                    <span className="text-6xl font-heading font-bold text-brand-gray-900 ml-1">{(plan.price / 100).toFixed(0)}</span>
                    <span className="text-brand-gray-500 ml-2 mb-2">/{billingPeriod === 'YEARLY' ? 'year' : plan.period}</span>
                  </div>
                  <div className="space-y-2">
                    {billingPeriod === 'YEARLY' && plan.planType !== 'FREE' && (
                      <div className="inline-flex items-center bg-gradient-to-r from-accent-100 to-brand-green-100 text-accent-800 px-4 py-2 rounded-full text-sm font-bold border border-accent-200 shadow-glow-yellow">
                        <Sparkles className="w-4 h-4 mr-2 animate-wiggle" />
                        <span>2 months FREE! 🎉</span>
                      </div>
                    )}
                    {plan.planType === 'FREE' && (
                      <div className="inline-flex items-center bg-brand-green-100 text-brand-green-800 px-4 py-2 rounded-full text-sm font-bold">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span>Forever Free 💚</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Plan Limits */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-brand-gray-50 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-brand-gray-500" />
                    <span className="text-sm font-medium text-brand-gray-700">Statements/month</span>
                  </div>
                  <span className="text-sm font-bold text-brand-gray-900">
                    {plan.statementsLimit === 'unlimited' ? '∞' : plan.statementsLimit}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-gray-50 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-brand-gray-500" />
                    <span className="text-sm font-medium text-brand-gray-700">Pages per statement</span>
                  </div>
                  <span className="text-sm font-bold text-brand-gray-900">
                    {plan.pagesPerStatementUi === 'unlimited' ? '∞' : `up to ${plan.pagesPerStatementUi}`}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-gray-50 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-brand-gray-500" />
                    <span className="text-sm font-medium text-brand-gray-700">Bank accounts</span>
                  </div>
                  <span className="text-sm font-bold text-brand-gray-900">
                    up to {plan.planType === 'FREE' ? 2 : plan.planType === 'PRO' ? 3 : 5}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div className="mb-8 flex-1">
                <ul className="space-y-3">
                  {plan.featuresUi.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-gradient-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-brand-gray-700 leading-relaxed">{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleUpgrade(plan.planType)}
                disabled={isExpired ? plan.planType === 'FREE' || upgrading === plan.planType : currentPlan.planType === plan.planType || upgrading === plan.planType}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                  plan.buttonVariant === 'primary'
                    ? 'bg-gradient-green text-white shadow-glow-green hover:scale-105 active:scale-95'
                    : plan.buttonVariant === 'premium'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-blue hover:scale-105 active:scale-95'
                    : 'bg-brand-gray-100 text-brand-gray-700 hover:bg-brand-gray-200'
                className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center space-x-2 ${
                  p === billingPeriod 
                    ? 'bg-gradient-green text-white shadow-glow-green transform scale-105' 
                    : 'text-brand-gray-600 hover:text-brand-green-600 hover:bg-brand-green-50'
                }`}
              >
                {upgrading === plan.planType ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : currentPlan.planType === plan.planType ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Current Plan</span>
                  </>
                ) : plan.planType === 'PREMIUM' ? (
                  <>
                    <Crown className="w-5 h-5" />
                    <span>{plan.buttonText}</span>
                  </>
                ) : plan.planType === 'PRO' ? (
                  <>
                    <Target className="w-5 h-5" />
                    <span>{plan.buttonText}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>{plan.buttonText}</span>
                  </>
                <span>{p === 'MONTHLY' ? '📅 Monthly' : '🎯 Yearly'}</span>
                {p === 'YEARLY' && (
                  <span className="bg-accent-500 text-brand-gray-900 text-xs px-2 py-0.5 rounded-full font-bold">
                    Save 17%
                  </span>
                )}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="card-funky">
        <div className="bg-gradient-funky text-white p-6 rounded-t-3xl">
          <h3 className="text-2xl font-heading font-bold mb-2">❓ Frequently Asked Questions</h3>
          <p className="text-white/90">Everything you need to know about CutTheSpend</p>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-brand-gray-900 mb-2 flex items-center space-x-2">
              <div className="w-6 h-6 bg-brand-green-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-brand-green-600">1</span>
              </div>
              <span>What happens if I exceed my limits?</span>
            </h4>
            <p className="text-sm text-brand-gray-600 ml-8">
              You'll receive a notification when approaching your limits. Once reached, you'll need to upgrade to continue uploading statements.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-brand-gray-900 mb-2 flex items-center space-x-2">
              <div className="w-6 h-6 bg-brand-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-brand-blue-600">2</span>
              </div>
              <span>Can I change plans anytime?</span>
            </h4>
            <p className="text-sm text-brand-gray-600 ml-8">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-brand-gray-900 mb-2 flex items-center space-x-2">
              <div className="w-6 h-6 bg-accent-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-accent-600">3</span>
              </div>
              <span>What's included in Priority Support?</span>
            </h4>
            <p className="text-sm text-brand-gray-600 ml-8">
              Priority support includes faster response times, dedicated support channels, and priority in our support queue.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-brand-gray-900 mb-2 flex items-center space-x-2">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-purple-600">4</span>
              </div>
              <span>Is my financial data secure?</span>
            </h4>
            <p className="text-sm text-brand-gray-600 ml-8">
              Yes! We use bank-level encryption and security measures. Your data is never shared with third parties.
            </p>
          </div>
          <div className="mt-4 text-center">
            <div className="inline-flex items-center bg-accent-100 text-accent-800 px-4 py-2 rounded-full text-sm font-semibold">
              <Sparkles className="w-4 h-4 mr-2" />
              Yearly plans include 2 months free (10× monthly price)
            </div>
          </div>
        
      </div>
    </div>
  );
};