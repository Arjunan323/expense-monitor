import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MonthlyTrendsScreen } from './analytics/MonthlyTrendsScreen';
import { BudgetTrackingScreen } from './analytics/BudgetTrackingScreen';
import SpendingAlertsScreen from './analytics/SpendingAlertsScreen';
import CashFlowForecastScreen from './analytics/CashFlowForecastScreen';
import GoalTrackingScreen from './analytics/GoalTrackingScreen';
import TaxTrackerScreen from './analytics/TaxTrackerScreen';
// Update the import path to the correct location of your API utilities, for example:
import { apiCall, fetchMonthlySpendingSeriesMobile, spendingAlertsApi, budgetsApi, goalsApi } from '../utils/api';
// If your API file is actually located at src/utils/api.ts, use the above path.
// Otherwise, create the file '../api.ts' and export the required functions/objects.
import Toast from 'react-native-toast-message';
import { useAuth } from '../contexts/AuthContext';
import PlanGate, { PlanTier } from '../components/PlanGate';

type AnalyticsView = 'overview' | 'trends' | 'budget' | 'alerts' | 'forecast' | 'goals' | 'tax';

export const AnalyticsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { usage } = useAuth();
  const [currentView, setCurrentView] = useState<AnalyticsView>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [quickStats, setQuickStats] = useState({
    spendingTrend: null as number | null,
    budgetAdherence: null as number | null,
    activeAlerts: null as number | null,
    goalsProgress: null as number | null,
    loading: false
  });

  useEffect(() => {
    loadQuickStats();
  }, []);

  const loadQuickStats = async () => {
    try {
      setQuickStats(prev => ({ ...prev, loading: true }));
      const now = new Date();
      const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const from = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
      
      const [trends, budgetSummary, alertSummary, goalStats] = await Promise.all([
        fetchMonthlySpendingSeriesMobile(from, to).catch(() => null),
        budgetsApi.summary().catch(() => null),
        spendingAlertsApi.list({ month: to }).then(r => r.summary).catch(() => null),
        goalsApi.stats().catch(() => null)
      ]);
      
      setQuickStats({
        spendingTrend: trends?.summary?.momChangePct ? Math.round(trends.summary.momChangePct) : null,
        budgetAdherence: budgetSummary ? Math.round(budgetSummary.history.thisMonthAdherence) : null,
        activeAlerts: alertSummary ? (alertSummary.criticalOpen + alertSummary.moderateOpen) : null,
        goalsProgress: goalStats ? Math.round(goalStats.averageProgressPercent) : null,
        loading: false
      });
    } catch (err) {
      console.error('Failed loading quick stats', err);
      Toast.show({ type: 'error', text1: 'Failed to load analytics data' });
      setQuickStats(prev => ({ ...prev, loading: false }));
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadQuickStats().finally(() => setRefreshing(false));
  };

  // feature -> minimum required plan mapping
  const featurePlans: Record<AnalyticsView, PlanTier> = {
    overview: 'FREE',
    trends: 'FREE',
    budget: 'PRO',
    alerts: 'PRO',
    forecast: 'PREMIUM',
    goals: 'PRO',
    tax: 'PREMIUM'
  };

  const planOrder: PlanTier[] = ['FREE','PRO','PREMIUM'];
  const hasPlan = (required: PlanTier) => planOrder.indexOf((usage?.planType as PlanTier) || 'FREE') >= planOrder.indexOf(required);

  const onUpgrade = () => {
    Toast.show({ type: 'info', text1: 'Upgrade', text2: 'Redirect to upgrade / billing screen coming soon.' });
    // navigation.navigate('Billing'); // if a billing screen exists
  };

  const analyticsMenuItems = useMemo(() => ([
    {
      id: 'trends' as AnalyticsView,
      title: 'Monthly Spending Trends',
      description: 'Track and compare spending patterns over time',
      icon: 'trending-up',
      color: '#00B77D',
      emoji: '📈',
      minPlan: featurePlans.trends
    },
    {
      id: 'budget' as AnalyticsView,
      title: 'Budget Tracking',
      description: 'Set budgets by category and monitor progress',
      icon: 'locate',
      color: '#0077B6',
      emoji: '🎯',
      minPlan: featurePlans.budget
    },
    {
      id: 'alerts' as AnalyticsView,
      title: 'Spending Alerts',
      description: 'Get notified of unusual spending patterns',
      icon: 'warning',
      color: '#F59E0B',
      emoji: '🚨',
      minPlan: featurePlans.alerts
    },
    {
      id: 'forecast' as AnalyticsView,
      title: 'Cash Flow Forecast',
      description: 'Predict future financial position',
      icon: 'analytics',
      color: '#8B5CF6',
      emoji: '🔮',
      minPlan: featurePlans.forecast
    },
    {
      id: 'goals' as AnalyticsView,
      title: 'Goal Tracking',
      description: 'Track savings goals and debt reduction',
      icon: 'trophy',
      color: '#EC4899',
      emoji: '🏆',
      minPlan: featurePlans.goals
    },
    {
      id: 'tax' as AnalyticsView,
      title: 'Tax Benefit Tracker',
      description: 'Maximize tax savings with smart categorization',
      icon: 'calculator',
      color: '#6366F1',
      emoji: '📊',
      minPlan: featurePlans.tax
    }
  ]), [usage?.planType]);

  if (currentView !== 'overview') {
    if (!hasPlan(featurePlans[currentView])) {
      return (
        <View style={styles.container}>
          <View style={styles.backNavigation}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentView('overview')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#00B77D" />
              <Text style={styles.backButtonText}>Back to Analytics</Text>
            </TouchableOpacity>
          </View>
          <PlanGate minPlan={featurePlans[currentView]} onUpgradePress={onUpgrade}>
            {/* Empty gated view placeholder */}
          </PlanGate>
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <View style={styles.backNavigation}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentView('overview')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#00B77D" />
            <Text style={styles.backButtonText}>Back to Analytics</Text>
          </TouchableOpacity>
        </View>
        {currentView === 'trends' && <MonthlyTrendsScreen />}
        {currentView === 'budget' && <BudgetTrackingScreen />}
        {currentView === 'alerts' && <SpendingAlertsScreen />}
        {currentView === 'forecast' && <CashFlowForecastScreen />}
        {currentView === 'goals' && <GoalTrackingScreen />}
        {currentView === 'tax' && <TaxTrackerScreen />}
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Advanced Analytics</Text>
        <Text style={styles.headerSubtitle}>
          Powerful insights to help you make smarter financial decisions
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#CCFBEF' }]}>
            <Ionicons name="trending-up" size={20} color="#00B77D" />
          </View>
          <Text style={styles.statLabel}>Spending Trend</Text>
          <Text style={[styles.statValue, { color: quickStats.spendingTrend && quickStats.spendingTrend < 0 ? '#00B77D' : '#EF4444' }]}>
            {quickStats.loading ? '...' : quickStats.spendingTrend !== null ? `${quickStats.spendingTrend > 0 ? '+' : ''}${quickStats.spendingTrend}%` : '—'}
          </Text>
          <Text style={styles.statSubtext}>vs last month</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="radio-outline" size={20} color="#0077B6" />
          </View>
          <Text style={styles.statLabel}>Budget Adherence</Text>
          <Text style={[styles.statValue, { color: '#0077B6' }]}>
            {quickStats.loading ? '...' : quickStats.budgetAdherence !== null ? `${quickStats.budgetAdherence}%` : '—'}
          </Text>
          <Text style={styles.statSubtext}>This month</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.statLabel}>Active Alerts</Text>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>
            {quickStats.loading ? '...' : quickStats.activeAlerts !== null ? quickStats.activeAlerts : '—'}
          </Text>
          <Text style={styles.statSubtext}>Need attention</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="trophy" size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.statLabel}>Goals Progress</Text>
          <Text style={[styles.statValue, { color: '#8B5CF6' }]}>
            {quickStats.loading ? '...' : quickStats.goalsProgress !== null ? `${quickStats.goalsProgress}%` : '—'}
          </Text>
          <Text style={styles.statSubtext}>Average completion</Text>
        </View>
      </View>

      {/* Analytics Menu */}
      <View style={styles.menuSection}>
        <Text style={styles.menuTitle}>Choose Analytics Tool</Text>
        <Text style={styles.menuSubtitle}>Select the analysis you want to explore</Text>
        
        <View style={styles.menuGrid}>
          {analyticsMenuItems.map(item => {
            const locked = !hasPlan(item.minPlan);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, locked && styles.menuItemLocked]}
                onPress={() => locked ? onUpgrade() : setCurrentView(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.menuItemHeader}>
                  <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon as any} size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.menuEmoji}>{item.emoji}</Text>
                </View>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemDescription}>{item.description}</Text>
                <View style={styles.menuItemFooter}>
                  {locked ? (
                    <View style={styles.lockBadge}>
                      <Ionicons name="lock-closed" size={12} color="#6366F1" />
                      <Text style={styles.lockBadgeText}>{item.minPlan} Plan</Text>
                    </View>
                  ) : (
                    <Text style={styles.exploreText}>Explore</Text>
                  )}
                  <Ionicons name={locked ? 'arrow-up-circle' : 'arrow-forward'} size={16} color={locked ? '#6366F1' : '#00B77D'} />
                </View>
                {locked && (
                  <View style={styles.lockOverlay} pointerEvents="none">
                    <Ionicons name="lock-closed" size={28} color="rgba(255,255,255,0.9)" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Coming Soon */}
      <View style={styles.comingSoonCard}>
        <View style={styles.comingSoonIcon}>
          <Ionicons name="rocket" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.comingSoonTitle}>More Analytics Coming Soon! 🚀</Text>
        <Text style={styles.comingSoonDescription}>
          We're working on even more powerful analytics features including AI-powered insights, 
          investment tracking, and personalized financial recommendations.
        </Text>
        <View style={styles.comingSoonFeatures}>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🤖</Text>
            <Text style={styles.featureText}>AI Insights</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>📊</Text>
            <Text style={styles.featureText}>Investment Tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>💡</Text>
            <Text style={styles.featureText}>Smart Recommendations</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  backNavigation: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00B77D',
  },
  header: {
    backgroundColor: '#6366F1',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 22,
  },
  quickStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  menuSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  menuSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  menuGrid: {
    gap: 16,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuEmoji: {
    fontSize: 32,
  },
  menuItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  menuItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exploreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B77D',
  },
  comingSoonCard: {
    backgroundColor: '#6366F1',
    marginHorizontal: 24,
    borderRadius: 25,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  comingSoonIcon: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  comingSoonDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  comingSoonFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  // Added for plan gating visuals
  menuItemLocked: {
    opacity: 0.85,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  lockBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6366F1',
    textTransform: 'uppercase'
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  }
});