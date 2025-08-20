import React, { useState, useEffect } from 'react';
import { FileText, Upload, Calculator, AlertTriangle, CheckCircle, Plus, Receipt, Info } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { usePreferences } from '../../contexts/PreferencesContext';

interface TaxTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  deductible: boolean;
  hasReceipt: boolean;
  receiptUrl?: string;
}

interface TaxCategory {
  code: string;
  name: string;
  description: string;
  limit: number;
  used: number;
  icon: string;
}

export const TaxTracker: React.FC = () => {
  const { preferences } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('2024-25');
  const [showAddForm, setShowAddForm] = useState(false);

  const [taxCategories] = useState<TaxCategory[]>([
    { code: '80C', name: 'Investments/Payments', description: 'PPF, LIC, ELSS, Tuition Fees', limit: 150000, used: 95000, icon: '💰' },
    { code: '80D', name: 'Medical Insurance', description: 'Health insurance premiums', limit: 25000, used: 18000, icon: '🏥' },
    { code: '80G', name: 'Donations', description: 'Charitable donations', limit: 0, used: 5000, icon: '❤️' },
    { code: '24(b)', name: 'Home Loan Interest', description: 'Interest on home loan', limit: 200000, used: 125000, icon: '🏠' },
    { code: '80E', name: 'Education Loan', description: 'Interest on education loan', limit: 0, used: 15000, icon: '📚' },
    { code: '80TTA', name: 'Savings Interest', description: 'Interest from savings account', limit: 10000, used: 3500, icon: '🏦' }
  ]);

  const [transactions, setTransactions] = useState<TaxTransaction[]>([
    {
      id: '1',
      date: '2024-04-15',
      description: 'LIC Premium Payment',
      amount: 25000,
      category: '80C',
      deductible: true,
      hasReceipt: true
    },
    {
      id: '2',
      date: '2024-05-10',
      description: 'Health Insurance Premium',
      amount: 18000,
      category: '80D',
      deductible: true,
      hasReceipt: false
    },
    {
      id: '3',
      date: '2024-06-01',
      description: 'PPF Contribution',
      amount: 50000,
      category: '80C',
      deductible: true,
      hasReceipt: true
    }
  ]);

  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    date: '',
    category: '80C',
    deductible: true
  });

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  const totalDeductible = transactions
    .filter(t => t.deductible)
    .reduce((sum, t) => sum + t.amount, 0);

  const missingReceipts = transactions.filter(t => t.deductible && !t.hasReceipt).length;

  const addTransaction = () => {
    if (newTransaction.description && newTransaction.amount && newTransaction.date) {
      const transaction: TaxTransaction = {
        id: Date.now().toString(),
        date: newTransaction.date,
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        category: newTransaction.category,
        deductible: newTransaction.deductible,
        hasReceipt: false
      };
      setTransactions(prev => [...prev, transaction]);
      setNewTransaction({ description: '', amount: '', date: '', category: '80C', deductible: true });
      setShowAddForm(false);
    }
  };

  const toggleDeductible = (id: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, deductible: !t.deductible } : t
    ));
  };

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
          <h1 className="text-4xl font-heading font-bold gradient-text mb-3">Tax Benefit Tracker</h1>
          <p className="text-brand-gray-600 text-lg">Categorize your spends & maximize savings under Indian Income Tax Act</p>
          <div className="flex items-center space-x-2 mt-2">
            <Info className="w-4 h-4 text-brand-blue-600" />
            <span className="text-sm text-brand-blue-600">Based on Sections 80C, 80D, 80G, 24(b), and other exemptions/deductions</span>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-brand-gray-700">Financial Year:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input-field w-auto"
          >
            <option value="2024-25">2024-25</option>
            <option value="2023-24">2023-24</option>
            <option value="2022-23">2022-23</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card border-brand-green-200 bg-brand-green-50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-green rounded-2xl flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-brand-green-600 bg-brand-green-100 px-2 py-1 rounded-full">TOTAL</span>
          </div>
          <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Total Deductible</h3>
          <p className="text-2xl font-bold text-brand-green-600">{formatCurrency(totalDeductible, undefined, preferences)}</p>
          <p className="text-sm text-brand-gray-500">This financial year</p>
        </div>

        <div className="stat-card border-brand-blue-200 bg-brand-blue-50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-blue rounded-2xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-brand-blue-600 bg-brand-blue-100 px-2 py-1 rounded-full">80C</span>
          </div>
          <h3 className="text-sm font-medium text-brand-gray-600 mb-1">80C Used</h3>
          <p className="text-2xl font-bold text-brand-blue-600">₹95,000</p>
          <p className="text-sm text-brand-gray-500">of ₹1,50,000 limit</p>
        </div>

        <div className="stat-card border-yellow-200 bg-yellow-50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">MISSING</span>
          </div>
          <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Missing Receipts</h3>
          <p className="text-2xl font-bold text-yellow-600">{missingReceipts}</p>
          <p className="text-sm text-brand-gray-500">Upload required</p>
        </div>

        <div className="stat-card border-purple-200 bg-purple-50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">SAVINGS</span>
          </div>
          <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Tax Savings</h3>
          <p className="text-2xl font-bold text-purple-600">₹31,200</p>
          <p className="text-sm text-brand-gray-500">Estimated (30% bracket)</p>
        </div>
      </div>

      {/* Tax Categories Overview */}
      <div className="card">
        <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-6">Tax Deduction Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {taxCategories.map(category => {
            const percentage = category.limit > 0 ? (category.used / category.limit) * 100 : 0;
            const isNearLimit = percentage >= 80;
            const isOverLimit = percentage >= 100;

            return (
              <div key={category.code} className="p-4 bg-brand-gray-50 rounded-2xl hover:bg-brand-gray-100 transition-colors duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h4 className="font-bold text-brand-gray-900">{category.code}</h4>
                      <p className="text-xs text-brand-gray-600">{category.name}</p>
                    </div>
                  </div>
                  {isOverLimit && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  {isNearLimit && !isOverLimit && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                </div>
                
                <p className="text-xs text-brand-gray-600 mb-3">{category.description}</p>
                
                {category.limit > 0 && (
                  <>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-brand-gray-600">Used</span>
                      <span className="font-semibold">{formatCurrency(category.used, undefined, preferences)}</span>
                    </div>
                    <div className="w-full bg-brand-gray-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-brand-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-brand-gray-500">
                      <span>Limit: {formatCurrency(category.limit, undefined, preferences)}</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                  </>
                )}
                
                {category.limit === 0 && (
                  <div className="text-center py-2">
                    <p className="text-sm font-semibold text-brand-green-600">No Limit</p>
                    <p className="text-xs text-brand-gray-600">Used: {formatCurrency(category.used, undefined, preferences)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-heading font-bold text-brand-gray-900">Tax-Related Transactions</h3>
            <p className="text-brand-gray-600">Manage and categorize your deductible expenses</p>
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
            <h4 className="text-lg font-heading font-bold text-brand-gray-900 mb-4">Add Tax Transaction</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., LIC Premium"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                  className="input-field"
                  placeholder="25000"
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
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Category</label>
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                  className="input-field"
                >
                  {taxCategories.map(cat => (
                    <option key={cat.code} value={cat.code}>
                      {cat.icon} {cat.code} - {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newTransaction.deductible}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, deductible: e.target.checked }))}
                  className="rounded border-brand-gray-300 text-brand-green-600 focus:ring-brand-green-500"
                />
                <span className="text-sm text-brand-gray-700">Tax Deductible</span>
              </label>
              <div className="flex space-x-3">
                <button onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
                <button onClick={addTransaction} className="btn-primary">Add Transaction</button>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-brand-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-brand-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-brand-gray-700">Description</th>
                <th className="text-right py-3 px-4 font-semibold text-brand-gray-700">Amount</th>
                <th className="text-center py-3 px-4 font-semibold text-brand-gray-700">Category</th>
                <th className="text-center py-3 px-4 font-semibold text-brand-gray-700">Deductible</th>
                <th className="text-center py-3 px-4 font-semibold text-brand-gray-700">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction.id} className="border-b border-brand-gray-100 hover:bg-brand-gray-50 transition-colors duration-200">
                  <td className="py-4 px-4 text-sm text-brand-gray-900">{formatDate(transaction.date)}</td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-brand-gray-900">{transaction.description}</p>
                      {!transaction.hasReceipt && transaction.deductible && (
                        <p className="text-xs text-yellow-600 mt-1">⚠️ Receipt required</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-brand-gray-900">
                    {formatCurrency(transaction.amount, undefined, preferences)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-blue-100 text-brand-blue-800">
                      {transaction.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => toggleDeductible(transaction.id)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                        transaction.deductible 
                          ? 'bg-brand-green-500 text-white' 
                          : 'bg-brand-gray-300 text-brand-gray-600'
                      }`}
                    >
                      {transaction.deductible && <CheckCircle className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-center">
                    {transaction.hasReceipt ? (
                      <div className="flex items-center justify-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-brand-green-500" />
                        <span className="text-xs text-brand-green-600">Uploaded</span>
                      </div>
                    ) : (
                      <button className="bg-brand-blue-100 hover:bg-brand-blue-200 text-brand-blue-700 px-3 py-1 rounded-xl text-xs font-semibold transition-all duration-300">
                        <Upload className="w-3 h-3 mr-1 inline" />
                        Upload
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Reference Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-6">📋 Tax Deduction Checklist</h3>
          <div className="space-y-3">
            {[
              { item: 'Life Insurance Premium (80C)', checked: true, amount: '₹25,000' },
              { item: 'PPF Contribution (80C)', checked: true, amount: '₹50,000' },
              { item: 'Medical Insurance (80D)', checked: true, amount: '₹18,000' },
              { item: 'Donations (80G)', checked: false, amount: '₹5,000' },
              { item: 'Home Loan Interest (24b)', checked: true, amount: '₹1,25,000' },
              { item: 'Education Loan Interest (80E)', checked: false, amount: '₹15,000' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-brand-gray-50 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                    item.checked ? 'bg-brand-green-500' : 'bg-brand-gray-300'
                  }`}>
                    {item.checked && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-brand-gray-700">{item.item}</span>
                </div>
                <span className="text-sm font-semibold text-brand-gray-900">{item.amount}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card bg-gradient-to-br from-brand-blue-50 to-brand-green-50 border-brand-blue-200">
          <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-6">💡 Tax Saving Tips</h3>
          <div className="space-y-4">
            <div className="p-4 bg-white/60 rounded-2xl">
              <h4 className="font-semibold text-brand-gray-900 mb-2">🎯 Maximize 80C</h4>
              <p className="text-sm text-brand-gray-700">You have ₹55,000 remaining in 80C limit. Consider ELSS or additional PPF contribution.</p>
            </div>
            
            <div className="p-4 bg-white/60 rounded-2xl">
              <h4 className="font-semibold text-brand-gray-900 mb-2">🏥 Health Checkup</h4>
              <p className="text-sm text-brand-gray-700">Preventive health checkups up to ₹5,000 are allowed under 80D in addition to insurance.</p>
            </div>
            
            <div className="p-4 bg-white/60 rounded-2xl">
              <h4 className="font-semibold text-brand-gray-900 mb-2">📄 Keep Receipts</h4>
              <p className="text-sm text-brand-gray-700">Upload all receipts and certificates for smooth tax filing and potential audits.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {(missingReceipts > 0 || taxCategories.some(c => c.limit > 0 && c.used > c.limit)) && (
        <div className="card border-yellow-200 bg-yellow-50">
          <h3 className="text-lg font-heading font-bold text-yellow-800 mb-4">⚠️ Action Required</h3>
          <div className="space-y-3">
            {missingReceipts > 0 && (
              <div className="flex items-start space-x-3 p-3 bg-yellow-100 rounded-2xl">
                <Receipt className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-800">Missing Receipts</p>
                  <p className="text-sm text-yellow-700">
                    {missingReceipts} transaction(s) need receipt uploads for tax deduction claims.
                  </p>
                </div>
              </div>
            )}
            
            {taxCategories.filter(c => c.limit > 0 && c.used > c.limit).map(category => (
              <div key={category.code} className="flex items-start space-x-3 p-3 bg-red-100 rounded-2xl">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800">Exceeded {category.code} Limit</p>
                  <p className="text-sm text-red-700">
                    You've exceeded the ₹{(category.limit/1000).toFixed(0)}K limit by ₹{((category.used - category.limit)/1000).toFixed(0)}K. 
                    Only ₹{(category.limit/1000).toFixed(0)}K is eligible for deduction.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};