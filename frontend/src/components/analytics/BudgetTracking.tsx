import React, { useState, useEffect } from 'react';
import { Target, Plus, Edit3, Check, X, AlertTriangle, TrendingUp, PiggyBank } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import { usePreferences } from '../../contexts/PreferencesContext';

import { budgetsApi, BudgetCategoryUsageDto, BudgetSummaryResponse } from '../../api/budgets';
import { fetchCategories } from '../../utils/api';
import { CategoryRecord } from '../../types';

interface LocalBudgetCategory extends BudgetCategoryUsageDto {
  budget: number; // alias for monthlyBudget for existing code readability
}

export const BudgetTracking: React.FC = () => {
  const { preferences } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`; // YYYY-MM
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', budget: '', icon: '💰' });

  const [budgets, setBudgets] = useState<LocalBudgetCategory[]>([]);
  const [summary, setSummary] = useState<BudgetSummaryResponse | null>(null);
  const [allCategories, setAllCategories] = useState<CategoryRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const [cats, summaryResp] = await Promise.all([
          fetchCategories().catch(()=>[]),
          budgetsApi.summary(selectedMonth)
        ]);
        if(cancelled) return;
        setAllCategories(cats);
        setSummary(summaryResp);
        setBudgets(summaryResp.categories.map(c => ({ ...c, budget: c.monthlyBudget })));
      } catch (e) {
        if(!cancelled) console.error('Failed to load budgets', e);
      } finally { if(!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedMonth]);

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
        // optimistic update
        setBudgets(prev => prev.map(b => b.id === Number(id) ? { ...b, monthlyBudget: newBudget, budget: newBudget } : b));
        // refresh summary silently
  budgetsApi.summary(selectedMonth).then(s => { setSummary(s); setBudgets(s.categories.map(c => ({ ...c, budget: c.monthlyBudget }))); });
      } catch(e){ console.error(e); }
    }
    setEditingId(null);
    setEditValue('');
  };

  const addNewCategory = async () => {
    if (newCategory.name && newCategory.budget) {
      try {
        await budgetsApi.create({ name: newCategory.name, monthlyBudget: parseFloat(newCategory.budget), icon: newCategory.icon, color: '#00B77D' });
  const s = await budgetsApi.summary(selectedMonth);
        setSummary(s);
        setBudgets(s.categories.map(c => ({ ...c, budget: c.monthlyBudget })));
        setNewCategory({ name: '', budget: '', icon: '💰' });
        setShowAddForm(false);
      } catch(e){ console.error(e); }
    }
  };

  const totalBudget = summary?.totals.totalBudget ?? budgets.reduce((sum,b)=> sum + b.budget,0);
  const totalSpent = summary?.totals.totalSpent ?? budgets.reduce((sum,b)=> sum + b.spent,0);
  const overBudgetCount = summary?.totals.overBudgetCount ?? budgets.filter(b=> b.spent > b.budget).length;

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
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-heading font-bold gradient-text mb-3">Budget Tracking</h1>
              <p className="text-brand-gray-600 text-lg">Set budgets by category and track your spending progress</p>
            </div>
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-brand-gray-700">Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e)=> setSelectedMonth(e.target.value)}
                className="input-field !py-2 !px-3"
                max={`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`}
              />
            </div>
          </div>
          {summary && (
            <p className="text-xs text-brand-gray-500 mt-1">Showing data for {new Date(selectedMonth + '-01T00:00:00').toLocaleString(undefined, { month:'long', year:'numeric' })}</p>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-blue rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-brand-blue-600 bg-brand-blue-100 px-2 py-1 rounded-full">TOTAL</span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Total Budget</h3>
            <p className="text-2xl font-bold text-brand-gray-900">{formatCurrency(totalBudget, undefined, preferences)}</p>
            <p className="text-sm text-brand-gray-500">This month</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                totalSpent > totalBudget ? 'bg-gradient-to-br from-red-400 to-red-600' : 'bg-gradient-green'
              }`}>
                <PiggyBank className="w-6 h-6 text-white" />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                totalSpent > totalBudget 
                  ? 'text-red-600 bg-red-100' 
                  : 'text-brand-green-600 bg-brand-green-100'
              }`}>
                {totalSpent > totalBudget ? 'OVER' : 'UNDER'}
              </span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Total Spent</h3>
            <p className="text-2xl font-bold text-brand-gray-900">{formatCurrency(totalSpent, undefined, preferences)}</p>
            <p className="text-sm text-brand-gray-500">
              {((totalSpent / totalBudget) * 100).toFixed(1)}% of budget
            </p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                overBudgetCount > 0 ? 'bg-gradient-to-br from-red-400 to-red-600' : 'bg-gradient-green'
              }`}>
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                overBudgetCount > 0 
                  ? 'text-red-600 bg-red-100' 
                  : 'text-brand-green-600 bg-brand-green-100'
              }`}>
                {overBudgetCount > 0 ? 'ALERTS' : 'ON TRACK'}
              </span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Over Budget</h3>
            <p className="text-2xl font-bold text-brand-gray-900">{overBudgetCount}</p>
            <p className="text-sm text-brand-gray-500">
              {overBudgetCount > 0 ? 'categories need attention' : 'All categories on track'}
            </p>
          </div>
        </div>
      </div>

      {/* Budget Categories */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-heading font-bold text-brand-gray-900">Budget Categories</h3>
            <p className="text-brand-gray-600">Manage your spending limits by category</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>

        <div className="space-y-4">
          {budgets.map(budget => {
            const percentage = budget.progressPercent ?? getProgressPercentage(budget.spent, budget.budget);
            const isOverBudget = budget.over ?? (budget.spent > budget.budget);
            const isNearBudget = budget.near ?? (percentage >= 80 && !isOverBudget);

            return (
              <div key={budget.id} className="p-6 bg-white border-2 border-brand-gray-100 rounded-3xl hover:shadow-funky transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: budget.color + '20' }}>
                      {budget.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-heading font-bold text-brand-gray-900">{budget.name}</h4>
                      <p className="text-sm text-brand-gray-600">
                        {formatCurrency(budget.spent, undefined, preferences)} of {formatCurrency(budget.budget, undefined, preferences)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {isOverBudget && (
                      <span className="bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full">
                        Over Budget
                      </span>
                    )}
                    {isNearBudget && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                        Near Limit
                      </span>
                    )}
                    
                    {editingId === budget.id.toString() ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24 px-3 py-1 border border-brand-gray-300 rounded-xl text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => saveBudget(budget.id.toString())}
                          className="text-brand-green-600 hover:text-brand-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-brand-gray-600 hover:text-brand-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditBudget(budget.id.toString(), budget.budget)}
                        className="text-brand-gray-600 hover:text-brand-blue-600 transition-colors duration-200"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-gray-600">Progress</span>
                    <span className="font-semibold" style={{ color: getProgressColor(budget.spent, budget.budget) }}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-brand-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: getProgressColor(budget.spent, budget.budget)
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-brand-gray-500">
                    <span>Spent: {formatCurrency(budget.spent, undefined, preferences)}</span>
                    <span>Remaining: {formatCurrency(Math.max(0, budget.budget - budget.spent), undefined, preferences)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Category Form */}
        {showAddForm && (
          <div className="p-6 bg-gradient-to-br from-brand-green-50 to-brand-blue-50 border-2 border-brand-green-200 rounded-3xl">
            <h4 className="text-lg font-heading font-bold text-brand-gray-900 mb-4">Add New Budget Category</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Category</label>
                <select
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Select category</option>
                  {allCategories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Monthly Budget</label>
                <input
                  type="number"
                  value={newCategory.budget}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, budget: e.target.value }))}
                  className="input-field"
                  placeholder="5000"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Icon</label>
                <select
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                  className="input-field"
                >
                  <option value="💰">💰 Money</option>
                  <option value="🍕">🍕 Food</option>
                  <option value="🚗">🚗 Transport</option>
                  <option value="🏠">🏠 Housing</option>
                  <option value="🎬">🎬 Entertainment</option>
                  <option value="👕">👕 Shopping</option>
                  <option value="🏥">🏥 Healthcare</option>
                  <option value="📚">📚 Education</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={addNewCategory}
                disabled={!newCategory.name || !newCategory.budget}
                className="btn-primary disabled:opacity-50"
              >
                Add Category
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Budget History */}
      <div className="card">
        <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-6">Budget Adherence History</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-brand-green-50 rounded-3xl border border-brand-green-200">
            <div className="w-16 h-16 bg-gradient-green rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-bold text-brand-gray-900 mb-2">This Month</h4>
            <p className="text-3xl font-bold text-brand-green-600 mb-1">{summary ? Math.round(summary.history.thisMonthAdherence) + '%' : '—'}</p>
            <p className="text-sm text-brand-gray-600">Budget adherence</p>
          </div>
          
          <div className="text-center p-6 bg-brand-blue-50 rounded-3xl border border-brand-blue-200">
            <div className="w-16 h-16 bg-gradient-blue rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-bold text-brand-gray-900 mb-2">Last Month</h4>
            <p className="text-3xl font-bold text-brand-blue-600 mb-1">{summary ? Math.round(summary.history.lastMonthAdherence) + '%' : '—'}</p>
            <p className="text-sm text-brand-gray-600">Budget adherence</p>
          </div>
          
          <div className="text-center p-6 bg-accent-50 rounded-3xl border border-accent-200">
            <div className="w-16 h-16 bg-gradient-yellow rounded-full flex items-center justify-center mx-auto mb-4">
              <PiggyBank className="w-8 h-8 text-brand-gray-900" />
            </div>
            <h4 className="text-lg font-bold text-brand-gray-900 mb-2">Avg. 6 Months</h4>
            <p className="text-3xl font-bold text-accent-600 mb-1">{summary ? Math.round(summary.history.avg6MonthsAdherence) + '%' : '—'}</p>
            <p className="text-sm text-brand-gray-600">Budget adherence</p>
          </div>
        </div>
      </div>

      {/* Tips & Recommendations */}
      <div className="card bg-gradient-to-br from-brand-green-50 to-brand-blue-50 border-brand-green-200">
        <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-4">💡 Budget Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-brand-green-500 rounded-full mt-2"></div>
              <p className="text-sm text-brand-gray-700">Set realistic budgets based on your 3-month average spending.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-brand-blue-500 rounded-full mt-2"></div>
              <p className="text-sm text-brand-gray-700">Review and adjust budgets monthly to stay on track.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-accent-500 rounded-full mt-2"></div>
              <p className="text-sm text-brand-gray-700">Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-brand-green-500 rounded-full mt-2"></div>
              <p className="text-sm text-brand-gray-700">Track daily to avoid month-end budget surprises.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};