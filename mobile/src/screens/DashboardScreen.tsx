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
  Dimensions,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
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
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [tempDateRange, setTempDateRange] = useState({ start: '', end: '' });
  const [activeDatePicker, setActiveDatePicker] = useState<'start' | 'end' | null>(null);
  const [showPerBank, setShowPerBank] = useState(false);
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

  const openDateRangePicker = () => {
    setTempDateRange(dateRange);
    setShowDateRangePicker(true);
  };

  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setActiveDatePicker(null);
    }
    
    if (selectedDate && activeDatePicker) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setTempDateRange(prev => ({
        ...prev,
        [activeDatePicker]: dateString
      }));
      
      if (Platform.OS === 'android') {
        // On Android, close the picker after selection
        setActiveDatePicker(null);
      }
    }
  };

  const openDatePicker = (type: 'start' | 'end') => {
    setActiveDatePicker(type);
  };

  const applyDateRange = () => {
    // Validate date range
    if (tempDateRange.start && tempDateRange.end) {
      const startDate = new Date(tempDateRange.start);
      const endDate = new Date(tempDateRange.end);
      
      if (startDate > endDate) {
        Alert.alert('Invalid Date Range', 'End date cannot be before start date');
        return;
      }
    }
    
    setDateRange(tempDateRange);
    setShowDateRangePicker(false);
    setActiveDatePicker(null);
  };

  const cancelDateRange = () => {
    setTempDateRange(dateRange);
    setShowDateRangePicker(false);
    setActiveDatePicker(null);
  };

  const clearDateRange = () => {
    setTempDateRange({ start: '', end: '' });
  };

  const clearFilters = () => {
    setSelectedBanks(stats?.bankSources || []);
    setDateRange({ start: '', end: '' });
    setTempDateRange({ start: '', end: '' });
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
    return stats;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!stats || stats.transactionCount === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyHeader}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoEmoji}>✂️</Text>
            </View>
          </View>
          <Text style={styles.brandName}>CutTheSpend</Text>
          <Text style={styles.tagline}>See it. Cut it. Save more.</Text>
          <Text style={styles.welcomeTitle}>Welcome to your financial freedom!</Text>
          <Text style={styles.welcomeSubtitle}>Get started by uploading your first bank statement</Text>
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
    legendFontColor: '#6B7280',
    legendFontSize: 12,
  })) || [];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Funky Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoEmoji}>✂️</Text>
              </View>
            </View>
            <View>
              <Text style={styles.brandName}>CutTheSpend</Text>
              <Text style={styles.tagline}>See it. Cut it. Save more.</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings' as never)}
          >
            <Ionicons name="settings" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerTitle}>💰 Financial Overview</Text>
        {stats.lastUpdateTime && (
          <Text style={styles.lastUpdate}>
            Last updated: {formatDate(stats.lastUpdateTime)}
          </Text>
        )}
        
        {/* Funky Filters */}
        <View style={styles.filtersContainer}>
          {stats.isMultiBank && (
            <TouchableOpacity 
              style={[styles.filterButton, styles.bankFilterButton]}
              onPress={() => setShowBankSelector(true)}
            >
              <Ionicons name="business" size={16} color="#FFFFFF" />
              <Text style={styles.filterButtonText}>
                {selectedBanks.length === stats.bankSources.length 
                  ? 'All Banks' 
                  : selectedBanks.length === 1 
                  ? selectedBanks[0] 
                  : `${selectedBanks.length} Banks`
                }
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.filterButton, styles.dateFilterButton]}
            onPress={openDateRangePicker}
          >
            <Ionicons name="calendar" size={16} color="#1F2937" />
            <Text style={[styles.filterButtonText, { color: '#1F2937' }]}>
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
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Funky Upload Button */}
      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={() => navigation.navigate('Upload' as never)}
        activeOpacity={0.8}
      >
        <View style={styles.uploadButtonContent}>
          <Ionicons name="cloud-upload" size={24} color="#1F2937" />
          <Text style={styles.uploadButtonText}>Upload Statement</Text>
          <View style={styles.uploadButtonBadge}>
            <Text style={styles.uploadButtonBadgeText}>+</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Balance Warning */}
      {filteredStats?.hasBalanceDiscrepancy && selectedBanks.length > 1 && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={20} color="#F59E0B" />
          <Text style={styles.warningText}>
            Multiple bank accounts detected. Balances may not add up correctly.
          </Text>
        </View>
      )}

      {/* Funky Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Current Balance"
          value={filteredStats?.totalBalance || 0}
          icon="wallet"
          subtitle={selectedBanks.length > 1 ? "Across selected accounts" : undefined}
          color="#00B77D"
        />
        <StatCard
          title="Monthly Income"
          value={filteredStats?.monthlyIncome || 0}
          icon="trending-up"
          subtitle="Credits this month"
          color="#22C55E"
        />
        <StatCard
          title="Monthly Expenses"
          value={Math.abs(filteredStats?.monthlyExpenses || 0)}
          icon="trending-down"
          subtitle="Debits this month"
          color="#EF4444"
        />
        <StatCard
          title="Total Transactions"
          value={filteredStats?.transactionCount || 0}
          icon="receipt"
          format="number"
          subtitle="Selected period"
          color="#8B5CF6"
        />
      </View>

      {/* Per-Bank Toggle */}
      {stats.isMultiBank && (
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowPerBank(!showPerBank)}
          >
            <Ionicons 
              name={showPerBank ? "eye-off" : "eye"} 
              size={16} 
              color="#00B77D" 
            />
            <Text style={styles.toggleText}>
              {showPerBank ? 'Hide' : 'Show'} per-bank breakdown
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Funky Chart Section */}
      {chartData.length > 0 && (
        <View style={styles.chartSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 Top 5 Expense Categories</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions' as never)}>
              <Text style={styles.viewAllText}>View all →</Text>
            </TouchableOpacity>
          </View>
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
              hasLegend={false}
            />
          </View>
        </View>
      )}

      {/* Funky Category Breakdown */}
      <View style={styles.categorySection}>
        <Text style={styles.sectionTitle}>📊 Category Breakdown</Text>
        <View style={styles.categoryContainer}>
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
      </View>

      {/* Funky Recent Transactions */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⚡ Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions' as never)}>
            <Text style={styles.viewAllText}>View all →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.transactionsContainer}>
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
                    { color: transaction.amount >= 0 ? '#22C55E' : '#EF4444' }
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
              <Text style={styles.modalTitle}>🏦 Select Banks</Text>
              <TouchableOpacity onPress={() => setShowBankSelector(false)}>
                <Ionicons name="close-circle" size={28} color="#EF4444" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.bankList}>
              {stats?.bankSources.map((bank) => (
                <TouchableOpacity
                  key={bank}
                  style={[
                    styles.bankOption,
                    selectedBanks.includes(bank) && styles.bankOptionSelected
                  ]}
                  onPress={() => toggleBank(bank)}
                  activeOpacity={0.7}
                >
                  <View style={styles.bankOptionLeft}>
                    <View style={[
                      styles.bankCheckbox,
                      { backgroundColor: selectedBanks.includes(bank) ? '#00B77D' : '#F3F4F6' }
                    ]}>
                      {selectedBanks.includes(bank) && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={styles.bankOptionText}>{bank}</Text>
                  </View>
                  <Text style={styles.bankOptionCount}>
                    {stats.transactionCountByBank?.[bank] || 0} transactions
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.modalApplyButton}
              onPress={() => setShowBankSelector(false)}
            >
              <Text style={styles.modalApplyButtonText}>Apply Selection ✨</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      {showDateRangePicker && (
        <Modal
          transparent={true}
          visible={showDateRangePicker}
          animationType="fade"
          onRequestClose={cancelDateRange}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.dateRangeModal}>
              <View style={styles.dateRangeHeader}>
                <Text style={styles.dateRangeTitle}>📅 Select Date Range</Text>
                <TouchableOpacity onPress={cancelDateRange}>
                  <Ionicons name="close-circle" size={28} color="#EF4444" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.dateRangeContent}>
                {/* Start Date Section */}
                <View style={styles.dateSection}>
                  <Text style={styles.dateSectionTitle}>From Date</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => openDatePicker('start')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dateButtonContent}>
                      <Ionicons name="calendar-outline" size={20} color="#00B77D" />
                      <Text style={styles.dateButtonText}>
                        {tempDateRange.start ? formatDateForDisplay(tempDateRange.start) : 'Select start date'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* End Date Section */}
                <View style={styles.dateSection}>
                  <Text style={styles.dateSectionTitle}>To Date</Text>
                  <TouchableOpacity
                    style={[
                      styles.dateButton,
                      !tempDateRange.start && styles.dateButtonDisabled
                    ]}
                    onPress={() => openDatePicker('end')}
                    disabled={!tempDateRange.start}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dateButtonContent}>
                      <Ionicons 
                        name="calendar-outline" 
                        size={20} 
                        color={!tempDateRange.start ? "#9CA3AF" : "#0077B6"} 
                      />
                      <Text style={[
                        styles.dateButtonText,
                        !tempDateRange.start && styles.dateButtonTextDisabled
                      ]}>
                        {tempDateRange.end ? formatDateForDisplay(tempDateRange.end) : 'Select end date'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {!tempDateRange.start && (
                    <Text style={styles.dateHint}>Please select start date first</Text>
                  )}
                </View>
        </Modal>
      )}
    </ScrollView>
  );
};

                {/* Quick Date Range Options */}
                <View style={styles.quickRangeSection}>
                  <Text style={styles.quickRangeTitle}>Quick Select</Text>
                  <View style={styles.quickRangeButtons}>
                    <TouchableOpacity
                      style={styles.quickRangeButton}
                      onPress={() => {
                        const today = new Date();
                        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                        setTempDateRange({
                          start: lastMonth.toISOString().split('T')[0],
                          end: lastMonthEnd.toISOString().split('T')[0]
                        });
                      }}
                    >
                      <Text style={styles.quickRangeButtonText}>Last Month</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.quickRangeButton}
                      onPress={() => {
                        const today = new Date();
                        const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                        setTempDateRange({
                          start: last30Days.toISOString().split('T')[0],
                          end: today.toISOString().split('T')[0]
                        });
                      }}
                    >
                      <Text style={styles.quickRangeButtonText}>Last 30 Days</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.quickRangeButton}
                      onPress={() => {
                        const today = new Date();
                        const last90Days = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
                        setTempDateRange({
                          start: last90Days.toISOString().split('T')[0],
                          end: today.toISOString().split('T')[0]
                        });
              {/* Action Buttons */}
              <View style={styles.dateRangeActions}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearDateRange}
                >
                  <Ionicons name="refresh-outline" size={16} color="#6B7280" />
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
                <View style={styles.actionButtonsRight}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelDateRange}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={applyDateRange}
                  >
                    <Text style={styles.applyButtonText}>Apply ✨</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
                      }}
                    >
                      <Text style={styles.quickRangeButtonText}>Last 90 Days</Text>
      {/* Native Date Picker (iOS/Android) */}
      {activeDatePicker && (
        <DateTimePicker
          value={
            activeDatePicker === 'start' 
              ? (tempDateRange.start ? new Date(tempDateRange.start) : new Date())
              : (tempDateRange.end ? new Date(tempDateRange.end) : new Date())
          }
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDatePickerChange}
          maximumDate={
            activeDatePicker === 'end' && tempDateRange.start 
              ? new Date() 
              : new Date()
          }
          minimumDate={
            activeDatePicker === 'end' && tempDateRange.start 
              ? new Date(tempDateRange.start) 
              : undefined
          }
        />
      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  emptyHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logoIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#00B77D',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#00B77D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  brandName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00B77D',
    marginBottom: 4,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    backgroundColor: '#00B77D',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    shadowColor: '#00B77D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: 12,
  },
  logoEmoji: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
  },
  settingsButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  lastUpdate: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 20,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  bankFilterButton: {
    backgroundColor: '#0077B6',
  },
  dateFilterButton: {
    backgroundColor: '#FFD60A',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  clearFiltersButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 16,
  },
  uploadButtonContent: {
    backgroundColor: '#FFD60A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    position: 'relative',
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  uploadButtonText: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  uploadButtonBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    backgroundColor: '#00B77D',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  statsGrid: {
    paddingHorizontal: 24,
    gap: 16,
  },
  toggleContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: {
    fontSize: 14,
    color: '#00B77D',
    fontWeight: '600',
  },
  chartSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#00B77D',
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  categorySection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#6B7280',
  },
  recentSection: {
    paddingHorizontal: 24,
    marginTop: 24,
    paddingBottom: 24,
  },
  transactionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  metaSeparator: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 4,
  },
  transactionBank: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '600',
  },
  transactionAmounts: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionBalance: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  bankOptionSelected: {
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#00B77D',
  },
  bankOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bankCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bankOptionText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  bankOptionCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalApplyButton: {
    backgroundColor: '#00B77D',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#00B77D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalApplyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dateRangeModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '80%',
  },
  dateRangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dateRangeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  dateRangeContent: {
    padding: 24,
  },
  dateSection: {
    marginBottom: 24,
  },
  dateSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  dateButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
  },
  dateButtonDisabled: {
    opacity: 0.5,
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  dateButtonTextDisabled: {
    color: '#9CA3AF',
  },
  dateHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  quickRangeSection: {
    marginTop: 8,
  },
  quickRangeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  quickRangeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickRangeButton: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#0077B6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickRangeButtonText: {
    fontSize: 14,
    color: '#0077B6',
    fontWeight: '600',
  },
  dateRangeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  actionButtonsRight: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#00B77D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontSize: 16,
    fontWeight: 'bold',
  },
});