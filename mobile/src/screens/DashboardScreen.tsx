import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showBankSelector, setShowBankSelector] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedBanks.length > 0) {
        params.append('banks', selectedBanks.join(','));
      }
      if (dateRange.start) {
        params.append('startDate', dateRange.start);
      }
      if (dateRange.end) {
        params.append('endDate', dateRange.end);
      }
      
      const data = await apiCall<DashboardStats>('GET', `/dashboard/summary?${params.toString()}`);
      setStats(data);
      
      // Initialize selected banks if not set
      if (selectedBanks.length === 0 && data.bankSources.length > 0) {
        setSelectedBanks(data.bankSources);
      }
    } catch (error: any) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stats) {
      fetchDashboardData();
    }
  }, [selectedBanks, dateRange]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const toggleBank = (bank: string) => {
    setSelectedBanks(prev => 
      prev.includes(bank) 
        ? prev.filter(b => b !== bank)
        : [...prev, bank]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date, type?: 'start' | 'end') => {
    setShowDatePicker(null);
    if (selectedDate && type) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setDateRange(prev => ({
        ...prev,
        [type]: dateString
      }));
    }
  };

  const clearFilters = () => {
    setSelectedBanks(stats?.bankSources || []);
    setDateRange({ start: '', end: '' });
  };

  const formatDateForDisplay = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getFilteredStats = () => {
    // In a real app, this would be calculated based on filtered data
    return stats;
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

  const filteredStats = getFilteredStats();
  const chartData = filteredStats?.topCategories?.slice(0, 5).map((cat, index) => ({
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
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>💰 Financial Overview</Text>
            {stats.lastUpdateTime && (
              <Text style={styles.lastUpdate}>
                Last updated: {formatDate(stats.lastUpdateTime)}
              </Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings' as never)}
          >
            <Ionicons name="settings-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
        
        {/* Filters */}
        {stats.isMultiBank && (
          <View style={styles.filtersContainer}>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowBankSelector(true)}
            >
              <Ionicons name="business-outline" size={16} color="#6b7280" />
              <Text style={styles.filterButtonText}>
                {selectedBanks.length === stats.bankSources.length 
                  ? 'All Banks' 
                  : selectedBanks.length === 1 
                  ? selectedBanks[0] 
                  : `${selectedBanks.length} Banks`
                }
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowDatePicker('start')}
            >
              <Ionicons name="calendar-outline" size={16} color="#6b7280" />
              <Text style={styles.filterButtonText}>
                {dateRange.start && dateRange.end 
                  ? `${formatDateForDisplay(dateRange.start)} - ${formatDateForDisplay(dateRange.end)}`
                  : 'Date Range'
                }
              </Text>
            </TouchableOpacity>
            
            {(selectedBanks.length < stats.bankSources.length || dateRange.start || dateRange.end) && (
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Ionicons name="close" size={16} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={() => navigation.navigate('Upload' as never)}
      >
        <Ionicons name="cloud-upload-outline" size={20} color="#ffffff" />
        <Text style={styles.uploadButtonText}>Upload Statement</Text>
      </TouchableOpacity>

      {filteredStats?.hasBalanceDiscrepancy && selectedBanks.length > 1 && (
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
          value={filteredStats?.totalBalance || 0}
          icon="wallet-outline"
          subtitle={selectedBanks.length > 1 ? "Across selected accounts" : undefined}
        />
        <StatCard
          title="Monthly Income"
          value={filteredStats?.monthlyIncome || 0}
          icon="trending-up-outline"
          subtitle="Credits this month"
          color="#22c55e"
        />
        <StatCard
          title="Monthly Expenses"
          value={Math.abs(filteredStats?.monthlyExpenses || 0)}
          icon="trending-down-outline"
          subtitle="Debits this month"
          color="#ef4444"
        />
        <StatCard
          title="Total Transactions"
          value={filteredStats?.transactionCount || 0}
          icon="receipt-outline"
          format="number"
          subtitle="Selected period"
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
        {filteredStats?.topCategories?.slice(0, 6).map((category, index) => (
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
        {filteredStats?.recentTransactions?.slice(0, 5).map((transaction) => (
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

      {/* Bank Selector Modal */}
      <Modal
        visible={showBankSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBankSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Banks</Text>
              <TouchableOpacity onPress={() => setShowBankSelector(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            {stats?.bankSources.map((bank) => (
              <TouchableOpacity
                key={bank}
                style={styles.bankOption}
                onPress={() => toggleBank(bank)}
              >
                <View style={styles.bankOptionLeft}>
                  <Ionicons 
                    name={selectedBanks.includes(bank) ? "checkbox" : "square-outline"} 
                    size={20} 
                    color={selectedBanks.includes(bank) ? "#0ea5e9" : "#6b7280"} 
                  />
                  <Text style={styles.bankOptionText}>{bank}</Text>
                </View>
                <Text style={styles.bankOptionCount}>
                  {stats.transactionCountByBank?.[bank] || 0} transactions
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalApplyButton}
              onPress={() => setShowBankSelector(false)}
            >
              <Text style={styles.modalApplyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={dateRange[showDatePicker] ? new Date(dateRange[showDatePicker]) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => handleDateChange(event, selectedDate, showDatePicker)}
        />
      )}
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  settingsButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#00B77D',
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
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  clearFiltersButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  bankOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  bankOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  bankOptionText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  bankOptionCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalApplyButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  modalApplyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});