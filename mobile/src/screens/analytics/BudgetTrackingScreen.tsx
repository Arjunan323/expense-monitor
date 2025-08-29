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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import { usePreferences } from '../../contexts/PreferencesContext';
import { apiCall, budgetsApi } from '../../utils/api';
import Toast from 'react-native-toast-message';
import { Alert } from 'react-native';

interface BudgetCategoryUsageDto {
  id: number;
  name: string;
  monthlyBudget: number;
  spent: number;
  icon: string;
  color: string;
  progressPercent: number;
  over: boolean;
  near: boolean;
  remaining: number;
}

interface BudgetSummaryResponse {
  month: string;
  categories: BudgetCategoryUsageDto[];
  totals: {
    totalBudget: number;
    totalSpent: number;
    overBudgetCount: number;
    overallProgressPercent: number;
  };
  history: {
    thisMonthAdherence: number;
    lastMonthAdherence: number;
    avg6MonthsAdherence: number;
  };
}


export const BudgetTrackingScreen: React.FC = () => {
  const { preferences } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', budget: '', icon: '💰' });

  const [budgets, setBudgets] = useState<BudgetCategoryUsageDto[]>([]);
  const [summary, setSummary] = useState<BudgetSummaryResponse | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [categoriesData, summaryData] = await Promise.all([
        apiCall<any[]>('GET', '/categories').catch(() => []),
        budgetsApi.summary(selectedMonth)
      ]);
      
      setAllCategories(categoriesData.map(c => c.name));
      setSummary(summaryData);
      setBudgets(summaryData.categories);
    } catch (e: any) {
      console.error('Failed to load budgets:', e);
      Toast.show({ type: 'error', text1: 'Failed to load budget data' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getProgressColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return '#EF4444';
    if (percentage >= 80) return '#F59E0B';
    return '#00B77D';
  };

  const getProgressPercentage = (spent: number, budget: number) => {
    return Math.min((spent / budget) * 100, 100);
  };

  const handleEditBudget = (id: string, currentBudget: number) => {
    setEditingId(id);
    setEditValue(currentBudget.toString());
  };

  const saveBudget = async (id: string) => {
    const newBudget = parseFloat(editValue);
    if (newBudget > 0) {
      try {
        await budgetsApi.updateLimit(Number(id), newBudget);
        setBudgets(prev => prev.map(b => 
          b.id === Number(id) ? { ...b, monthlyBudget: newBudget, budget: newBudget } : b
        ));
        loadData(); // Refresh summary
        Toast.show({ type: 'success', text1: 'Budget updated' });
      } catch (e: any) {
        Toast.show({ type: 'error', text1: 'Failed to update budget' });
      }
    }
    setEditingId(null);
    setEditValue('');
  };

  const addNewCategory = async () => {
    if (newCategory.name && newCategory.budget) {
      try {
        await budgetsApi.create({
          name: newCategory.name,
          monthlyBudget: parseFloat(newCategory.budget),
          icon: newCategory.icon,
          color: '#00B77D'
        });
        setNewCategory({ name: '', budget: '', icon: '💰' });
        setShowAddModal(false);
        loadData();
        Toast.show({ type: 'success', text1: 'Budget category added' });
      } catch (e: any) {
        Toast.show({ type: 'error', text1: 'Failed to add category' });
      }
    }
  };

  const totalBudget = summary?.totals.totalBudget ?? budgets.reduce((sum, b) => sum + b.monthlyBudget, 0);
  const totalSpent = summary?.totals.totalSpent ?? budgets.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCount = summary?.totals.overBudgetCount ?? budgets.filter(b => b.spent > b.monthlyBudget).length;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎯 Budget Tracking</Text>
        <Text style={styles.headerSubtitle}>Set budgets by category and track your spending progress</Text>
        
        <View style={styles.monthSelector}>
          <Text style={styles.monthLabel}>Month:</Text>
          <TextInput
            style={styles.monthInput}
            value={selectedMonth}
            onChangeText={setSelectedMonth}
            placeholder="YYYY-MM"
          />
        </View>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="pie-chart-outline" size={24} color="#0077B6" />
          </View>
          <Text style={styles.summaryLabel}>Total Budget</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalBudget, preferences)}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: totalSpent > totalBudget ? '#FEE2E2' : '#CCFBEF' }]}>
            <Ionicons name="wallet" size={24} color={totalSpent > totalBudget ? '#EF4444' : '#00B77D'} />
          </View>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={[styles.summaryValue, { color: totalSpent > totalBudget ? '#EF4444' : '#00B77D' }]}>
            {formatCurrency(totalSpent, preferences)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: overBudgetCount > 0 ? '#FEE2E2' : '#CCFBEF' }]}>
            <Ionicons name="warning" size={24} color={overBudgetCount > 0 ? '#EF4444' : '#00B77D'} />
          </View>
          <Text style={styles.summaryLabel}>Over Budget</Text>
          <Text style={[styles.summaryValue, { color: overBudgetCount > 0 ? '#EF4444' : '#00B77D' }]}>
            {overBudgetCount}
          </Text>
        </View>
      </View>

      {/* Budget Categories */}
      <View style={styles.categoriesSection}>
        <View style={styles.categoriesHeader}>
          <Text style={styles.categoriesTitle}>Budget Categories</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesList}>
          {budgets.map(budget => {
            const percentage = budget.progressPercent ?? getProgressPercentage(budget.spent, budget.monthlyBudget);
            const isOverBudget = budget.over ?? (budget.spent > budget.monthlyBudget);
            const isNearBudget = budget.near ?? (percentage >= 80 && !isOverBudget);

            return (
              <View key={budget.id} style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetInfo}>
                    <View style={[styles.budgetIcon, { backgroundColor: budget.color + '20' }]}>
                      <Text style={styles.budgetEmoji}>{budget.icon}</Text>
                    </View>
                    <View style={styles.budgetDetails}>
                      <Text style={styles.budgetName}>{budget.name}</Text>
                      <Text style={styles.budgetAmount}>
                        {formatCurrency(budget.spent, preferences)} of {formatCurrency(budget.monthlyBudget, preferences)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.badgeContainer}>
                    {isOverBudget && (
                      <View style={styles.overBudgetBadge}>
                        <Text style={styles.overBudgetText}>Over Budget</Text>
                      </View>
                    )}
                    {isNearBudget && (
                      <View style={styles.nearBudgetBadge}>
                        <Text style={styles.nearBudgetText}>Near Limit</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: getProgressColor(budget.spent, budget.monthlyBudget)
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: getProgressColor(budget.spent, budget.monthlyBudget) }]}>
                    {percentage.toFixed(1)}%
                  </Text>
                </View>

                <View style={styles.budgetFooter}>
                  <Text style={styles.remainingText}>
                    Remaining: {formatCurrency(Math.max(0, budget.monthlyBudget - budget.spent), preferences)}
                  </Text>
                  {editingId === budget.id.toString() ? (
                    <View style={styles.editContainer}>
                      <TextInput
                        style={styles.editInput}
                        value={editValue}
                        onChangeText={setEditValue}
                        keyboardType="numeric"
                        autoFocus
                      />
                      <TouchableOpacity
                        onPress={() => saveBudget(budget.id.toString())}
                        style={styles.saveButton}
                      >
                        <Ionicons name="checkmark" size={16} color="#00B77D" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setEditingId(null)}
                        style={styles.cancelEditButton}
                      >
                        <Ionicons name="close" size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleEditBudget(budget.id.toString(), budget.monthlyBudget)}
                      style={styles.editButton}
                    >
                      <Ionicons name="create-outline" size={16} color="#0077B6" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Add Category Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Budget Category</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category Name</Text>
                <View style={styles.categorySelector}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {allCategories.map(category => (
                      <TouchableOpacity
                        key={category}
                        onPress={() => setNewCategory(prev => ({ ...prev, name: category }))}
                        style={[
                          styles.categoryOption,
                          newCategory.name === category && styles.categoryOptionSelected
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text style={[
                          styles.categoryOptionText,
                          newCategory.name === category && styles.categoryOptionTextSelected
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Monthly Budget</Text>
                <TextInput
                  style={styles.input}
                  value={newCategory.budget}
                  onChangeText={(text) => setNewCategory(prev => ({ ...prev, budget: text }))}
                  placeholder="5000"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Icon</Text>
                <View style={styles.iconSelector}>
                  {['💰', '🍕', '🚗', '🏠', '🎬', '👕', '🏥', '📚'].map(icon => (
                    <TouchableOpacity
                      key={icon}
                      onPress={() => setNewCategory(prev => ({ ...prev, icon }))}
                      style={[
                        styles.iconOption,
                        newCategory.icon === icon && styles.iconOptionSelected
                      ]}
                    >
                      <Text style={styles.iconEmoji}>{icon}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={addNewCategory}
                disabled={!newCategory.name || !newCategory.budget}
              >
                <Text style={styles.saveButtonText}>Add Category</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Budget History */}
      {summary && (
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Budget Adherence History</Text>
          <View style={styles.historyGrid}>
            <View style={styles.historyItem}>
              <Text style={styles.historyLabel}>This Month</Text>
              <Text style={[styles.historyValue, { color: '#0077B6' }]}>
                {Math.round(summary.history.thisMonthAdherence)}%
              </Text>
            </View>
            <View style={styles.historyItem}>
              <Text style={styles.historyLabel}>Last Month</Text>
              <Text style={[styles.historyValue, { color: '#00B77D' }]}>
                {Math.round(summary.history.lastMonthAdherence)}%
              </Text>
            </View>
            <View style={styles.historyItem}>
              <Text style={styles.historyLabel}>6-Month Avg</Text>
              <Text style={[styles.historyValue, { color: '#F59E0B' }]}>
                {Math.round(summary.history.avg6MonthsAdherence)}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Budget Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 Budget Tips</Text>
        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>Set realistic budgets based on your 3-month average spending.</Text>
          </View>
          <View style={styles.tipItem}>
            <View style={[styles.tipDot, { backgroundColor: '#0077B6' }]} />
            <Text style={styles.tipText}>Review and adjust budgets monthly to stay on track.</Text>
          </View>
          <View style={styles.tipItem}>
            <View style={[styles.tipDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.tipText}>Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings.</Text>
          </View>
          <View style={styles.tipItem}>
            <View style={[styles.tipDot, { backgroundColor: '#00B77D' }]} />
            <Text style={styles.tipText}>Track daily to avoid month-end budget surprises.</Text>
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
    backgroundColor: '#0077B6',
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
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  monthLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  monthInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
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
    width: 48,
    height: 48,
    backgroundColor: '#E0F2FE',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  categoriesSection: {
    paddingHorizontal: 24,
  },
  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoriesTitle: {
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
  categoriesList: {
    gap: 16,
  },
  budgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  budgetEmoji: {
    fontSize: 24,
  },
  budgetDetails: {
    flex: 1,
  },
  budgetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 14,
    color: '#6B7280',
  },
  overBudgetBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overBudgetText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  nearBudgetBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  nearBudgetText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  editButton: {
    padding: 8,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    width: 80,
  },
  cancelEditButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalContent: {
    padding: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  categorySelector: {
    marginTop: 8,
  },
  categoryOption: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryOptionSelected: {
    backgroundColor: '#00B77D',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  iconSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  iconOptionSelected: {
    borderColor: '#00B77D',
    backgroundColor: '#F0FDF9',
  },
  iconEmoji: {
    fontSize: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
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
  saveButtonModal: {
    flex: 1,
    backgroundColor: '#00B77D',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historyCard: {
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
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  historyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  historyItem: {
    alignItems: 'center',
  },
  historyLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  historyValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tipsCard: {
    backgroundColor: '#F0FDF9',
    borderWidth: 2,
    borderColor: '#CCFBEF',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipDot: {
    width: 8,
    height: 8,
    backgroundColor: '#00B77D',
    borderRadius: 4,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  saveButton: {
    padding: 4,
  },
});

export default BudgetTrackingScreen;