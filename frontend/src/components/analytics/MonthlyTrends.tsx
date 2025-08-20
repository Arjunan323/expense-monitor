import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, Filter, BarChart3, LineChart, Eye, EyeOff } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { DateRangePicker } from '../ui/DateRangePicker';
import { MultiSelect } from '../ui/MultiSelect';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { usePreferences } from '../../contexts/PreferencesContext';

export const MonthlyTrends: React.FC = () => {
  const { preferences } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [viewMode, setViewMode] = useState<'category' | 'bank' | 'previous'>('category');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [showPerBank, setShowPerBank] = useState(false);

  // Mock data - replace with API calls
  const [trendData, setTrendData] = useState([
    { month: 'Jan 2024', amount: 45000, category: 'Food', bank: 'HDFC' },
    { month: 'Feb 2024', amount: 52000, category: 'Food', bank: 'HDFC' },
    { month: 'Mar 2024', amount: 48000, category: 'Food', bank: 'ICICI' },
    { month: 'Apr 2024', amount: 55000, category: 'Travel', bank: 'HDFC' },
    { month: 'May 2024', amount: 42000, category: 'Food', bank: 'ICICI' },
    { month: 'Jun 2024', amount: 38000, category: 'Food', bank: 'HDFC' },
  ]);

  const [summaryStats, setSummaryStats] = useState({
    highestMonth: { month: 'Apr 2024', amount: 55000 },
    lowestMonth: { month: 'Jun 2024', amount: 38000 },
    averageSpending: 46667,
    momChange: -10.5
  });

  useEffect(() => {
    // Simulate API loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const bankOptions = [
    { value: 'HDFC', label: 'HDFC Bank', count: 45 },
    { value: 'ICICI', label: 'ICICI Bank', count: 32 },
    { value: 'SBI', label: 'State Bank', count: 28 }
  ];

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
          <h1 className="text-4xl font-heading font-bold gradient-text mb-3">Monthly Spending Trends</h1>
          <p className="text-brand-gray-600 text-lg">Track and compare your spending patterns over time</p>
        </div>

        {/* Enhanced Filter Bar */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-brand-gray-100 p-6 shadow-funky">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Left Side - Filters */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-2xl flex items-center justify-center">
                  <Filter className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-brand-gray-900">Filters</h3>
                  <p className="text-xs text-brand-gray-500">Customize your view</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <MultiSelect
                  options={bankOptions}
                  selected={selectedBanks}
                  onChange={setSelectedBanks}
                  placeholder="🏦 Select Banks"
                  className="min-w-[200px]"
                  title="Select Bank Accounts"
                  desc="Choose which banks to analyze"
                />
                
                <DateRangePicker
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  onApply={(start, end) => setDateRange({ start, end })}
                  className="min-w-[200px]"
                />
              </div>
            </div>

            {/* Right Side - View Controls */}
            <div className="flex items-center space-x-3">
              <div className="flex bg-brand-gray-100 rounded-2xl p-1">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    chartType === 'line' 
                      ? 'bg-white text-brand-green-600 shadow-funky' 
                      : 'text-brand-gray-600 hover:text-brand-green-600'
                  }`}
                >
                  <LineChart className="w-4 h-4 mr-2 inline" />
                  Line
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    chartType === 'bar' 
                      ? 'bg-white text-brand-blue-600 shadow-funky' 
                      : 'text-brand-gray-600 hover:text-brand-blue-600'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-2 inline" />
                  Bar
                </button>
              </div>
            </div>
          </div>

          {/* View Mode Toggles */}
          <div className="mt-4 pt-4 border-t border-brand-gray-100">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'category', label: 'By Category', icon: '📊' },
                { key: 'bank', label: 'By Bank Account', icon: '🏦' },
                { key: 'previous', label: 'Previous Year', icon: '📅' }
              ].map(mode => (
                <button
                  key={mode.key}
                  onClick={() => setViewMode(mode.key as any)}
                  className={`px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 ${
                    viewMode === mode.key
                      ? 'bg-gradient-green text-white shadow-glow-green'
                      : 'bg-white border-2 border-brand-gray-200 text-brand-gray-700 hover:border-brand-green-400'
                  }`}
                >
                  <span className="mr-2">{mode.icon}</span>
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">HIGHEST</span>
          </div>
          <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Highest Spend Month</h3>
          <p className="text-2xl font-bold text-brand-gray-900">{formatCurrency(summaryStats.highestMonth.amount, undefined, preferences)}</p>
          <p className="text-sm text-brand-gray-500">{summaryStats.highestMonth.month}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-green rounded-2xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-brand-green-600 bg-brand-green-100 px-2 py-1 rounded-full">LOWEST</span>
          </div>
          <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Lowest Spend Month</h3>
          <p className="text-2xl font-bold text-brand-gray-900">{formatCurrency(summaryStats.lowestMonth.amount, undefined, preferences)}</p>
          <p className="text-sm text-brand-gray-500">{summaryStats.lowestMonth.month}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-blue rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-brand-blue-600 bg-brand-blue-100 px-2 py-1 rounded-full">AVERAGE</span>
          </div>
          <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Average Monthly</h3>
          <p className="text-2xl font-bold text-brand-gray-900">{formatCurrency(summaryStats.averageSpending, undefined, preferences)}</p>
          <p className="text-sm text-brand-gray-500">Last 6 months</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              summaryStats.momChange >= 0 
                ? 'bg-gradient-to-br from-red-400 to-red-600' 
                : 'bg-gradient-green'
            }`}>
              {summaryStats.momChange >= 0 ? (
                <TrendingUp className="w-6 h-6 text-white" />
              ) : (
                <TrendingDown className="w-6 h-6 text-white" />
              )}
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              summaryStats.momChange >= 0 
                ? 'text-red-600 bg-red-100' 
                : 'text-brand-green-600 bg-brand-green-100'
            }`}>
              {summaryStats.momChange >= 0 ? 'INCREASE' : 'DECREASE'}
            </span>
          </div>
          <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Month-over-Month</h3>
          <p className="text-2xl font-bold text-brand-gray-900">
            {summaryStats.momChange >= 0 ? '+' : ''}{summaryStats.momChange}%
          </p>
          <p className="text-sm text-brand-gray-500">vs last month</p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-heading font-bold text-brand-gray-900">Spending Trends</h3>
            <p className="text-brand-gray-600">Monthly expenditure patterns</p>
          </div>
          <button
            onClick={() => setShowPerBank(!showPerBank)}
            className="flex items-center space-x-2 text-sm text-brand-gray-600 hover:text-brand-green-600 transition-colors duration-300"
          >
            {showPerBank ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showPerBank ? 'Hide' : 'Show'} bank breakdown</span>
          </button>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <RechartsLineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value, undefined, preferences), 'Amount']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 183, 125, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#00B77D" 
                  strokeWidth={3}
                  dot={{ fill: '#00B77D', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#00B77D', strokeWidth: 2, fill: '#ffffff' }}
                />
              </RechartsLineChart>
            ) : (
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value, undefined, preferences), 'Amount']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 183, 125, 0.1)'
                  }}
                />
                <Bar dataKey="amount" fill="#00B77D" radius={[8, 8, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-gradient-to-br from-brand-green-50 to-brand-blue-50 border-brand-green-200">
          <h4 className="text-lg font-heading font-bold text-brand-gray-900 mb-4">💡 Key Insights</h4>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-brand-green-500 rounded-full mt-2"></div>
              <p className="text-sm text-brand-gray-700">Your spending decreased by 10.5% last month - great job cutting costs!</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-brand-blue-500 rounded-full mt-2"></div>
              <p className="text-sm text-brand-gray-700">Food category shows the most consistent spending pattern.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-accent-500 rounded-full mt-2"></div>
              <p className="text-sm text-brand-gray-700">Consider setting a budget for Travel category to control peaks.</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h4 className="text-lg font-heading font-bold text-brand-gray-900 mb-4">📈 Trend Analysis</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-brand-gray-50 rounded-2xl">
              <span className="text-sm font-medium text-brand-gray-700">Spending Volatility</span>
              <span className="text-sm font-bold text-brand-green-600">Low</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-brand-gray-50 rounded-2xl">
              <span className="text-sm font-medium text-brand-gray-700">Seasonal Pattern</span>
              <span className="text-sm font-bold text-brand-blue-600">Detected</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-brand-gray-50 rounded-2xl">
              <span className="text-sm font-medium text-brand-gray-700">Savings Opportunity</span>
              <span className="text-sm font-bold text-accent-600">High</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};