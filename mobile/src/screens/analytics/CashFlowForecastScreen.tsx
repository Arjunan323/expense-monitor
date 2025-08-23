import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { LineChart } from 'react-native-chart-kit';
import { formatCurrency } from '../../utils/formatters';
import { usePreferences } from '../../contexts/PreferencesContext';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface UpcomingTransaction {
  id: number;
  description: string;
  amount: number;
  dueDate: string;
  type: 'income' | 'expense';
  recurring: boolean;
  status: 'pending' | 'paid' | 'cancelled';
}

export const CashFlowForecastScreen: React.FC = () => {
  const { preferences } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [sensitivityFactor, setSensitivityFactor] = useState(0);
  
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    date: '',
    type: 'expense' as 'income' | 'expense',
    recurring: false
  });

  const [upcomingTransactions, setUpcomingTransactions] = useState<UpcomingTransaction[]>([
    {
      id: 1,
      description: 'Monthly Salary',
      amount: 75000,
      dueDate: '2025-02-01',
      type: 'income',
      recurring: true,
      status: 'pending'
    },
    {
      id: 2,
      description: 'Rent Payment',
      amount: -25000,
      dueDate: '2025-02-05',
      type: 'expense',
      recurring: true,
      status: 'pending'
    },
    {
      id: 3,
      description: 'Utility Bills',
      amount: -8000,
      dueDate: '2025-02-10',
      type: 'expense',
      recurring: true,
      status: 'pending'
    }
  ]);

  const [chartData, setChartData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: [45000, 52000, 48000, 61000, 55000, 67000],
      color: (opacity = 1) => `rgba(0, 183, 125, ${opacity})`,
      strokeWidth: 3
    }]
  });

  const [summaryStats, setSummaryStats] = useState({
    predictedBalance: 67000,
    potentialShortfall: 0,
    expectedSurplus: 15000
  });

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  const addTransaction = () => {
    if (newTransaction.description && newTransaction.amount && newTransaction.date) {
      const amount = newTransaction.type === 'expense' 
        ? -Math.abs(parseFloat(newTransaction.amount))
        : Math.abs(parseFloat(newTransaction.amount));
      
      const transaction: UpcomingTransaction = {
        id: Date.now(),
        description: newTransaction.description,
        amount,
        dueDate: newTransaction.date,
        type: newTransaction.type,
        recurring: newTransaction.recurring,
        status: 'pending'
      };
      
      setUpcomingTransactions(prev => [...prev, transaction]);
      setNewTransaction({ description: '', amount: '', date: '', type: 'expense', recurring: false });
      setShowAddModal(false);
      Alert.alert('Success', 'Transaction added successfully');
    }
  };

  const deleteTransaction = (id: number) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setUpcomingTransactions(prev => prev.filter(t => t.id !== id));
            Alert.alert('Success', 'Transaction deleted');
          }
        }
      ]
    );
  };

  const adjustedChartData = {
    ...chartData,
    datasets: [{
      ...chartData.datasets[0],
      data: chartData.datasets[0].data.map(value => value + (value * sensitivityFactor / 100))
    }]
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cash Flow Forecast</Text>
        <Text style={styles.headerSubtitle}>Predict your future financial position</Text>
      </View>

      {/* Enhanced Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: '#E0F2FE' }]}>
          <View style={[styles.summaryIcon, { backgroundColor: '#0077B6' }]}>
            <Ionicons name="trending-up" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryLabel}>Predicted Balance</Text>
          <Text style={[styles.summaryValue, { color: '#0077B6' }]}>
            {formatCurrency(summaryStats.predictedBalance, preferences)}
          </Text>
          <Text style={styles.summarySubtext}>End of month</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#FEE2E2' }]}>
          <View style={[styles.summaryIcon, { backgroundColor: '#EF4444' }]}>
            <Ionicons name="warning" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryLabel}>Potential Risk</Text>
          <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
            {formatCurrency(summaryStats.potentialShortfall, preferences)}
          </Text>
          <Text style={styles.summarySubtext}>If trends continue</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#ECFDF5' }]}>
          <View style={[styles.summaryIcon, { backgroundColor: '#00B77D' }]}>
            <Ionicons name="trending-up" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryLabel}>Expected Surplus</Text>
          <Text style={[styles.summaryValue, { color: '#00B77D' }]}>
            {formatCurrency(summaryStats.expectedSurplus, preferences)}
          </Text>
          <Text style={styles.summarySubtext}>Available for savings</Text>
        </View>
      </View>

      {/* Enhanced Sensitivity Controls */}
      <View style={styles.sensitivityCard}>
        <Text style={styles.sensitivityTitle}>What-if Scenarios</Text>
        <Text style={styles.sensitivitySubtitle}>Adjust spending to see impact on forecast</Text>
        
        <View style={styles.sensitivityButtons}>
          {[-10, 0, 10].map(factor => (
            <TouchableOpacity
              key={factor}
              onPress={() => setSensitivityFactor(factor)}
              style={[
                styles.sensitivityButton,
                sensitivityFactor === factor && styles.sensitivityButtonActive,
                factor === -10 && styles.sensitivityButtonGreen,
                factor === 10 && styles.sensitivityButtonRed
              ]}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.sensitivityButtonText,
                sensitivityFactor === factor && styles.sensitivityButtonTextActive
              ]}>
                {factor === 0 ? 'Normal' : `${factor > 0 ? '+' : ''}${factor}%`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Enhanced Forecast Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>6-Month Projection</Text>
          <Text style={styles.chartSubtitle}>Predicted cash flow based on patterns</Text>
        </View>
        
        <LineChart
          data={adjustedChartData}
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
              r: '6',
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
          formatYLabel={(value) => `₹${(parseInt(value)/1000).toFixed(0)}K`}
        />
      </View>

      {/* Enhanced Upcoming Transactions */}
      <View style={styles.transactionsSection}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Upcoming Transactions</Text>
          <TouchableOpacity
            style={styles.addTransactionButton}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addTransactionText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsList}>
          {upcomingTransactions.map(transaction => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: transaction.amount >= 0 ? '#00B77D' : '#EF4444' }
                ]}>
                  <Ionicons 
                    name={transaction.amount >= 0 ? "trending-up" : "trending-down"} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </View>
                
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <View style={styles.transactionMeta}>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.dueDate).toLocaleDateString()}
                    </Text>
                    {transaction.recurring && (
                      <View style={styles.recurringBadge}>
                        <Ionicons name="refresh" size={12} color="#00B77D" />
                        <Text style={styles.recurringText}>Recurring</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.transactionActions}>
                  <Text style={[
                    styles.transactionAmount,
                    { color: transaction.amount >= 0 ? '#00B77D' : '#EF4444' }
                  ]}>
                    {transaction.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount), preferences)}
                  </Text>
                  
                  <TouchableOpacity
                    onPress={() => deleteTransaction(transaction.id)}
                    style={styles.deleteButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Enhanced Add Transaction Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addModal}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>Add Upcoming Transaction</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.addModalContent}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>📝 Description</Text>
                <TextInput
                  style={styles.formInput}
                  value={newTransaction.description}
                  onChangeText={(text) => setNewTransaction(prev => ({ ...prev, description: text }))}
                  placeholder="e.g., Monthly Salary, Rent Payment"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>💰 Amount</Text>
                <TextInput
                  style={styles.formInput}
                  value={newTransaction.amount}
                  onChangeText={(text) => setNewTransaction(prev => ({ ...prev, amount: text }))}
                  placeholder="Enter amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>📅 Date</Text>
                <TouchableOpacity style={styles.dateButton}>
                  <TextInput
                    style={styles.dateInput}
                    value={newTransaction.date}
                    onChangeText={(text) => setNewTransaction(prev => ({ ...prev, date: text }))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Ionicons name="calendar" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>🏷️ Type</Text>
                <View style={styles.typeButtons}>
                  <TouchableOpacity
                    onPress={() => setNewTransaction(prev => ({ ...prev, type: 'income' }))}
                    style={[
                      styles.typeButton,
                      newTransaction.type === 'income' && styles.typeButtonActiveIncome
                    ]}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name="trending-up" 
                      size={16} 
                      color={newTransaction.type === 'income' ? "#FFFFFF" : "#00B77D"} 
                    />
                    <Text style={[
                      styles.typeButtonText,
                      newTransaction.type === 'income' && styles.typeButtonTextActive
                    ]}>
                      Income
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => setNewTransaction(prev => ({ ...prev, type: 'expense' }))}
                    style={[
                      styles.typeButton,
                      newTransaction.type === 'expense' && styles.typeButtonActiveExpense
                    ]}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name="trending-down" 
                      size={16} 
                      color={newTransaction.type === 'expense' ? "#FFFFFF" : "#EF4444"} 
                    />
                    <Text style={[
                      styles.typeButtonText,
                      newTransaction.type === 'expense' && styles.typeButtonTextActive
                    ]}>
                      Expense
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formSection}>
                <View style={styles.recurringRow}>
                  <View style={styles.recurringInfo}>
                    <Text style={styles.recurringLabel}>🔄 Recurring Monthly</Text>
                    <Text style={styles.recurringSubtext}>Repeat this transaction every month</Text>
                  </View>
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
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!newTransaction.description || !newTransaction.amount || !newTransaction.date) && styles.saveButtonDisabled
                ]}
                onPress={addTransaction}
                disabled={!newTransaction.description || !newTransaction.amount || !newTransaction.date}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Add Transaction</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
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
  },
  summarySubtext: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  sensitivityCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  sensitivityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  sensitivitySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  sensitivityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sensitivityButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sensitivityButtonActive: {
    backgroundColor: '#0077B6',
  },
  sensitivityButtonGreen: {
    backgroundColor: '#00B77D',
  },
  sensitivityButtonRed: {
    backgroundColor: '#EF4444',
  },
  sensitivityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  sensitivityButtonTextActive: {
    color: '#FFFFFF',
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
  transactionsSection: {
    paddingHorizontal: 24,
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
  addTransactionButton: {
    backgroundColor: '#00B77D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
    shadowColor: '#00B77D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addTransactionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#00B77D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  deleteButton: {
    padding: 8,
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
    fontSize: 16,
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  typeButtonActiveIncome: {
    backgroundColor: '#00B77D',
  },
  typeButtonActiveExpense: {
    backgroundColor: '#EF4444',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  recurringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  recurringInfo: {
    flex: 1,
  },
  recurringLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  recurringSubtext: {
    fontSize: 12,
    color: '#6B7280',
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
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#00B77D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#00B77D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});