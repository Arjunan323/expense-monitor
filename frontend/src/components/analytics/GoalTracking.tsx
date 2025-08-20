import React, { useState, useEffect } from 'react';
import { Target, Plus, Trophy, Calendar, TrendingUp, PiggyBank, Home, Plane, GraduationCap } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { usePreferences } from '../../contexts/PreferencesContext';

interface Goal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: 'savings' | 'debt' | 'investment';
  icon: string;
  color: string;
  monthlyContribution: number;
}

export const GoalTracking: React.FC = () => {
  const { preferences } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetAmount: '',
    targetDate: '',
    category: 'savings' as 'savings' | 'debt' | 'investment',
    icon: '🎯'
  });

  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Emergency Fund',
      description: 'Build 6 months of expenses',
      targetAmount: 300000,
      currentAmount: 125000,
      targetDate: '2024-12-31',
      category: 'savings',
      icon: '🛡️',
      color: '#00B77D',
      monthlyContribution: 25000
    },
    {
      id: '2',
      title: 'Home Down Payment',
      description: 'Save for dream home',
      targetAmount: 1000000,
      currentAmount: 450000,
      targetDate: '2025-06-30',
      category: 'savings',
      icon: '🏠',
      color: '#0077B6',
      monthlyContribution: 50000
    },
    {
      id: '3',
      title: 'Credit Card Debt',
      description: 'Pay off high-interest debt',
      targetAmount: 75000,
      currentAmount: 45000,
      targetDate: '2024-10-31',
      category: 'debt',
      icon: '💳',
      color: '#EF4444',
      monthlyContribution: 15000
    },
    {
      id: '4',
      title: 'Vacation Fund',
      description: 'Europe trip savings',
      targetAmount: 200000,
      currentAmount: 85000,
      targetDate: '2024-11-30',
      category: 'savings',
      icon: '✈️',
      color: '#FFD60A',
      monthlyContribution: 20000
    }
  ]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

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

  const getProjectedDate = (current: number, target: number, monthlyContribution: number) => {
    const remaining = target - current;
    const monthsNeeded = Math.ceil(remaining / monthlyContribution);
    const projectedDate = new Date();
    projectedDate.setMonth(projectedDate.getMonth() + monthsNeeded);
    return projectedDate.toLocaleDateString();
  };

  const addContribution = (goalId: string, amount: number) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { ...goal, currentAmount: Math.min(goal.currentAmount + amount, goal.targetAmount) }
        : goal
    ));
  };

  const addNewGoal = () => {
    if (newGoal.title && newGoal.targetAmount && newGoal.targetDate) {
      const goal: Goal = {
        id: Date.now().toString(),
        title: newGoal.title,
        description: newGoal.description,
        targetAmount: parseFloat(newGoal.targetAmount),
        currentAmount: 0,
        targetDate: newGoal.targetDate,
        category: newGoal.category,
        icon: newGoal.icon,
        color: newGoal.category === 'savings' ? '#00B77D' : newGoal.category === 'debt' ? '#EF4444' : '#0077B6',
        monthlyContribution: 0
      };
      setGoals(prev => [...prev, goal]);
      setNewGoal({ title: '', description: '', targetAmount: '', targetDate: '', category: 'savings', icon: '🎯' });
      setShowAddForm(false);
    }
  };

  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount);
  const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-heading font-bold gradient-text mb-3">Goal Tracking</h1>
          <p className="text-brand-gray-600 text-lg">Track your savings goals and debt reduction progress</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-blue rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-brand-blue-600 bg-brand-blue-100 px-2 py-1 rounded-full">ACTIVE</span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Active Goals</h3>
            <p className="text-3xl font-bold text-brand-blue-600">{activeGoals.length}</p>
            <p className="text-sm text-brand-gray-500">In progress</p>
          </div>

          <div className="stat-card border-brand-green-200 bg-brand-green-50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-green rounded-2xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-brand-green-600 bg-brand-green-100 px-2 py-1 rounded-full">COMPLETED</span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Completed</h3>
            <p className="text-3xl font-bold text-brand-green-600">{completedGoals.length}</p>
            <p className="text-sm text-brand-gray-500">This year</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-yellow rounded-2xl flex items-center justify-center">
                <PiggyBank className="w-6 h-6 text-brand-gray-900" />
              </div>
              <span className="text-xs font-semibold text-accent-600 bg-accent-100 px-2 py-1 rounded-full">TOTAL</span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Total Saved</h3>
            <p className="text-3xl font-bold text-accent-600">
              {formatCurrency(goals.reduce((sum, g) => sum + g.currentAmount, 0), undefined, preferences)}
            </p>
            <p className="text-sm text-brand-gray-500">Across all goals</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">MONTHLY</span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Monthly Target</h3>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(goals.reduce((sum, g) => sum + g.monthlyContribution, 0), undefined, preferences)}
            </p>
            <p className="text-sm text-brand-gray-500">Total contributions</p>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-heading font-bold text-brand-gray-900">Your Goals</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Goal</span>
          </button>
        </div>

        {/* Add Goal Form */}
        {showAddForm && (
          <div className="card bg-gradient-to-br from-brand-green-50 to-brand-blue-50 border-brand-green-200">
            <h4 className="text-lg font-heading font-bold text-brand-gray-900 mb-4">Create New Goal</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Goal Title</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., Emergency Fund"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Target Amount</label>
                <input
                  type="number"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: e.target.value }))}
                  className="input-field"
                  placeholder="100000"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Target Date</label>
                <input
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Category</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value as any }))}
                  className="input-field"
                >
                  <option value="savings">💰 Savings</option>
                  <option value="debt">💳 Debt Reduction</option>
                  <option value="investment">📈 Investment</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Description</label>
              <textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                className="input-field"
                rows={2}
                placeholder="Brief description of your goal"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
              <button onClick={addNewGoal} className="btn-primary">Create Goal</button>
            </div>
          </div>
        )}

        {/* Goals List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {goals.map(goal => {
            const percentage = getProgressPercentage(goal.currentAmount, goal.targetAmount);
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const monthsRemaining = getMonthsRemaining(goal.targetDate);
            const projectedDate = getProjectedDate(goal.currentAmount, goal.targetAmount, goal.monthlyContribution);

            return (
              <div key={goal.id} className={`card border-2 transition-all duration-300 ${
                isCompleted 
                  ? 'border-brand-green-300 bg-brand-green-50 shadow-glow-green' 
                  : 'border-brand-gray-200 hover:shadow-funky'
              }`}>
                {isCompleted && (
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-green rounded-full flex items-center justify-center shadow-glow-green animate-bounce-gentle">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl" style={{ backgroundColor: goal.color + '20' }}>
                      {goal.icon}
                    </div>
                    <div>
                      <h4 className="text-xl font-heading font-bold text-brand-gray-900 mb-1">{goal.title}</h4>
                      <p className="text-brand-gray-600 mb-2">{goal.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-brand-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          goal.category === 'savings' ? 'bg-brand-green-100 text-brand-green-700' :
                          goal.category === 'debt' ? 'bg-red-100 text-red-700' :
                          'bg-brand-blue-100 text-brand-blue-700'
                        }`}>
                          {goal.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Visualization */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-brand-gray-700">Progress</span>
                      <span className="text-sm font-bold" style={{ color: goal.color }}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    
                    {/* Circular Progress */}
                    <div className="relative w-32 h-32 mx-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { value: percentage, fill: goal.color },
                              { value: 100 - percentage, fill: '#f3f4f6' }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            startAngle={90}
                            endAngle={450}
                            dataKey="value"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-2xl font-bold" style={{ color: goal.color }}>
                            {percentage.toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-brand-gray-600">Current Amount</span>
                      <p className="text-xl font-bold text-brand-gray-900">
                        {formatCurrency(goal.currentAmount, undefined, preferences)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-brand-gray-600">Target Amount</span>
                      <p className="text-xl font-bold text-brand-gray-900">
                        {formatCurrency(goal.targetAmount, undefined, preferences)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-brand-gray-600">Remaining</span>
                      <p className="text-xl font-bold" style={{ color: goal.color }}>
                        {formatCurrency(goal.targetAmount - goal.currentAmount, undefined, preferences)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Goal Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-brand-gray-50 rounded-2xl">
                    <h5 className="font-semibold text-brand-gray-900 mb-2">Time Remaining</h5>
                    <p className="text-2xl font-bold text-brand-gray-900">{monthsRemaining}</p>
                    <p className="text-sm text-brand-gray-600">months</p>
                  </div>
                  
                  <div className="p-4 bg-brand-gray-50 rounded-2xl">
                    <h5 className="font-semibold text-brand-gray-900 mb-2">Monthly Needed</h5>
                    <p className="text-2xl font-bold text-brand-gray-900">
                      {formatCurrency(monthsRemaining > 0 ? (goal.targetAmount - goal.currentAmount) / monthsRemaining : 0, undefined, preferences)}
                    </p>
                    <p className="text-sm text-brand-gray-600">to reach goal</p>
                  </div>
                </div>

                {/* Quick Actions */}
                {!isCompleted && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => addContribution(goal.id, 1000)}
                      className="bg-brand-green-100 hover:bg-brand-green-200 text-brand-green-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105"
                    >
                      +₹1,000
                    </button>
                    <button
                      onClick={() => addContribution(goal.id, 5000)}
                      className="bg-brand-blue-100 hover:bg-brand-blue-200 text-brand-blue-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105"
                    >
                      +₹5,000
                    </button>
                    <button
                      onClick={() => addContribution(goal.id, 10000)}
                      className="bg-accent-100 hover:bg-accent-200 text-accent-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105"
                    >
                      +₹10,000
                    </button>
                  </div>
                )}

                {isCompleted && (
                  <div className="text-center p-4 bg-gradient-green rounded-2xl">
                    <Trophy className="w-8 h-8 text-white mx-auto mb-2" />
                    <p className="text-white font-bold">🎉 Goal Achieved! 🎉</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivational Section */}
      <div className="card bg-gradient-funky text-white">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-heading font-bold mb-4">Keep Going! You're Doing Great! 🚀</h3>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Every small step counts towards your financial goals. Stay consistent with your contributions and you'll reach your targets sooner than expected!
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">85%</p>
              <p className="text-white/80">Average progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">3.2</p>
              <p className="text-white/80">Months ahead</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">₹2.1L</p>
              <p className="text-white/80">Total saved</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};