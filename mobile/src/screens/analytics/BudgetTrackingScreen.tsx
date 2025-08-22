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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import { usePreferences } from '../../contexts/PreferencesContext';

interface BudgetCategory {
  id: string;
  name: string;
  budget: number;
  spent: number;
  icon: string;
  color: string;
}

export const BudgetTrackingScreen: React.FC = () => {
  const { preferences } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', budget: '', icon: '💰' });

  const [budgets, setBudgets] = useState<BudgetCategory[]>([
    { id: '1', name: 'Groceries', budget: 15000, spent: 12500, icon: '🛒', color: '#00B77D' },
    { id: '2', name: 'Utilities', budget: 8000, spent: 9200, icon: '⚡', color: '#0077B6' },
    { id: '3', name: 'Entertainment', budget: 5000, spent: 3800, icon: '🎬', color: '#FFD60A' },
    { id: '4', name: 'Transport', budget: 6000, spent: 7500, icon: '🚗', color: '#8B5CF6' },
  ]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  const getProgressColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return '#EF4444';
    if (percentage >= 80) return '#F59E0B';
    return '#00B77D';
  };

  const getProgressPercentage = (spent: number, budget: number) => {
    return Math.min((spent / budget) * 100, 100);
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.budget, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCount = budgets.filter(b => b.spent > b.budget).length;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Budget Tracking</Text>
        <Text style={styles.headerSubtitle}>Set budgets by category and track your spending progress</Text>
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
            const percentage = getProgressPercentage(budget.spent, budget.budget);
            const isOverBudget = budget.spent > budget.budget;

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
                        {formatCurrency(budget.spent, preferences)} of {formatCurrency(budget.budget, preferences)}
                      </Text>
                    </View>
                  </View>
                  
                  {isOverBudget && (
                    <View style={styles.overBudgetBadge}>
                      <Text style={styles.overBudgetText}>Over Budget</Text>
                    </View>
                  )}
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: getProgressColor(budget.spent, budget.budget)
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: getProgressColor(budget.spent, budget.budget) }]}>
                    {percentage.toFixed(1)}%
                  </Text>
                </View>

                <View style={styles.budgetFooter}>
                  <Text style={styles.remainingText}>
                    Remaining: {formatCurrency(Math.max(0, budget.budget - budget.spent), preferences)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingId(budget.id);
                      setEditValue(budget.budget.toString());
                    }}
                    style={styles.editButton}
                  >
                    <Ionicons name="create-outline" size={16} color="#0077B6" />
                  </TouchableOpacity>
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
                <TextInput
                  style={styles.input}
                  value={newCategory.name}
                  onChangeText={(text) => setNewCategory(prev => ({ ...prev, name: text }))}
                  placeholder="e.g., Dining Out"
                />
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
                onPress={() => {
                  // Add logic here
                  setShowAddModal(false);
                }}
              >
                <Text style={styles.saveButtonText}>Add Category</Text>
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
  saveButton: {
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
});