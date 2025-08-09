import React, { useState, useEffect } from 'react';
import { 
  ArrowUpDown, 
  Filter, 
  Search, 
  Calendar,
  Tag,
  Building2,
  ChevronLeft,
  ChevronRight,
  Settings,
  X,
  RotateCcw,
  Download
} from 'lucide-react';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { EmptyState } from './ui/EmptyState';
import { DateRangePicker } from './ui/DateRangePicker';
import { MultiSelect } from './ui/MultiSelect';
import { Transaction, DashboardStats, TransactionFilters } from '../types';
import { apiCall } from '../utils/api';
import { formatCurrency, formatDate, getCategoryColor } from '../utils/formatters';
import toast from 'react-hot-toast';

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [usage, setUsage] = useState<DashboardStats | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [availableBanks, setAvailableBanks] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  const itemsPerPage = 50;

  const [filters, setFilters] = useState<TransactionFilters>({
    banks: [],
    dateRange: { start: '', end: '' },
    categories: [],
    amountRange: { min: null, max: null },
    transactionType: 'all',
    description: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  useEffect(() => {
    fetchTransactionsAndUsage();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const fetchTransactionsAndUsage = async () => {
    try {
      setLoading(true);
      const [txns, usageData] = await Promise.all([
        apiCall<Transaction[]>('GET', '/transactions'),
        apiCall<DashboardStats>('GET', '/dashboard/summary'),
      ]);
      setTransactions(txns);
      setUsage(usageData);
      
      // Extract unique banks and categories
      const banks = [...new Set(txns.map(t => t.bankName).filter(Boolean))];
      const categories = [...new Set(txns.map(t => t.category).filter(Boolean))];
      setAvailableBanks(banks);
      setAvailableCategories(categories);
      
      // Initialize filters with all banks selected
      setFilters(prev => ({ ...prev, banks }));
    } catch (error: any) {
      toast.error('Failed to load transactions or usage');
      console.error('Transactions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Bank filter
    if (filters.banks.length > 0) {
      filtered = filtered.filter(t => filters.banks.includes(t.bankName || ''));
    }

    // Date range filter
    if (filters.dateRange.start) {
      filtered = filtered.filter(t => t.date >= filters.dateRange.start);
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(t => t.date <= filters.dateRange.end);
    }

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(t => filters.categories.includes(t.category));
    }

    // Amount range filter
    if (filters.amountRange.min !== null) {
      filtered = filtered.filter(t => Math.abs(t.amount) >= filters.amountRange.min!);
    }
    if (filters.amountRange.max !== null) {
      filtered = filtered.filter(t => Math.abs(t.amount) <= filters.amountRange.max!);
    }

    // Transaction type filter
    if (filters.transactionType === 'credit') {
      filtered = filtered.filter(t => t.amount > 0);
    } else if (filters.transactionType === 'debit') {
      filtered = filtered.filter(t => t.amount < 0);
    }

    // Description search
    if (filters.description) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(filters.description.toLowerCase())
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'amount':
          aValue = Math.abs(a.amount);
          bValue = Math.abs(b.amount);
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'bank':
          aValue = a.bankName || '';
          bValue = b.bankName || '';
          break;
        default: // date
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const resetFilters = () => {
    setFilters({
      banks: availableBanks,
      dateRange: { start: '', end: '' },
      categories: [],
      amountRange: { min: null, max: null },
      transactionType: 'all',
      description: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  const exportTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.banks.length > 0) params.append('banks', filters.banks.join(','));
      if (filters.dateRange.start) params.append('startDate', filters.dateRange.start);
      if (filters.dateRange.end) params.append('endDate', filters.dateRange.end);
      if (filters.categories.length > 0) params.append('categories', filters.categories.join(','));
      
      const csv = await apiCall<string>('GET', `/dashboard/export?${params.toString()}`);
      
      // Create and download CSV file
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Transactions exported successfully');
    } catch (error) {
      toast.error('Failed to export transactions');
    }
  };

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const bankOptions = availableBanks.map(bank => ({
    value: bank,
    label: bank,
    count: transactions.filter(t => t.bankName === bank).length
  }));

  const categoryOptions = availableCategories.map(category => ({
    value: category,
    label: category,
    count: transactions.filter(t => t.category === category).length
  }));

  const activeFiltersCount = [
    filters.banks.length < availableBanks.length ? 1 : 0,
    filters.dateRange.start || filters.dateRange.end ? 1 : 0,
    filters.categories.length > 0 ? 1 : 0,
    filters.amountRange.min !== null || filters.amountRange.max !== null ? 1 : 0,
    filters.transactionType !== 'all' ? 1 : 0,
    filters.description ? 1 : 0
  ].reduce((sum, count) => sum + count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="No transactions found"
        description="Upload your bank statements to see your transactions here"
        action={{
          label: 'Upload Statement',
          onClick: () => window.location.href = '/upload'
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Transactions</h1>
          <p className="text-gray-600 mt-1">
            {filteredTransactions.length} of {transactions.length} transactions
            {activeFiltersCount > 0 && (
              <span className="text-primary-600"> • {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} applied</span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportTransactions}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center space-x-2 ${showFilters ? 'bg-primary-50 border-primary-300' : ''}`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expired Subscription Banner */}
      {usage && usage.status === 'EXPIRED' && (
        <div className="card bg-yellow-100 border-yellow-300 mb-4 flex items-center space-x-3">
          <Settings className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <div className="font-semibold text-yellow-900">Your subscription has expired</div>
            <div className="text-yellow-800 text-sm">Upgrade to Pro or Premium to restore access to advanced features.</div>
          </div>
          <button
            onClick={() => window.location.href = '/billing'}
            className="btn-primary text-sm ml-auto"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="card bg-gray-50 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={resetFilters}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Bank Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Accounts
              </label>
              <MultiSelect
                options={bankOptions}
                selected={filters.banks}
                onChange={(banks) => setFilters(prev => ({ ...prev, banks }))}
                placeholder="Select banks"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <DateRangePicker
                startDate={filters.dateRange.start}
                endDate={filters.dateRange.end}
                onDateChange={(start, end) => setFilters(prev => ({ 
                  ...prev, 
                  dateRange: { start, end } 
                }))}
              />
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <MultiSelect
                options={categoryOptions}
                selected={filters.categories}
                onChange={(categories) => setFilters(prev => ({ ...prev, categories }))}
                placeholder="Select categories"
              />
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.amountRange.min || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    amountRange: { ...prev.amountRange, min: e.target.value ? Number(e.target.value) : null }
                  }))}
                  className="input-field"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.amountRange.max || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    amountRange: { ...prev.amountRange, max: e.target.value ? Number(e.target.value) : null }
                  }))}
                  className="input-field"
                />
              </div>
            </div>

            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type
              </label>
              <select
                value={filters.transactionType}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  transactionType: e.target.value as 'all' | 'credit' | 'debit' 
                }))}
                className="input-field"
              >
                <option value="all">All Transactions</option>
                <option value="credit">Credits Only</option>
                <option value="debit">Debits Only</option>
              </select>
            </div>

            {/* Description Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search descriptions..."
                  value={filters.description}
                  onChange={(e) => setFilters(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  sortBy: e.target.value as 'date' | 'amount' | 'category' | 'bank' 
                }))}
                className="input-field w-auto"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="category">Category</option>
                <option value="bank">Bank</option>
              </select>
              <button
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                }))}
                className="btn-secondary flex items-center space-x-2"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span>{filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredTransactions.length === 0 && (
        <div className="card text-center py-12">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your filters or search criteria
          </p>
          <button onClick={resetFilters} className="btn-primary">
            Reset Filters
          </button>
        </div>
      )}

      {/* Transactions Table */}
      {filteredTransactions.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span>{transaction.bankName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={transaction.description}>
                        {transaction.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: getCategoryColor(transaction.category) }}
                      >
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={`font-semibold ${
                        transaction.amount >= 0 ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(transaction.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(startIndex + itemsPerPage, filteredTransactions.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredTransactions.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Coming Soon Banner for Advanced Features */}
      {usage && usage.advancedAnalyticsLocked && usage.status !== 'EXPIRED' && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-800">Coming Soon: Advanced Transaction Features</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Manual transaction editing, custom categorization, bulk actions, and advanced analytics are coming in future updates.
                </p>
                <div className="mt-2 text-xs text-blue-600">
                  • Edit transaction details • Custom categories • Bulk operations • Advanced reporting
                </div>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/billing'}
              className="btn-primary text-sm whitespace-nowrap"
            >
              Upgrade for Early Access
            </button>
          </div>
        </div>
      )}
    </div>
  );
};