import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, Filter, BarChart3, LineChart, Eye, EyeOff } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { DateRangePicker } from '../ui/DateRangePicker';
import { MultiSelect } from '../ui/MultiSelect';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { fetchMonthlySpendingSeries } from '../../api/analyticsTrends';
import { fetchBanks } from '../../utils/api';
import { usePreferences } from '../../contexts/PreferencesContext';

export const MonthlyTrends: React.FC<{ planType: string }> = ({ planType }) => {
  const { preferences } = usePreferences();
  const [loading, setLoading] = useState(true);
  const STORAGE_KEY = 'monthlyTrendsPrefs';
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [viewMode, setViewMode] = useState<'category' | 'bank' | 'previous'>('category');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [bankOptions, setBankOptions] = useState<{ value:string; label:string; count?:number }[]>([]);
  const [showPerBank, setShowPerBank] = useState(false);

  const [trendData, setTrendData] = useState<{ month: string; amount: number; banks?: { name: string; outflow: number; }[]; categories?: { name: string; outflow: number; }[] }[]>([]);
  const [bankKeys, setBankKeys] = useState<string[]>([]);
  const [categoryKeys, setCategoryKeys] = useState<string[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    highestMonth: { month: '', amount: 0 },
    lowestMonth: { month: '', amount: 0 },
    averageSpending: 0,
    momChange: 0
  });
  const [error, setError] = useState<string | null>(null);

  const currencySymbol = useMemo(()=>{
    try {
      const sample = new Intl.NumberFormat(preferences.locale||'en-US', { style:'currency', currency: preferences.currency||'USD', minimumFractionDigits:0, maximumFractionDigits:0 }).format(0);
      return sample.replace(/0/g,'').trim();
    } catch { return preferences.currency || '$'; }
  }, [preferences]);
  const shortCurrency = (value:number)=> `${currencySymbol}${(value/1000).toFixed(0)}K`;

  const computeDefaultRange = () => {
    const now = new Date();
    const endYm = new Date(now.getFullYear(), now.getMonth(), 1);
    const startYm = new Date(endYm.getFullYear(), endYm.getMonth() - 5, 1);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    return { start: fmt(startYm), end: fmt(endYm) };
  };

  // Load persisted preferences
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        const p = JSON.parse(raw);
        if(p.chartType) setChartType(p.chartType);
        if(p.viewMode) setViewMode(p.viewMode);
        if(p.dateRange && p.dateRange.start && p.dateRange.end) setDateRange(p.dateRange);
        if(Array.isArray(p.selectedBanks)) setSelectedBanks(p.selectedBanks);
        if(typeof p.showPerBank === 'boolean') setShowPerBank(p.showPerBank);
      }
    }catch{/* ignore */}
    setDateRange(dr => (!dr.start || !dr.end) ? computeDefaultRange() : dr);
  }, []);

  // Persist preferences
  useEffect(()=>{
    const payload = { chartType, viewMode, dateRange, selectedBanks, showPerBank };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch {/* ignore */}
  }, [chartType, viewMode, dateRange, selectedBanks, showPerBank]);

  const loadData = useCallback(async () => {
    if(!dateRange.start || !dateRange.end) return;
    setLoading(true); setError(null);
    try {
  const includeBanksActive = (showPerBank || viewMode==='bank') && planType === 'PREMIUM';
      const resp = await fetchMonthlySpendingSeries({ from: dateRange.start, to: dateRange.end, includeBanks: includeBanksActive, includePrevYear: viewMode==='previous', banks: selectedBanks.length ? selectedBanks : undefined });
      const chart = resp.monthly.map((p: any) => ({
        month: labelMonth(p.month),
        amount: Number(p.totalOutflow),
        banks: p.banks?.map((b: any) => ({ name: b.bank, outflow: Number(b.outflow) })),
        categories: p.categories?.map((c:any) => ({ name: c.category, outflow: Number(c.outflow) }))
      }));
      setTrendData(chart);
      if(includeBanksActive){
        const keys = new Set<string>();
        chart.forEach(m => m.banks?.forEach((b: { name: string; outflow: number }) => keys.add(b.name)));
        setBankKeys(Array.from(keys).sort());
      } else {
        setBankKeys([]);
      }
      // derive top categories overall (sum across months)
  if(viewMode==='category'){
        const catTotals: Record<string, number> = {};
        chart.forEach(m => m.categories?.forEach((c: { name: string; outflow: number }) => { catTotals[c.name] = (catTotals[c.name]||0)+c.outflow; }));
        const top = Object.entries(catTotals).sort((a,b)=>b[1]-a[1]).slice(0,6).map(e=>e[0]);
        setCategoryKeys(top);
      } else {
        setCategoryKeys([]);
      }
      setSummaryStats({
        highestMonth: { month: resp.summary.highest.month||'', amount: Number(resp.summary.highest.amount) },
        lowestMonth: { month: resp.summary.lowest.month||'', amount: Number(resp.summary.lowest.amount) },
        averageSpending: Number(resp.summary.averageOutflow),
        momChange: resp.summary.momChangePct ? Number(resp.summary.momChangePct) : 0
      });
    } catch(e:any){
      setError(e.message || 'Failed to load');
    } finally { setLoading(false); }
  }, [dateRange.start, dateRange.end, showPerBank, viewMode, selectedBanks]);

  useEffect(() => { loadData(); }, [loadData]);

  // Downgrade protections: if user not premium, force-disable advanced modes
  useEffect(() => {
    if(planType !== 'PREMIUM'){
      if(viewMode !== 'category') setViewMode('category');
      if(showPerBank) setShowPerBank(false);
    }
  }, [planType, viewMode, showPerBank]);

  const labelMonth = (ym: string) => {
    const [y,m] = ym.split('-');
    const date = new Date(Number(y), Number(m)-1, 1);
    return date.toLocaleString(undefined,{ month:'short', year:'numeric'});
  };

  // load banks once
  useEffect(()=>{
    (async()=>{
      try{
        const banks = await fetchBanks();
        setBankOptions(banks.map(b=>({ value: b.name, label: b.name, count: b.transactionCount })));
      }catch(err){ /* silent */ }
    })();
  },[]);
  // reload when banks changed
  useEffect(()=>{ loadData(); }, [selectedBanks]);

  const effectiveBankOptions = bankOptions;

  const includeBanksActive = (showPerBank || viewMode==='bank') && bankKeys.length>0;
  const includeCategoriesActive = (viewMode==='category') && !includeBanksActive && categoryKeys.length>0;
  const stackedData = useMemo(()=>{
    if(includeBanksActive){
      return trendData.map(row => {
        const base: any = { month: row.month };
        bankKeys.forEach(k => { base[k] = row.banks?.find(b=>b.name===k)?.outflow || 0; });
        return base;
      });
    } else if(includeCategoriesActive){
      return trendData.map(row => {
        const base: any = { month: row.month };
        categoryKeys.forEach(k => { base[k] = row.categories?.find(c=>c.name===k)?.outflow || 0; });
        return base;
      });
    }
    return trendData;
  }, [trendData, includeBanksActive, includeCategoriesActive, bankKeys, categoryKeys]);
  const palette = ['#00B77D','#0891B2','#6366F1','#F59E0B','#EC4899','#10B981','#8B5CF6','#DC2626','#0EA5E9','#14B8A6'];
  const colorFor = (name:string, idx:number) => palette[idx % palette.length];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if(error){
    return <div className="p-8 text-center">
      <p className="text-red-600 mb-4">{error}</p>
      <button onClick={loadData} className="btn-primary">Retry</button>
    </div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-heading font-bold mb-3 flex items-center gap-3">
            <span className="select-none leading-none">📈</span>
            <span className="gradient-text">Monthly Spending Trends</span>
          </h1>
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
                  options={effectiveBankOptions}
                  selected={selectedBanks}
                  onChange={setSelectedBanks}
                  placeholder="🏦 Select Banks"
                  className="min-w-[200px]"
                  title="Select Bank Accounts"
                  desc="Choose which banks to analyze"
                  deferCommit
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
                { key: 'bank', label: 'By Bank Account', icon: '🏦', disabled: bankOptions.length===0 || planType !== 'PREMIUM' },
                { key: 'previous', label: 'Previous Year', icon: '📅', disabled: planType !== 'PREMIUM' }
              ].map(mode => (
                <button
                  key={mode.key}
                  onClick={() => !('disabled' in mode && mode.disabled) && setViewMode(mode.key as any)}
                  disabled={('disabled' in mode && mode.disabled)}
                  className={`px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 ${
                    ('disabled' in mode && mode.disabled)
                      ? 'bg-brand-gray-100 text-brand-gray-400 cursor-not-allowed'
                      : viewMode === mode.key
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
            disabled={bankOptions.length===0 || planType !== 'PREMIUM'}
            onClick={() => setShowPerBank(!showPerBank)}
            className={`flex items-center space-x-2 text-sm transition-colors duration-300 ${(bankOptions.length===0 || planType !== 'PREMIUM') ? 'text-brand-gray-300 cursor-not-allowed' : 'text-brand-gray-600 hover:text-brand-green-600'}`}
          >
            {showPerBank ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showPerBank ? 'Hide' : 'Show'} bank breakdown</span>
          </button>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <RechartsLineChart data={stackedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => shortCurrency(value)} />
                <Tooltip 
                  formatter={(value: number, name: string) => [formatCurrency(value, undefined, preferences), includeBanksActive ? name : 'Amount']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 183, 125, 0.1)'
                  }}
                />
                {includeBanksActive ? (
                  bankKeys.map((bk, idx) => (
                    <Line key={bk} type="monotone" dataKey={bk} stroke={colorFor(bk, idx)} strokeWidth={2}
                      dot={false} activeDot={{ r: 6, stroke: colorFor(bk, idx), strokeWidth: 2, fill: '#ffffff' }} />
                  ))
                ) : includeCategoriesActive ? (
                  categoryKeys.map((ck, idx) => (
                    <Line key={ck} type="monotone" dataKey={ck} stroke={colorFor(ck, idx)} strokeWidth={2}
                      dot={false} activeDot={{ r: 5, stroke: colorFor(ck, idx), strokeWidth: 2, fill: '#ffffff' }} />
                  ))
                ) : (
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#00B77D" 
                    strokeWidth={3}
                    dot={{ fill: '#00B77D', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#00B77D', strokeWidth: 2, fill: '#ffffff' }}
                  />
                )}
                {(includeBanksActive || includeCategoriesActive) && <Legend />}
              </RechartsLineChart>
            ) : (
              <BarChart data={stackedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => shortCurrency(value)} />
                <Tooltip 
                  formatter={(value: number, name: string) => [formatCurrency(value, undefined, preferences), includeBanksActive ? name : 'Amount']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 183, 125, 0.1)'
                  }}
                />
                {includeBanksActive ? (
                  bankKeys.map((bk, idx) => (
                    <Bar key={bk} dataKey={bk} stackId="a" fill={colorFor(bk, idx)} radius={[8,8,0,0]} />
                  ))
                ) : includeCategoriesActive ? (
                  categoryKeys.map((ck, idx) => (
                    <Bar key={ck} dataKey={ck} stackId="a" fill={colorFor(ck, idx)} radius={[8,8,0,0]} />
                  ))
                ) : (
                  <Bar dataKey="amount" fill="#00B77D" radius={[8, 8, 0, 0]} />
                )}
                {(includeBanksActive || includeCategoriesActive) && <Legend />}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-gradient-to-br from-brand-green-50 to-brand-blue-50 border-brand-green-200">
          <h4 className="text-lg font-heading font-bold text-brand-gray-900 mb-4">💡 Key Insights</h4>
          {includeCategoriesActive ? (
            (()=>{
              // derive insights for category distribution
              const totals: Record<string, number> = {};
              trendData.forEach(m => m.categories?.forEach(c => { totals[c.name]=(totals[c.name]||0)+c.outflow; }));
              const sorted = Object.entries(totals).sort((a,b)=>b[1]-a[1]);
              const totalAll = sorted.reduce((s,[_k,v])=>s+v,0);
              const top1 = sorted[0];
              const top3Share = sorted.slice(0,3).reduce((s,[_k,v])=>s+v,0) / (totalAll||1) * 100;
              // pareto 80% categories count
              let running=0, paretoCount=0; for(const [_k,v] of sorted){ running+=v; paretoCount++; if(running/ (totalAll||1) >=0.8) break; }
              return (
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-brand-green-500 rounded-full mt-2" />
                    <p className="text-sm text-brand-gray-700">Top category <span className="font-semibold">{top1? top1[0]: 'N/A'}</span> contributes {top1? ((top1[1]/(totalAll||1))*100).toFixed(1): '0.0'}% of spend.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-brand-blue-500 rounded-full mt-2" />
                    <p className="text-sm text-brand-gray-700">Top 3 categories account for {top3Share.toFixed(1)}% of total outflow.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-accent-500 rounded-full mt-2" />
                    <p className="text-sm text-brand-gray-700">{paretoCount} categories make up 80% of spending (focus here for optimization).</p>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="space-y-3">
              <div className="flex items-start space-x-3"><div className="w-2 h-2 bg-brand-green-500 rounded-full mt-2" /><p className="text-sm text-brand-gray-700">Switch to "By Category" to see category composition stacked.</p></div>
              {planType === 'PREMIUM' ? (
                <>
                  <div className="flex items-start space-x-3"><div className="w-2 h-2 bg-brand-blue-500 rounded-full mt-2" /><p className="text-sm text-brand-gray-700">Use bank breakdown for per-account performance.</p></div>
                  <div className="flex items-start space-x-3"><div className="w-2 h-2 bg-accent-500 rounded-full mt-2" /><p className="text-sm text-brand-gray-700">Previous Year mode gives YoY context.</p></div>
                </>
              ) : (
                <div className="flex items-start space-x-3"><div className="w-2 h-2 bg-brand-blue-500 rounded-full mt-2" /><p className="text-sm text-brand-gray-700">Upgrade to Premium for bank breakdown & YoY comparison.</p></div>
              )}
            </div>
          )}
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