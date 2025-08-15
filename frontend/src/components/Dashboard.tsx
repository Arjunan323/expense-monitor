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
  Clock,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import { StatCard } from './ui/StatCard';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { EmptyState } from './ui/EmptyState';
import { DateRangePicker } from './ui/DateRangePicker';
import { MultiSelect } from './ui/MultiSelect';
import { DashboardStats } from '../types';
import { apiCall } from '../utils/api';
import { formatCurrency, formatDate, formatDateTime, getCategoryColor } from '../utils/formatters';
import { usePreferences } from '../contexts/PreferencesContext';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  // Pull user currency/locale preferences
  const { preferences } = usePreferences();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showPerBank, setShowPerBank] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, [selectedBanks, dateRange]);

  // Only trigger fetch when user clicks Apply in date picker
  const handleDateRangeApply = (start: string, end: string) => {
    setDateRange({ start, end });
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedBanks.length > 0) {
        params.append('banks', selectedBanks.join(','));
      }
      // Always send startDate and endDate, even if empty, to ensure backend receives them as null if not set
      params.append('startDate', dateRange.start || '');
      params.append('endDate', dateRange.end || '');

      const data = await apiCall<DashboardStats>('GET', `/dashboard/summary?${params.toString()}`);
      setStats(data);

      // Initialize selected banks if not set
      if (selectedBanks.length === 0 && data.bankSources.length > 0) {
        setSelectedBanks(data.bankSources);
      }
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Remove handleDateRangeChange, use handleDateRangeApply instead

  const getFilteredStats = () => {
    if (!stats || selectedBanks.length === 0) return stats;
    
    // If all banks selected, return original stats
    if (selectedBanks.length === stats.bankSources.length) return stats;
    
    // Calculate filtered stats based on selected banks
    const filteredBalance = selectedBanks.reduce((sum, bank) => 
      sum + (stats.balanceByBank?.[bank] || 0), 0);
    const filteredIncome = selectedBanks.reduce((sum, bank) => 
      sum + (stats.incomeByBank?.[bank] || 0), 0);
    const filteredExpenses = selectedBanks.reduce((sum, bank) => 
      sum + (stats.expensesByBank?.[bank] || 0), 0);
    const filteredTransactionCount = selectedBanks.reduce((sum, bank) => 
      sum + (stats.transactionCountByBank?.[bank] || 0), 0);

    return {
      ...stats,
      totalBalance: filteredBalance,
      monthlyIncome: filteredIncome,
      monthlyExpenses: filteredExpenses,
      transactionCount: filteredTransactionCount,
      isMultiBank: selectedBanks.length > 1
    };
  };

  const filteredStats = getFilteredStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show onboarding only if there is truly no data and no filters are applied
  const noFiltersApplied = selectedBanks.length === (stats?.bankSources?.length || 0) && !dateRange.start && !dateRange.end;
  if (!stats || (stats.transactionCount === 0 && noFiltersApplied)) {
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


  // Inline empty state message if filters return no results, but show the rest of the dashboard (with zeroed/empty data)
  const showNoResults = stats && filteredStats && filteredStats.transactionCount === 0;

  const bankOptions = stats.bankSources.map(bank => ({
    value: bank,
    label: bank,
    count: stats.transactionCountByBank?.[bank]
  }));

  const chartData = filteredStats?.topCategories?.slice(0, 5).map(cat => ({
    name: cat.category,
    value: Math.abs(cat.amount),
    color: getCategoryColor(cat.category)
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Inline filter empty state */}
      {showNoResults && (
        <div className="card bg-yellow-50 border-yellow-200 text-center py-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2">No results for your filters</h1>
          <p className="text-gray-600">Try adjusting your date range or bank selection to see results.</p>
          <button
            className="btn-primary mt-4"
            onClick={() => {
              setDateRange({ start: '', end: '' });
              setSelectedBanks(stats.bankSources);
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold gradient-text">Financial Overview</h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 space-y-1 sm:space-y-0">
            {stats.lastUpdateTime && (
              <div className="flex items-center space-x-2 text-sm text-brand-gray-500">
                <Clock className="w-4 h-4" />
                <span>Last updated: {formatDateTime(stats.lastUpdateTime)}</span>
              </div>
            )}
            {selectedBanks.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-brand-gray-600">
                <Building2 className="w-4 h-4" />
                <span>
                  {selectedBanks.length === stats.bankSources.length 
                    ? 'All Banks' 
                    : selectedBanks.length === 1 
                    ? selectedBanks[0] 
                    : `${selectedBanks.length} Banks Selected`
                  }
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Multi-bank Selector */}
          {stats.isMultiBank && (
            <div className="relative">
              <MultiSelect
                options={bankOptions}
                selected={selectedBanks}
                onChange={setSelectedBanks}
                placeholder="🏦 Select banks"
                className="min-w-[200px] filter-button"
              />
            </div>
          )}
          
          {/* Date Range Picker */}
          <div className="relative">
            <DateRangePicker
              startDate={dateRange.start}
              endDate={dateRange.end}
              onApply={handleDateRangeApply}
              className="min-w-[200px] filter-button"
            />
          </div>
          
          <button
            onClick={() => navigate('/upload')}
            className="btn-primary flex items-center space-x-2 whitespace-nowrap group"
          >
            <Upload className="w-4 h-4 group-hover:animate-bounce-gentle" />
            <span>Upload Statement</span>
          </button>
        </div>
      </div>

      {/* Balance Discrepancy Warning */}
      {stats.hasBalanceDiscrepancy && selectedBanks.length > 1 && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">Data Not Fully Reconciled</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Multiple bank accounts detected. Balances may not add up correctly across different statements.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Current Balance"
          value={filteredStats?.totalBalance || 0}
          icon={DollarSign}
          format="currency"
          subtitle={selectedBanks.length > 1 ? "Across selected accounts" : undefined}
          showPerBank={showPerBank && stats.isMultiBank}
          bankData={showPerBank ? stats.balanceByBank : undefined}
        />
        <StatCard
          title="Monthly Income"
          value={filteredStats?.monthlyIncome || 0}
          icon={TrendingUp}
          format="currency"
          subtitle="Credits this month"
          showPerBank={showPerBank && stats.isMultiBank}
          bankData={showPerBank ? stats.incomeByBank : undefined}
        />
        <StatCard
          title="Monthly Expenses"
          value={Math.abs(filteredStats?.monthlyExpenses || 0)}
          icon={TrendingDown}
          format="currency"
          subtitle="Debits this month"
          showPerBank={showPerBank && stats.isMultiBank}
          bankData={showPerBank ? stats.expensesByBank : undefined}
        />
        <StatCard
          title="Total Transactions"
          value={filteredStats?.transactionCount || 0}
          icon={Receipt}
          format="number"
          subtitle="Selected period"
          showPerBank={showPerBank && stats.isMultiBank}
          bankData={showPerBank ? stats.transactionCountByBank : undefined}
        />
      </div>

      {/* Per-Bank Toggle */}
      {stats.isMultiBank && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowPerBank(!showPerBank)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {showPerBank ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showPerBank ? 'Hide' : 'Show'} per-bank breakdown</span>
          </button>
        </div>
      )}

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
                  <Tooltip formatter={(value: number) => formatCurrency(value, undefined, preferences)} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No expense data available
            </div>
          )}
        </div>

        {/* Category Breakdown Table */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Breakdown</h3>
          <div className="space-y-4">
            {filteredStats?.topCategories?.slice(0, 6).map((category, index) => (
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
                    {formatCurrency(Math.abs(category.amount), undefined, preferences)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {typeof category.percentage === 'number' ? category.percentage.toFixed(1) + '%' : 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {showPerBank && stats.isMultiBank && stats.topCategoriesByBank && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Per-Bank Breakdown</h4>
              {selectedBanks.map(bank => (
                <div key={bank} className="mb-4">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">{bank}</h5>
                  <div className="space-y-2">
                    {stats.topCategoriesByBank[bank]?.slice(0, 3).map(cat => (
                      <div key={`${bank}-${cat.category}`} className="flex justify-between text-xs">
                        <span className="text-gray-600">{cat.category}</span>
                        <span className="font-medium">{formatCurrency(Math.abs(cat.amount), undefined, preferences)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
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
            {(filteredStats?.recentTransactions?.slice(0, 8) || []).map((transaction) => (
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
                      {transaction.bankName && (
                        <span className="text-xs text-gray-400">•</span>
                      )}
                      {transaction.bankName && (
                        <span className="text-xs text-gray-500">{transaction.bankName}</span>
                      )}
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
                    {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount, undefined, preferences)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Balance: {formatCurrency(transaction.balance, undefined, preferences)}
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