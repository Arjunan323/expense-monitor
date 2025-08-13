import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RazorpayCheckout from 'react-native-razorpay';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { UsageStats } from '../types';
import { apiCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  statementsLimit: string;
  pagesPerStatement: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonVariant: 'secondary' | 'primary' | 'premium';
}

const PLANS: Plan[] = [
  {
    id: 'FREE',
    name: 'Free Plan',
    price: 0,
    currency: '₹',
    period: 'forever',
    description: 'Ideal for casual users or those wanting to try out the service',
    statementsLimit: '3',
    pagesPerStatement: '10',
    features: [
      'AI Parsing & Categorization',
      'Basic Dashboard & Analytics',
      'Email Support'
    ],
    buttonText: 'Current Plan',
    buttonVariant: 'secondary',
  },
  {
    id: 'PRO',
    name: 'Pro Plan',
    price: 129,
    currency: '₹',
    period: 'month',
    description: 'Perfect for power users tracking multiple accounts',
    statementsLimit: '5',
    pagesPerStatement: '50',
    features: [
      'AI Parsing & Categorization',
      'Advanced Dashboard & Analytics',
      'Basic Spending Trends',
      'Category Breakdown',
      'Priority Support'
    ],
    popular: true,
    buttonText: 'Upgrade to Pro',
    buttonVariant: 'primary',
  },
  {
    id: 'PREMIUM',
    name: 'Premium Plan',
    price: 299,
    currency: '₹',
    period: 'month',
    description: 'Best for business, heavy users, or those who want no limits',
    statementsLimit: 'Unlimited',
    pagesPerStatement: '100',
    features: [
      'AI Parsing & Categorization',
      'Full Analytics Suite',
      'Advanced Spending Trends',
      'Budget Tracking',
      'Priority Processing',
      'Top-Priority Support',
      'Early Access to New Features'
    ],
    buttonText: 'Upgrade to Premium',
    buttonVariant: 'premium',
  },
];

export const BillingScreen: React.FC = () => {
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

  const getUsagePercentage = (used: number, limit: number | string) => {
    if (limit === 'unlimited' || limit === -1) return 0;
    return (used / Number(limit)) * 100;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 100) return '#ef4444';
    if (percentage >= 80) return '#f59e0b';
    return '#0ea5e9';
  };

  const getCurrentPlan = () => {
    if (!usage) return PLANS[0];
    return PLANS.find(plan => plan.id === usage.planType) || PLANS[0];
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === 'FREE') return;
    Alert.alert(
      'Upgrade Plan',
      `Upgrade to ${planId} plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: async () => {
            try {
              setUpgrading(planId);
              // 1. Call backend to create Razorpay order
              const resp = await apiCall<any>('POST', '/payment/order', { planType: planId });
              if (!resp || !resp.orderId) throw new Error('Order creation failed');
              // 2. Open Razorpay native checkout
              const options = {
                description: `${planId} Plan Subscription`,
                image: 'https://yourdomain.com/logo.png',
                currency: resp.currency,
                key: resp.key,
                amount: resp.amount,
                name: 'Expense Monitor',
                order_id: resp.orderId,
                prefill: {
                  email: user?.email,
                },
                theme: { color: '#6366f1' },
              };
              RazorpayCheckout.open(options)
                .then(() => {
                  Alert.alert('Success', 'Payment successful!');
                  fetchUsageStats();
                })
                .catch(() => {
                  Alert.alert('Cancelled', 'Payment cancelled.');
                });
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to upgrade plan');
            } finally {
              setUpgrading(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const currentPlan = getCurrentPlan();
  const statementsPercentage = usage ? getUsagePercentage(usage.statementsThisMonth, usage.statementLimit) : 0;
  const pagesPercentage = usage ? getUsagePercentage(usage.pagesThisMonth, usage.pageLimit) : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Billing & Plans</Text>
        <Text style={styles.headerSubtitle}>
          Choose the plan that fits your needs. Upgrade or downgrade anytime.
        </Text>
      </View>

      {/* Current Usage Overview */}
      {usage && (
        <View style={styles.usageCard}>
          <View style={styles.usageHeader}>
            <View style={styles.usageHeaderLeft}>
              <View style={styles.usageIcon}>
                <Ionicons 
                  name={usage.planType === 'PREMIUM' ? "diamond-outline" : "bar-chart-outline"} 
                  size={20} 
                  color="#0ea5e9" 
                />
              </View>
              <View>
                <Text style={styles.usageTitle}>{currentPlan.name} Usage</Text>
                <Text style={styles.usageSubtitle}>Your current month's activity</Text>
              </View>
            </View>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>
                {Number(currentPlan.price) > 0 ? `${currentPlan.currency}${currentPlan.price}/${currentPlan.period}` : 'Free'}
              </Text>
            </View>
          </View>

          <View style={styles.usageStats}>
            <View style={styles.usageStat}>
              <View style={styles.usageStatHeader}>
                <Text style={styles.usageStatLabel}>Statements</Text>
                <Text style={[
                  styles.usageStatValue,
                  { color: getUsageColor(statementsPercentage) }
                ]}>
                  {usage.statementsThisMonth} / {usage.statementLimit === -1 ? '∞' : usage.statementLimit}
                </Text>
              </View>
              {usage.statementLimit !== -1 && (
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${Math.min(statementsPercentage, 100)}%`,
                        backgroundColor: getUsageColor(statementsPercentage)
                      }
                    ]} 
                  />
                </View>
              )}
            </View>

            <View style={styles.usageStat}>
              <View style={styles.usageStatHeader}>
                <Text style={styles.usageStatLabel}>Pages</Text>
                <Text style={[
                  styles.usageStatValue,
                  { color: getUsageColor(pagesPercentage) }
                ]}>
                  {usage.pagesThisMonth} / {usage.pageLimit === -1 ? '∞' : usage.pageLimit}
                </Text>
              </View>
              {usage.pageLimit !== -1 && (
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${Math.min(pagesPercentage, 100)}%`,
                        backgroundColor: getUsageColor(pagesPercentage)
                      }
                    ]} 
                  />
                </View>
              )}
            </View>
          </View>

          {!usage.canUpload && (
            <View style={styles.limitWarning}>
              <Ionicons name="warning-outline" size={16} color="#f59e0b" />
              <Text style={styles.limitWarningText}>
                Upload limit reached. Upgrade to continue uploading statements.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Plans */}
      <View style={styles.plansSection}>
        <Text style={styles.plansTitle}>Choose Your Plan</Text>
        <Text style={styles.plansSubtitle}>Select the plan that best fits your needs</Text>

        {PLANS.map((plan) => (
          <View
            key={plan.id}
            style={[
              styles.planCard,
              plan.popular && styles.planCardPopular,
              currentPlan.id === plan.id && styles.planCardCurrent,
            ]}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Ionicons name="star" size={12} color="#ffffff" />
                <Text style={styles.popularBadgeText}>Most Popular</Text>
              </View>
            )}

            {currentPlan.id === plan.id && !plan.popular && (
              <View style={styles.currentBadge}>
                <Ionicons name="checkmark" size={12} color="#ffffff" />
                <Text style={styles.currentBadgeText}>Current Plan</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.planPrice}>
                <Text style={styles.planPriceAmount}>{plan.currency}{plan.price}</Text>
                {Number(plan.price) > 0 && <Text style={styles.planPricePeriod}>/{plan.period}</Text>}
              </View>
              <Text style={styles.planDescription}>{plan.description}</Text>
            </View>

            <View style={styles.planLimits}>
              <View style={styles.planLimit}>
                <Ionicons name="document-text-outline" size={16} color="#6b7280" />
                <Text style={styles.planLimitLabel}>Statements/month</Text>
                <Text style={styles.planLimitValue}>{plan.statementsLimit}</Text>
              </View>
              <View style={styles.planLimit}>
                <Ionicons name="cloud-upload-outline" size={16} color="#6b7280" />
                <Text style={styles.planLimitLabel}>Pages per statement</Text>
                <Text style={styles.planLimitValue}>up to {plan.pagesPerStatement}</Text>
              </View>
            </View>

            <View style={styles.planFeatures}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.planFeature}>
                  <Ionicons name="checkmark" size={16} color="#22c55e" />
                  <Text style={styles.planFeatureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.planButton,
                plan.buttonVariant === 'primary' && styles.planButtonPrimary,
                plan.buttonVariant === 'premium' && styles.planButtonPremium,
                (currentPlan.id === plan.id || upgrading === plan.id) && styles.planButtonDisabled,
              ]}
              onPress={() => handleUpgrade(plan.id)}
              disabled={currentPlan.id === plan.id || upgrading === plan.id}
            >
              {upgrading === plan.id ? (
                <LoadingSpinner size="small" color="#ffffff" />
              ) : currentPlan.id === plan.id ? (
                <>
                  <Ionicons name="checkmark" size={16} color="#6b7280" />
                  <Text style={styles.planButtonTextDisabled}>Current Plan</Text>
                </>
              ) : (
                <>
                  {plan.id === 'PREMIUM' && <Ionicons name="diamond-outline" size={16} color="#ffffff" />}
                  <Text style={[
                    styles.planButtonText,
                    plan.buttonVariant === 'secondary' && styles.planButtonTextSecondary,
                  ]}>
                    {plan.buttonText}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingBottom: Platform.OS === 'ios' ? 88 : 60,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 22,
  },
  usageCard: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  usageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  usageIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#bfdbfe',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  usageSubtitle: {
    fontSize: 14,
    color: '#3730a3',
  },
  planBadge: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  planBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  usageStats: {
    gap: 16,
  },
  usageStat: {
    gap: 8,
  },
  usageStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageStatLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  usageStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  limitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  limitWarningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
  },
  plansSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  plansSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  planCardPopular: {
    borderColor: '#0ea5e9',
    backgroundColor: '#f0f9ff',
  },
  planCardCurrent: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#0ea5e9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  popularBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  currentBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  currentBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  planPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planPriceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  planPricePeriod: {
    fontSize: 16,
    color: '#6b7280',
  },
  planDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  planLimits: {
    marginBottom: 20,
    gap: 12,
  },
  planLimit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  planLimitLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  planLimitValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  planFeatures: {
    marginBottom: 20,
    gap: 8,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planFeatureText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  planButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  planButtonPrimary: {
    backgroundColor: '#0ea5e9',
  },
  planButtonPremium: {
    backgroundColor: '#8b5cf6',
  },
  planButtonDisabled: {
    opacity: 0.6,
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  planButtonTextSecondary: {
    color: '#6b7280',
  },
  planButtonTextDisabled: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
});