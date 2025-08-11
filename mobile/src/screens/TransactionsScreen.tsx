import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Transaction, PaginatedResponse } from '../types';
import { apiCall } from '../utils/api';
import { formatCurrency, formatDate, getCategoryColor } from '../utils/formatters';
import DateTimePicker from '@react-native-community/datetimepicker';

export const TransactionsScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    banks: [] as string[],
    categories: [] as string[],
    dateRange: { start: '', end: '' },
    amountRange: { min: '', max: '' },
    transactionType: 'all' as 'all' | 'credit' | 'debit',
  });
  const [availableBanks, setAvailableBanks] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    fetchTransactions(true);
  }, [searchQuery, sortOrder, filters]);

  const fetchTransactions = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(0);
      }

      const currentPage = reset ? 0 : page;
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('size', '50');
      params.append('sortBy', 'date');
      params.append('sortOrder', sortOrder);
      
      if (filters.banks.length > 0) params.append('banks', filters.banks.join(','));
      if (filters.categories.length > 0) params.append('categories', filters.categories.join(','));
      if (filters.dateRange.start) params.append('startDate', filters.dateRange.start);
      if (filters.dateRange.end) params.append('endDate', filters.dateRange.end);
      if (filters.amountRange.min) params.append('amountMin', filters.amountRange.min);
      if (filters.amountRange.max) params.append('amountMax', filters.amountRange.max);
      if (filters.transactionType !== 'all') params.append('transactionType', filters.transactionType);
      
      if (searchQuery) {
        params.append('description', searchQuery);
      }

      const response = await apiCall<PaginatedResponse<Transaction>>(
        'GET', 
        `/transactions?${params.toString()}`
      );

      if (reset) {
        setTransactions(response.content);
      } else {
        setTransactions(prev => [...prev, ...response.content]);
      }

      setHasMore(response.content.length === 50);
      setPage(currentPage + 1);
      
      // Extract available banks and categories for filters
      if (reset) {
        const banks = [...new Set(response.content.map(t => t.bankName).filter(Boolean))];
        const categories = [...new Set(response.content.map(t => t.category).filter(Boolean))];
        setAvailableBanks(banks);
        setAvailableCategories(categories);
      }
    } catch (error: any) {
      console.error('Transactions error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchTransactions(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      banks: [],
      categories: [],
      dateRange: { start: '', end: '' },
      amountRange: { min: '', max: '' },
      transactionType: 'all',
    });
    setSearchQuery('');
  };

  const toggleBankFilter = (bank: string) => {
    setFilters(prev => ({
      ...prev,
      banks: prev.banks.includes(bank) 
        ? prev.banks.filter(b => b !== bank)
        : [...prev.banks, bank]
    }));
  };

  const toggleCategoryFilter = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category) 
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date, type?: 'start' | 'end') => {
    setShowDatePicker(null);
    if (selectedDate && type) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFilters(prev => ({
        ...prev,
        dateRange: {
          ...prev.dateRange,
          [type]: dateString
        }
      }));
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.banks.length > 0) count++;
    if (filters.categories.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.amountRange.min || filters.amountRange.max) count++;
    if (filters.transactionType !== 'all') count++;
    if (searchQuery) count++;
    return count;
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View 
        style={[
          styles.categoryDot, 
          { backgroundColor: getCategoryColor(item.category) }
        ]} 
      />
      <View style={styles.transactionContent}>
        <Text style={styles.transactionDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.transactionMeta}>
          <Text style={styles.transactionDate}>
            {formatDate(item.date)}
          </Text>
          {item.bankName && (
            <>
              <Text style={styles.metaSeparator}>•</Text>
              <Text style={styles.transactionBank}>{item.bankName}</Text>
            </>
          )}
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{item.category}</Text>
        </View>
      </View>
      <View style={styles.transactionAmounts}>
        <Text 
          style={[
            styles.transactionAmount,
            { color: item.amount >= 0 ? '#22c55e' : '#ef4444' }
          ]}
        >
          {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
        </Text>
        <Text style={styles.transactionBalance}>
          {formatCurrency(item.balance)}
        </Text>
      </View>
    </View>
  );

  if (loading && transactions.length === 0) {
    return <LoadingSpinner />;
  }

  if (transactions.length === 0 && !loading) {
    return (
      <EmptyState
        icon="receipt-outline"
        title="No transactions found"
        description="Upload your bank statements to see your transactions here"
        action={{
          label: 'Upload Statement',
          onPress: () => {/* Navigate to upload */},
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>All Transactions</Text>
        <Text style={styles.headerSubtitle}>
          {transactions.length} transactions
          {getActiveFiltersCount() > 0 && (
            <Text style={styles.filtersApplied}> • {getActiveFiltersCount()} filter{getActiveFiltersCount() > 1 ? 's' : ''} applied</Text>
          )}
        </Text>
          <TouchableOpacity
            style={styles.filtersButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="filter-outline" size={20} color="#6b7280" />
            {getActiveFiltersCount() > 0 && (
              <View style={styles.filtersBadge}>
                <Text style={styles.filtersBadgeText}>{getActiveFiltersCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          <Ionicons 
            name={sortOrder === 'asc' ? "arrow-up-outline" : "arrow-down-outline"} 
            size={20} 
            color="#6b7280" 
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          loading && transactions.length > 0 ? (
            <View style={styles.loadingFooter}>
              <LoadingSpinner size="small" />
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContainer}
      />

      {/* Advanced Filters Modal */}
      <Modal
        visible={showFilters}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filtersModal}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>Advanced Filters</Text>
              <View style={styles.filtersHeaderActions}>
                <TouchableOpacity onPress={resetFilters} style={styles.resetButton}>
                  <Ionicons name="refresh-outline" size={16} color="#6b7280" />
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.filtersContent}>
              {/* Bank Accounts */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Bank Accounts</Text>
                {availableBanks.map((bank) => (
                  <TouchableOpacity
                    key={bank}
                    style={styles.filterOption}
                    onPress={() => toggleBankFilter(bank)}
                  >
                    <Ionicons 
                      name={filters.banks.includes(bank) ? "checkbox" : "square-outline"} 
                      size={20} 
                      color={filters.banks.includes(bank) ? "#0ea5e9" : "#6b7280"} 
                    />
                    <Text style={styles.filterOptionText}>{bank}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Categories */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Categories</Text>
                {availableCategories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={styles.filterOption}
                    onPress={() => toggleCategoryFilter(category)}
                  >
                    <Ionicons 
                      name={filters.categories.includes(category) ? "checkbox" : "square-outline"} 
                      size={20} 
                      color={filters.categories.includes(category) ? "#0ea5e9" : "#6b7280"} 
                    />
                    <Text style={styles.filterOptionText}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Date Range</Text>
                <View style={styles.dateRangeContainer}>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker('start')}
                  >
                    <Text style={styles.dateButtonText}>
                      {filters.dateRange.start || 'Start Date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker('end')}
                  >
                    <Text style={styles.dateButtonText}>
                      {filters.dateRange.end || 'End Date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Amount Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Amount Range</Text>
                <View style={styles.amountRangeContainer}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="Min Amount"
                    value={filters.amountRange.min}
                    onChangeText={(text) => setFilters(prev => ({
                      ...prev,
                      amountRange: { ...prev.amountRange, min: text }
                    }))}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.amountInput}
                    placeholder="Max Amount"
                    value={filters.amountRange.max}
                    onChangeText={(text) => setFilters(prev => ({
                      ...prev,
                      amountRange: { ...prev.amountRange, max: text }
                    }))}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Transaction Type */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Transaction Type</Text>
                {['all', 'credit', 'debit'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.filterOption}
                    onPress={() => setFilters(prev => ({ ...prev, transactionType: type as any }))}
                  >
                    <Ionicons 
                      name={filters.transactionType === type ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={filters.transactionType === type ? "#0ea5e9" : "#6b7280"} 
                    />
                    <Text style={styles.filterOptionText}>
                      {type === 'all' ? 'All Transactions' : type === 'credit' ? 'Credits Only' : 'Debits Only'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={filters.dateRange[showDatePicker] ? new Date(filters.dateRange[showDatePicker]) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => handleDateChange(event, selectedDate, showDatePicker)}
        />
      )}

      <View style={styles.comingSoonBanner}>
        <Ionicons name="construct-outline" size={20} color="#0ea5e9" />
        <Text style={styles.comingSoonText}>
          Transaction editing and bulk actions coming soon!
        </Text>
      </View>
    </View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  },
  filtersApplied: {
    color: '#0ea5e9',
    fontWeight: '500',
  },
  filtersButton: {
    position: 'relative',
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filtersBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  sortButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 24,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    marginTop: 6,
  },
  transactionContent: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 20,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionBalance: {
    fontSize: 12,
    color: '#6b7280',
  },
  loadingFooter: {
    paddingVertical: 20,
  },
  comingSoonBanner: {
    backgroundColor: '#dbeafe',
    borderTopWidth: 1,
    borderTopColor: '#93c5fd',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comingSoonText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filtersModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  filtersHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  filtersContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  amountRangeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  amountInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#374151',
  },
  applyFiltersButton: {
    backgroundColor: '#0ea5e9',
    marginHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyFiltersButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});