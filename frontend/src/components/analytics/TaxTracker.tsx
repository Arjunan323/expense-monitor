import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calculator, 
  Plus, 
  Upload, 
  Eye, 
  Settings, 
  Brain, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Trash2,
  Edit3,
  X,
  Save,
  Target,
  TrendingDown,
  Award,
  RefreshCcw,
  Filter,
  Calendar,
  DollarSign
} from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { usePreferences } from '../../contexts/PreferencesContext';
import { taxApi, TaxTransactionDto, TaxSummaryDto, TaxCategoryUsageDto, TaxDeductionChecklistItem, TaxSavingTip } from '../../api/client';
import toast from 'react-hot-toast';

interface ClassificationRule {
  id?: number;
  matchType: 'DESCRIPTION_REGEX' | 'CATEGORY' | 'MERCHANT' | 'AMOUNT_RANGE';
  matchValue: string;
  taxCategoryCode: string;
  priority: number;
  autoMarkDeductible: boolean;
  active: boolean;
}

export const TaxTracker: React.FC = () => {
  const { preferences } = usePreferences();
  const currentFY = (() => {
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return year;
  })();

  const [selectedYear, setSelectedYear] = useState(currentFY);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<TaxSummaryDto | null>(null);
  const [transactions, setTransactions] = useState<TaxTransactionDto[]>([]);
  const [categories, setCategories] = useState<TaxCategoryUsageDto[]>([]);
  const [checklist, setChecklist] = useState<TaxDeductionChecklistItem[]>([]);
  const [tips, setTips] = useState<TaxSavingTip[]>([]);
  const [suggestions, setSuggestions] = useState<TaxTransactionDto[]>([]);
  const [rules, setRules] = useState<ClassificationRule[]>([]);
  
  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showRulesPanel, setShowRulesPanel] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Partial<TaxTransactionDto>>({
    note: '',
    category: '',
    amount: null,
    paidDate: new Date().toISOString().slice(0,10),
    deductible: true
  });
  const [creatingTx, setCreatingTx] = useState(false);
  const [uploadTxId, setUploadTxId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<TaxTransactionDto>>({});
  
  // Classification State
  const [classifyRange, setClassifyRange] = useState({ start: '', end: '' });
  const [classifyProgress, setClassifyProgress] = useState<number | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  
  // Rule Management
  const [newRule, setNewRule] = useState<ClassificationRule>({
    matchType: 'DESCRIPTION_REGEX',
    matchValue: '',
    taxCategoryCode: '80C',
    priority: 0,
    autoMarkDeductible: true,
    active: true
  });
  const [testRule, setTestRule] = useState({
    description: '',
    amount: '',
    category: '',
    merchant: ''
  });
  const [testResult, setTestResult] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryData, txData, checklistData, tipsData, suggestionsData] = await Promise.all([
        taxApi.summary(selectedYear),
        taxApi.list(selectedYear),
        taxApi.getChecklist(),
        taxApi.getTips(),
        taxApi.suggestions()
      ]);
      setSummary(summaryData);
      setCategories(summaryData.categories);
      setTransactions(txData);
      setChecklist(checklistData);
      setTips(tipsData);
      setSuggestions(suggestionsData);
    } catch (e: any) {
      toast.error('Failed to load tax data');
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  const loadRules = useCallback(async () => {
    try {
      const data = await taxApi.listRules();
      setRules(data);
    } catch (e: any) {
      toast.error('Failed to load rules');
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleDeductible = async (id: number) => {
    try {
      const updated = await taxApi.toggleDeductible(id);
      setTransactions(prev => prev.map(t => t.id === id ? updated : t));
      taxApi.invalidateCache();
      loadData();
    } catch (e: any) {
      toast.error('Failed to toggle deductible status');
    }
  };

  const runAIClassification = async () => {
    if (!classifyRange.start || !classifyRange.end) {
      toast.error('Please select both start and end dates');
      return;
    }
    
    try {
      setClassifyProgress(0);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setClassifyProgress(prev => prev !== null && prev < 90 ? prev + 10 : prev);
      }, 300);
      
      const result = await taxApi.classifyRange(classifyRange.start, classifyRange.end);
      clearInterval(progressInterval);
      setClassifyProgress(100);
      let createdCount = 0;
      if (result && typeof result === 'object') {
        if ('created' in result && typeof (result as any).created === 'number') createdCount = (result as any).created;
        else if ('value' in result && typeof (result as any).value === 'number') createdCount = (result as any).value; // fallback if backend returns key/value summary
      }
      toast.success(`Successfully classified ${createdCount} transactions`);
      
      setTimeout(() => {
        setClassifyProgress(null);
        setShowAIPanel(false);
        loadData();
      }, 1000);
    } catch (e: any) {
      setClassifyProgress(null);
      toast.error('Classification failed');
    }
  };

  const createRule = async () => {
    if (!newRule.matchValue.trim()) {
      toast.error('Please enter a match value');
      return;
    }
    
    try {
      await taxApi.createRule(newRule);
      setNewRule({
        matchType: 'DESCRIPTION_REGEX',
        matchValue: '',
        taxCategoryCode: '80C',
        priority: 0,
        autoMarkDeductible: true,
        active: true
      });
      loadRules();
      toast.success('Rule created successfully');
    } catch (e: any) {
      toast.error('Failed to create rule');
    }
  };

  const testRuleLogic = async () => {
    if (!newRule.matchValue.trim()) {
      toast.error('Please enter a match value to test');
      return;
    }
    
    try {
      const result = await taxApi.testRule({
        matchType: newRule.matchType,
        matchValue: newRule.matchValue,
        description: testRule.description,
        amount: testRule.amount ? parseFloat(testRule.amount) : undefined,
        category: testRule.category,
        merchant: testRule.merchant
      });
      setTestResult(result);
    } catch (e: any) {
      toast.error('Failed to test rule');
    }
  };

  const deleteRule = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      await taxApi.deleteRule(id);
      loadRules();
      toast.success('Rule deleted');
    } catch (e: any) {
      toast.error('Failed to delete rule');
    }
  };

  const approveSuggestions = async () => {
    if (selectedSuggestions.size === 0) return;
    
    try {
      await taxApi.approveSuggestions(Array.from(selectedSuggestions));
      setSelectedSuggestions(new Set());
      loadData();
      toast.success('Suggestions approved');
    } catch (e: any) {
      toast.error('Failed to approve suggestions');
    }
  };

  const createTransaction = async () => {
    if(!newTransaction.note?.trim()) { toast.error('Enter a note/description'); return; }
    if(!newTransaction.category) { toast.error('Select a category'); return; }
    if(!newTransaction.amount || newTransaction.amount <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      setCreatingTx(true);
      await taxApi.create({
        note: newTransaction.note,
        category: newTransaction.category,
        amount: newTransaction.amount,
        paidDate: newTransaction.paidDate,
        deductible: newTransaction.deductible ?? true,
        taxYear: selectedYear
      });
      toast.success('Transaction added');
      setShowAddTransaction(false);
      setNewTransaction({ note: '', category: '', amount: null, paidDate: new Date().toISOString().slice(0,10), deductible: true });
      taxApi.invalidateCache();
      loadData();
    } catch(e:any){
      toast.error('Failed to create transaction');
    } finally { setCreatingTx(false); }
  };

  const handleUploadReceipt = async (file: File) => {
    if(!uploadTxId) return;
    try {
      setUploadProgress(0);
      const updated = await taxApi.uploadReceipt(uploadTxId, file, pct => setUploadProgress(pct));
      setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
      toast.success('Receipt uploaded');
      setUploadTxId(null); setUploadProgress(null);
      taxApi.invalidateCache();
      loadData();
    } catch(e:any){
      toast.error('Upload failed');
      setUploadProgress(null);
    }
  };

  const downloadReceipt = async (id:number) => {
    try {
      const blob = await taxApi.downloadReceipt(id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(()=> URL.revokeObjectURL(url), 10_000);
    } catch(e:any){ toast.error('Failed to open receipt'); }
  };

  const rejectSuggestions = async () => {
    if (selectedSuggestions.size === 0) return;
    
    try {
      await taxApi.rejectSuggestions(Array.from(selectedSuggestions));
      setSelectedSuggestions(new Set());
      loadData();
      toast.success('Suggestions rejected');
    } catch (e: any) {
      toast.error('Failed to reject suggestions');
    }
  };

  const categoryIcon: Record<string, string> = {
    '80C': '💰', '80D': '🏥', '80G': '❤️', '24(b)': '🏠', '80E': '📚', '80TTA': '🏦'
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
      {/* Enhanced Header */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-heading font-bold gradient-text mb-3">📊 Tax Benefit Tracker</h1>
            <p className="text-brand-gray-600 text-lg">Maximize your tax savings with smart categorization and AI-powered insights</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input-field !py-2 !px-3"
            >
              {[currentFY, currentFY - 1, currentFY - 2].map(year => (
                <option key={year} value={year}>FY {year}-{(year + 1).toString().slice(-2)}</option>
              ))}
            </select>
            
            <button
              onClick={() => setShowAIPanel(true)}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:scale-105 transition-all duration-300 flex items-center space-x-2"
            >
              <Brain className="w-5 h-5" />
              <span>AI Classify</span>
            </button>
            
            <button
              onClick={() => { setShowRulesPanel(true); loadRules(); }}
              className="bg-gradient-blue text-white px-6 py-3 rounded-2xl font-semibold shadow-glow-blue hover:scale-105 transition-all duration-300 flex items-center space-x-2"
            >
              <Settings className="w-5 h-5" />
              <span>Rules</span>
            </button>
          </div>
        </div>

        {/* Enhanced Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="stat-card border-purple-200 bg-purple-50">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">TOTAL</span>
              </div>
              <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Total Deductible</h3>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.totalDeductible, undefined, preferences)}</p>
              <p className="text-sm text-brand-gray-500">This financial year</p>
            </div>

            <div className="stat-card border-red-200 bg-red-50">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  summary.missingReceipts > 0 
                    ? 'bg-gradient-to-br from-red-400 to-red-600' 
                    : 'bg-gradient-green'
                }`}>
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  summary.missingReceipts > 0 
                    ? 'text-red-600 bg-red-100' 
                    : 'text-brand-green-600 bg-brand-green-100'
                }`}>
                  {summary.missingReceipts > 0 ? 'ACTION' : 'COMPLETE'}
                </span>
              </div>
              <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Missing Receipts</h3>
              <p className={`text-2xl font-bold ${summary.missingReceipts > 0 ? 'text-red-600' : 'text-brand-green-600'}`}>
                {summary.missingReceipts}
              </p>
              <p className="text-sm text-brand-gray-500">Upload required</p>
            </div>

            <div className="stat-card border-brand-green-200 bg-brand-green-50">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-green rounded-2xl flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-brand-green-600 bg-brand-green-100 px-2 py-1 rounded-full">SAVINGS</span>
              </div>
              <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Est. Tax Savings</h3>
              <p className="text-2xl font-bold text-brand-green-600">{formatCurrency(summary.estimatedTaxSavings, undefined, preferences)}</p>
              <p className="text-sm text-brand-gray-500">Based on 30% bracket</p>
            </div>

            <div className="stat-card border-brand-blue-200 bg-brand-blue-50">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-blue rounded-2xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-brand-blue-600 bg-brand-blue-100 px-2 py-1 rounded-full">COMPLIANCE</span>
              </div>
              <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Categories Used</h3>
              <p className="text-2xl font-bold text-brand-blue-600">{categories.filter(c => c.used > 0).length}</p>
              <p className="text-sm text-brand-gray-500">Out of {categories.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Categories Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-heading font-bold text-brand-gray-900">Tax Deduction Categories</h3>
            <p className="text-brand-gray-600">Track your progress against annual limits</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="bg-brand-gray-100 hover:bg-brand-gray-200 text-brand-gray-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.map(category => (
            <div key={category.code} className="p-6 bg-gradient-to-r from-white to-brand-gray-50 rounded-3xl border-2 border-brand-gray-100 hover:border-brand-green-300 hover:shadow-funky transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-funky rounded-3xl flex items-center justify-center text-3xl shadow-glow-green">
                    {categoryIcon[category.code] || '📄'}
                  </div>
                  <div>
                    <h4 className="text-lg font-heading font-bold text-brand-gray-900">{category.code}</h4>
                    <p className="text-sm text-brand-gray-600">{category.description}</p>
                  </div>
                </div>
                
                {category.overLimit && (
                  <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Over Limit</span>
                  </div>
                )}
                {category.nearLimit && !category.overLimit && (
                  <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Near Limit</span>
                  </div>
                )}
              </div>

              {category.annualLimit && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-gray-600">Progress</span>
                    <span className="font-semibold" style={{ color: category.overLimit ? '#EF4444' : category.nearLimit ? '#F59E0B' : '#00B77D' }}>
                      {category.percentUsed.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-brand-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        width: `${Math.min(category.percentUsed, 100)}%`,
                        backgroundColor: category.overLimit ? '#EF4444' : category.nearLimit ? '#F59E0B' : '#00B77D'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-brand-gray-500">
                    <span>Used: {formatCurrency(category.used, undefined, preferences)}</span>
                    <span>Limit: {formatCurrency(category.annualLimit, undefined, preferences)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Suggestions Section */}
      {suggestions.length > 0 && (
        <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-heading font-bold text-brand-gray-900">🤖 AI Suggestions</h3>
              <p className="text-brand-gray-600">Review AI-identified potential tax deductions</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={approveSuggestions}
                disabled={selectedSuggestions.size === 0}
                className="bg-gradient-green text-white px-4 py-2 rounded-2xl font-semibold text-sm shadow-glow-green hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve ({selectedSuggestions.size})</span>
              </button>
              <button
                onClick={rejectSuggestions}
                disabled={selectedSuggestions.size === 0}
                className="bg-brand-gray-200 hover:bg-brand-gray-300 text-brand-gray-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Reject ({selectedSuggestions.size})</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {suggestions.map(suggestion => (
              <div key={suggestion.id} className="p-4 bg-white/60 rounded-2xl border border-purple-200 hover:border-purple-300 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedSuggestions.has(suggestion.id)}
                      onChange={(e) => {
                        setSelectedSuggestions(prev => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(suggestion.id);
                          else next.delete(suggestion.id);
                          return next;
                        });
                      }}
                      className="w-4 h-4 text-purple-600 rounded border-brand-gray-300 focus:ring-purple-500"
                    />
                    <div>
                      <p className="font-semibold text-brand-gray-900">{suggestion.note}</p>
                      <p className="text-sm text-brand-gray-600">{suggestion.category} • {formatCurrency(suggestion.amount || 0, undefined, preferences)}</p>
                    </div>
                  </div>
                  <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                    AI Suggested
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Transactions Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-heading font-bold text-brand-gray-900">Tax Transactions</h3>
            <p className="text-brand-gray-600">Manage your tax-related expenses and receipts</p>
          </div>
          <button
            onClick={() => setShowAddTransaction(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-brand-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-8 h-8 text-brand-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-brand-gray-900 mb-2">No tax transactions yet</h4>
            <p className="text-brand-gray-600 mb-4">Add transactions manually or use AI classification to get started</p>
            <button
              onClick={() => setShowAIPanel(true)}
              className="btn-primary"
            >
              Start AI Classification
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map(transaction => (
              <div key={transaction.id} className="p-6 bg-gradient-to-r from-white to-brand-gray-50 rounded-3xl border-2 border-brand-gray-100 hover:shadow-funky transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-brand-gray-900">{transaction.note}</h4>
                      {transaction.classificationStatus === 'SUGGESTED' && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold">
                          AI Suggested
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-brand-gray-600 mb-3">
                      <span>{transaction.paidDate ? formatDate(transaction.paidDate) : 'No date'}</span>
                      <span>•</span>
                      <span>{transaction.category || 'Uncategorized'}</span>
                      <span>•</span>
                      <span className="font-semibold">{formatCurrency(transaction.amount || 0, undefined, preferences)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => toggleDeductible(transaction.id)}
                        className={`px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 flex items-center space-x-2 ${
                          transaction.deductible
                            ? 'bg-brand-green-100 text-brand-green-700 hover:bg-brand-green-200'
                            : 'bg-brand-gray-100 text-brand-gray-700 hover:bg-brand-gray-200'
                        }`}
                      >
                        <CheckCircle className={`w-4 h-4 ${transaction.deductible ? 'text-brand-green-600' : 'text-brand-gray-500'}`} />
                        <span>{transaction.deductible ? 'Deductible' : 'Not Deductible'}</span>
                      </button>
                      
                      {!transaction.hasReceipt ? (
                        <button
                          onClick={() => setUploadTxId(transaction.id)}
                          className="bg-brand-blue-100 hover:bg-brand-blue-200 text-brand-blue-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload Receipt</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => downloadReceipt(transaction.id)}
                          className="bg-brand-green-100 hover:bg-brand-green-200 text-brand-green-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Receipt</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Checklist & Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-6">📋 Tax Deduction Checklist</h3>
          <div className="space-y-3">
            {checklist.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-brand-gray-50 rounded-2xl hover:bg-brand-green-50 transition-colors duration-300">
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    item.checked 
                      ? 'bg-brand-green-500 shadow-glow-green' 
                      : 'bg-brand-gray-300 hover:bg-brand-green-300'
                  }`}>
                    {item.checked && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-brand-gray-900">{item.item}</span>
                    {item.category && (
                      <span className="ml-2 bg-brand-blue-100 text-brand-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
                {item.amount && (
                  <span className="text-sm font-bold text-brand-gray-900">{item.amount}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card bg-gradient-to-br from-brand-blue-50 to-brand-green-50 border-brand-blue-200">
          <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-6">💡 Tax Saving Tips</h3>
          <div className="space-y-4">
            {tips.map(tip => (
              <div key={tip.id} className="p-4 bg-white/60 rounded-2xl hover:bg-white/80 transition-all duration-300">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{tip.icon || '💡'}</div>
                  <div>
                    <h4 className="font-semibold text-brand-gray-900 mb-2">{tip.title}</h4>
                    <p className="text-sm text-brand-gray-700 leading-relaxed">{tip.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Classification Modal */}
      <Modal open={showAIPanel} onClose={() => setShowAIPanel(false)} title="🤖 AI Classification" widthClass="max-w-2xl">
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-brand-gray-900 mb-3">Classify Transactions</h4>
            <p className="text-brand-gray-600 mb-4">
              Our AI will analyze your transactions and automatically categorize potential tax deductions based on your rules and patterns.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={classifyRange.start}
                  onChange={(e) => setClassifyRange(prev => ({ ...prev, start: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={classifyRange.end}
                  onChange={(e) => setClassifyRange(prev => ({ ...prev, end: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>

            {classifyProgress !== null && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-brand-gray-600">Classification Progress</span>
                  <span className="font-semibold text-purple-600">{classifyProgress}%</span>
                </div>
                <div className="w-full bg-brand-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${classifyProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAIPanel(false)}
                disabled={classifyProgress !== null}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={runAIClassification}
                disabled={!classifyRange.start || !classifyRange.end || classifyProgress !== null}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {classifyProgress !== null ? 'Classifying...' : 'Start Classification'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Rules Management Modal */}
      <Modal open={showRulesPanel} onClose={() => setShowRulesPanel(false)} title="⚙️ Classification Rules" widthClass="max-w-4xl">
        <div className="space-y-6">
          {/* Create New Rule */}
          <div className="bg-gradient-to-r from-brand-green-50 to-brand-blue-50 border border-brand-green-200 rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-brand-gray-900 mb-4">Create New Rule</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Match Type</label>
                <select
                  value={newRule.matchType}
                  onChange={(e) => setNewRule(prev => ({ ...prev, matchType: e.target.value as any }))}
                  className="input-field"
                >
                  <option value="DESCRIPTION_REGEX">Description Pattern</option>
                  <option value="CATEGORY">Category Match</option>
                  <option value="MERCHANT">Merchant Match</option>
                  <option value="AMOUNT_RANGE">Amount Range</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Tax Category</label>
                <select
                  value={newRule.taxCategoryCode}
                  onChange={(e) => setNewRule(prev => ({ ...prev, taxCategoryCode: e.target.value }))}
                  className="input-field"
                >
                  {categories.map(cat => (
                    <option key={cat.code} value={cat.code}>{cat.code} - {cat.description.split(' - ')[0]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Match Value</label>
              <input
                type="text"
                value={newRule.matchValue}
                onChange={(e) => setNewRule(prev => ({ ...prev, matchValue: e.target.value }))}
                className="input-field"
                placeholder={
                  newRule.matchType === 'DESCRIPTION_REGEX' ? 'e.g., LIC|INSURANCE' :
                  newRule.matchType === 'CATEGORY' ? 'e.g., Insurance' :
                  newRule.matchType === 'MERCHANT' ? 'e.g., LIC OF INDIA' :
                  'e.g., 1000:50000'
                }
              />
            </div>

            {/* Rule Testing */}
            <div className="mt-6 p-4 bg-white/60 rounded-2xl border border-brand-gray-200">
              <h5 className="font-semibold text-brand-gray-900 mb-3">Test Rule</h5>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={testRule.description}
                  onChange={(e) => setTestRule(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  placeholder="Test description"
                />
                <input
                  type="number"
                  value={testRule.amount}
                  onChange={(e) => setTestRule(prev => ({ ...prev, amount: e.target.value }))}
                  className="input-field"
                  placeholder="Test amount"
                />
              </div>
              
              <div className="flex items-center space-x-3 mt-3">
                <button
                  onClick={testRuleLogic}
                  className="bg-brand-blue-100 hover:bg-brand-blue-200 text-brand-blue-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105"
                >
                  Test Rule
                </button>
                {testResult && (
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    testResult.matched 
                      ? 'bg-brand-green-100 text-brand-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {testResult.matched ? '✅ Match' : '❌ No Match'}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={createRule}
                disabled={!newRule.matchValue.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Rule
              </button>
            </div>
          </div>

          {/* Existing Rules */}
          <div>
            <h4 className="text-lg font-semibold text-brand-gray-900 mb-4">Existing Rules</h4>
            {rules.length === 0 ? (
              <p className="text-brand-gray-600 text-center py-8">No rules created yet</p>
            ) : (
              <div className="space-y-3">
                {rules.map(rule => (
                  <div key={rule.id} className="p-4 bg-white border border-brand-gray-200 rounded-2xl hover:shadow-funky transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="bg-brand-blue-100 text-brand-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                            {rule.matchType}
                          </span>
                          <span className="bg-brand-green-100 text-brand-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                            {rule.taxCategoryCode}
                          </span>
                          {!rule.active && (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-brand-gray-900">{rule.matchValue}</p>
                        <p className="text-xs text-brand-gray-600">Priority: {rule.priority}</p>
                      </div>
                      <button
                        onClick={() => deleteRule(rule.id!)}
                        className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Add Transaction Modal */}
      <Modal open={showAddTransaction} onClose={() => !creatingTx && setShowAddTransaction(false)} title="➕ Add Tax Transaction" widthClass="max-w-lg">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Description / Note</label>
              <input
                type="text"
                value={newTransaction.note || ''}
                onChange={(e)=> setNewTransaction(p=>({...p, note: e.target.value}))}
                className="input-field"
                placeholder="e.g. LIC premium"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Category</label>
              <select
                value={newTransaction.category || ''}
                onChange={(e)=> setNewTransaction(p=>({...p, category: e.target.value}))}
                className="input-field"
              >
                <option value="" disabled>Select...</option>
                {categories.map(c => (
                  <option key={c.code} value={c.code}>{c.code} - {c.description.split(' - ')[0]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Amount</label>
              <input
                type="number"
                value={newTransaction.amount ?? ''}
                onChange={(e)=> setNewTransaction(p=>({...p, amount: e.target.value ? parseFloat(e.target.value) : null}))}
                className="input-field"
                min={0}
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Paid Date</label>
              <input
                type="date"
                value={newTransaction.paidDate || ''}
                onChange={(e)=> setNewTransaction(p=>({...p, paidDate: e.target.value}))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Deductible</label>
              <select
                value={newTransaction.deductible ? 'true':'false'}
                onChange={(e)=> setNewTransaction(p=>({...p, deductible: e.target.value === 'true'}))}
                className="input-field"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button onClick={()=> setShowAddTransaction(false)} disabled={creatingTx} className="btn-secondary">Cancel</button>
            <button onClick={createTransaction} disabled={creatingTx} className="btn-primary">{creatingTx? 'Saving...' : 'Add Transaction'}</button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal open={showSettings} onClose={()=> setShowSettings(false)} title="⚙️ Tax Tracker Settings" widthClass="max-w-2xl">
        <div className="space-y-6">
          <div className="p-4 bg-brand-gray-50 rounded-2xl text-sm text-brand-gray-700 leading-relaxed">
            Configure how tax deduction categories are displayed. Editing limits may require backend support; currently read-only.
          </div>
          <div className="space-y-3 max-h-80 overflow-auto pr-2">
            {categories.map(c => (
              <div key={c.code} className="flex items-center justify-between p-3 bg-white rounded-xl border border-brand-gray-200">
                <div>
                  <p className="font-semibold text-brand-gray-900">{c.code}</p>
                  <p className="text-xs text-brand-gray-600">{c.description}</p>
                </div>
                <div className="text-right text-xs text-brand-gray-600">
                  {c.annualLimit && <p>Limit: {formatCurrency(c.annualLimit, undefined, preferences)}</p>}
                  <p>Used: {formatCurrency(c.used, undefined, preferences)}</p>
                  <p className="font-semibold" style={{color: c.overLimit? '#EF4444' : c.nearLimit? '#F59E0B' : '#00B77D'}}>{c.percentUsed.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button onClick={()=> setShowSettings(false)} className="btn-primary">Close</button>
          </div>
        </div>
      </Modal>

      {/* Receipt Upload Modal */}
      <Modal open={uploadTxId !== null} onClose={()=> uploadProgress===null && setUploadTxId(null)} title="📄 Upload Receipt" widthClass="max-w-md">
        {uploadTxId && (
          <div className="space-y-5">
            <div className="p-4 bg-brand-gray-50 rounded-2xl text-sm text-brand-gray-700">
              Select the receipt file for transaction #{uploadTxId}.
            </div>
            <div>
              <input
                type="file"
                accept="image/*,application/pdf"
                disabled={uploadProgress !== null}
                onChange={(e)=> { const f = e.target.files?.[0]; if(f) handleUploadReceipt(f); }}
                className="block w-full text-sm text-brand-gray-700 file:mr-4 file:px-4 file:py-2 file:rounded-full file:border-0 file:bg-brand-blue-100 file:text-brand-blue-700 file:font-semibold hover:file:bg-brand-blue-200"
              />
            </div>
            {uploadProgress !== null && (
              <div>
                <div className="flex justify-between text-xs mb-1"><span>Uploading</span><span>{uploadProgress}%</span></div>
                <div className="w-full h-2 bg-brand-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-blue transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button onClick={()=> setUploadTxId(null)} disabled={uploadProgress !== null} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TaxTracker;