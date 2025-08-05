import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Receipt,
  PieChart,
  Calendar
} from 'lucide-react';
import { StatCard } from './ui/StatCard';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { EmptyState } from './ui/EmptyState';
import { DashboardStats, Transaction } from '../types';
import { apiCall } from '../utils/api';
import { formatCurrency, formatDate, getCategoryColor } from '../utils/formatters';
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiCall<DashboardStats>('GET', '/dashboard/stats');
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

  if (!stats) {
    return (
      <EmptyState
        icon={Receipt}
        title="No data available"
        description="Upload your first bank statement to see your financial insights"
        action={{
          label: 'Upload Statement',
          onClick: () => window.location.href = '/upload'
        }}
      />
    );
  }

  const chartData = stats.topCategories.map(cat => ({
    name: cat.category,
    value: Math.abs(cat.amount),
    color: getCategoryColor(cat.category)
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Last updated: {formatDate(new Date().toISOString())}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Current Balance"
          value={stats.totalBalance}
          icon={DollarSign}
          format="currency"
        />
        <StatCard
          title="Monthly Income"
          value={stats.monthlyIncome}
          icon={TrendingUp}
          format="currency"
        />
        <StatCard
          title="Monthly Expenses"
          value={Math.abs(stats.monthlyExpenses)}
          icon={TrendingDown}
          format="currency"
        />
        <StatCard
          title="Total Transactions"
          value={stats.transactionCount}
          icon={Receipt}
          format="number"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Expense Categories</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
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
              No category data available
            </div>
          )}
        </div>

        {/* Category List */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Categories</h3>
          <div className="space-y-4">
            {stats.topCategories.slice(0, 6).map((category, index) => (
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
                    {category.percentage.toFixed(1)}%
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
            onClick={() => window.location.href = '/transactions'}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all
          </button>
        </div>
        <div className="overflow-hidden">
          <div className="space-y-3">
            {stats.recentTransactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getCategoryColor(transaction.category) }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(transaction.date)} • {transaction.category}
                    </p>
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