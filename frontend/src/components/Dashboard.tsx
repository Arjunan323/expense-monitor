import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Receipt,
  Upload,
  Calendar,
  AlertTriangle,
  Building2,
  Clock
} from 'lucide-react';
import { StatCard } from './ui/StatCard';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { EmptyState } from './ui/EmptyState';
import { DashboardStats } from '../types';
import { apiCall } from '../utils/api';
import { formatCurrency, formatDate, formatDateTime, getCategoryColor } from '../utils/formatters';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiCall<DashboardStats>('GET', '/dashboard/summary');
      setStats(data);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats || stats.transactionCount === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Expense Monitor</h1>
          <p className="text-gray-600">Get started by uploading your first bank statement</p>
        </div>
        
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Upload your PDF bank statements to automatically extract and categorize your transactions using AI"
          action={{
            label: 'Upload Your First Statement',
            onClick: () => navigate('/upload')
          }}
        />
        
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-900">1</span>
              <p>Upload PDF bank statements from any Indian bank</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-900">2</span>
              <p>AI extracts and categorizes transactions automatically</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-900">3</span>
              <p>View insights and track spending patterns</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-900">4</span>
              <p>Get actionable financial insights</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const chartData = stats.topCategories.slice(0, 5).map(cat => ({
    name: cat.category,
    value: Math.abs(cat.amount),
    color: getCategoryColor(cat.category)
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Upload CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
          <div className="flex items-center space-x-4 mt-1">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Last updated: {formatDateTime(stats.lastUpdateTime)}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Building2 className="w-4 h-4" />
              <span>
                {stats.isMultiBank ? 'Multiple Banks' : (stats.bankSources?.[0] || 'Unknown Bank')}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="btn-primary flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Statement</span>
        </button>
      </div>

      {/* Balance Discrepancy Warning */}
      {stats.hasBalanceDiscrepancy && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">Data Not Fully Reconciled</h3>
              <p className="text-sm text-yellow-700 mt-1">
                We've detected multiple bank accounts. Balances may not add up correctly across different statements.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Current Balance"
          value={stats.totalBalance}
          icon={DollarSign}
          format="currency"
          subtitle={stats.isMultiBank ? "Across all accounts" : undefined}
        />
        <StatCard
          title="Monthly Income"
          value={stats.monthlyIncome}
          icon={TrendingUp}
          format="currency"
          subtitle="Credits this month"
        />
        <StatCard
          title="Monthly Expenses"
          value={Math.abs(stats.monthlyExpenses)}
          icon={TrendingDown}
          format="currency"
          subtitle="Debits this month"
        />
        <StatCard
          title="Total Transactions"
          value={stats.transactionCount}
          icon={Receipt}
          format="number"
          subtitle="All uploaded statements"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top 5 Expense Categories</h3>
            <button 
              onClick={() => navigate('/transactions')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all transactions
            </button>
          </div>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No expense data available
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Breakdown</h3>
          <div className="space-y-4">
            {stats.topCategories?.slice(0, 5).map((category, index) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getCategoryColor(category.category) }}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {category.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({category.count} transactions)
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(Math.abs(category.amount))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {typeof category.percentage === 'number' ? category.percentage.toFixed(1) + '%' : 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <button 
            onClick={() => navigate('/transactions')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all transactions
          </button>
        </div>
        <div className="overflow-hidden">
          <div className="space-y-3">
            {(stats.recentTransactions?.slice(0, 8) || []).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getCategoryColor(transaction.category) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transaction.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-gray-500">
                        {formatDate(transaction.date)}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {transaction.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    transaction.amount >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Balance: {formatCurrency(transaction.balance)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};