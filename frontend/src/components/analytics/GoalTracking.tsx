import React, { useState, useEffect } from 'react';
import { Target, Plus, Trophy, Calendar, TrendingUp, PiggyBank, Home, Plane, GraduationCap, Edit3, CheckCircle, Trash2, X } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { usePreferences } from '../../contexts/PreferencesContext';
import { goalsApi, GoalDto, GoalStatsDto } from '../../api/client';
import toast from 'react-hot-toast';

type GoalCategory = 'savings' | 'debt' | 'investment' | 'travel' | 'education' | 'home' | 'retirement' | 'health' | 'wedding' | 'car' | 'emergency';
interface Goal extends GoalDto { color?: string; icon?: string; category: GoalCategory; }

export const GoalTracking: React.FC = () => {
  const { preferences } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Goal>>({});
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetAmount: '',
    targetDate: '',
    category: 'savings' as GoalCategory,
    icon: '🎯'
  });

  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<GoalStatsDto | null>(null);
  const CATEGORY_META: Record<GoalCategory, { color: string; icon: string; badgeBg: string; badgeText: string; label: string }> = {
    savings:    { color: '#00B77D', icon: '💰', badgeBg: 'bg-brand-green-100', badgeText: 'text-brand-green-700', label: 'Savings' },
    debt:       { color: '#EF4444', icon: '💳', badgeBg: 'bg-red-100',          badgeText: 'text-red-700',          label: 'Debt Reduction' },
    investment: { color: '#0077B6', icon: '📈', badgeBg: 'bg-brand-blue-100',   badgeText: 'text-brand-blue-700',   label: 'Investment' },
    travel:     { color: '#F59E0B', icon: '✈️', badgeBg: 'bg-amber-100',        badgeText: 'text-amber-700',        label: 'Travel' },
    education:  { color: '#6366F1', icon: '🎓', badgeBg: 'bg-indigo-100',       badgeText: 'text-indigo-700',       label: 'Education' },
    home:       { color: '#0EA5E9', icon: '🏠', badgeBg: 'bg-sky-100',          badgeText: 'text-sky-700',          label: 'Home' },
    retirement: { color: '#16A34A', icon: '🛡️', badgeBg: 'bg-green-100',       badgeText: 'text-green-700',        label: 'Retirement' },
    health:     { color: '#DC2626', icon: '🩺', badgeBg: 'bg-rose-100',         badgeText: 'text-rose-700',         label: 'Health' },
    wedding:    { color: '#DB2777', icon: '💍', badgeBg: 'bg-pink-100',         badgeText: 'text-pink-700',         label: 'Wedding' },
    car:        { color: '#2563EB', icon: '�', badgeBg: 'bg-blue-100',         badgeText: 'text-blue-700',         label: 'Car' },
    emergency:  { color: '#F97316', icon: '🚨', badgeBg: 'bg-orange-100',       badgeText: 'text-orange-700',       label: 'Emergency Fund' }
  };
  const categoryColor = (c:GoalCategory) => CATEGORY_META[c]?.color || '#0077B6';
  const defaultIcon = (c:GoalCategory) => CATEGORY_META[c]?.icon || '🎯';
  const coerceCategory = (c:string): GoalCategory => (Object.keys(CATEGORY_META) as GoalCategory[]).includes(c as GoalCategory) ? c as GoalCategory : 'savings';

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [list, s] = await Promise.all([goalsApi.list(), goalsApi.stats()]);
        if(!active) return;
  setGoals(list.map(g => { const cat = coerceCategory(g.category); return ({ ...g, category: cat, color: g.color || categoryColor(cat), icon: g.icon || defaultIcon(cat) }); }) as Goal[]);
        setStats(s);
      } catch (e) {
        console.error('Failed loading goals', e); toast.error('Failed to load goals');
      } finally { if(active) setLoading(false); }
    })();
    return () => { active = false; };
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

  const addContribution = async (goalId: number, amount: number) => {
    // optimistic update
    setGoals(prev => prev.map(g => g.id===goalId ? { ...g, currentAmount: Math.min(g.currentAmount + amount, g.targetAmount) } : g));
    try {
      const updated = await goalsApi.contribute(goalId, amount);
      setGoals(prev => prev.map(g => g.id === updated.id ? { ...(updated as any), color: g.color, icon: g.icon } : g));
      goalsApi.invalidateStats(); const s = await goalsApi.stats(); setStats(s);
    } catch(e){ toast.error('Contribution failed'); }
  };

  const addNewGoal = async () => {
    if (newGoal.title && newGoal.targetAmount && newGoal.targetDate) {
      try {
        const payload = {
          title: newGoal.title,
            description: newGoal.description,
            targetAmount: parseFloat(newGoal.targetAmount),
            targetDate: newGoal.targetDate,
            category: newGoal.category,
            icon: newGoal.icon,
            color: categoryColor(newGoal.category),
            monthlyContribution: 0
        };
        const created = await goalsApi.create(payload as any);
        setGoals(prev => [...prev, { ...(created as any), color: payload.color, icon: payload.icon }]);
        setNewGoal({ title: '', description: '', targetAmount: '', targetDate: '', category: 'savings', icon: '🎯' });
        setShowAddForm(false);
        const s = await goalsApi.stats(); setStats(s);
      } catch(e){ console.error('Create goal failed', e); toast.error('Create goal failed'); }
    }
  };

  const startEdit = (g:Goal) => { setEditingGoalId(g.id); setEditDraft({ ...g, targetAmount: g.targetAmount, monthlyContribution: g.monthlyContribution }); };
  const cancelEdit = () => { setEditingGoalId(null); setEditDraft({}); };
  const saveEdit = async () => {
    if(editingGoalId==null) return; const id = editingGoalId;
    try {
      const payload:any = { ...editDraft }; delete payload.id; // ensure id not sent if backend disallows
      const updated = await goalsApi.update(id, payload);
      setGoals(prev => prev.map(g => {
        if(g.id!==id) return g;
        const cat = coerceCategory((updated as any).category);
        return { ...(updated as any), category: cat, color: g.color || categoryColor(cat), icon: g.icon || defaultIcon(cat) };
      }));
      setEditingGoalId(null); setEditDraft({}); goalsApi.invalidateStats(); const s = await goalsApi.stats(); setStats(s); toast.success('Goal updated');
    } catch(e){ toast.error('Update failed'); }
  };

  const deleteGoal = async (id:number) => {
    const existing = goals.find(g => g.id===id); if(!existing) return;
    if(!confirm(`Delete goal "${existing.title}"?`)) return;
    const prev = goals; setGoals(prev.filter(g => g.id!==id));
    try { await goalsApi.delete(id); goalsApi.invalidateStats(); const s = await goalsApi.stats(); setStats(s); toast.success('Goal deleted'); }
    catch(e){ toast.error('Delete failed'); setGoals(prev); }
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
          <h1 className="text-4xl font-heading font-bold mb-3 flex items-center gap-3">
            <span className="select-none leading-none">🏆</span>
            <span className="gradient-text">Goal Tracking</span>
          </h1>
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
            <p className="text-3xl font-bold text-brand-blue-600">{stats ? stats.activeGoals : activeGoals.length}</p>
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
            <p className="text-3xl font-bold text-brand-green-600">{stats ? stats.completedGoals : completedGoals.length}</p>
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
              {formatCurrency(stats ? stats.totalSaved : goals.reduce((sum, g) => sum + g.currentAmount, 0), undefined, preferences)}
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
              {formatCurrency(stats ? stats.monthlyTarget : goals.reduce((sum, g) => sum + (g.monthlyContribution || 0), 0), undefined, preferences)}
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
                  onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value as GoalCategory }))}
                  className="input-field"
                >
                  {Object.entries(CATEGORY_META).map(([value, meta]) => (
                    <option key={value} value={value}>{meta.icon} {meta.label}</option>
                  ))}
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
            const projectedDate = getProjectedDate(goal.currentAmount, goal.targetAmount, goal.monthlyContribution || 0);
            const isEditing = editingGoalId === goal.id;

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
                      {isEditing ? (
                        <input className="input-field mb-2" value={editDraft.title as any || ''} onChange={e=>setEditDraft(d=>({...d,title:e.target.value}))} />
                      ) : (
                        <h4 className="text-xl font-heading font-bold text-brand-gray-900 mb-1">{goal.title}</h4>
                      )}
                      {isEditing ? (
                        <textarea className="input-field mb-2" rows={2} value={editDraft.description as any || ''} onChange={e=>setEditDraft(d=>({...d,description:e.target.value}))} />
                      ) : (
                        <p className="text-brand-gray-600 mb-2">{goal.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-brand-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          {isEditing ? (
                            <input type="date" className="input-field py-0 h-6" value={editDraft.targetDate as any || goal.targetDate} onChange={e=>setEditDraft(d=>({...d,targetDate:e.target.value}))} />
                          ) : (
                            <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${CATEGORY_META[goal.category]?.badgeBg} ${CATEGORY_META[goal.category]?.badgeText}`}>
                          {CATEGORY_META[goal.category]?.label || goal.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center space-x-2">
                      {!isCompleted && !isEditing && (
                        <button 
                          onClick={() => startEdit(goal)}
                          className="bg-brand-blue-100 hover:bg-brand-blue-200 text-brand-blue-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      )}
                      {isEditing && (
                        <>
                          <button 
                            onClick={saveEdit}
                            className="bg-gradient-green text-white px-4 py-2 rounded-2xl font-semibold text-sm shadow-glow-green hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Save</span>
                          </button>
                          <button 
                            onClick={cancelEdit}
                            className="bg-brand-gray-200 hover:bg-brand-gray-300 text-brand-gray-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                        </>
                      )}
                      {!isEditing && (
                        <button 
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete the goal "${goal.title}"? This action cannot be undone.`)) {
                              deleteGoal(goal.id as any);
                            }
                          }}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 flex items-center space-x-2 group"
                        >
                          <Trash2 className="w-4 h-4 group-hover:animate-wiggle" />
                          <span>Delete</span>
                        </button>
                      )}
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
                      {isEditing ? (
                        <input type="number" className="input-field" value={editDraft.currentAmount as any ?? goal.currentAmount} onChange={e=>setEditDraft(d=>({...d,currentAmount: parseFloat(e.target.value)}))} />
                      ) : (
                        <p className="text-xl font-bold text-brand-gray-900">
                          {formatCurrency(goal.currentAmount, undefined, preferences)}
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-brand-gray-600">Target Amount</span>
                      {isEditing ? (
                        <input type="number" className="input-field" value={editDraft.targetAmount as any ?? goal.targetAmount} onChange={e=>setEditDraft(d=>({...d,targetAmount: parseFloat(e.target.value)}))} />
                      ) : (
                        <p className="text-xl font-bold text-brand-gray-900">
                          {formatCurrency(goal.targetAmount, undefined, preferences)}
                        </p>
                      )}
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
                  <div className="p-4 bg-brand-gray-50 rounded-2xl">
                    <h5 className="font-semibold text-brand-gray-900 mb-2">Monthly Contribution</h5>
                    {isEditing ? (
                      <input type="number" className="input-field" value={(editDraft.monthlyContribution as any) ?? (goal.monthlyContribution || 0)} onChange={e=>setEditDraft(d=>({...d,monthlyContribution: parseFloat(e.target.value)}))} />
                    ) : (
                      <p className="text-2xl font-bold text-brand-gray-900">{formatCurrency(goal.monthlyContribution || 0, undefined, preferences)}</p>
                    )}
                    <p className="text-sm text-brand-gray-600">planned per month</p>
                  </div>
                </div>

                {/* Quick Actions */}
                {!isCompleted && !isEditing && (
                  <div className="space-y-4">
                    <h5 className="text-sm font-semibold text-brand-gray-700">Quick Contributions</h5>
                    <div className="grid grid-cols-3 gap-3">
                      {[1000, 5000, 10000].map(v => {
                        const label = formatCurrency(v, undefined, preferences).replace(/\.00$/, '');
                        const colors = {
                          1000: 'bg-gradient-green text-white shadow-glow-green',
                          5000: 'bg-gradient-blue text-white shadow-glow-blue',
                          10000: 'bg-gradient-yellow text-brand-gray-900 shadow-glow-yellow'
                        };
                        return (
                          <button
                            key={v}
                            onClick={() => addContribution(goal.id as any, v)}
                            className={`${colors[v as keyof typeof colors]} px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center space-x-2`}
                          >
                            <span>+{label}</span>
                            <span className="text-lg">🚀</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isCompleted && (
                  <div className="text-center p-6 bg-gradient-green rounded-3xl shadow-glow-green">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-8 h-8 text-white animate-bounce-gentle" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">🎉 Goal Achieved! 🎉</h4>
                    <p className="text-white/90">Congratulations on reaching your target!</p>
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
              <p className="text-2xl font-bold text-white">{formatCurrency(stats ? stats.totalSaved : goals.reduce((sum, g) => sum + g.currentAmount, 0), undefined, preferences)}</p>
              <p className="text-white/80">Total saved</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};