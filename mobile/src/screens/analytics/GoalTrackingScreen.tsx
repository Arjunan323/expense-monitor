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
  Alert,
  Switch,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import { usePreferences } from '../../contexts/PreferencesContext';
import { apiCall, goalsApi } from '../../utils/api';
import Toast from 'react-native-toast-message';

interface GoalDto {
  id: number;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  icon?: string;
  color?: string;
  monthlyContribution?: number;
}

interface GoalStatsDto {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  totalSaved: number;
  monthlyTarget: number;
  averageProgressPercent: number;
}

type GoalCategory = 'savings' | 'debt' | 'investment' | 'travel' | 'education' | 'home' | 'retirement' | 'health' | 'wedding' | 'car' | 'emergency';

export const GoalTrackingScreen: React.FC = () => {
  const { preferences } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<GoalDto>>({});
  
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetAmount: '',
    targetDate: '',
    category: 'savings' as GoalCategory,
    icon: '🎯'
  });

  const [goals, setGoals] = useState<GoalDto[]>([]);
  const [stats, setStats] = useState<GoalStatsDto | null>(null);

  const CATEGORY_META: Record<GoalCategory, { color: string; icon: string; label: string }> = {
    savings: { color: '#00B77D', icon: '💰', label: 'Savings' },
    debt: { color: '#EF4444', icon: '💳', label: 'Debt Reduction' },
    investment: { color: '#0077B6', icon: '📈', label: 'Investment' },
    travel: { color: '#F59E0B', icon: '✈️', label: 'Travel' },
    education: { color: '#6366F1', icon: '🎓', label: 'Education' },
    home: { color: '#0EA5E9', icon: '🏠', label: 'Home' },
    retirement: { color: '#16A34A', icon: '🛡️', label: 'Retirement' },
    health: { color: '#DC2626', icon: '🩺', label: 'Health' },
    wedding: { color: '#DB2777', icon: '💍', label: 'Wedding' },
    car: { color: '#2563EB', icon: '🚗', label: 'Car' },
    emergency: { color: '#F97316', icon: '🚨', label: 'Emergency Fund' }
  };

  const categoryColor = (c: GoalCategory) => CATEGORY_META[c]?.color || '#0077B6';
  const defaultIcon = (c: GoalCategory) => CATEGORY_META[c]?.icon || '🎯';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [goalsData, statsData] = await Promise.all([
        goalsApi.list(),
        goalsApi.stats()
      ]);
      setGoals(goalsData);
      setStats(statsData);
    } catch (e: any) {
      console.error('Failed loading goals:', e);
      Alert.alert('Error', 'Failed to load goals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getMonthsRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return Math.max(0, diffMonths);
  };

  const addContribution = async (goalId: number, amount: number) => {
    try {
      const updated = await goalsApi.contribute(goalId, amount);
      setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
      const newStats = await goalsApi.stats();
      setStats(newStats);
      Toast.show({ 
        type: 'success', 
        text1: 'Contribution Added!', 
        text2: `Added ${formatCurrency(amount, preferences)} to goal` 
      });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed to add contribution' });
    }
  };

  const addNewGoal = async () => {
    if (!newGoal.title || !newGoal.targetAmount || !newGoal.targetDate) {
      Toast.show({ type: 'error', text1: 'Please fill in all required fields' });
      return;
    }

    try {
      const payload = {
        title: newGoal.title,
        description: newGoal.description,
        targetAmount: parseFloat(newGoal.targetAmount),
        targetDate: newGoal.targetDate,
        category: newGoal.category,
        icon: newGoal.icon,
        color: categoryColor(newGoal.category),
        currentAmount: 0,
        monthlyContribution: 0
      };
      
      const created = await goalsApi.create(payload);
      setGoals(prev => [...prev, created]);
      setNewGoal({ title: '', description: '', targetAmount: '', targetDate: '', category: 'savings', icon: '🎯' });
      setShowAddForm(false);
      loadData(); // Refresh stats
      Toast.show({ type: 'success', text1: 'Goal created successfully!' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed to create goal' });
    }
  };

  const deleteGoal = async (id: number, title: string) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await goalsApi.delete(id);
              setGoals(prev => prev.filter(g => g.id !== id));
              loadData(); // Refresh stats
              Toast.show({ type: 'success', text1: 'Goal deleted' });
            } catch (e: any) {
              Toast.show({ type: 'error', text1: 'Failed to delete goal' });
            }
          }
        }
      ]
    );
  };

  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount);
  const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount);

  if (loading) {
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
        <Text style={styles.headerTitle}>🏆 Goal Tracking</Text>
        <Text style={styles.headerSubtitle}>Track your savings goals and debt reduction progress</Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: '#E0F2FE' }]}>
          <View style={[styles.summaryIcon, { backgroundColor: '#0077B6' }]}>
            <Ionicons name="target" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryLabel}>Active Goals</Text>
          <Text style={[styles.summaryValue, { color: '#0077B6' }]}>
            {stats ? stats.activeGoals : activeGoals.length}
          </Text>
          <Text style={styles.summarySubtext}>In progress</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#ECFDF5' }]}>
          <View style={[styles.summaryIcon, { backgroundColor: '#00B77D' }]}>
            <Ionicons name="trophy" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryLabel}>Completed</Text>
          <Text style={[styles.summaryValue, { color: '#00B77D' }]}>
            {stats ? stats.completedGoals : completedGoals.length}
          </Text>
          <Text style={styles.summarySubtext}>This year</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
          <View style={[styles.summaryIcon, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="wallet" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryLabel}>Total Saved</Text>
          <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
            {formatCurrency(stats ? stats.totalSaved : goals.reduce((sum, g) => sum + g.currentAmount, 0), preferences)}
          </Text>
          <Text style={styles.summarySubtext}>Across all goals</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#F3E8FF' }]}>
          <View style={[styles.summaryIcon, { backgroundColor: '#8B5CF6' }]}>
            <Ionicons name="trending-up" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryLabel}>Monthly Target</Text>
          <Text style={[styles.summaryValue, { color: '#8B5CF6' }]}>
            {formatCurrency(stats ? stats.monthlyTarget : goals.reduce((sum, g) => sum + (g.monthlyContribution || 0), 0), preferences)}
          </Text>
          <Text style={styles.summarySubtext}>Total contributions</Text>
        </View>
      </View>

      {/* Goals Section */}
      <View style={styles.goalsSection}>
        <View style={styles.goalsHeader}>
          <Text style={styles.goalsTitle}>Your Goals</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Goals List */}
        <View style={styles.goalsList}>
          {goals.map(goal => {
            const percentage = getProgressPercentage(goal.currentAmount, goal.targetAmount);
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const monthsRemaining = getMonthsRemaining(goal.targetDate);
            const categoryMeta = CATEGORY_META[goal.category as GoalCategory] || CATEGORY_META.savings;

            return (
              <View key={goal.id} style={[
                styles.goalCard,
                isCompleted && styles.goalCardCompleted
              ]}>
                {isCompleted && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="trophy" size={16} color="#FFFFFF" />
                    <Text style={styles.completedBadgeText}>Completed!</Text>
                  </View>
                )}

                <View style={styles.goalHeader}>
                  <View style={styles.goalInfo}>
                    <View style={[styles.goalIcon, { backgroundColor: categoryMeta.color + '20' }]}>
                      <Text style={styles.goalEmoji}>{goal.icon || categoryMeta.icon}</Text>
                    </View>
                    <View style={styles.goalDetails}>
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      <Text style={styles.goalDescription}>{goal.description}</Text>
                      <View style={styles.goalMeta}>
                        <Ionicons name="calendar" size={12} color="#6B7280" />
                        <Text style={styles.goalDate}>
                          Target: {new Date(goal.targetDate).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    onPress={() => deleteGoal(goal.id, goal.title)}
                    style={styles.deleteButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* Progress */}
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={[styles.progressPercentage, { color: categoryMeta.color }]}>
                      {percentage.toFixed(1)}%
                    </Text>
                  </View>
                  
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: categoryMeta.color
                        }
                      ]}
                    />
                  </View>
                  
                  <View style={styles.amountRow}>
                    <Text style={styles.currentAmount}>
                      {formatCurrency(goal.currentAmount, preferences)}
                    </Text>
                    <Text style={styles.targetAmount}>
                      of {formatCurrency(goal.targetAmount, preferences)}
                    </Text>
                  </View>
                </View>

                {/* Goal Details */}
                <View style={styles.goalDetailsGrid}>
                  <View style={styles.goalDetailItem}>
                    <Text style={styles.goalDetailLabel}>Time Remaining</Text>
                    <Text style={styles.goalDetailValue}>{monthsRemaining} months</Text>
                  </View>
                  
                  <View style={styles.goalDetailItem}>
                    <Text style={styles.goalDetailLabel}>Monthly Needed</Text>
                    <Text style={styles.goalDetailValue}>
                      {formatCurrency(
                        monthsRemaining > 0 ? (goal.targetAmount - goal.currentAmount) / monthsRemaining : 0,
                        preferences
                      )}
                    </Text>
                  </View>
                  
                  <View style={styles.goalDetailItem}>
                    <Text style={styles.goalDetailLabel}>Monthly Contribution</Text>
                    <Text style={styles.goalDetailValue}>
                      {formatCurrency(goal.monthlyContribution || 0, preferences)}
                    </Text>
                  </View>
                  
                  <View style={styles.goalDetailItem}>
                    <Text style={styles.goalDetailLabel}>Remaining</Text>
                    <Text style={[styles.goalDetailValue, { color: categoryMeta.color }]}>
                      {formatCurrency(goal.targetAmount - goal.currentAmount, preferences)}
                    </Text>
                  </View>
                </View>

                {/* Quick Contributions */}
                {!isCompleted && (
                  <View style={styles.contributionsSection}>
                    <Text style={styles.contributionsTitle}>Quick Contributions</Text>
                    <View style={styles.contributionButtons}>
                      {[1000, 5000, 10000].map((amount, index) => {
                        const colors = ['#00B77D', '#0077B6', '#FFD60A'];
                        const textColors = ['#FFFFFF', '#FFFFFF', '#1F2937'];
                        return (
                          <TouchableOpacity
                            key={amount}
                            onPress={() => addContribution(goal.id, amount)}
                            style={[styles.contributionButton, { backgroundColor: colors[index] }]}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.contributionButtonText, { color: textColors[index] }]}>
                              +{formatCurrency(amount, preferences).replace(/\.00$/, '')}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {isCompleted && (
                  <View style={styles.completedSection}>
                    <View style={styles.completedIcon}>
                      <Ionicons name="trophy" size={32} color="#FFFFFF" />
                    </View>
                    <Text style={styles.completedTitle}>🎉 Goal Achieved! 🎉</Text>
                    <Text style={styles.completedText}>Congratulations on reaching your target!</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddForm}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addModal}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>Create New Goal</Text>
              <TouchableOpacity onPress={() => setShowAddForm(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.addModalContent}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Goal Title</Text>
                <TextInput
                  style={styles.formInput}
                  value={newGoal.title}
                  onChangeText={(text) => setNewGoal(prev => ({ ...prev, title: text }))}
                  placeholder="e.g., Emergency Fund"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Target Amount</Text>
                <TextInput
                  style={styles.formInput}
                  value={newGoal.targetAmount}
                  onChangeText={(text) => setNewGoal(prev => ({ ...prev, targetAmount: text }))}
                  placeholder="100000"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Target Date</Text>
                <TextInput
                  style={styles.formInput}
                  value={newGoal.targetDate}
                  onChangeText={(text) => setNewGoal(prev => ({ ...prev, targetDate: text }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {Object.entries(CATEGORY_META).map(([key, meta]) => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setNewGoal(prev => ({ ...prev, category: key as GoalCategory }))}
                      style={[
                        styles.categoryButton,
                        newGoal.category === key && styles.categoryButtonActive,
                        { borderColor: meta.color }
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.categoryEmoji}>{meta.icon}</Text>
                      <Text style={[
                        styles.categoryText,
                        newGoal.category === key && { color: meta.color }
                      ]}>
                        {meta.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={newGoal.description}
                  onChangeText={(text) => setNewGoal(prev => ({ ...prev, description: text }))}
                  placeholder="Brief description of your goal"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>
            
            <View style={styles.addModalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddForm(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!newGoal.title || !newGoal.targetAmount || !newGoal.targetDate) && styles.saveButtonDisabled
                ]}
                onPress={addNewGoal}
                disabled={!newGoal.title || !newGoal.targetAmount || !newGoal.targetDate}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Create Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Motivational Section */}
      <View style={styles.motivationalCard}>
        <View style={styles.motivationalIcon}>
          <Ionicons name="trophy" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.motivationalTitle}>Keep Going! You're Doing Great! 🚀</Text>
        <Text style={styles.motivationalText}>
          Every small step counts towards your financial goals. Stay consistent with your contributions!
        </Text>
        <View style={styles.motivationalStats}>
          <View style={styles.motivationalStat}>
            <Text style={styles.motivationalStatValue}>
              {stats ? Math.round(stats.averageProgressPercent) : 0}%
            </Text>
            <Text style={styles.motivationalStatLabel}>Average progress</Text>
          </View>
          <View style={styles.motivationalStat}>
            <Text style={styles.motivationalStatValue}>
              {formatCurrency(stats ? stats.totalSaved : 0, preferences)}
            </Text>
            <Text style={styles.motivationalStatLabel}>Total saved</Text>
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
    backgroundColor: '#EC4899',
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  summarySubtext: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  goalsSection: {
    paddingHorizontal: 24,
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalsTitle: {
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
  goalsList: {
    gap: 16,
    marginBottom: 24,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
  },
  goalCardCompleted: {
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#00B77D',
  },
  completedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#00B77D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 1,
  },
  completedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalEmoji: {
    fontSize: 24,
  },
  goalDetails: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  goalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goalDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  deleteButton: {
    padding: 8,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  targetAmount: {
    fontSize: 14,
    color: '#6B7280',
  },
  goalDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  goalDetailItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
  },
  goalDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  goalDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  contributionsSection: {
    marginBottom: 16,
  },
  contributionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  contributionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  contributionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  contributionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  completedSection: {
    backgroundColor: '#00B77D',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  completedIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  completedText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginRight: 12,
    gap: 4,
  },
  categoryButtonActive: {
    backgroundColor: '#F0FDF9',
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
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
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  motivationalCard: {
    backgroundColor: '#6366F1',
    marginHorizontal: 24,
    borderRadius: 25,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  motivationalIcon: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  motivationalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  motivationalText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  motivationalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  motivationalStat: {
    alignItems: 'center',
  },
  motivationalStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  motivationalStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
});

export default GoalTrackingScreen;