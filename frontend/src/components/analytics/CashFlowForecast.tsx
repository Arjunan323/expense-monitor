import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Calendar, DollarSign, AlertCircle, Target, Zap } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { usePreferences } from '../../contexts/PreferencesContext';

interface ForecastData {
  month: string;
  actual?: number;
  predicted: number;
  isActual: boolean;
}

interface UpcomingTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  recurring: boolean;
}

export const CashFlowForecast: React.FC = () => {
  const { preferences } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sensitivityFactor, setSensitivityFactor] = useState(0);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    date: '',
    type: 'expense' as 'income' | 'expense',
    recurring: false
  });

  const [forecastData, setForecastData] = useState<ForecastData[]>([
    { month: 'Jan 2024', actual: 45000, predicted: 45000, isActual: true },
    { month: 'Feb 2024', actual: 52000, predicted: 52000, isActual: true },
    { month: 'Mar 2024', actual: 48000, predicted: 48000, isActual: true },
    { month: 'Apr 2024', actual: 55000, predicted: 55000, isActual: true },
    { month: 'May 2024', predicted: 50000, isActual: false },
    { month: 'Jun 2024', predicted: 48000, isActual: false },
    { month: 'Jul 2024', predicted: 52000, isActual: false },
    { month: 'Aug 2024', predicted: 49000, isActual: false },
  ]);

  const [upcomingTransactions, setUpcomingTransactions] = useState<UpcomingTransaction[]>([
    { id: '1', description: 'Salary Credit', amount: 75000, date: '2024-05-01', type: 'income', recurring: true },
    { id: '2', description: 'Rent Payment', amount: -25000, date: '2024-05-05', type: 'expense', recurring: true },
    { id: '3', description: 'Insurance Premium', amount: -8000, date: '2024-05-15', type: 'expense', recurring: false },
  ]);

  const [summaryStats, setSummaryStats] = useState({
    predictedBalance: 125000,
    potentialShortfall: 0,
    expectedSurplus: 15000
  });

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const addTransaction = () => {
    if (newTransaction.description && newTransaction.amount && newTransaction.date) {
      const transaction: UpcomingTransaction = {
        id: Date.now().toString(),
        description: newTransaction.description,
        amount: newTransaction.type === 'expense' ? -Math.abs(parseFloat(newTransaction.amount)) : Math.abs(parseFloat(newTransaction.amount)),
        date: newTransaction.date,
        type: newTransaction.type,
        recurring: newTransaction.recurring
      };
      setUpcomingTransactions(prev => [...prev, transaction]);
      setNewTransaction({ description: '', amount: '', date: '', type: 'expense', recurring: false });
      setShowAddForm(false);
    }
  };

  const adjustedForecastData = forecastData.map(item => ({
    ...item,
    predicted: item.predicted + (item.predicted * sensitivityFactor / 100)
  }));

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
          <h1 className="text-4xl font-heading font-bold gradient-text mb-3">Cash Flow Forecast</h1>
          <p className="text-brand-gray-600 text-lg">Predict your future financial position and plan ahead</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stat-card border-brand-blue-200 bg-brand-blue-50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-blue rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-brand-blue-600 bg-brand-blue-100 px-2 py-1 rounded-full">PREDICTED</span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Predicted Balance (EoM)</h3>
            <p className="text-2xl font-bold text-brand-blue-600">{formatCurrency(summaryStats.predictedBalance, undefined, preferences)}</p>
            <p className="text-sm text-brand-gray-500">End of next month</p>
          </div>

          <div className="stat-card border-red-200 bg-red-50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">RISK</span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Potential Shortfall</h3>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summaryStats.potentialShortfall, undefined, preferences)}</p>
            <p className="text-sm text-brand-gray-500">If trends continue</p>
          </div>

          <div className="stat-card border-brand-green-200 bg-brand-green-50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-green rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-brand-green-600 bg-brand-green-100 px-2 py-1 rounded-full">SURPLUS</span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Expected Surplus</h3>
            <p className="text-2xl font-bold text-brand-green-600">{formatCurrency(summaryStats.expectedSurplus, undefined, preferences)}</p>
            <p className="text-sm text-brand-gray-500">Available for savings</p>
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-heading font-bold text-brand-gray-900">Cash Flow Projection</h3>
            <p className="text-brand-gray-600">Predicted balance over the next 6 months</p>
          </div>
          
          {/* Sensitivity Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-brand-gray-600" />
              <span className="text-sm font-medium text-brand-gray-700">What-if:</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSensitivityFactor(-10)}
                className={`px-3 py-1 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  sensitivityFactor === -10 
                    ? 'bg-brand-green-100 text-brand-green-700' 
                    : 'bg-brand-gray-100 text-brand-gray-600 hover:bg-brand-green-50'
                }`}
              >
                -10%
              </button>
              <button
                onClick={() => setSensitivityFactor(0)}
                className={`px-3 py-1 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  sensitivityFactor === 0 
                    ? 'bg-brand-blue-100 text-brand-blue-700' 
                    : 'bg-brand-gray-100 text-brand-gray-600 hover:bg-brand-blue-50'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setSensitivityFactor(10)}
                className={`px-3 py-1 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  sensitivityFactor === 10 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-brand-gray-100 text-brand-gray-600 hover:bg-red-50'
                }`}
              >
                +10%
              </button>
            </div>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={adjustedForecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value, undefined, preferences), 
                  name === 'actual' ? 'Actual' : 'Predicted'
                ]}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 183, 125, 0.1)'
                }}
              />
              <ReferenceLine x="Apr 2024" stroke="#6b7280" strokeDasharray="2 2" />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#00B77D" 
                strokeWidth={3}
                dot={{ fill: '#00B77D', strokeWidth: 2, r: 6 }}
                connectNulls={false}
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#0077B6" 
                strokeWidth={3}
                strokeDasharray="8 8"
                dot={{ fill: '#0077B6', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-brand-green-500 rounded"></div>
            <span className="text-brand-gray-600">Actual</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-brand-blue-500 rounded" style={{ backgroundImage: 'repeating-linear-gradient(to right, #0077B6 0, #0077B6 4px, transparent 4px, transparent 8px)' }}></div>
            <span className="text-brand-gray-600">Predicted</span>
          </div>
        </div>
      </div>

      {/* Upcoming Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-heading font-bold text-brand-gray-900">Upcoming Transactions</h3>
            <p className="text-brand-gray-600">Add or adjust future transactions to update forecast</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>

        {/* Add Transaction Form */}
        {showAddForm && (
          <div className="p-6 bg-gradient-to-br from-brand-green-50 to-brand-blue-50 border-2 border-brand-green-200 rounded-3xl mb-6">
            <h4 className="text-lg font-heading font-bold text-brand-gray-900 mb-4">Add Upcoming Transaction</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., Salary, Rent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                  className="input-field"
                  placeholder="5000"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Type</label>
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                  className="input-field"
                >
                  <option value="income">💰 Income</option>
                  <option value="expense">💸 Expense</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newTransaction.recurring}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, recurring: e.target.checked }))}
                  className="rounded border-brand-gray-300 text-brand-green-600 focus:ring-brand-green-500"
                />
                <span className="text-sm text-brand-gray-700">Recurring monthly</span>
              </label>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={addTransaction}
                  className="btn-primary"
                >
                  Add Transaction
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="space-y-3">
          {upcomingTransactions.map(transaction => (
            <div key={transaction.id} className="flex items-center justify-between p-4 bg-brand-gray-50 rounded-2xl hover:bg-brand-gray-100 transition-colors duration-200">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  transaction.type === 'income' 
                    ? 'bg-brand-green-100 text-brand-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {transaction.type === 'income' ? '💰' : '💸'}
                </div>
                <div>
                  <h4 className="font-semibold text-brand-gray-900">{transaction.description}</h4>
                  <div className="flex items-center space-x-2 text-sm text-brand-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(transaction.date).toLocaleDateString()}</span>
                    {transaction.recurring && (
                      <span className="bg-brand-blue-100 text-brand-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                        Recurring
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${
                  transaction.type === 'income' ? 'text-brand-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : ''}{formatCurrency(Math.abs(transaction.amount), undefined, preferences)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Methodology Info */}
      <div className="card bg-gradient-to-br from-brand-blue-50 to-brand-green-50 border-brand-blue-200">
        <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-4">📊 Forecast Methodology</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-brand-gray-900 mb-3">How we predict:</h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-brand-green-500 rounded-full mt-2"></div>
                <p className="text-sm text-brand-gray-700">Analyze your last 6 months of spending patterns</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-brand-blue-500 rounded-full mt-2"></div>
                <p className="text-sm text-brand-gray-700">Factor in seasonal trends and recurring transactions</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-accent-500 rounded-full mt-2"></div>
                <p className="text-sm text-brand-gray-700">Apply machine learning for improved accuracy</p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-brand-gray-900 mb-3">Accuracy factors:</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-brand-gray-700">Historical data quality</span>
                <span className="text-sm font-bold text-brand-green-600">High</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-brand-gray-700">Spending consistency</span>
                <span className="text-sm font-bold text-brand-blue-600">Medium</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-brand-gray-700">Forecast confidence</span>
                <span className="text-sm font-bold text-accent-600">85%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};