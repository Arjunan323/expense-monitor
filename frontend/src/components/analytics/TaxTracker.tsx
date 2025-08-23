import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Upload, Calculator, AlertTriangle, CheckCircle, Plus, Receipt, Info, TrendingUp, RefreshCcw, Filter, ShieldCheck, Ban, Play, Settings, Trash2, Brain, Zap, Target, Eye, EyeOff } from 'lucide-react';
import { taxApi, TaxTransactionDto, TaxCategoryUsageDto, TaxSummaryDto, TaxInsightDto } from '../../api/client';
import ChecklistAndTips from './ChecklistAndTips';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { usePreferences } from '../../contexts/PreferencesContext';

import { Toast } from '../ui/Toast';

interface UiTransaction extends TaxTransactionDto {
  tempId?: string; // for optimistic create
}

interface ClassificationRule {
  id?: number;
  matchType: string;
  matchValue: string;
  taxCategoryCode: string;
  priority: number;
  autoMarkDeductible: boolean;
  active: boolean;
}

// Lightweight inline test widget for rules
const TestRuleWidget: React.FC<{rules:any[]; categories:string[]}> = ({ rules, categories }) => {
  const [form, setForm] = useState({ matchType:'DESCRIPTION_REGEX', matchValue:'', description:'', amount:'', category:'', merchant:'' });
  const [result, setResult] = useState<any|null>(null);
  const [loading, setLoading] = useState(false);
  const runTest = async () => {
    if(!form.matchValue) return;
    try {
      setLoading(true);
      const payload:any = { matchType: form.matchType, matchValue: form.matchValue };
      if(form.description) payload.description=form.description;
      if(form.amount) payload.amount=parseFloat(form.amount);
      if(form.category) payload.category=form.category;
      if(form.merchant) payload.merchant=form.merchant;
      const res = await taxApi.testRule(payload);
      setResult(res);
    } catch(e:any){ setResult({ error: e.message||'Failed'}); } finally { setLoading(false);} };
  return (
    <div className="mt-6 p-4 border border-brand-gray-200 rounded-2xl bg-white">
      <h5 className="font-semibold mb-3 text-sm flex items-center space-x-2"><span>🔍</span><span>Test Rule</span></h5>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end text-xs">
        <div>
          <label className="block mb-1 font-semibold text-brand-gray-600">Type</label>
          <select value={form.matchType} onChange={e=> setForm(f=>({...f, matchType:e.target.value}))} className="input-field py-1">
            <option value="DESCRIPTION_REGEX">DESCRIPTION_REGEX</option>
            <option value="CATEGORY">CATEGORY</option>
            <option value="MERCHANT">MERCHANT</option>
            <option value="AMOUNT_RANGE">AMOUNT_RANGE</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-semibold text-brand-gray-600">Value</label>
          <input value={form.matchValue} onChange={e=> setForm(f=>({...f, matchValue:e.target.value}))} className="input-field py-1" placeholder="regex / value" />
        </div>
        <div>
          <label className="block mb-1 font-semibold text-brand-gray-600">Desc</label>
          <input value={form.description} onChange={e=> setForm(f=>({...f, description:e.target.value}))} className="input-field py-1" placeholder="Sample description" />
        </div>
        <div>
          <label className="block mb-1 font-semibold text-brand-gray-600">Amount</label>
          <input value={form.amount} onChange={e=> setForm(f=>({...f, amount:e.target.value}))} className="input-field py-1" type="number" placeholder="1000" />
        </div>
        <div>
          <label className="block mb-1 font-semibold text-brand-gray-600">Category</label>
          <select value={form.category} onChange={e=> setForm(f=>({...f, category:e.target.value}))} className="input-field py-1">
            <option value="">(auto)</option>
            {categories.map(c=> <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex space-x-2">
          <button disabled={loading} onClick={runTest} className="btn-primary text-xs w-full">{loading? 'Testing...':'Run'}</button>
        </div>
      </div>
      {result && (
        <div className="mt-3 text-xs p-2 rounded bg-brand-gray-100">
          {result.error && <span className="text-red-600">{result.error}</span>}
          {!result.error && (
            <div className="space-y-1">
              <div><span className="font-semibold">Matched:</span> {String(result.matched)}</div>
              {result.taxCategoryCode && <div><span className="font-semibold">Category:</span> {result.taxCategoryCode}</div>}
              {typeof result.autoMarkDeductible==='boolean' && <div><span className="font-semibold">Auto Deductible:</span> {result.autoMarkDeductible? 'Yes':'No'}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


// Checklist and Tips Section (must be outside main component)
// (Removed stray top-level JSX for ChecklistAndTips)

export const TaxTracker: React.FC = () => {
  const { preferences } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('2024-25');
  const [showAddForm, setShowAddForm] = useState(false);

  const [taxCategories, setTaxCategories] = useState<TaxCategoryUsageDto[]>([]);
  const [transactions, setTransactions] = useState<UiTransaction[]>([]);
  const [summary, setSummary] = useState<TaxSummaryDto | null>(null);
  const [insights, setInsights] = useState<TaxInsightDto[]>([]);
  const [suggestions, setSuggestions] = useState<UiTransaction[]>([]);
  const [suggestionPage, setSuggestionPage] = useState(0);
  const [suggestionTotalPages, setSuggestionTotalPages] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<number[]>([]);
  const [classifyRange, setClassifyRange] = useState({start:'', end:''});
  const [rules, setRules] = useState<ClassificationRule[]>([]);
  const [showRules, setShowRules] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<number|null>(null);
  const [editingRule, setEditingRule] = useState<ClassificationRule|null>(null);
  const [newRule, setNewRule] = useState<ClassificationRule>({ matchType:'DESCRIPTION_REGEX', matchValue:'', taxCategoryCode:'80C', priority:0, autoMarkDeductible:true, active:true });
  const [showClassifyPanel, setShowClassifyPanel] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showTestRule, setShowTestRule] = useState(false);
  const [testRuleForm, setTestRuleForm] = useState({
    matchType: 'DESCRIPTION_REGEX',
    matchValue: '',
    description: '',
    amount: '',
    category: '',
    merchant: ''
  });
  const [testResult, setTestResult] = useState<any>(null);
  const [classifyProgress, setClassifyProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{msg:string; type:'info'|'success'|'error'}|null>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const categoryIcon: Record<string,string> = { '80C':'💰','80D':'🏥','80G':'❤️','24(b)':'🏠','80E':'📚','80TTA':'🏦' };

  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    date: '',
    category: '80C',
    deductible: true
  });

  const fyToYear = (fy:string): number => {
    // '2024-25' -> 2024 (first year part)
    const m = fy.match(/^(\d{4})-/); return m? parseInt(m[1],10): new Date().getFullYear();
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const year = fyToYear(selectedPeriod);
      const [tx, sum, ins] = await Promise.all([
        taxApi.list(year),
        taxApi.summary(year),
        taxApi.insights(year)
      ]);
      setTransactions(tx.map(t=>({...t})));
      setSummary(sum);
      setTaxCategories(sum.categories);
      setInsights(ins);
      await loadSuggestions(0);
    } catch(e:any){
      setError(e.message || 'Failed to load tax data');
    } finally { setLoading(false); }
  }, [selectedPeriod]);
  const loadSuggestions = async (page:number) => {
    try {
      const res:any = await taxApi.suggestionsPage(page, 25);
      if(Array.isArray(res)) { setSuggestions(res as UiTransaction[]); setSuggestionTotalPages(1); }
      else { setSuggestions(res.content || []); setSuggestionTotalPages(res.totalPages || 0); }
      setSuggestionPage(page);
    } catch { setToast({msg:'Load suggestions failed', type:'error'}); }
  };

  useEffect(()=>{ loadData(); }, [loadData]);

  const totalDeductible = summary?.totalDeductible ?? transactions.filter(t=>t.deductible).reduce((s,t)=> s + (t.amount||0),0);

  const missingReceipts = summary?.missingReceipts ?? transactions.filter(t => t.deductible && !t.hasReceipt).length;

  const addTransaction = async () => {
    if (!(newTransaction.description && newTransaction.amount && newTransaction.date)) return;
    try {
      setSaving(true);
      const year = fyToYear(selectedPeriod);
      const payload = { taxYear: year, category: newTransaction.category, amount: parseFloat(newTransaction.amount), paidDate: newTransaction.date, note: newTransaction.description, deductible: newTransaction.deductible };
      const created = await taxApi.create(payload as any);
      setTransactions(prev => [created, ...prev]);
      setNewTransaction({ description: '', amount: '', date: '', category: '80C', deductible: true });
      loadData();
      setShowAddForm(false);
    } catch(e:any){ setError(e.message||'Create failed'); } finally { setSaving(false);}  };

  const toggleDeductible = async (id: number) => {
    try { const updated = await taxApi.toggleDeductible(id); setTransactions(prev=> prev.map(t=> t.id===id? updated : t)); loadData(); } catch(e:any){ setError('Toggle failed'); } };

  const handleUpload = async (id:number, file:File) => {
    try {
      // validation
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowed = ['application/pdf','image/png','image/jpeg'];
      if(file.size > maxSize){ setToast({msg:'File too large (max 5MB)', type:'error'}); return; }
      if(!allowed.some(a=> file.type===a)) { setToast({msg:'Unsupported file type', type:'error'}); return; }
      setSaving(true); setUploadPct(0);
      await taxApi.uploadReceipt(id, file, pct=> setUploadPct(pct));
      setToast({msg:'Receipt uploaded', type:'success'});
      await loadData();
    }
    catch(e:any){ setError('Upload failed'); setToast({msg:'Upload failed', type:'error'}); }
    finally { setSaving(false); setTimeout(()=> setUploadPct(null), 800);} };

  const onUploadClick = (id:number) => {
    const input = document.createElement('input');
    input.type='file';
    input.accept='image/*,application/pdf';
    input.onchange = ()=> { if(input.files && input.files[0]) handleUpload(id, input.files[0]); };
    input.click();
  };

  const manualRefresh = () => { taxApi.invalidateCache(); loadData(); };

  const runClassification = async () => {
    if(!classifyRange.start || !classifyRange.end){ setToast({msg:'Select start & end dates', type:'error'}); return; }
    try { 
      setSaving(true); 
      setClassifyProgress(0);
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setClassifyProgress(prev => prev !== null && prev < 90 ? prev + 10 : prev);
      }, 200);
      
      const res:any = await taxApi.classifyRange(classifyRange.start, classifyRange.end); 
      clearInterval(progressInterval);
      setClassifyProgress(100);
      
      setToast({msg:`Created ${res.created ?? res.value ?? 0} records`, type:'success'}); 
      await loadData(); 
      setTimeout(() => setClassifyProgress(null), 1000);
    }
    catch(e:any){ setToast({msg:'Classification failed', type:'error'});} finally { setSaving(false);} }

  const testRule = async () => {
    if (!testRuleForm.matchValue) {
      setToast({msg:'Enter match value to test', type:'error'});
      return;
    }
    try {
      setSaving(true);
      const payload: any = { 
        matchType: testRuleForm.matchType, 
        matchValue: testRuleForm.matchValue 
      };
      if (testRuleForm.description) payload.description = testRuleForm.description;
      if (testRuleForm.amount) payload.amount = parseFloat(testRuleForm.amount);
      if (testRuleForm.category) payload.category = testRuleForm.category;
      if (testRuleForm.merchant) payload.merchant = testRuleForm.merchant;
      
      const result = await taxApi.testRule(payload);
      setTestResult(result);
      setToast({msg: result.matched ? 'Rule matched!' : 'Rule did not match', type: result.matched ? 'success' : 'info'});
    } catch (e: any) {
      setTestResult({ error: e.message || 'Test failed' });
      setToast({msg:'Test failed', type:'error'});
    } finally {
      setSaving(false);
    }
  };

  const toggleSuggestionSelect = (id:number) => {
    setSelectedSuggestionIds(prev => prev.includes(id)? prev.filter(i=>i!==id): [...prev,id]);
  };

  const approveSelected = async () => {
    if(selectedSuggestionIds.length===0) return;
    try { setSaving(true); await taxApi.approveSuggestions(selectedSuggestionIds); setToast({msg:'Approved', type:'success'}); setSelectedSuggestionIds([]); await loadData(); }
    catch{ setToast({msg:'Approve failed', type:'error'});} finally { setSaving(false);} };

  const rejectSelected = async () => {
    if(selectedSuggestionIds.length===0) return;
    try { setSaving(true); await taxApi.rejectSuggestions(selectedSuggestionIds); setToast({msg:'Rejected', type:'success'}); setSelectedSuggestionIds([]); await loadData(); }
    catch{ setToast({msg:'Reject failed', type:'error'});} finally { setSaving(false);} };

  const loadRules = async () => { try { setRules(await taxApi.listRules() as ClassificationRule[]); setEditingRuleId(null); setEditingRule(null); } catch{ setToast({msg:'Load rules failed', type:'error'});} };
  const addRule = async () => {
    if(!newRule.matchValue) { setToast({msg:'Enter match value', type:'error'}); return; }
    try { setSaving(true); await taxApi.createRule(newRule); setToast({msg:'Rule created', type:'success'}); setNewRule({ ...newRule, matchValue:''}); await loadRules(); }
    catch{ setToast({msg:'Create rule failed', type:'error'});} finally { setSaving(false);} };
  const deleteRule = async (id:number) => { try { await taxApi.deleteRule(id); await loadRules(); } catch{} };
  const startEditRule = (rule:ClassificationRule) => { setEditingRuleId(rule.id!); setEditingRule({...rule}); };
  const cancelEditRule = () => { setEditingRuleId(null); setEditingRule(null); };
  const saveEditRule = async () => {
    if(!editingRule) return;
    try {
      setSaving(true);
  if(editingRule.id==null) throw new Error('Missing rule id');
  await taxApi.updateRule(editingRule.id, editingRule);
      setToast({msg:'Rule updated', type:'success'});
      await loadRules();
    } catch { setToast({msg:'Update failed', type:'error'}); }
    finally { setSaving(false); }
  };

  const viewReceipt = async (id:number) => {
    try {
      const blob = await taxApi.downloadReceipt(id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(()=> URL.revokeObjectURL(url), 30_000);
    } catch { setToast({msg:'No receipt available', type:'error'}); }
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
            <option value="2025-26">2025-26</option>
            <option value="2024-25">2024-25</option>
            <option value="2023-24">2023-24</option>
            <option value="2022-23">2022-23</option>
          </select>
        </div>
      </div>

  {error && <div className="p-4 rounded-2xl bg-red-100 text-red-700 text-sm">{error}</div>}
  {uploadPct!==null && <div className="w-full bg-brand-gray-200 h-2 rounded-full overflow-hidden"><div className="h-2 bg-brand-blue-500 transition-all" style={{width:`${uploadPct}%`}}/></div>}

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
          {(() => {
            const c80c = taxCategories.find(c=>c.code==='80C');
            const used = c80c?.used ?? 0; const limit = c80c?.annualLimit ?? 0;
            return <><p className="text-2xl font-bold text-brand-blue-600">{formatCurrency(used, undefined, preferences)}</p><p className="text-sm text-brand-gray-500">of {limit? formatCurrency(limit, undefined, preferences): '—'} limit</p></>;
          })()}
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
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(31200, undefined, preferences)}</p>
          <p className="text-sm text-brand-gray-500">Estimated (30% bracket)</p>
        </div>
      </div>

      {/* Tax Categories Overview */}
      <div className="card">
        <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-6">Tax Deduction Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {taxCategories.map(category => {
            const limit = category.annualLimit || 0;
            const percentage = limit > 0 ? category.percentUsed : 0;
            const isNearLimit = category.nearLimit;
            const isOverLimit = category.overLimit;

            return (
              <div key={category.code} className="p-4 bg-brand-gray-50 rounded-2xl hover:bg-brand-gray-100 transition-colors duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{categoryIcon[category.code] || '📄'}</span>
                    <div>
                      <h4 className="font-bold text-brand-gray-900">{category.code}</h4>
                      <p className="text-xs text-brand-gray-600">{category.description?.split('-')[0]}</p>
                    </div>
                  </div>
                  {isOverLimit && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  {isNearLimit && !isOverLimit && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                </div>
                
                <p className="text-xs text-brand-gray-600 mb-3">{category.description}</p>
                
                {limit > 0 && (
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
          <span>Limit: {formatCurrency(limit, undefined, preferences)}</span>
          <span>{percentage.toFixed(1)}%</span>
                    </div>
                  </>
                )}
                
                {limit === 0 && (
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
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowClassifyPanel(!showClassifyPanel)}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:scale-105 transition-all duration-300 flex items-center space-x-2"
            >
              <Brain className="w-5 h-5" />
              <span>AI Classify</span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>

        {/* Enhanced Control Panel */}
        <div className="bg-gradient-to-r from-brand-green-50 to-brand-blue-50 rounded-3xl p-6 mb-6 border border-brand-green-200">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setShowSuggestions(!showSuggestions)} 
                className={`px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 flex items-center space-x-2 ${
                  showSuggestions 
                    ? 'bg-gradient-blue text-white shadow-glow-blue' 
                    : 'bg-white border-2 border-brand-blue-200 text-brand-blue-700 hover:border-brand-blue-400'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span>AI Suggestions ({suggestions.length})</span>
              </button>
              
              <button 
                onClick={() => { setShowRules(!showRules); if(!showRules) loadRules(); }} 
                className={`px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 flex items-center space-x-2 ${
                  showRules 
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg' 
                    : 'bg-white border-2 border-purple-200 text-purple-700 hover:border-purple-400'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Classification Rules</span>
              </button>
              
              <button 
                onClick={() => setShowTestRule(!showTestRule)} 
                className={`px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 flex items-center space-x-2 ${
                  showTestRule 
                    ? 'bg-gradient-yellow text-brand-gray-900 shadow-glow-yellow' 
                    : 'bg-white border-2 border-accent-200 text-accent-700 hover:border-accent-400'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Test Rules</span>
              </button>
            </div>
            
            <button
              onClick={manualRefresh}
              className="bg-white border-2 border-brand-gray-200 hover:border-brand-green-400 text-brand-gray-700 hover:text-brand-green-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:shadow-funky flex items-center space-x-2"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* AI Classification Panel */}
        {showClassifyPanel && (
          <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-heading font-bold text-brand-gray-900">AI Classification Engine</h4>
                  <p className="text-sm text-brand-gray-600">Automatically categorize transactions using smart rules</p>
                </div>
              </div>
              <button
                onClick={() => setShowClassifyPanel(false)}
                className="text-brand-gray-400 hover:text-brand-gray-600 p-2 rounded-xl hover:bg-white/50 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Start Date</label>
                <input 
                  type="date" 
                  value={classifyRange.start} 
                  onChange={e => setClassifyRange(r => ({...r, start: e.target.value}))} 
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">End Date</label>
                <input 
                  type="date" 
                  value={classifyRange.end} 
                  onChange={e => setClassifyRange(r => ({...r, end: e.target.value}))} 
                  className="input-field"
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={runClassification} 
                  disabled={!classifyRange.start || !classifyRange.end || saving}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <LoadingSpinner size="sm" className="text-white" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  <span>{saving ? 'Classifying...' : 'Run AI Classification'}</span>
                </button>
              </div>
            </div>
            
            {classifyProgress !== null && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-brand-gray-700">Classification Progress</span>
                  <span className="text-sm font-bold text-purple-600">{classifyProgress}%</span>
                </div>
                <div className="w-full bg-brand-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${classifyProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Test Rule Panel */}
        {showTestRule && (
          <div className="card bg-gradient-to-br from-accent-50 to-yellow-50 border-accent-200 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-yellow rounded-2xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-brand-gray-900" />
                </div>
                <div>
                  <h4 className="text-lg font-heading font-bold text-brand-gray-900">Rule Testing Lab</h4>
                  <p className="text-sm text-brand-gray-600">Test your classification rules with sample data</p>
                </div>
              </div>
              <button
                onClick={() => setShowTestRule(false)}
                className="text-brand-gray-400 hover:text-brand-gray-600 p-2 rounded-xl hover:bg-white/50 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Rule Type</label>
                <select 
                  value={testRuleForm.matchType} 
                  onChange={e => setTestRuleForm(f => ({...f, matchType: e.target.value}))} 
                  className="input-field"
                >
                  <option value="DESCRIPTION_REGEX">Description Pattern</option>
                  <option value="CATEGORY">Category Match</option>
                  <option value="MERCHANT">Merchant Match</option>
                  <option value="AMOUNT_RANGE">Amount Range</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Match Value</label>
                <input 
                  value={testRuleForm.matchValue} 
                  onChange={e => setTestRuleForm(f => ({...f, matchValue: e.target.value}))} 
                  className="input-field" 
                  placeholder="e.g., LIC|INSURANCE" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Test Description</label>
                <input 
                  value={testRuleForm.description} 
                  onChange={e => setTestRuleForm(f => ({...f, description: e.target.value}))} 
                  className="input-field" 
                  placeholder="Sample transaction description" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Test Amount</label>
                <input 
                  type="number"
                  value={testRuleForm.amount} 
                  onChange={e => setTestRuleForm(f => ({...f, amount: e.target.value}))} 
                  className="input-field" 
                  placeholder="25000" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Test Category</label>
                <input 
                  value={testRuleForm.category} 
                  onChange={e => setTestRuleForm(f => ({...f, category: e.target.value}))} 
                  className="input-field" 
                  placeholder="Insurance" 
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={testRule} 
                  disabled={!testRuleForm.matchValue || saving}
                  className="w-full bg-gradient-yellow text-brand-gray-900 px-6 py-3 rounded-2xl font-bold shadow-glow-yellow hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Target className="w-5 h-5" />
                  )}
                  <span>{saving ? 'Testing...' : 'Test Rule'}</span>
                </button>
              </div>
            </div>
            
            {testResult && (
              <div className={`p-4 rounded-2xl border-2 ${
                testResult.error 
                  ? 'bg-red-50 border-red-200' 
                  : testResult.matched 
                  ? 'bg-brand-green-50 border-brand-green-200' 
                  : 'bg-brand-gray-50 border-brand-gray-200'
              }`}>
                <div className="flex items-center space-x-3 mb-3">
                  {testResult.error ? (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  ) : testResult.matched ? (
                    <CheckCircle className="w-5 h-5 text-brand-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-brand-gray-600" />
                  )}
                  <h5 className="font-bold text-brand-gray-900">
                    {testResult.error ? 'Test Error' : testResult.matched ? 'Rule Matched!' : 'No Match'}
                  </h5>
                </div>
                
                {testResult.error ? (
                  <p className="text-sm text-red-700">{testResult.error}</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-brand-gray-600">Matched:</span>
                      <span className="font-semibold">{testResult.matched ? 'Yes' : 'No'}</span>
                    </div>
                    {testResult.taxCategoryCode && (
                      <div className="flex justify-between">
                        <span className="text-brand-gray-600">Category:</span>
                        <span className="font-semibold">{testResult.taxCategoryCode}</span>
                      </div>
                    )}
                    {typeof testResult.autoMarkDeductible === 'boolean' && (
                      <div className="flex justify-between">
                        <span className="text-brand-gray-600">Auto Deductible:</span>
                        <span className="font-semibold">{testResult.autoMarkDeductible ? 'Yes' : 'No'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
                      {categoryIcon[cat.code] || '📄'} {cat.code}
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
                <th className="text-center py-3 px-4 font-semibold text-brand-gray-700">Status</th>
                <th className="text-center py-3 px-4 font-semibold text-brand-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction.id} className="border-b border-brand-gray-100 hover:bg-brand-gray-50 transition-colors duration-200">
                  <td className="py-4 px-4 text-sm text-brand-gray-900">{transaction.paidDate? formatDate(transaction.paidDate): ''}</td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-brand-gray-900">{transaction.note}</p>
                      {!transaction.hasReceipt && transaction.deductible && (
                        <p className="text-xs text-yellow-600 mt-1">⚠️ Receipt required</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-brand-gray-900">
                    {transaction.amount!=null? formatCurrency(transaction.amount, undefined, preferences): ''}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-blue-100 text-brand-blue-800">
                      {transaction.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => toggleDeductible(transaction.id as number)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                        transaction.deductible 
                          ? 'bg-gradient-green text-white shadow-glow-green' 
                          : 'bg-brand-gray-300 text-brand-gray-600 hover:bg-brand-gray-400'
                      }`}
                    >
                      {transaction.deductible ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <X className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-center">
                     {transaction.hasReceipt ? (
                      <div className="flex items-center justify-center space-x-2">
                        <button onClick={()=> viewReceipt(transaction.id as number)} className="flex items-center space-x-1 text-brand-green-600 hover:underline">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">View</span>
                        </button>
                      </div>
                    ) : (
                      <button onClick={()=> onUploadClick(transaction.id as number)} className="bg-gradient-blue text-white px-4 py-2 rounded-2xl text-xs font-semibold shadow-glow-blue hover:scale-105 transition-all duration-300 flex items-center space-x-1">
                        <Upload className="w-3 h-3 mr-1 inline" />
                        Upload
                      </button>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center text-xs">
                    <span className={`px-3 py-1 rounded-full font-semibold text-xs ${
                      transaction.classificationStatus==='SUGGESTED' ? 'bg-gradient-yellow text-brand-gray-900' : 
                      transaction.classificationStatus==='REJECTED' ? 'bg-red-100 text-red-600' : 
                      'bg-brand-green-100 text-brand-green-700'
                    }`}>
                      {transaction.classificationStatus||'MANUAL'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-xs">
                    <button
                      onClick={async ()=> { if(window.confirm('Delete this record? This will ignore the source transaction for future classification.')) { try { await taxApi.delete(transaction.id as number); setToast({msg:'Deleted', type:'success'}); await loadData(); } catch { setToast({msg:'Delete failed', type:'error'});} }}}
                      className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-xl transition-all duration-300 hover:scale-105 group"
                    >
                      <Trash2 className="w-4 h-4 group-hover:animate-wiggle" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showSuggestions && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-blue rounded-2xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-bold text-brand-gray-900">AI Suggestions</h3>
                <p className="text-sm text-brand-gray-600">Smart recommendations for tax categorization</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                disabled={!selectedSuggestionIds.length} 
                onClick={approveSelected} 
                className="bg-gradient-green text-white px-4 py-2 rounded-2xl font-semibold text-sm shadow-glow-green hover:scale-105 transition-all duration-300 flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Approve ({selectedSuggestionIds.length})</span>
              </button>
              <button 
                disabled={!selectedSuggestionIds.length} 
                onClick={rejectSelected} 
                className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Ban className="w-4 h-4" />
                <span>Reject ({selectedSuggestionIds.length})</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-brand-gray-200">
                  <th className="py-3 px-4 text-left font-semibold text-brand-gray-700">
                    <input 
                      type="checkbox" 
                      checked={selectedSuggestionIds.length === suggestions.length && suggestions.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSuggestionIds(suggestions.map(s => s.id as number));
                        } else {
                          setSelectedSuggestionIds([]);
                        }
                      }}
                      className="w-4 h-4 text-brand-green-600 rounded border-brand-gray-300 focus:ring-brand-green-500"
                    />
                  </th>
                  <th className="py-3 px-4 text-left font-semibold text-brand-gray-700">Date</th>
                  <th className="py-3 px-4 text-left font-semibold text-brand-gray-700">Description</th>
                  <th className="py-3 px-4 text-left font-semibold text-brand-gray-700">Category</th>
                  <th className="py-3 px-4 text-right font-semibold text-brand-gray-700">Amount</th>
                  <th className="py-3 px-4 text-left font-semibold text-brand-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map(s => (
                  <tr key={s.id} className="border-b border-brand-gray-100 hover:bg-gradient-to-r hover:from-brand-green-50 hover:to-brand-blue-50 transition-all duration-200">
                    <td className="py-4 px-4">
                      <input 
                        type="checkbox" 
                        checked={selectedSuggestionIds.includes(s.id as number)} 
                        onChange={() => toggleSuggestionSelect(s.id as number)}
                        className="w-4 h-4 text-brand-green-600 rounded border-brand-gray-300 focus:ring-brand-green-500"
                      />
                    </td>
                    <td className="py-4 px-4 text-sm text-brand-gray-900">{s.paidDate? formatDate(s.paidDate): ''}</td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-brand-gray-900">{s.note}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-blue text-white shadow-glow-blue">
                        {s.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-brand-gray-900">
                      {s.amount!=null? formatCurrency(s.amount, undefined, preferences): ''}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-yellow text-brand-gray-900">
                        <Brain className="w-3 h-3 mr-1" />
                        {s.classificationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {suggestions.length===0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <div className="flex flex-col items-center space-y-2">
                        <Brain className="w-8 h-8 text-brand-gray-300" />
                        <p className="text-sm text-brand-gray-500">No AI suggestions available</p>
                        <p className="text-xs text-brand-gray-400">Run classification to generate suggestions</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {suggestionTotalPages > 1 && (
              <div className="flex items-center justify-center space-x-4 mt-6 pt-4 border-t border-brand-gray-200">
                <button 
                  disabled={suggestionPage === 0} 
                  onClick={() => loadSuggestions(suggestionPage - 1)} 
                  className="bg-white border-2 border-brand-gray-200 hover:border-brand-blue-400 text-brand-gray-700 hover:text-brand-blue-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:shadow-funky disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-brand-gray-600">
                  Page {suggestionPage + 1} of {suggestionTotalPages}
                </span>
                <button 
                  disabled={suggestionPage + 1 >= suggestionTotalPages} 
                  onClick={() => loadSuggestions(suggestionPage + 1)} 
                  className="bg-white border-2 border-brand-gray-200 hover:border-brand-blue-400 text-brand-gray-700 hover:text-brand-blue-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:shadow-funky disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showRules && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-bold text-brand-gray-900">Classification Rules</h3>
                <p className="text-sm text-brand-gray-600">Manage automatic categorization rules</p>
              </div>
            </div>
            <button 
              onClick={loadRules} 
              className="bg-white border-2 border-brand-gray-200 hover:border-purple-400 text-brand-gray-700 hover:text-purple-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:shadow-funky flex items-center space-x-2"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Reload Rules</span>
            </button>
          </div>
          
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-brand-gray-200">
                  <th className="py-3 px-4 text-left font-semibold text-brand-gray-700">Type</th>
                  <th className="py-3 px-4 text-left font-semibold text-brand-gray-700">Match Value</th>
                  <th className="py-3 px-4 text-left font-semibold text-brand-gray-700">Category</th>
                  <th className="py-3 px-4 text-right font-semibold text-brand-gray-700">Priority</th>
                  <th className="py-3 px-4 text-center font-semibold text-brand-gray-700">Auto Deductible</th>
                  <th className="py-3 px-4 text-center font-semibold text-brand-gray-700">Status</th>
                  <th className="py-3 px-4 text-center font-semibold text-brand-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  (editingRuleId===r.id && editingRule) ? (
                    <tr key={r.id} className="border-b border-brand-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                      <td className="py-4 px-4">
                        <select value={editingRule.matchType} onChange={e=> setEditingRule(prev=> prev? ({...prev, matchType:e.target.value}) : prev)} className="input-field py-1">
                          <option value="DESCRIPTION_REGEX">DESCRIPTION_REGEX</option>
                          <option value="CATEGORY">CATEGORY</option>
                          <option value="MERCHANT">MERCHANT</option>
                          <option value="AMOUNT_RANGE">AMOUNT_RANGE</option>
                        </select>
                      </td>
                      <td className="py-4 px-4"><input value={editingRule.matchValue} onChange={e=> setEditingRule(prev=> prev? ({...prev, matchValue:e.target.value}) : prev)} className="input-field py-1" /></td>
                      <td className="py-4 px-4">
                        <select value={editingRule.taxCategoryCode} onChange={e=> setEditingRule(prev=> prev? ({...prev, taxCategoryCode:e.target.value}) : prev)} className="input-field py-1">
                          {taxCategories.map(c=> <option key={c.code} value={c.code}>{c.code}</option>)}
                        </select>
                      </td>
                      <td className="py-4 px-4 text-right"><input type="number" value={editingRule.priority} onChange={e=> setEditingRule(prev=> prev? ({...prev, priority:parseInt(e.target.value||'0',10)}) : prev)} className="input-field py-1 w-20" /></td>
                      <td className="py-4 px-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={!!editingRule.autoMarkDeductible} 
                          onChange={e=> setEditingRule(prev=> prev? ({...prev, autoMarkDeductible:e.target.checked}) : prev)}
                          className="w-4 h-4 text-brand-green-600 rounded border-brand-gray-300 focus:ring-brand-green-500"
                        />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={!!editingRule.active} 
                          onChange={e=> setEditingRule(prev=> prev? ({...prev, active:e.target.checked}) : prev)}
                          className="w-4 h-4 text-brand-green-600 rounded border-brand-gray-300 focus:ring-brand-green-500"
                        />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={saveEditRule} 
                            className="bg-gradient-green text-white px-3 py-1 rounded-xl font-semibold text-xs shadow-glow-green hover:scale-105 transition-all duration-300"
                          >
                            Save
                          </button>
                          <button 
                            onClick={cancelEditRule} 
                            className="bg-brand-gray-200 hover:bg-brand-gray-300 text-brand-gray-700 px-3 py-1 rounded-xl font-semibold text-xs transition-all duration-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={r.id} className="border-b border-brand-gray-100 hover:bg-brand-gray-50 transition-colors duration-200">
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                          {r.matchType.replace('DESCRIPTION_', 'DESC_')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <code className="bg-brand-gray-100 px-2 py-1 rounded text-xs font-mono">{r.matchValue}</code>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-blue-100 text-brand-blue-800">
                          {r.taxCategoryCode}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-brand-gray-100 rounded-full text-sm font-bold text-brand-gray-700">
                          {r.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto ${
                          r.autoMarkDeductible ? 'bg-gradient-green text-white' : 'bg-brand-gray-300 text-brand-gray-600'
                        }`}>
                          {r.autoMarkDeductible ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          r.active ? 'bg-brand-green-100 text-brand-green-700' : 'bg-brand-gray-100 text-brand-gray-600'
                        }`}>
                          {r.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => startEditRule(r)} 
                            className="bg-brand-blue-100 hover:bg-brand-blue-200 text-brand-blue-700 p-2 rounded-xl transition-all duration-300 hover:scale-105"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { if(r.id!=null) deleteRule(r.id); }} 
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-xl transition-all duration-300 hover:scale-105 group"
                          >
                            <Trash2 className="w-4 h-4 group-hover:animate-wiggle" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
                {rules.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center">
                      <div className="flex flex-col items-center space-y-2">
                        <Settings className="w-8 h-8 text-brand-gray-300" />
                        <p className="text-sm text-brand-gray-500">No classification rules yet</p>
                        <p className="text-xs text-brand-gray-400">Create rules to automate tax categorization</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Add New Rule Form */}
          <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl border border-purple-200">
            <h4 className="text-lg font-heading font-bold text-brand-gray-900 mb-4 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-purple-600" />
              <span>Create New Rule</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Rule Type</label>
                <select value={newRule.matchType} onChange={e=> setNewRule(r=>({...r, matchType:e.target.value}))} className="input-field py-1">
                  <option value="DESCRIPTION_REGEX">DESCRIPTION_REGEX</option>
                  <option value="CATEGORY">CATEGORY</option>
                  <option value="MERCHANT">MERCHANT</option>
                  <option value="AMOUNT_RANGE">AMOUNT_RANGE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Match Value</label>
                <input value={newRule.matchValue} onChange={e=> setNewRule(r=>({...r, matchValue:e.target.value}))} className="input-field py-1" placeholder="regex / value" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Tax Category</label>
                <select value={newRule.taxCategoryCode} onChange={e=> setNewRule(r=>({...r, taxCategoryCode:e.target.value}))} className="input-field py-1">
                  {taxCategories.map(c=> <option key={c.code}>{c.code}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Priority</label>
                <input type="number" value={newRule.priority} onChange={e=> setNewRule(r=>({...r, priority:parseInt(e.target.value||'0',10)}))} className="input-field py-1" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={newRule.autoMarkDeductible} 
                    onChange={e=> setNewRule(r=>({...r, autoMarkDeductible:e.target.checked}))}
                    className="w-4 h-4 text-brand-green-600 rounded border-brand-gray-300 focus:ring-brand-green-500"
                  />
                  <span className="text-sm font-semibold text-brand-gray-700">Auto Mark Deductible</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={newRule.active} 
                    onChange={e=> setNewRule(r=>({...r, active:e.target.checked}))}
                    className="w-4 h-4 text-brand-green-600 rounded border-brand-gray-300 focus:ring-brand-green-500"
                  />
                  <span className="text-sm font-semibold text-brand-gray-700">Active Rule</span>
                </label>
              </div>
              
              <button 
                onClick={addRule} 
                disabled={!newRule.matchValue || saving}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                <span>{saving ? 'Adding...' : 'Create Rule'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

  {/* Quick Reference Checklist (Dynamic) */}
  <ChecklistAndTips />

      {/* Alerts Section */}
  {(missingReceipts > 0 || taxCategories.some(c => (c.annualLimit||0) > 0 && c.used > (c.annualLimit||0))) && (
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
            
            {taxCategories.filter(c => (c.annualLimit||0) > 0 && c.used > (c.annualLimit||0)).map(category => (
              <div key={category.code} className="flex items-start space-x-3 p-3 bg-red-100 rounded-2xl">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800">Exceeded {category.code} Limit</p>
                  <p className="text-sm text-red-700">
                    {(() => { const limit = category.annualLimit||0; const over = category.used - limit; return (
                      <>You've exceeded the {formatCurrency(limit, undefined, preferences)} limit by {formatCurrency(over, undefined, preferences)}. <br className="hidden sm:block" />Only {formatCurrency(limit, undefined, preferences)} is eligible for deduction.</>
                    ); })()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={()=> setToast(null)} />}
    </div>
  );
};

export default TaxTracker;