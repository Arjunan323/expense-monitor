import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { StatCard } from '../components/ui/StatCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { DashboardStats, Transaction } from '../types';
import { apiCall } from '../utils/api';
import { formatCurrency, formatDate, getCategoryColor } from '../utils/formatters';
import { useNavigation } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

export const DashboardScreen: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiCall<DashboardStats>('GET', '/dashboard/summary');
      setStats(data);
    } catch (error: any) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!stats || stats.transactionCount === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Welcome to Expense Monitor</Text>
          <Text style={styles.headerSubtitle}>Get started by uploading your first bank statement</Text>
        </View>
        <EmptyState
          icon="receipt-outline"
          title="No transactions yet"
          description="Upload your PDF bank statements to automatically extract and categorize your transactions using AI"
          action={{
            label: 'Upload Your First Statement',
            onPress: () => navigation.navigate('Upload' as never),
          }}
        />
      </View>
    );
  }

  const chartData = stats.topCategories?.slice(0, 5).map((cat, index) => ({
    name: cat.category,
    amount: Math.abs(cat.amount),
    color: getCategoryColor(cat.category),
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  })) || [];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial Overview</Text>
        {stats.lastUpdateTime && (
          <Text style={styles.lastUpdate}>
            Last updated: {formatDate(stats.lastUpdateTime)}
          </Text>
        )}
      </View>

      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={() => navigation.navigate('Upload' as never)}
      >
        <Ionicons name="cloud-upload-outline" size={20} color="#ffffff" />
        <Text style={styles.uploadButtonText}>Upload Statement</Text>
      </TouchableOpacity>

      {stats.hasBalanceDiscrepancy && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={20} color="#f59e0b" />
          <Text style={styles.warningText}>
            Multiple bank accounts detected. Balances may not add up correctly.
          </Text>
        </View>
      )}

      <View style={styles.statsGrid}>
        <StatCard
          title="Current Balance"
          value={stats.totalBalance}
          icon="wallet-outline"
          subtitle={stats.isMultiBank ? "Across all accounts" : undefined}
        />
        <StatCard
          title="Monthly Income"
          value={stats.monthlyIncome}
          icon="trending-up-outline"
          subtitle="Credits this month"
          color="#22c55e"
        />
        <StatCard
          title="Monthly Expenses"
          value={Math.abs(stats.monthlyExpenses)}
          icon="trending-down-outline"
          subtitle="Debits this month"
          color="#ef4444"
        />
        <StatCard
          title="Total Transactions"
          value={stats.transactionCount}
          icon="receipt-outline"
          format="number"
          subtitle="All time"
          color="#8b5cf6"
        />
      </View>

      {chartData.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Top 5 Expense Categories</Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={chartData}
              width={screenWidth - 48}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        </View>
      )}

      <View style={styles.categorySection}>
        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        {stats.topCategories?.slice(0, 6).map((category, index) => (
          <View key={category.category} style={styles.categoryItem}>
            <View style={styles.categoryLeft}>
              <View 
                style={[
                  styles.categoryDot, 
                  { backgroundColor: getCategoryColor(category.category) }
                ]} 
              />
              <View>
                <Text style={styles.categoryName}>{category.category}</Text>
                <Text style={styles.categoryCount}>
                  {category.count} transactions
                </Text>
              </View>
            </View>
            <View style={styles.categoryRight}>
              <Text style={styles.categoryAmount}>
                {formatCurrency(Math.abs(category.amount))}
              </Text>
              <Text style={styles.categoryPercentage}>
                {category.percentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions' as never)}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>
        {stats.recentTransactions?.slice(0, 5).map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View 
              style={[
                styles.transactionDot, 
                { backgroundColor: getCategoryColor(transaction.category) }
              ]} 
            />
            <View style={styles.transactionContent}>
              <Text style={styles.transactionDescription} numberOfLines={1}>
                {transaction.description}
              </Text>
              <View style={styles.transactionMeta}>
                <Text style={styles.transactionDate}>
                  {formatDate(transaction.date)}
                </Text>
                {transaction.bankName && (
                  <>
                    <Text style={styles.metaSeparator}>•</Text>
                    <Text style={styles.transactionBank}>{transaction.bankName}</Text>
                  </>
                )}
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{transaction.category}</Text>
                </View>
              </View>
            </View>
            <View style={styles.transactionAmounts}>
              <Text 
                style={[
                  styles.transactionAmount,
                  { color: transaction.amount >= 0 ? '#22c55e' : '#ef4444' }
                ]}
              >
                {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
              </Text>
              <Text style={styles.transactionBalance}>
                Balance: {formatCurrency(transaction.balance)}
              </Text>
            </View>
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
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  lastUpdate: {
    fontSize: 14,
    color: '#6b7280',
  },
  uploadButton: {
    backgroundColor: '#0ea5e9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningBanner: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
  },
  statsGrid: {
    paddingHorizontal: 24,
  },
  chartSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categorySection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  categoryCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#6b7280',
  },
  recentSection: {
    paddingHorizontal: 24,
    marginTop: 24,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transactionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  metaSeparator: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 4,
  },
  transactionBank: {
    fontSize: 12,
    color: '#6b7280',
  },
  categoryBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '500',
  },
  transactionAmounts: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionBalance: {
    fontSize: 12,
    color: '#6b7280',
  },
});