import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  RefreshControl,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { LineChart } from 'react-native-chart-kit';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { usePreferences } from '../../contexts/PreferencesContext';
import { apiCall, forecastApi } from '../../utils/api';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

interface ForecastData {
  month: string;
  actual?: number;
  predicted?: number;
  isActual: boolean;
}

interface UpcomingTransaction {
  id: number;
  description: string;
  amount: number;
  dueDate: string;
  category?: string;
  status: string;
  recurring: boolean;
  flowType?: 'INCOME' | 'EXPENSE';
}

interface ForecastSummary {
  averageNet: number;
  lastMonthNet: number;
  projectedNextMonth: number;
  projectedPeriodTotal: number;
  historyMonths: number;
  futureMonths: number;
}

export const CashFlowForecastScreen: React.FC = () => {
  const { preferences } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<UpcomingTransaction>>({});
  
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    date: '',
    type: 'expense' as 'income' | 'expense',
    recurring: false,
    category: ''
  });

  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [upcomingTransactions, setUpcomingTransactions] = useState<UpcomingTransaction[]>([]);
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      { data: [] as number[], color: (o = 1) => `rgba(0, 183, 125, ${o})`, strokeWidth: 3 },
      { data: [] as number[], color: (o = 1) => `rgba(0, 119, 182, ${o})`, strokeWidth: 3, strokeDashArray: [5, 5] }
    ]
  });
  
  const [summaryStats, setSummaryStats] = useState<ForecastSummary>({
    averageNet: 0,
    lastMonthNet: 0,
    projectedNextMonth: 0,
    projectedPeriodTotal: 0,
    historyMonths: 0,
    futureMonths: 0
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [forecast, upcoming] = await Promise.all([
        forecastApi.get(6),
        forecastApi.upcoming.list()
      ]);
      
      transformForecast(forecast);
      setUpcomingTransactions(upcoming);
      setSummaryStats(forecast.summary);
    } catch (e: any) {
      console.error('Failed to load forecast:', e);
      Toast.show({ type: 'error', text1: 'Failed to load forecast data' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const transformForecast = (forecast: any) => {
    const actuals: ForecastData[] = forecast.actuals.map((a: any) => ({
      month: prettyMonth(a.month),
      actual: a.projectedNet,
      predicted: a.projectedNet,
      isActual: true
    }));
    
    const projections: ForecastData[] = forecast.projections.map((p: any) => ({
      month: prettyMonth(p.month),
      predicted: p.projectedNet,
      isActual: false
    }));
    
    const combined = [...actuals, ...projections];
    setForecastData(combined);
    
    // Prepare chart data
    const labels = combined.map(item => item.month);
    const actualData = combined.map(item => item.actual || 0);
    const predictedData = combined.map(item => item.predicted || 0);
    
    setChartData({
      labels,
      datasets: [
        { data: actualData, color: (o = 1) => `rgba(0, 183, 125, ${o})`, strokeWidth: 3 },
        { data: predictedData, color: (o = 1) => `rgba(0, 119, 182, ${o})`, strokeWidth: 3 }
      ]
    });
  };

  const prettyMonth = (ym: string) => {
    const [year, month] = ym.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const addTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount || !newTransaction.date) {
      Toast.show({ type: 'error', text1: 'Please fill in all required fields' });
      return;
    }

    try {
      const amount = newTransaction.type === 'expense' 
        ? -Math.abs(parseFloat(newTransaction.amount)) 
        : Math.abs(parseFloat(newTransaction.amount));
      
      const flowType = amount >= 0 ? 'INCOME' : 'EXPENSE';
      
      const created = await forecastApi.upcoming.create({
        description: newTransaction.description,
        amount,
        dueDate: newTransaction.date,
        category: newTransaction.category || newTransaction.type,
        status: 'PENDING',
        recurring: newTransaction.recurring,
        flowType
      });
      
      setUpcomingTransactions(prev => [...prev, created]);
      setNewTransaction({ 
        description: '', 
        amount: '', 
        date: '', 
        type: 'expense', 
        recurring: false, 
        category: '' 
      });
      setShowAddForm(false);
      Toast.show({ type: 'success', text1: 'Upcoming transaction added' });
      
      // Refresh forecast data
      loadData();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed to add transaction' });
    }
  };

  const startEdit = (t: UpcomingTransaction) => {
    setEditingId(t.id);
    setEditDraft({ ...t });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({});
  };

  const saveEdit = async () => {
    if (editingId == null) return;
    try {
      const updated = await forecastApi.upcoming.update(editingId, editDraft);
      setUpcomingTransactions(list => list.map(l => l.id === editingId ? updated : l));
      setEditingId(null);
      setEditDraft({});
      Toast.show({ type: 'success', text1: 'Transaction updated' });
      loadData();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Update failed' });
    }
  };

  const removeTransaction = async (id: number) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this upcoming transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await forecastApi.upcoming.delete(id);
              setUpcomingTransactions(list => list.filter(l => l.id !== id));
              Toast.show({ type: 'success', text1: 'Transaction deleted' });
              loadData();
            } catch (e: any) {
              Toast.show({ type: 'error', text1: 'Delete failed' });
            }
          }
        }
      ]
    );
  };

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔮 Cash Flow Forecast</Text>
        <Text style={styles.headerSubtitle}>Predict your future financial position and plan ahead</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: '#E0F2FE' }]}>
          <View style={[styles.summaryIcon, { backgroundColor: '#0077B6' }]}>
            {/* 'target' not in Ionicons set; using 'locate' as closest visual metaphor */}
            <Ionicons name="locate" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryLabel}>Predicted Balance</Text>
          <Text style={[styles.summaryValue, { color: '#0077B6' }]}>
            {formatCurrency(summaryStats.projectedNextMonth, preferences)}
          </Text>
          <Text style={styles.summarySubtext}>End of next month</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: summaryStats.projectedNextMonth < 0 ? '#FEE2E2' : '#ECFDF5' }]}>
          <View style={[styles.summaryIcon, { backgroundColor: summaryStats.projectedNextMonth < 0 ? '#EF4444' : '#00B77D' }]}>
            <Ionicons name={summaryStats.projectedNextMonth < 0 ? "alert-circle" : "trending-up"} size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryLabel}>
            {summaryStats.projectedNextMonth < 0 ? 'Potential Shortfall' : 'Expected Surplus'}
          </Text>
          <Text style={[styles.summaryValue, { color: summaryStats.projectedNextMonth < 0 ? '#EF4444' : '#00B77D' }]}>
            {formatCurrency(Math.abs(summaryStats.projectedNextMonth), preferences)}
          </Text>
          <Text style={styles.summarySubtext}>
            {summaryStats.projectedNextMonth < 0 ? 'If trends continue' : 'Available for savings'}
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#F3E8FF' }]}>
          <View style={[styles.summaryIcon, { backgroundColor: '#8B5CF6' }]}>
            <Ionicons name="analytics" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryLabel}>Average Net</Text>
          <Text style={[styles.summaryValue, { color: '#8B5CF6' }]}>
            {formatCurrency(summaryStats.averageNet, preferences)}
          </Text>
          <Text style={styles.summarySubtext}>Historical average</Text>
        </View>
      </View>

      {/* Forecast Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Cash Flow Projection</Text>
          <Text style={styles.chartSubtitle}>Predicted balance over the next 6 months</Text>
        </View>
        
        <LineChart
          data={chartData}
          width={width - 48}
          height={250}
          chartConfig={{
            backgroundColor: '#FFFFFF',
            backgroundGradientFrom: '#FFFFFF',
            backgroundGradientTo: '#FFFFFF',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 183, 125, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#00B77D'
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: '#F3F4F6'
            }
          }}
          bezier
          style={styles.chart}
          formatYLabel={(value) => {
            const num = parseInt(value);
            return num >= 0 ? `+${(num/1000).toFixed(0)}K` : `${(num/1000).toFixed(0)}K`;
          }}
        />
        
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#00B77D' }]} />
            <Text style={styles.legendText}>Actual</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#0077B6' }]} />
            <Text style={styles.legendText}>Predicted</Text>
          </View>
        </View>
      </View>

      {/* Upcoming Transactions */}
      <View style={styles.transactionsSection}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Upcoming Transactions</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsList}>
          {upcomingTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No upcoming transactions</Text>
              <Text style={styles.emptyText}>
                Add your expected income and expenses to improve forecast accuracy
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowAddForm(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyButtonText}>Add Your First Transaction</Text>
              </TouchableOpacity>
            </View>
          ) : (
            upcomingTransactions.map(transaction => {
              const isIncome = transaction.amount >= 0;
              const isEditing = editingId === transaction.id;
              
              return (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionHeader}>
                    <View style={styles.transactionInfo}>
                      <View style={[styles.transactionIcon, { 
                        backgroundColor: isIncome ? '#ECFDF5' : '#FEE2E2' 
                      }]}>
                        <Ionicons 
                          name={isIncome ? "trending-up" : "trending-down"} 
                          size={20} 
                          color={isIncome ? '#00B77D' : '#EF4444'} 
                        />
                      </View>
                      <View style={styles.transactionDetails}>
                        {isEditing ? (
                          <TextInput
                            style={styles.editInput}
                            value={editDraft.description || ''}
                            onChangeText={(text) => setEditDraft(prev => ({ ...prev, description: text }))}
                            placeholder="Transaction description"
                          />
                        ) : (
                          <Text style={styles.transactionTitle}>{transaction.description}</Text>
                        )}
                        
                        <View style={styles.transactionMeta}>
                          <Ionicons name="calendar" size={12} color="#6B7280" />
                          {isEditing ? (
                            <TextInput
                              style={styles.editDateInput}
                              value={editDraft.dueDate?.slice(0, 10) || transaction.dueDate?.slice(0, 10)}
                              onChangeText={(text) => setEditDraft(prev => ({ ...prev, dueDate: text }))}
                              placeholder="YYYY-MM-DD"
                            />
                          ) : (
                            <Text style={styles.transactionDate}>
                              {formatDate(transaction.dueDate)}
                            </Text>
                          )}
                          
                          {transaction.recurring && (
                            <View style={styles.recurringBadge}>
                              <Ionicons name="refresh" size={10} color="#00B77D" />
                              <Text style={styles.recurringText}>Recurring</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.transactionActions}>
                      {isEditing ? (
                        <View style={styles.editActions}>
                          <TextInput
                            style={styles.editAmountInput}
                            value={editDraft.amount?.toString() || transaction.amount.toString()}
                            onChangeText={(text) => setEditDraft(prev => ({ ...prev, amount: parseFloat(text) }))}
                            keyboardType="numeric"
                            placeholder="Amount"
                          />
                          <TouchableOpacity
                            style={styles.saveButton}
                            onPress={saveEdit}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={cancelEdit}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="close" size={16} color="#6B7280" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.transactionAmount}>
                          <Text style={[styles.amountText, { 
                            color: isIncome ? '#00B77D' : '#EF4444' 
                          }]}>
                            {isIncome ? '+' : ''}{formatCurrency(Math.abs(transaction.amount), preferences)}
                          </Text>
                          <View style={styles.actionButtons}>
                            <TouchableOpacity
                              style={styles.editButton}
                              onPress={() => startEdit(transaction)}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="create-outline" size={16} color="#0077B6" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => removeTransaction(transaction.id)}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* Add Transaction Modal */}
      <Modal
        visible={showAddForm}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addModal}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>Add Upcoming Transaction</Text>
              <TouchableOpacity onPress={() => setShowAddForm(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.addModalContent}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={styles.formInput}
                  value={newTransaction.description}
                  onChangeText={(text) => setNewTransaction(prev => ({ ...prev, description: text }))}
                  placeholder="e.g., Salary, Rent"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Amount</Text>
                <TextInput
                  style={styles.formInput}
                  value={newTransaction.amount}
                  onChangeText={(text) => setNewTransaction(prev => ({ ...prev, amount: text }))}
                  placeholder="5000"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Date</Text>
                <TextInput
                  style={styles.formInput}
                  value={newTransaction.date}
                  onChangeText={(text) => setNewTransaction(prev => ({ ...prev, date: text }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Type</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      newTransaction.type === 'income' && styles.typeButtonActive
                    ]}
                    onPress={() => setNewTransaction(prev => ({ ...prev, type: 'income' }))}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trending-up" size={16} color={newTransaction.type === 'income' ? '#FFFFFF' : '#00B77D'} />
                    <Text style={[
                      styles.typeButtonText,
                      newTransaction.type === 'income' && styles.typeButtonTextActive
                    ]}>
                      Income
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      newTransaction.type === 'expense' && styles.typeButtonActiveExpense
                    ]}
                    onPress={() => setNewTransaction(prev => ({ ...prev, type: 'expense' }))}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trending-down" size={16} color={newTransaction.type === 'expense' ? '#FFFFFF' : '#EF4444'} />
                    <Text style={[
                      styles.typeButtonText,
                      newTransaction.type === 'expense' && styles.typeButtonTextActiveExpense
                    ]}>
                      Expense
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formSection}>
                <View style={styles.recurringRow}>
                  <Text style={styles.formLabel}>Recurring Monthly</Text>
                  <Switch
                    value={newTransaction.recurring}
                    onValueChange={(value) => setNewTransaction(prev => ({ ...prev, recurring: value }))}
                    trackColor={{ false: '#D1D5DB', true: '#00B77D' }}
                    thumbColor={newTransaction.recurring ? '#FFFFFF' : '#F3F4F6'}
                  />
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.addModalActions}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => setShowAddForm(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.saveModalButton,
                  (!newTransaction.description || !newTransaction.amount || !newTransaction.date) && styles.saveModalButtonDisabled
                ]}
                onPress={addTransaction}
                disabled={!newTransaction.description || !newTransaction.amount || !newTransaction.date}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.saveModalButtonText}>Add Transaction</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Methodology Info */}
      <View style={styles.methodologyCard}>
        <Text style={styles.methodologyTitle}>📊 Forecast Methodology</Text>
        <View style={styles.methodologyGrid}>
          <View style={styles.methodologyItem}>
            <Text style={styles.methodologyLabel}>How we predict:</Text>
            <View style={styles.methodologyPoints}>
              <View style={styles.methodologyPoint}>
                <View style={[styles.methodologyDot, { backgroundColor: '#00B77D' }]} />
                <Text style={styles.methodologyText}>Analyze your last {summaryStats.historyMonths} months of spending patterns</Text>
              </View>
              <View style={styles.methodologyPoint}>
                <View style={[styles.methodologyDot, { backgroundColor: '#0077B6' }]} />
                <Text style={styles.methodologyText}>Factor in seasonal trends and recurring transactions</Text>
              </View>
              <View style={styles.methodologyPoint}>
                <View style={[styles.methodologyDot, { backgroundColor: '#FFD60A' }]} />
                <Text style={styles.methodologyText}>Apply machine learning for improved accuracy</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.methodologyItem}>
            <Text style={styles.methodologyLabel}>Accuracy factors:</Text>
            <View style={styles.accuracyFactors}>
              <View style={styles.accuracyFactor}>
                <Text style={styles.accuracyLabel}>Historical data quality</Text>
                <Text style={[styles.accuracyValue, { color: '#00B77D' }]}>High</Text>
              </View>
              <View style={styles.accuracyFactor}>
                <Text style={styles.accuracyLabel}>Spending consistency</Text>
                <Text style={[styles.accuracyValue, { color: '#0077B6' }]}>Medium</Text>
              </View>
              <View style={styles.accuracyFactor}>
                <Text style={styles.accuracyLabel}>Forecast confidence</Text>
                <Text style={[styles.accuracyValue, { color: '#FFD60A' }]}>85%</Text>
              </View>
            </View>
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
  header: {
    backgroundColor: '#8B5CF6',
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
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  summaryCard: {
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
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  summarySubtext: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  chart: {
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 4,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  transactionsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#00B77D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsList: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  emptyButton: {
    backgroundColor: '#00B77D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  recurringText: {
    fontSize: 10,
    color: '#00B77D',
    fontWeight: '600',
  },
  transactionActions: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#E0F2FE',
    padding: 8,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 8,
  },
  editActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  editDateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    width: 100,
  },
  editAmountInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    width: 100,
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: '#00B77D',
    padding: 8,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  addModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  addModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  addModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addModalContent: {
    padding: 24,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#00B77D',
    borderColor: '#00B77D',
  },
  typeButtonActiveExpense: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  typeButtonTextActiveExpense: {
    color: '#FFFFFF',
  },
  recurringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  cancelModalButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveModalButton: {
    flex: 1,
    backgroundColor: '#00B77D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  saveModalButtonDisabled: {
    opacity: 0.5,
  },
  saveModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  methodologyCard: {
    backgroundColor: '#F0FDF9',
    borderWidth: 2,
    borderColor: '#CCFBEF',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  methodologyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  methodologyGrid: {
    gap: 16,
  },
  methodologyItem: {
    gap: 12,
  },
  methodologyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  methodologyPoints: {
    gap: 8,
  },
  methodologyPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  methodologyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  methodologyText: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
  accuracyFactors: {
    gap: 8,
  },
  accuracyFactor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accuracyLabel: {
    fontSize: 12,
    color: '#374151',
  },
  accuracyValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default CashFlowForecastScreen;