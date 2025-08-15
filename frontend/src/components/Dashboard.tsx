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
import { DashboardStats, UsageStats } from '../types';
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
  // selectedBanks are applied banks used for API calls
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]); // applied banks
  // bankDraft holds in-progress selection in the multiselect before Apply
  const [bankDraft, setBankDraft] = useState<string[]>([]);
  const [allBanks, setAllBanks] = useState<string[]>([]); // original unfiltered list
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showPerBank, setShowPerBank] = useState(false);
  const navigate = useNavigate();
  // Read combined bank limit from usage endpoint via a lightweight fetch (could also use existing context if available)
  const [usage, setUsage] = useState<UsageStats | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const resp = await apiCall<UsageStats>('GET', '/user/usage');
        setUsage(resp);
      } catch {}
    })();
  }, []);

  // Only PRO & PREMIUM plans can view per-bank breakdown
  const isPerBankEligible = ['PRO','PREMIUM'].includes(usage?.planType || '');
  useEffect(() => {
    if (!isPerBankEligible && showPerBank) setShowPerBank(false);
  }, [isPerBankEligible, showPerBank]);

  // Fetch only on mount and when date range changes; bank selection is client-side
  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.start, dateRange.end]);

  // Only trigger fetch when user clicks Apply in date picker
  const handleDateRangeApply = (start: string, end: string) => {
    setDateRange({ start, end });
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
  const params = new URLSearchParams();
  params.append('startDate', dateRange.start || '');
  params.append('endDate', dateRange.end || '');

      const data = await apiCall<DashboardStats>('GET', `/dashboard/summary?${params.toString()}`);
      setStats(data);
      if (allBanks.length === 0 && data.bankSources?.length) {
        setAllBanks(data.bankSources);
      }

      // Initialize selected banks if not set
      if (selectedBanks.length === 0) {
        const sourceList = allBanks.length ? allBanks : data.bankSources;
        if (sourceList?.length) {
          setSelectedBanks(sourceList);
          setBankDraft(sourceList);
        }
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
    if (!stats) return stats;
    if (!selectedBanks.length) return stats;
    const sourceAll = allBanks.length ? allBanks : stats.bankSources;
    if (selectedBanks.length === sourceAll.length) return stats;
    const totalBalance = selectedBanks.reduce((s,b)=> s + (stats.balanceByBank?.[b]||0),0);
    const monthlyIncome = selectedBanks.reduce((s,b)=> s + (stats.incomeByBank?.[b]||0),0);
    const monthlyExpenses = selectedBanks.reduce((s,b)=> s + (stats.expensesByBank?.[b]||0),0);
    const transactionCount = selectedBanks.reduce((s,b)=> s + (stats.transactionCountByBank?.[b]||0),0);
    // Aggregate categories
    const catAgg: Record<string,{amount:number; count:number; abs:number}> = {};
    selectedBanks.forEach(b => {
      (stats.topCategoriesByBank?.[b]||[]).forEach(c => {
        if (!catAgg[c.category]) catAgg[c.category] = {amount:0,count:0,abs:0};
        catAgg[c.category].amount += c.amount;
        catAgg[c.category].count += c.count;
        catAgg[c.category].abs += Math.abs(c.amount);
      });
    });
    const totalAbs = Object.values(catAgg).reduce((s,v)=>s+v.abs,0);
    const topCategories = Object.entries(catAgg)
      .map(([category,v])=>({category, amount:v.amount, count:v.count, percentage: totalAbs? (v.abs/totalAbs)*100:0}))
      .sort((a,b)=> Math.abs(b.amount)-Math.abs(a.amount))
      .slice(0,6);
    const recentTransactions = (stats.recentTransactions||[]).filter(t=> !t.bankName || selectedBanks.includes(t.bankName));
    return { ...stats, totalBalance, monthlyIncome, monthlyExpenses, transactionCount, topCategories, recentTransactions, multiBank: selectedBanks.length>1 };
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
  const noFiltersApplied = selectedBanks.length === ((allBanks.length? allBanks : stats?.bankSources)||[]).length && !dateRange.start && !dateRange.end;
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

  const bankOptions = (allBanks.length ? allBanks : (stats?.bankSources||[])).map(bank => ({
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
      <div className="space-y-6">
        {/* Title Section */}
        <div>
          <h1 className="text-4xl font-heading font-bold gradient-text mb-3">Financial Overview</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-brand-gray-500">
            {stats.lastUpdateTime && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Last updated: {formatDateTime(stats.lastUpdateTime)}</span>
              </div>
            )}
            {selectedBanks.length > 0 && (
              <div className="flex items-center space-x-2">
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
        
        {/* Filters and Actions Bar */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-brand-gray-100 p-6 shadow-funky">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Left Side - Filters */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Multi-bank Selector */}
              {( (allBanks.length ? allBanks.length : stats.bankSources.length) > 1) && (
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <MultiSelect
                      options={bankOptions}
                      selected={bankDraft}
                      onChange={(next) => {
                        const limit = usage?.combinedBankLimit || (usage?.planType === 'PREMIUM' ? 5 : usage?.planType === 'PRO' ? 3 : 2);
                        if (next.length > limit) return; // hard cap
                        setBankDraft(next);
                      }}
                      placeholder={`🏦 Select Banks`}
                      className="min-w-[280px] bg-white border-2 border-brand-gray-200 hover:border-brand-green-400 rounded-2xl px-4 py-3 text-sm font-medium text-brand-gray-700 transition-all duration-300 hover:shadow-funky focus:ring-4 focus:ring-brand-green-200"
                    />
                  </div>
                  <button
                    className="bg-gradient-green text-white px-6 py-3 rounded-2xl font-semibold text-sm shadow-glow-green hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={bankDraft.sort().join(',') === selectedBanks.sort().join(',')}
                    onClick={() => setSelectedBanks(bankDraft)}
                  >
                    Apply ({bankDraft.length}/{usage?.combinedBankLimit || (usage?.planType === 'PREMIUM' ? 5 : usage?.planType === 'PRO' ? 3 : 2)})
                  </button>
                </div>
              )}
              
              {/* Date Range Picker */}
              <div className="relative">
                <DateRangePicker
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  onApply={handleDateRangeApply}
                  className="min-w-[240px] bg-white border-2 border-brand-gray-200 hover:border-brand-blue-400 rounded-2xl px-4 py-3 text-sm font-medium text-brand-gray-700 transition-all duration-300 hover:shadow-funky focus:ring-4 focus:ring-brand-blue-200"
                />
              </div>
            </div>
            
            {/* Right Side - Upload Button */}
            <div className="flex justify-end">
              <button
                onClick={() => navigate('/upload')}
                className="bg-gradient-yellow text-brand-gray-900 font-bold px-8 py-4 rounded-2xl shadow-glow-yellow hover:scale-105 active:scale-95 transition-all duration-300 flex items-center space-x-3 group"
              >
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                  <Upload className="w-4 h-4 group-hover:animate-bounce-gentle" />
                </div>
                <span className="text-lg">Upload Statement</span>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </button>
            </div>
          </div>
          
          {/* Selected Banks Display */}
          {selectedBanks.length > 0 && selectedBanks.length < (allBanks.length || stats.bankSources.length) && (
            <div className="mt-4 pt-4 border-t border-brand-gray-100">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-brand-gray-600">Selected Banks:</span>
                {selectedBanks.map(bank => (
                  <span key={bank} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-green-100 text-brand-green-800 border border-brand-green-200">
                    <Building2 className="w-3 h-3 mr-1" />
                    {bank}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Date Range Display */}
          {(dateRange.start || dateRange.end) && (
            <div className="mt-4 pt-4 border-t border-brand-gray-100">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-brand-gray-600">Date Range:</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-blue-100 text-brand-blue-800 border border-brand-blue-200">
                  <Calendar className="w-3 h-3 mr-1" />
                  {dateRange.start && dateRange.end 
                    ? `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`
                    : dateRange.start 
                    ? `From ${formatDate(dateRange.start)}`
                    : `Until ${formatDate(dateRange.end)}`
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clear Filters Button */}
      {(selectedBanks.length < (allBanks.length || stats.bankSources.length) || dateRange.start || dateRange.end) && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setDateRange({ start: '', end: '' });
              const allBanksList = allBanks.length ? allBanks : stats.bankSources;
              setSelectedBanks(allBanksList);
              setBankDraft(allBanksList);
            }}
            className="bg-white border-2 border-brand-gray-200 hover:border-brand-gray-400 text-brand-gray-700 hover:text-brand-gray-900 px-6 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:shadow-funky flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear All Filters</span>
          </button>
        </div>
      )}

      {/* Multi-bank Selector */}
      {( (allBanks.length ? allBanks.length : stats.bankSources.length) > 1) && (
        <div className="flex items-center space-x-2">
          <div className="relative">
            <MultiSelect
              options={bankOptions}
              selected={bankDraft}
              onChange={(next) => {
                const limit = usage?.combinedBankLimit || (usage?.planType === 'PREMIUM' ? 5 : usage?.planType === 'PRO' ? 3 : 2);
                if (next.length > limit) return; // hard cap
                setBankDraft(next);
              }}
              placeholder={`🏦 Banks (${bankDraft.length}/${usage?.combinedBankLimit || (usage?.planType === 'PREMIUM' ? 5 : usage?.planType === 'PRO' ? 3 : 2)})`}
              className="min-w-[240px] filter-button"
            />
          </div>
          <button
            className="btn-secondary h-10 px-3 text-xs"
            disabled={bankDraft.sort().join(',') === selectedBanks.sort().join(',')}
            onClick={() => setSelectedBanks(bankDraft)}
          >
            Apply ({bankDraft.length}/{usage?.combinedBankLimit || (usage?.planType === 'PREMIUM' ? 5 : usage?.planType === 'PRO' ? 3 : 2)})
          </button>
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
    </div>
     <button
        onClick={() => navigate('/upload')}
        className="btn-primary flex items-center space-x-2 whitespace-nowrap group"
      >
        <Upload className="w-4 h-4 group-hover:animate-bounce-gentle" />
        <span>Upload Statement</span>
      </button>
  </div>
          {/* Multi-bank Selector */}
    {( (allBanks.length ? allBanks.length : stats.bankSources.length) > 1) && (
            <div className="flex items-center space-x-2">
              <div className="relative">
                <MultiSelect
                  options={bankOptions}
                  selected={bankDraft}
                  onChange={(next) => {
                    const limit = usage?.combinedBankLimit || (usage?.planType === 'PREMIUM' ? 5 : usage?.planType === 'PRO' ? 3 : 2);
                    if (next.length > limit) return; // hard cap
                    setBankDraft(next);
                  }}
      placeholder={`🏦 Banks (${bankDraft.length}/${usage?.combinedBankLimit || (usage?.planType === 'PREMIUM' ? 5 : usage?.planType === 'PRO' ? 3 : 2)})`}
                  className="min-w-[240px] filter-button"
                />
              </div>
              <button
                className="btn-secondary h-10 px-3 text-xs"
                disabled={bankDraft.sort().join(',') === selectedBanks.sort().join(',')}
                onClick={() => setSelectedBanks(bankDraft)}
              >
                Apply ({bankDraft.length}/{usage?.combinedBankLimit || (usage?.planType === 'PREMIUM' ? 5 : usage?.planType === 'PRO' ? 3 : 2)})
              </button>
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
        </div>
         <button
            onClick={() => navigate('/upload')}
            className="btn-primary flex items-center space-x-2 whitespace-nowrap group"
          >
            <Upload className="w-4 h-4 group-hover:animate-bounce-gentle" />
            <span>Upload Statement</span>
          </button>
      </div>

      {/* Balance Discrepancy Warning */}
      {/* {stats.hasBalanceDiscrepancy && selectedBanks.length > 1 && (
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
      )} */}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Current Balance"
          value={filteredStats?.totalBalance || 0}
          icon={DollarSign}
          format="currency"
          subtitle={selectedBanks.length > 1 ? "Across selected accounts" : undefined}
          showPerBank={showPerBank && stats.multiBank}
          bankData={showPerBank ? stats.balanceByBank : undefined}
        />
        <StatCard
          title="Monthly Income"
          value={filteredStats?.monthlyIncome || 0}
          icon={TrendingUp}
          format="currency"
          subtitle="Credits this month"
          showPerBank={showPerBank && stats.multiBank}
          bankData={showPerBank ? stats.incomeByBank : undefined}
        />
        <StatCard
          title="Monthly Expenses"
          value={Math.abs(filteredStats?.monthlyExpenses || 0)}
          icon={TrendingDown}
          format="currency"
          subtitle="Debits this month"
          showPerBank={showPerBank && stats.multiBank}
          bankData={showPerBank ? stats.expensesByBank : undefined}
        />
        <StatCard
          title="Total Transactions"
          value={filteredStats?.transactionCount || 0}
          icon={Receipt}
          format="number"
          subtitle="Selected period"
          showPerBank={showPerBank && stats.multiBank}
          bankData={showPerBank ? stats.transactionCountByBank : undefined}
        />
      </div>

  {/* Per-Bank Toggle (Eligible plans only) */}
  {stats.multiBank && isPerBankEligible && (
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
          
          {showPerBank && stats.multiBank && isPerBankEligible && stats.topCategoriesByBank && (
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