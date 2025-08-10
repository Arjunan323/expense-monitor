import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Transaction, PaginatedResponse } from '../types';
import { apiCall } from '../utils/api';
import { formatCurrency, formatDate, getCategoryColor } from '../utils/formatters';

export const TransactionsScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchTransactions(true);
  }, [searchQuery, sortOrder]);

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
        <Text style={styles.headerTitle}>All Transactions</Text>
        <Text style={styles.headerSubtitle}>
          {transactions.length} transactions
        </Text>
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

      <View style={styles.comingSoonBanner}>
        <Ionicons name="construct-outline" size={20} color="#0ea5e9" />
        <Text style={styles.comingSoonText}>
          Advanced filtering and transaction editing coming soon!
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
});