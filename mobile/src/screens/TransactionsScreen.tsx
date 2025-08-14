import React, { useState, useEffect, memo, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
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
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Transaction, PaginatedResponse } from '../types';
import { apiCall } from '../utils/api';
import { formatCurrency, formatDate, getCategoryColor } from '../utils/formatters';
import DateTimePicker from '@react-native-community/datetimepicker';

export const TransactionsScreen: React.FC = () => {

  const navigation = useNavigation<any>(); // Use correct type for navigation

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
  // Pending filter changes before apply
  const [pendingFilters, setPendingFilters] = useState({
    banks: [] as string[],
    categories: [] as string[],
    dateRange: { start: '', end: '' },
    amountRange: { min: '', max: '' },
    transactionType: 'all' as 'all' | 'credit' | 'debit',
  });
  const [availableBanks, setAvailableBanks] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const filtersJustApplied = useRef(false);

  // Sync pendingFilters with filters when opening modal
  useEffect(() => {
    if (showFilters) {
      setPendingFilters(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFilters]);

  useEffect(() => {
    if (filtersJustApplied.current) {
      fetchTransactions(true);
      filtersJustApplied.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    fetchTransactions(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, sortOrder]);

  const fetchTransactions = async (reset = false) => {
    setLoading(true);
    try {
      // Build query params from filters and search
      const params: any = {
        page: reset ? 0 : page,
        size: 50,
        sort: `date,${sortOrder}`,
        search: searchQuery,
      };
      if (filters.banks.length > 0) params.banks = filters.banks.join(',');
      if (filters.categories.length > 0) params.categories = filters.categories.join(',');
      if (filters.dateRange.start) params.startDate = filters.dateRange.start;
      if (filters.dateRange.end) params.endDate = filters.dateRange.end;
      if (filters.amountRange.min) params.minAmount = filters.amountRange.min;
      if (filters.amountRange.max) params.maxAmount = filters.amountRange.max;
      if (filters.transactionType !== 'all') params.type = filters.transactionType;

      // FIX: Properly serialize params to query string (all values as strings)
      const queryString = new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      ).toString();

      const response = await apiCall<PaginatedResponse<Transaction>>(
        'GET',
        `/transactions?${queryString}`
      );

      if (reset) {
        setTransactions(response.content);
        setPage(1);
      } else {
        setTransactions(prev => [...prev, ...response.content]);
        setPage(prev => prev + 1);
      }

      setHasMore(response.content.length === 50);

      // Extract available banks and categories for filters
      if (reset) {
        const banks = [...new Set(response.content.map(t => t.bankName).filter((b): b is string => !!b))];
        const categories = [...new Set(response.content.map(t => t.category).filter((c): c is string => !!c))];
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
    setPage(0);
    filtersJustApplied.current = true;
  };

  const toggleBankFilter = (bank: string) => {
    setPendingFilters(prev => ({
      ...prev,
      banks: prev.banks.includes(bank) 
        ? prev.banks.filter(b => b !== bank)
        : [...prev.banks, bank]
    }));
  };

  const toggleCategoryFilter = (category: string) => {
    setPendingFilters(prev => ({
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
      setPendingFilters(prev => ({
        ...prev,
        dateRange: {
          ...prev.dateRange,
          [type]: dateString
        }
      }));
    }
  };

  const openDateRangePicker = () => {
    setShowDatePicker('start'); // Start with start date picker
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

  const TransactionItem = memo(({ item }: { item: Transaction }) => (
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
  ));

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TransactionItem item={item} />
  );

  if (loading && transactions.length === 0) {
    return <LoadingSpinner />;
  }

  // Show empty state if no transactions after filter (or any API call), matching web
  if (transactions.length === 0 && !loading) {
    if (getActiveFiltersCount() > 0) {
      // Show actionable Reset Filters button below the message
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <EmptyState
            icon="receipt-outline"
            title="No results for your filters"
            description="Try adjusting your filters or upload more statements."
          />
          <TouchableOpacity
            style={styles.resetFiltersButton}
            onPress={resetFilters}
            activeOpacity={0.8}
          >
            <Text style={styles.resetFiltersButtonText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <EmptyState
          icon="receipt-outline"
          title="No transactions found"
          description="Upload your bank statements to see your transactions here"
          action={{
            label: 'Upload Statement',
            onPress: () => {
              if (navigation && typeof navigation.navigate === 'function') {
                // TODO: Confirm the route name for the upload screen if different
                navigation.navigate('Upload');
              } else {
                Alert.alert('Upload', 'Upload screen navigation not available.');
              }
            },
          }}
        />
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>All Transactions</Text>
            <View style={styles.transactionMetaRow}>
              <Text style={styles.transactionCount}>{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</Text>
              {getActiveFiltersCount() > 0 && (
                <TouchableOpacity onPress={() => setShowFilters(true)} activeOpacity={0.7}>
                  <Text style={styles.filtersAppliedLink}>{getActiveFiltersCount()} filter{getActiveFiltersCount() > 1 ? 's' : ''} applied</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
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

      {loading && transactions.length === 0 ? (
        <LoadingSpinner />
      ) : transactions.length === 0 && !loading ? (
        <EmptyState
          icon="receipt-outline"
          title="No transactions found"
          description="Upload your bank statements to see your transactions here"
          action={{
            label: 'Upload Statement',
            onPress: () => {/* Navigate to upload */},
          }}
        />
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item, index) => `${item.id}-${index}`}
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
      )}

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
                      name={pendingFilters.banks.includes(bank) ? "checkbox" : "square-outline"} 
                      size={20} 
                      color={pendingFilters.banks.includes(bank) ? "#0ea5e9" : "#6b7280"} 
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
                      name={pendingFilters.categories.includes(category) ? "checkbox" : "square-outline"} 
                      size={20} 
                      color={pendingFilters.categories.includes(category) ? "#0ea5e9" : "#6b7280"} 
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
                    onPress={openDateRangePicker}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dateButtonText}>
                      {pendingFilters.dateRange.start && pendingFilters.dateRange.end
                        ? `${pendingFilters.dateRange.start} - ${pendingFilters.dateRange.end}`
                        : 'Select Date Range'
                      }
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                
                {/* Enhanced Date Picker Modal */}
                {showDatePicker && (
                  <Modal
                    transparent={true}
                    visible={!!showDatePicker}
                    animationType="slide"
                    onRequestClose={() => setShowDatePicker(null)}
                  >
                    <View style={styles.datePickerModalOverlay}>
                      <View style={styles.datePickerModalContent}>
                        <View style={styles.datePickerModalHeader}>
                          <Text style={styles.datePickerModalTitle}>
                            📅 Select {showDatePicker === 'start' ? 'Start' : 'End'} Date
                          </Text>
                          <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                            <Ionicons name="close-circle" size={24} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={showDatePicker ? (pendingFilters.dateRange[showDatePicker] ? new Date(pendingFilters.dateRange[showDatePicker]) : new Date()) : new Date()}
                          mode="date"
                          display="default"
                          onChange={(event, selectedDate) => handleDateChange(event, selectedDate, showDatePicker ?? undefined)}
                          maximumDate={showDatePicker === 'end' && pendingFilters.dateRange.start ? new Date() : undefined}
                          minimumDate={showDatePicker === 'end' && pendingFilters.dateRange.start ? new Date(pendingFilters.dateRange.start) : undefined}
                        />
                        <View style={styles.datePickerActions}>
                          {showDatePicker === 'start' && (
                            <TouchableOpacity 
                              style={styles.nextDateButton}
                              onPress={() => {
                                if (pendingFilters.dateRange.start) {
                                  setShowDatePicker('end');
                                } else {
                                  Alert.alert('Please select start date first');
                                }
                              }}
                            >
                              <Text style={styles.nextDateButtonText}>Next: End Date →</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity 
                            style={styles.datePickerDone} 
                            onPress={() => setShowDatePicker(null)}
                          >
                            <Text style={styles.datePickerDoneText}>
                              {showDatePicker === 'end' ? 'Done ✨' : 'Skip End Date'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </Modal>
                )}
              </View>

              {/* Amount Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Amount Range</Text>
                <View style={styles.amountRangeContainer}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="Min Amount"
                    value={pendingFilters.amountRange.min}
                    onChangeText={(text) => setPendingFilters(prev => ({
                      ...prev,
                      amountRange: { ...prev.amountRange, min: text }
                    }))}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.amountInput}
                    placeholder="Max Amount"
                    value={pendingFilters.amountRange.max}
                    onChangeText={(text) => setPendingFilters(prev => ({
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
                    onPress={() => setPendingFilters(prev => ({ ...prev, transactionType: type as any }))}
                  >
                    <Ionicons 
                      name={pendingFilters.transactionType === type ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={pendingFilters.transactionType === type ? "#0ea5e9" : "#6b7280"} 
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
              onPress={() => {
                setFilters(pendingFilters);
                setShowFilters(false);
                filtersJustApplied.current = true;
              }}
            >
              <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.comingSoonBanner}>
        <Ionicons name="construct-outline" size={20} color="#0ea5e9" />
        <Text style={styles.comingSoonText}>
          Transaction editing and bulk actions coming soon!
        </Text>
      </View>
    </View>
  );
};


// ...existing code...

const styles = StyleSheet.create({
  transactionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
    gap: 12,
  },
  transactionCount: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '400',
  },
  filtersAppliedLink: {
    fontSize: 15,
    color: '#FFD60A',
    fontWeight: '500',
    textDecorationLine: 'underline',
    marginLeft: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  header: {
    backgroundColor: '#00B77D',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    shadowColor: '#00B77D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filtersBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFD60A',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  filtersBadgeText: {
    color: '#1F2937',
    fontSize: 10,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  sortButton: {
    backgroundColor: '#FFD60A',
    borderRadius: 16,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00B77D',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
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
    maxHeight: '98%',
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
    zIndex: 2,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    zIndex: 3,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  datePickerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  nextDateButton: {
    backgroundColor: '#0077B6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    flex: 1,
  },
  nextDateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  datePickerDone: {
    backgroundColor: '#00B77D',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    flex: 1,
  },
  datePickerDoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
  resetFiltersButton: {
    marginTop: 24,
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  resetFiltersButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});


// ...existing code...
