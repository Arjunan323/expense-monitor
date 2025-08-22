import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Bell, CheckCircle, X, Eye, TrendingUp, CreditCard, MapPin, BarChart3, EyeOff } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { usePreferences } from '../../contexts/PreferencesContext';
// @ts-ignore tooling resolution issue workaround
import { spendingAlertsApi, SpendingAlertDto, SpendingAlertSummaryDto, SpendingAlertSettingsDto, RecommendationDto, AuditEntryDto, RecommendationsGrouped, SpendingAlertsMeta } from '../../api/spendingAlerts';
import toast from 'react-hot-toast';

export const SpendingAlerts: React.FC = () => {
  const { preferences } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<SpendingAlertDto[]>([]);
  const [summary, setSummary] = useState<SpendingAlertSummaryDto | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [settings, setSettings] = useState<SpendingAlertSettingsDto | null>(null);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newMerchant, setNewMerchant] = useState('');
  const [mutedCats, setMutedCats] = useState<{ id:number; category:string; muteUntil?:string|null }[]>([]);
  const [muteCategoryInput, setMuteCategoryInput] = useState('');
  const [muteUntilInput, setMuteUntilInput] = useState('');
  const [tips, setTips] = useState<RecommendationDto[]>([]);
  const [suggestedLimits, setSuggestedLimits] = useState<RecommendationsGrouped['suggestedLimits']>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [auditAlert, setAuditAlert] = useState<SpendingAlertDto | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntryDto[]>([]);
  const [live, setLive] = useState<boolean>(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const month = new Date().toISOString().slice(0,7); // YYYY-MM current month
  const [meta, setMeta] = useState<SpendingAlertsMeta | null>(null);
  const [dismissedCount, setDismissedCount] = useState<number>(0);
  const [pageSize, setPageSize] = useState(50);
  const [sseAttempts, setSseAttempts] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const ackParam = showAcknowledged ? 'all' : 'false';
    const effectiveSize = pageSize && pageSize > 0 ? pageSize : 50;
    // Debug logging (remove in production if noisy)
    // eslint-disable-next-line no-console
    console.debug('[SpendingAlerts] Fetch list', { month, filterType, ackParam, page, effectiveSize });
  const listResp = await spendingAlertsApi.list({ month, type: filterType, severity: 'all', acknowledged: ackParam, page, size: effectiveSize });
  setAlerts(listResp.content);
  setTotalPages(listResp.page.totalPages);
  setSummary(listResp.summary);
  // derive dismissed count: total - (critical+moderate+acknowledged)
  const total = listResp.summary.total;
  const dismissed = total - (listResp.summary.criticalOpen + listResp.summary.moderateOpen + listResp.summary.acknowledged);
  setDismissedCount(dismissed < 0 ? 0 : dismissed);
      setSelectedIds(new Set());
    } catch (e:any) {
  // eslint-disable-next-line no-console
  console.error('[SpendingAlerts] List fetch failed', e);
  toast.error(e.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [filterType, showAcknowledged, page, month, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const loadAncillary = async () => {
      const results = await Promise.allSettled([
        spendingAlertsApi.settings(),
        spendingAlertsApi.whitelist(),
        spendingAlertsApi.muted(),
        spendingAlertsApi.recommendations(month),
        spendingAlertsApi.meta()
      ]);
      if(results[0].status==='fulfilled') setSettings(results[0].value);
      if(results[1].status==='fulfilled') setWhitelist(results[1].value);
      if(results[2].status==='fulfilled') setMutedCats(results[2].value);
      if(results[3].status==='fulfilled'){ setTips(results[3].value.tips as any); setSuggestedLimits(results[3].value.suggestedLimits); }
      if(results[4].status==='fulfilled') setMeta(results[4].value);
    };
    loadAncillary();
  }, [month]);

  useEffect(()=>{
    if(live){
  const es = spendingAlertsApi.stream((ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data);
          if(data && data.type && data.payload){
            if(data.type === 'alert.new') setAlerts(prev => [data.payload, ...prev]);
            if(data.type === 'alert.acknowledged' || data.type==='alert.updated') setAlerts(prev => prev.map(a=> a.id===data.payload.id? data.payload: a));
            if(data.type === 'alert.dismissed') setAlerts(prev => prev.filter(a=> a.id!==data.payload.id));
          }
        } catch(e){}
      }, (errEvent) => {
        // Stop retry loop if server returns 404 (likely backend route missing or port issue)
        // EventSource doesn't expose status directly; heuristic: if readyState is 2 (CLOSED) immediately after open attempt, back off longer.
        es.close();
        setEventSource(null);
        setSseAttempts(a=> a+1);
        const base = 1000;
        const delay = Math.min(60000, (2 ** sseAttempts) * base);
        setTimeout(()=> { if(live) setLive(true); }, delay);
      });
      setEventSource(es);
      return ()=>{ es.close(); };
    } else {
      eventSource?.close();
    }
  }, [live, sseAttempts]);

  const getSeverityIcon = (severity: string) => {
    return severity === 'critical' ? (
      <AlertTriangle className="w-5 h-5 text-red-500" />
    ) : (
      <Bell className="w-5 h-5 text-yellow-500" />
    );
  };

  const getSeverityColor = (severity: string) => {
    return severity === 'critical' 
      ? 'border-red-200 bg-red-50' 
      : 'border-yellow-200 bg-yellow-50';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'large_transaction': return <CreditCard className="w-4 h-4" />;
      case 'new_merchant': return <MapPin className="w-4 h-4" />;
      case 'frequency': return <TrendingUp className="w-4 h-4" />;
      case 'category_spike': return <BarChart3 className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };
  const acknowledgeAlert = async (id: number) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    try {
      const updated = await spendingAlertsApi.acknowledge(id);
      setAlerts(prev => prev.map(a => a.id === id ? updated : a));
  const listResp = await spendingAlertsApi.list({ month, type: filterType, severity: 'all', acknowledged: showAcknowledged? 'all':'false', page, size:pageSize });
  setSummary(listResp.summary);
    } catch (e:any) {
      toast.error('Failed to acknowledge');
      fetchData();
    }
  };

  const dismissAlert = async (id: number) => {
    const prevState = alerts;
    setAlerts(prev => prev.filter(a => a.id !== id));
    try {
      await spendingAlertsApi.dismiss(id);
  const listResp = await spendingAlertsApi.list({ month, type: filterType, severity: 'all', acknowledged: showAcknowledged? 'all':'false', page, size:pageSize });
  setSummary(listResp.summary);
    } catch (e:any) {
      toast.error('Failed to dismiss');
      setAlerts(prevState);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (!showAcknowledged && alert.acknowledged) return false;
    if (filterType === 'all') return true;
    return alert.type === filterType;
  });
  const allSelected = selectedIds.size>0 && filteredAlerts.length>0 && filteredAlerts.every(a=> selectedIds.has(a.id));

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
          <h1 className="text-4xl font-heading font-bold gradient-text mb-3">Spending Alerts</h1>
          <p className="text-brand-gray-600 text-lg">Monitor unusual spending patterns and get notified of anomalies</p>
        </div>

        {/* Alert Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stat-card border-red-200 bg-red-50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">CRITICAL</span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Critical Alerts</h3>
            <p className="text-3xl font-bold text-red-600">{summary?.criticalOpen ?? 0}</p>
            <p className="text-sm text-brand-gray-500">Require immediate attention</p>
            {summary?.generated!=null && <p className="text-xs text-brand-gray-400 mt-1">Generated {summary.generated} at {summary.lastGeneratedAt? formatDate(summary.lastGeneratedAt): '—'}</p>}
          </div>

          <div className="stat-card border-yellow-200 bg-yellow-50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">MODERATE</span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Moderate Alerts</h3>
            <p className="text-3xl font-bold text-yellow-600">{summary?.moderateOpen ?? 0}</p>
            <p className="text-sm text-brand-gray-500">Worth reviewing</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-green rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-brand-green-600 bg-brand-green-100 px-2 py-1 rounded-full">RESOLVED</span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Acknowledged</h3>
            <p className="text-3xl font-bold text-brand-green-600">{summary?.acknowledged ?? 0}</p>
            <p className="text-sm text-brand-gray-500">This month</p>
          </div>
        </div>
      </div>

  {/* Filters */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-brand-gray-100 p-6 shadow-funky">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'all', label: 'All Alerts', icon: '🔔' },
              ...(meta?.types || []).map(t=> ({ key: t.key, label: t.label, icon: t.key==='large_transaction'?'💳': t.key==='new_merchant'? '🏪': t.key==='frequency'? '⚡': t.key==='category_spike'? '📈':'�'}))
            ]).map(filter => (
              <button
                key={filter.key}
        onClick={() => { setFilterType(filter.key); setPage(0); }}
                className={`px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 ${
                  filterType === filter.key
                    ? 'bg-gradient-green text-white shadow-glow-green'
                    : 'bg-white border-2 border-brand-gray-200 text-brand-gray-700 hover:border-brand-green-400'
                }`}
              >
                <span className="mr-2">{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setShowAcknowledged(!showAcknowledged)}
            className="flex items-center space-x-2 text-sm text-brand-gray-600 hover:text-brand-green-600 transition-colors duration-300"
          >
            {showAcknowledged ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showAcknowledged ? 'Hide' : 'Show'} acknowledged</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-brand-gray-600 ml-auto">
            <label className="flex items-center gap-1">Page Size
              <select value={pageSize} onChange={e=> { setPageSize(parseInt(e.target.value)); setPage(0); }} className="input py-1 px-2 text-xs w-20">
                {[25,50,100].map(s=> <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>

      {selectedIds.size>0 && (
        <div className="sticky top-0 z-40 bg-brand-gray-900 text-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-glow-green">
          <div className="text-xs font-semibold">{selectedIds.size} selected</div>
          <div className="flex gap-2">
            <button onClick={async ()=>{
              try { const updated = await spendingAlertsApi.bulkAcknowledge(Array.from(selectedIds));
                setAlerts(prev=> prev.map(a=> updated.find(u=> u.id===a.id) || a));
                toast.success('Acknowledged'); fetchData();
              } catch{ toast.error('Bulk acknowledge failed'); }
            }} className="bg-brand-green-600 hover:bg-brand-green-500 text-white text-xs rounded-xl px-3 py-2">Ack Selected</button>
            <button onClick={async ()=>{
              try { await spendingAlertsApi.bulkDismiss(Array.from(selectedIds));
                setAlerts(prev=> prev.filter(a=> !selectedIds.has(a.id)));
                toast.success('Dismissed'); fetchData();
              } catch{ toast.error('Bulk dismiss failed'); }
            }} className="bg-red-600 hover:bg-red-500 text-white text-xs rounded-xl px-3 py-2">Dismiss Selected</button>
            <button onClick={()=> setSelectedIds(new Set())} className="bg-brand-gray-600 hover:bg-brand-gray-500 text-white text-xs rounded-xl px-3 py-2">Clear</button>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-brand-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">No alerts to show</h3>
            <p className="text-brand-gray-600">Your spending patterns look normal. Keep up the good work!</p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className={`card border-2 transition-all duration-300 ${
                alert.acknowledged 
                  ? 'opacity-60 border-brand-gray-200 bg-brand-gray-50' 
                  : getSeverityColor(alert.severity)
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="pt-1">
                    <input type="checkbox" checked={selectedIds.has(alert.id)} onChange={(e)=>{
                      setSelectedIds(prev=> { const next = new Set(prev); if(e.target.checked) next.add(alert.id); else next.delete(alert.id); return next; });
                    }} className="w-4 h-4" />
                  </div>
                  <div className="flex-shrink-0">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-lg font-heading font-bold text-brand-gray-900">{alert.title}</h4>
                      <div className="flex items-center space-x-1 text-brand-gray-500">
                        {getTypeIcon(alert.type)}
                        <span className="text-xs font-medium capitalize">{alert.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                    
                    <p className="text-brand-gray-700 mb-3">{alert.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-brand-gray-500 font-medium">Amount:</span>
                        <p className="font-bold text-brand-gray-900">{formatCurrency(alert.amount || 0, undefined, preferences)}</p>
                      </div>
                      <div>
                        <span className="text-brand-gray-500 font-medium">Merchant:</span>
                        <p className="font-bold text-brand-gray-900">{alert.merchant || '—'}</p>
                      </div>
                      <div>
                        <span className="text-brand-gray-500 font-medium">Category:</span>
                        <p className="font-bold text-brand-gray-900">{alert.category || '—'}</p>
                      </div>
                      <div>
                        <span className="text-brand-gray-500 font-medium">Date:</span>
                        <p className="font-bold text-brand-gray-900">{alert.date ? formatDate(alert.date) : '—'}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-white/60 rounded-2xl">
                      <p className="text-sm text-brand-gray-700"><span className="font-semibold">Reason:</span> {alert.reason || '—'}</p>
                      { (alert as any).parsedMetadata && (
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer text-brand-gray-500">Details</summary>
                          <pre className="mt-1 bg-brand-gray-100 rounded p-2 overflow-auto max-h-40">{JSON.stringify((alert as any).parsedMetadata, null, 2)}</pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button onClick={async ()=>{ const audit = await spendingAlertsApi.audit(alert.id); setAuditAlert(alert); setAuditEntries(audit); }} className="text-xs text-brand-gray-500 hover:text-brand-green-600">Audit</button>
                  {!alert.acknowledged ? (
                    <>
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="bg-brand-green-100 hover:bg-brand-green-200 text-brand-green-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105"
                      >
                        <CheckCircle className="w-4 h-4 mr-2 inline" />
                        Acknowledge
                      </button>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="bg-brand-gray-100 hover:bg-brand-gray-200 text-brand-gray-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105"
                      >
                        <X className="w-4 h-4 mr-2 inline" />
                        Dismiss
                      </button>
                    </>
                  ) : (
                    <span className="bg-brand-green-100 text-brand-green-700 px-4 py-2 rounded-2xl font-semibold text-sm">
                      ✅ Acknowledged
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Select All & Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-2 mt-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-xs text-brand-gray-600 cursor-pointer">
              <input type="checkbox" checked={allSelected} onChange={(e)=>{
                if(e.target.checked){ setSelectedIds(new Set(filteredAlerts.map(a=> a.id))); } else { setSelectedIds(new Set()); }
              }} className="w-4 h-4" /> Select Page
            </label>
            <button disabled={page===0} onClick={()=> setPage(p=> Math.max(0,p-1))} className="px-3 py-1 rounded-xl text-xs bg-brand-gray-200 disabled:opacity-40">Prev</button>
            <span className="text-xs text-brand-gray-600">Page {page+1} / {totalPages}</span>
            <button disabled={page>= totalPages-1} onClick={()=> setPage(p=> Math.min(totalPages-1,p+1))} className="px-3 py-1 rounded-xl text-xs bg-brand-gray-200 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

  {/* Recommendations & Suggested Limits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-brand-blue-50 to-brand-green-50 border-brand-blue-200 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-heading font-bold text-brand-gray-900">💡 Smart Recommendations</h3>
            <button onClick={async ()=>{ setTips([]); setSuggestedLimits([]); const latest = await spendingAlertsApi.recommendations(month); setTips(latest.tips as any); setSuggestedLimits(latest.suggestedLimits); }} className="text-xs text-brand-gray-600 hover:text-brand-green-600">Refresh</button>
          </div>
          <div className="space-y-4">
            {tips.length===0 && suggestedLimits.length===0 && <p className="text-sm text-brand-gray-600">No recommendations yet.</p>}
            {tips.map(r=> (
              <div key={r.id} className="p-4 bg-white/60 rounded-2xl flex items-start gap-4">
                <div className="text-2xl">💡</div>
                <div>
                  <h4 className="font-semibold text-brand-gray-900 mb-1">{r.title}</h4>
                  <p className="text-sm text-brand-gray-700 mb-1">{r.message}</p>
                  {r.category && <p className="text-xs text-brand-gray-500">Category: {r.category}</p>}
                </div>
              </div>
            ))}
            {suggestedLimits.map(sl=> (
              <div key={sl.id} className="p-4 bg-white/60 rounded-2xl flex items-start gap-4 border border-brand-green-100">
                <div className="text-2xl">🎯</div>
                <div>
                  <h4 className="font-semibold text-brand-gray-900 mb-1">{sl.title || `Limit Suggestion: ${sl.category}`}</h4>
                  <p className="text-sm text-brand-gray-700 mb-1">{sl.message}</p>
                  <p className="text-xs text-brand-gray-500">Avg: {sl.currentMonthlyAvg?.toFixed(2)} Cap: {sl.suggestedCap?.toFixed(2)}</p>
                  {sl.rationale && <p className="text-xs text-brand-gray-400">{sl.rationale}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Settings</h4>
              <button onClick={()=> setShowSettings(!showSettings)} className="text-xs text-brand-gray-500 hover:text-brand-green-600">{showSettings? 'Hide':'Edit'}</button>
            </div>
      {!showSettings && settings && (
              <div className="text-xs text-brand-gray-600 space-y-1">
                <div>Large x{settings.largeMultiplier}</div>
                <div>Freq window {settings.freqWindowHours}h / max {settings.freqMaxTxn}</div>
                <div>Spike x{settings.catSpikeMultiplier} lookback {settings.catSpikeLookbackMonths}m</div>
        {settings.criticalLargeAbsolute && <div>Critical Large ≥ {settings.criticalLargeAbsolute}</div>}
        {settings.criticalCategorySpikeMultiplier && <div>Critical Spike ≥ x{settings.criticalCategorySpikeMultiplier}</div>}
        {settings.criticalFrequencyCount && <div>Critical Freq ≥ {settings.criticalFrequencyCount}</div>}
        {settings.criticalNewMerchantAbsolute && <div>Critical New Merchant ≥ {settings.criticalNewMerchantAbsolute}</div>}
              </div>
            )}
            {showSettings && settings && (
              <form className="space-y-3" onSubmit={async e=>{ e.preventDefault(); try { const updated = await spendingAlertsApi.updateSettings(settings); setSettings(updated); toast.success('Settings saved'); } catch(err){ toast.error('Failed'); } }}>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex flex-col">Large Multiplier<input type="number" step="0.1" value={settings.largeMultiplier} onChange={e=> setSettings({...settings, largeMultiplier: parseFloat(e.target.value)})} className="input"/></label>
                  <label className="flex flex-col">Large Min<input type="number" step="0.01" value={settings.largeMinAmount} onChange={e=> setSettings({...settings, largeMinAmount: parseFloat(e.target.value)})} className="input"/></label>
                  <label className="flex flex-col">Freq Window Hrs<input type="number" value={settings.freqWindowHours} onChange={e=> setSettings({...settings, freqWindowHours: parseInt(e.target.value)})} className="input"/></label>
                  <label className="flex flex-col">Freq Max Txn<input type="number" value={settings.freqMaxTxn} onChange={e=> setSettings({...settings, freqMaxTxn: parseInt(e.target.value)})} className="input"/></label>
                  <label className="flex flex-col">Freq Min Amt<input type="number" step="0.01" value={settings.freqMinAmount} onChange={e=> setSettings({...settings, freqMinAmount: parseFloat(e.target.value)})} className="input"/></label>
                  <label className="flex flex-col">Spike Multiplier<input type="number" step="0.1" value={settings.catSpikeMultiplier} onChange={e=> setSettings({...settings, catSpikeMultiplier: parseFloat(e.target.value)})} className="input"/></label>
                  <label className="flex flex-col">Spike Lookback M<input type="number" value={settings.catSpikeLookbackMonths} onChange={e=> setSettings({...settings, catSpikeLookbackMonths: parseInt(e.target.value)})} className="input"/></label>
                  <label className="flex flex-col">Spike Min<input type="number" step="0.01" value={settings.catSpikeMinAmount} onChange={e=> setSettings({...settings, catSpikeMinAmount: parseFloat(e.target.value)})} className="input"/></label>
                  <label className="flex flex-col col-span-2">New Merchant Min<input type="number" step="0.01" value={settings.newMerchantMinAmount} onChange={e=> setSettings({...settings, newMerchantMinAmount: parseFloat(e.target.value)})} className="input"/></label>
                  <label className="flex flex-col">Crit Large Abs<input type="number" step="0.01" value={settings.criticalLargeAbsolute ?? ''} onChange={e=> setSettings({...settings, criticalLargeAbsolute: e.target.value? parseFloat(e.target.value): undefined})} className="input"/></label>
                  <label className="flex flex-col">Crit Spike Mult<input type="number" step="0.1" value={settings.criticalCategorySpikeMultiplier ?? ''} onChange={e=> setSettings({...settings, criticalCategorySpikeMultiplier: e.target.value? parseFloat(e.target.value): undefined})} className="input"/></label>
                  <label className="flex flex-col">Crit Freq Count<input type="number" value={settings.criticalFrequencyCount ?? ''} onChange={e=> setSettings({...settings, criticalFrequencyCount: e.target.value? parseInt(e.target.value): undefined})} className="input"/></label>
                  <label className="flex flex-col">Crit NewMerch Abs<input type="number" step="0.01" value={settings.criticalNewMerchantAbsolute ?? ''} onChange={e=> setSettings({...settings, criticalNewMerchantAbsolute: e.target.value? parseFloat(e.target.value): undefined})} className="input"/></label>
                </div>
                <button type="submit" className="w-full bg-brand-green-600 text-white rounded-2xl py-2 text-sm font-semibold">Save</button>
              </form>
            )}
          </div>
          <div className="card">
            <h4 className="font-semibold mb-2">Whitelist</h4>
            <form onSubmit={async e=>{ e.preventDefault(); if(!newMerchant) return; await spendingAlertsApi.addWhitelist(newMerchant); setWhitelist(prev=> [...prev, newMerchant]); setNewMerchant(''); }} className="flex gap-2 mb-2">
              <input value={newMerchant} onChange={e=> setNewMerchant(e.target.value)} placeholder="Merchant" className="input flex-1" />
              <button className="bg-brand-gray-200 rounded-xl px-3 text-xs">Add</button>
            </form>
            <div className="flex flex-wrap gap-2 text-xs">
              {whitelist.map(m=> <span key={m} className="px-2 py-1 bg-brand-gray-100 rounded-xl flex items-center gap-1">{m}<button onClick={async ()=>{ await spendingAlertsApi.deleteWhitelist(m); setWhitelist(prev=> prev.filter(x=> x!==m)); }}>×</button></span>)}
            </div>
          </div>
          <div className="card">
            <h4 className="font-semibold mb-2">Muted Categories</h4>
            <form onSubmit={async e=>{ e.preventDefault(); if(!muteCategoryInput) return; await spendingAlertsApi.mute(muteCategoryInput, muteUntilInput || undefined); setMutedCats(await spendingAlertsApi.muted()); setMuteCategoryInput(''); setMuteUntilInput(''); }} className="flex gap-2 mb-2 text-xs">
              <input value={muteCategoryInput} onChange={e=> setMuteCategoryInput(e.target.value)} placeholder="Category" className="input flex-1" />
              <input type="date" value={muteUntilInput} onChange={e=> setMuteUntilInput(e.target.value)} className="input" />
              <button className="bg-brand-gray-200 rounded-xl px-3">Mute</button>
            </form>
            <div className="flex flex-wrap gap-2 text-xs">
              {mutedCats.map(m=> <span key={m.id} className="px-2 py-1 bg-brand-gray-100 rounded-xl flex items-center gap-1">{m.category}{m.muteUntil? ` (until ${m.muteUntil})`: ''}<button onClick={async ()=>{ await spendingAlertsApi.unmute(m.category); setMutedCats(await spendingAlertsApi.muted()); }}>×</button></span> )}
            </div>
          </div>
          <div className="card">
            <h4 className="font-semibold mb-2">Generation</h4>
            <div className="flex flex-col gap-2">
              <button onClick={async ()=>{ await spendingAlertsApi.recompute(month); fetchData(); toast.success('Recomputed'); }} className="bg-brand-green-600 text-white rounded-2xl py-2 text-xs font-semibold">Recompute Month</button>
              <button onClick={async ()=>{ await spendingAlertsApi.backfill(6); fetchData(); toast.success('Backfill started'); }} className="bg-brand-gray-200 rounded-2xl py-2 text-xs font-semibold">Backfill 6m</button>
              <button onClick={()=> setLive(!live)} className={`rounded-2xl py-2 text-xs font-semibold ${live? 'bg-red-200 text-red-700':'bg-brand-blue-200 text-brand-blue-700'}`}>{live? 'Stop Live':'Start Live'}</button>
              {meta?.streamEvents && <div className="text-[10px] text-brand-gray-400">Events: {meta.streamEvents.join(', ')}</div>}
            </div>
          </div>
          <div className="card text-xs text-brand-gray-600">
            <h4 className="font-semibold mb-2">Counts</h4>
            <div>Dismissed: {dismissedCount}</div>
            <div>Total: {summary?.total ?? 0}</div>
          </div>
        </div>
      </div>

      {auditAlert && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Audit Trail</h4>
              <button onClick={()=> setAuditAlert(null)} className="text-brand-gray-500">✕</button>
            </div>
            <div className="max-h-64 overflow-y-auto text-xs space-y-1">
              {auditEntries.map((ae,i)=> <div key={i} className="flex justify-between"><span>{ae.action}</span><span>{formatDate(ae.at)}</span></div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};