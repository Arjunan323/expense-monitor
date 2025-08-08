import React, { useState, useEffect } from 'react';
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

const plans: Plan[] = [
  {
    id: 'FREE',
    name: 'Free Plan',
    price: 0,
    currency: '₹',
    period: 'forever',
    description: 'Ideal for casual users or those wanting to try out the service',
    statementsLimit: 3,
    pagesPerStatement: 10,
    features: [
      { name: 'AI Parsing & Categorization', included: true },
      { name: 'Basic Dashboard & Analytics', included: true },
      { name: 'Email Support', included: true, description: 'Standard response time' },
      { name: 'Advanced Analytics', included: false },
      { name: 'Priority Support', included: false },
      { name: 'Priority Processing', included: false }
    ],
    buttonText: 'Current Plan',
    buttonVariant: 'secondary'
  },
  {
    id: 'PRO',
    name: 'Pro Plan',
    price: 129,
    currency: '₹',
    period: 'month',
    description: 'Perfect for power users tracking multiple accounts or statement-heavy banks',
    statementsLimit: 5,
    pagesPerStatement: 50,
    popular: true,
    features: [
      { name: 'AI Parsing & Categorization', included: true },
      { name: 'Advanced Dashboard & Analytics', included: true },
      { name: 'Basic Spending Trends', included: true },
      { name: 'Category Breakdown', included: true },
      { name: 'Priority Support', included: true },
      { name: 'Priority Processing', included: false },
      { name: 'Early Access Features', included: false }
    ],
    buttonText: 'Upgrade to Pro',
    buttonVariant: 'primary'
  },
  {
    id: 'PREMIUM',
    name: 'Premium Plan',
    price: 299,
    currency: '₹',
    period: 'month',
    description: 'Best for business, heavy users, or those who want no limits',
    statementsLimit: 'unlimited',
    pagesPerStatement: 100,
    features: [
      { name: 'AI Parsing & Categorization', included: true },
      { name: 'Full Analytics Suite', included: true },
      { name: 'Advanced Spending Trends', included: true },
      { name: 'Budget Tracking', included: true },
      { name: 'Priority Processing', included: true },
      { name: 'Top-Priority Support', included: true },
      { name: 'Early Access to New Features', included: true }
    ],
    buttonText: 'Upgrade to Premium',
    buttonVariant: 'premium'
  }
];

export const Billing: React.FC = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

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
        planType: 'FREE',
        pagesThisMonth: 0,
        pageLimit: 10,
        canUpload: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === 'FREE') return;
    
    try {
      setUpgrading(planId);
      const response = await apiCall<{ url: string }>('POST', '/payments/subscribe', {
        planType: planId,
        userEmail: user?.email
      });
      
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error: any) {
      toast.error('Failed to initiate upgrade process');
    } finally {
      setUpgrading(null);
    }
  };

  const getCurrentPlan = () => {
    if (!usage) return plans[0];
    return plans.find(plan => plan.id === usage.planType) || plans[0];
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const currentPlan = getCurrentPlan();
  const statementsPercentage = usage ? getUsagePercentage(usage.statementsThisMonth, usage.statementLimit) : 0;
  const pagesPercentage = usage ? getUsagePercentage(usage.pagesThisMonth, usage.pageLimit) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
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
                {currentPlan.price > 0 ? `${currentPlan.currency}${currentPlan.price}/${currentPlan.period}` : 'Free'}
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
                  : currentPlan.id === plan.id
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
              {currentPlan.id === plan.id && !plan.popular && (
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
                  <span className="text-3xl font-bold text-gray-900">{plan.currency}{plan.price}</span>
                  {plan.price > 0 && <span className="text-gray-500">/{plan.period}</span>}
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
                    {plan.pagesPerStatement === 'unlimited' ? '∞' : `up to ${plan.pagesPerStatement}`}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div className="mb-6">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
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
                onClick={() => handleUpgrade(plan.id)}
                disabled={currentPlan.id === plan.id || upgrading === plan.id}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 ${
                  plan.buttonVariant === 'primary'
                    ? 'bg-primary-600 hover:bg-primary-700 text-white'
                    : plan.buttonVariant === 'premium'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                } ${currentPlan.id === plan.id ? 'cursor-not-allowed' : ''}`}
              >
                {upgrading === plan.id ? (
                  <LoadingSpinner size="sm" className="text-white" />
                ) : currentPlan.id === plan.id ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Current Plan</span>
                  </>
                ) : plan.id === 'PREMIUM' ? (
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