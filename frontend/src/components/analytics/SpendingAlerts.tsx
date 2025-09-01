import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertTriangle, Bell, CheckCircle, X, Eye, TrendingUp, CreditCard, MapPin, BarChart3, EyeOff, Settings, Filter, RefreshCcw, Plus, Trash2, Calendar, Info } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { usePreferences } from '../../contexts/PreferencesContext';
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
  const [pageSize, setPageSize] = useState(25);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  // Settings & Configuration
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<SpendingAlertSettingsDto | null>(null);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newMerchant, setNewMerchant] = useState('');
  const [mutedCats, setMutedCats] = useState<{ id:number; category:string; muteUntil?:string|null }[]>([]);
  const [muteCategoryInput, setMuteCategoryInput] = useState('');
  const [muteUntilInput, setMuteUntilInput] = useState('');
  
  // Recommendations & Meta
  const [tips, setTips] = useState<RecommendationDto[]>([]);
  const [suggestedLimits, setSuggestedLimits] = useState<RecommendationsGrouped['suggestedLimits']>([]);
  const [meta, setMeta] = useState<SpendingAlertsMeta | null>(null);
  
  // Audit & Live Updates
  const [auditAlert, setAuditAlert] = useState<SpendingAlertDto | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntryDto[]>([]);
  const [live, setLive] = useState<boolean>(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  
  // Month selection (YYYY-MM) for viewing historic alerts
  const [month, setMonth] = useState<string>(() => new Date().toISOString().slice(0,7));

  // Generate past N months including current
  const monthOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = d.toISOString().slice(0,7);
      const label = d.toLocaleString(undefined, { month: 'short', year: 'numeric' });
      opts.push({ value, label });
    }
    return opts;
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const ackParam = showAcknowledged ? 'all' : 'false';
      const listResp = await spendingAlertsApi.list({ 
        month, 
        type: filterType, 
        severity: 'all', 
        acknowledged: ackParam, 
        page, 
        size: pageSize 
      });
      setAlerts(listResp.content);
      setTotalPages(listResp.page.totalPages);
      setSummary(listResp.summary);
      setSelectedIds(new Set());
    } catch (e: any) {
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

  // Live updates via SSE
  useEffect(() => {
    if (live) {
      const es = spendingAlertsApi.stream((ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data);
          if (data && data.type && data.payload) {
            if (data.type === 'alert.new') setAlerts(prev => [data.payload, ...prev]);
            if (data.type === 'alert.acknowledged' || data.type === 'alert.updated') {
              setAlerts(prev => prev.map(a => a.id === data.payload.id ? data.payload : a));
            }
            if (data.type === 'alert.dismissed') {
              setAlerts(prev => prev.filter(a => a.id !== data.payload.id));
            }
          }
        } catch(e) {}
      }, () => {
        es.close();
        setEventSource(null);
        setTimeout(() => { if(live) setLive(true); }, 5000);
      });
      setEventSource(es);
      return () => { es.close(); };
    } else {
      eventSource?.close();
    }
  }, [live]);

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
      const listResp = await spendingAlertsApi.list({ month, type: filterType, severity: 'all', acknowledged: showAcknowledged ? 'all' : 'false', page, size: pageSize });
      setSummary(listResp.summary);
    } catch (e: any) {
      toast.error('Failed to acknowledge');
      fetchData();
    }
  };

  const dismissAlert = async (id: number) => {
    const prevState = alerts;
    setAlerts(prev => prev.filter(a => a.id !== id));
    try {
      await spendingAlertsApi.dismiss(id);
      const listResp = await spendingAlertsApi.list({ month, type: filterType, severity: 'all', acknowledged: showAcknowledged ? 'all' : 'false', page, size: pageSize });
      setSummary(listResp.summary);
    } catch (e: any) {
      toast.error('Failed to dismiss');
      setAlerts(prevState);
    }
  };

  const bulkAcknowledge = async () => {
    if (selectedIds.size === 0) return;
    try {
      const updated = await spendingAlertsApi.bulkAcknowledge(Array.from(selectedIds));
      setAlerts(prev => prev.map(a => updated.find(u => u.id === a.id) || a));
      setSelectedIds(new Set());
      toast.success('Alerts acknowledged');
      fetchData();
    } catch {
      toast.error('Bulk acknowledge failed');
    }
  };

  const bulkDismiss = async () => {
    if (selectedIds.size === 0) return;
    try {
      await spendingAlertsApi.bulkDismiss(Array.from(selectedIds));
      setAlerts(prev => prev.filter(a => !selectedIds.has(a.id)));
      setSelectedIds(new Set());
      toast.success('Alerts dismissed');
      fetchData();
    } catch {
      toast.error('Bulk dismiss failed');
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    try {
      const updated = await spendingAlertsApi.updateSettings(settings);
      setSettings(updated);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const addToWhitelist = async () => {
    if (!newMerchant.trim()) return;
    try {
      await spendingAlertsApi.addWhitelist(newMerchant.trim());
      setWhitelist(prev => [...prev, newMerchant.trim()]);
      setNewMerchant('');
      toast.success('Merchant whitelisted');
    } catch {
      toast.error('Failed to add merchant');
    }
  };

  const removeFromWhitelist = async (merchant: string) => {
    try {
      await spendingAlertsApi.deleteWhitelist(merchant);
      setWhitelist(prev => prev.filter(m => m !== merchant));
      toast.success('Merchant removed from whitelist');
    } catch {
      toast.error('Failed to remove merchant');
    }
  };

  const muteCategory = async () => {
    if (!muteCategoryInput.trim()) return;
    try {
      await spendingAlertsApi.mute(muteCategoryInput.trim(), muteUntilInput || undefined);
      const updated = await spendingAlertsApi.muted();
      setMutedCats(updated);
      setMuteCategoryInput('');
      setMuteUntilInput('');
      toast.success('Category muted');
    } catch {
      toast.error('Failed to mute category');
    }
  };

  const unmuteCategory = async (category: string) => {
    try {
      await spendingAlertsApi.unmute(category);
      const updated = await spendingAlertsApi.muted();
      setMutedCats(updated);
      toast.success('Category unmuted');
    } catch {
      toast.error('Failed to unmute category');
    }
  };

  const recompute = async () => {
    try {
      await spendingAlertsApi.recompute(month);
      fetchData();
      toast.success('Alerts recomputed');
    } catch {
      toast.error('Failed to recompute');
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (!showAcknowledged && alert.acknowledged) return false;
    if (filterType === 'all') return true;
    return alert.type === filterType;
  });

  const allSelected = selectedIds.size > 0 && filteredAlerts.length > 0 && filteredAlerts.every(a => selectedIds.has(a.id));

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
          <h1 className="text-4xl font-heading font-bold mb-3 flex items-center gap-3">
            <span className="select-none leading-none">🚨</span>
            <span className="gradient-text">Spending Alerts</span>
          </h1>
          <p className="text-brand-gray-600 text-lg">Monitor unusual spending patterns and get notified of anomalies</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

          <div className="stat-card border-brand-green-200 bg-brand-green-50">
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

          <div className="stat-card border-brand-blue-200 bg-brand-blue-50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-blue rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-brand-blue-600 bg-brand-blue-100 px-2 py-1 rounded-full">TOTAL</span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Total Alerts</h3>
            <p className="text-3xl font-bold text-brand-blue-600">{summary?.total ?? 0}</p>
            <p className="text-sm text-brand-gray-500">Generated this month</p>
          </div>
        </div>
      </div>

      {/* Enhanced Filter & Control Bar */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-brand-gray-100 p-6 shadow-funky">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'all', label: 'All Alerts', icon: '🔔' },
              ...(meta?.types || []).map(t => ({ 
                key: t.key, 
                label: t.label, 
                icon: t.key === 'large_transaction' ? '💳' : 
                      t.key === 'new_merchant' ? '🏪' : 
                      t.key === 'frequency' ? '⚡' : 
                      t.key === 'category_spike' ? '📈' : '🔔'
              }))
            ]).map(filter => (
              <button
                key={filter.key}
                onClick={() => { setFilterType(filter.key); setPage(0); }}
                className={`px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 ${
                  filterType === filter.key
                    ? 'bg-gradient-green text-white shadow-glow-green transform scale-105'
                    : 'bg-white border-2 border-brand-gray-200 text-brand-gray-700 hover:border-brand-green-400 hover:shadow-funky'
                }`}
              >
                <span className="mr-2">{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>
          
          {/* Control Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Month Selector */}
            <label className="flex items-center gap-2 text-sm text-brand-gray-600 bg-white border border-brand-gray-200 rounded-xl px-3 py-2">
              <Calendar className="w-4 h-4 text-brand-gray-500" />
              <span className="hidden sm:inline">Month:</span>
              <select
                value={month}
                onChange={(e) => { setMonth(e.target.value); setPage(0); }}
                className="bg-transparent focus:outline-none text-brand-gray-800"
              >
                {monthOptions.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </label>
            <button
              onClick={() => setShowAcknowledged(!showAcknowledged)}
              className="flex items-center space-x-2 text-sm text-brand-gray-600 hover:text-brand-green-600 transition-colors duration-300 px-3 py-2 rounded-xl hover:bg-brand-green-50"
            >
              {showAcknowledged ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showAcknowledged ? 'Hide' : 'Show'} acknowledged</span>
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center space-x-2 bg-brand-blue-100 hover:bg-brand-blue-200 text-brand-blue-700 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            
            <button
              onClick={() => setLive(!live)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-2xl font-semibold text-sm transition-all duration-300 ${
                live 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-brand-green-100 text-brand-green-700 hover:bg-brand-green-200'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${live ? 'bg-red-500 animate-pulse' : 'bg-brand-gray-400'}`} />
              <span>{live ? 'Live' : 'Connect'}</span>
            </button>
          </div>
        </div>

        {/* Page Size & Pagination Controls */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-gray-100">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-brand-gray-600">
              <span>Show:</span>
              <select 
                value={pageSize} 
                onChange={e => { setPageSize(parseInt(e.target.value)); setPage(0); }}
                className="input-field py-1 px-2 text-sm w-20"
              >
                {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span>per page</span>
            </label>
            
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-brand-gray-700">{selectedIds.size} selected</span>
                <button onClick={bulkAcknowledge} className="btn-primary text-xs">Acknowledge</button>
                <button onClick={bulkDismiss} className="btn-secondary text-xs">Dismiss</button>
                <button onClick={() => setSelectedIds(new Set())} className="text-xs text-brand-gray-500 hover:text-brand-gray-700">Clear</button>
              </div>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="px-3 py-1 rounded-xl text-sm bg-brand-gray-200 hover:bg-brand-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-brand-gray-600">
                Page {page + 1} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                className="px-3 py-1 rounded-xl text-sm bg-brand-gray-200 hover:bg-brand-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

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
          <>
            {/* Select All Checkbox */}
            <div className="flex items-center gap-3 px-4">
              <label className="flex items-center gap-2 text-sm text-brand-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(new Set(filteredAlerts.map(a => a.id)));
                    } else {
                      setSelectedIds(new Set());
                    }
                  }}
                  className="w-4 h-4 text-brand-green-600 rounded border-brand-gray-300 focus:ring-brand-green-500"
                />
                Select all on page
              </label>
            </div>

            {filteredAlerts.map(alert => (
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
                      <input
                        type="checkbox"
                        checked={selectedIds.has(alert.id)}
                        onChange={(e) => {
                          setSelectedIds(prev => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(alert.id);
                            else next.delete(alert.id);
                            return next;
                          });
                        }}
                        className="w-4 h-4 text-brand-green-600 rounded border-brand-gray-300 focus:ring-brand-green-500"
                      />
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
                        {(alert as any).parsedMetadata && (
                          <details className="mt-2 text-xs">
                            <summary className="cursor-pointer text-brand-gray-500 hover:text-brand-green-600">View Details</summary>
                            <pre className="mt-1 bg-brand-gray-100 rounded p-2 overflow-auto max-h-40 text-xs">{JSON.stringify((alert as any).parsedMetadata, null, 2)}</pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={async () => {
                        const audit = await spendingAlertsApi.audit(alert.id);
                        setAuditAlert(alert);
                        setAuditEntries(audit);
                      }}
                      className="text-xs text-brand-gray-500 hover:text-brand-blue-600 px-2 py-1 rounded-lg hover:bg-brand-blue-50 transition-colors duration-200"
                    >
                      <Info className="w-3 h-3 mr-1 inline" />
                      Audit
                    </button>
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
            ))}
          </>
        )}
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-gradient-to-br from-brand-blue-50 to-brand-green-50 border-brand-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-heading font-bold text-brand-gray-900">💡 Smart Recommendations</h3>
            <button
              onClick={async () => {
                setTips([]);
                setSuggestedLimits([]);
                const latest = await spendingAlertsApi.recommendations(month);
                setTips(latest.tips as any);
                setSuggestedLimits(latest.suggestedLimits);
              }}
              className="text-xs text-brand-gray-600 hover:text-brand-green-600 px-2 py-1 rounded-lg hover:bg-brand-green-50"
            >
              <RefreshCcw className="w-3 h-3 mr-1 inline" />
              Refresh
            </button>
          </div>
          <div className="space-y-4">
            {tips.length === 0 && suggestedLimits.length === 0 && (
              <p className="text-sm text-brand-gray-600">No recommendations yet.</p>
            )}
            {tips.map(r => (
              <div key={r.id} className="p-4 bg-white/60 rounded-2xl flex items-start gap-4">
                <div className="text-2xl">💡</div>
                <div>
                  <h4 className="font-semibold text-brand-gray-900 mb-1">{r.title}</h4>
                  <p className="text-sm text-brand-gray-700 mb-1">{r.message}</p>
                  {r.category && <p className="text-xs text-brand-gray-500">Category: {r.category}</p>}
                </div>
              </div>
            ))}
            {suggestedLimits.map(sl => (
              <div key={sl.id} className="p-4 bg-white/60 rounded-2xl flex items-start gap-4 border border-brand-green-100">
                <div className="text-2xl">🎯</div>
                <div>
                  <h4 className="font-semibold text-brand-gray-900 mb-1">{sl.title || `Limit Suggestion: ${sl.category}`}</h4>
                  <p className="text-sm text-brand-gray-700 mb-1">{sl.message}</p>
                  <p className="text-xs text-brand-gray-500">
                    Avg: {sl.currentMonthlyAvg?.toFixed(2)} → Suggested: {sl.suggestedCap?.toFixed(2)}
                  </p>
                  {sl.rationale && <p className="text-xs text-brand-gray-400">{sl.rationale}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-4">⚡ Quick Actions</h3>
          <div className="space-y-4">
            <button
              onClick={recompute}
              className="w-full bg-gradient-green text-white px-4 py-3 rounded-2xl font-semibold text-sm shadow-glow-green hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Recompute {monthOptions.find(mo => mo.value === month)?.label || 'Selected Month'}</span>
            </button>
            
            <button
              onClick={async () => {
                try {
                  await spendingAlertsApi.backfill(6);
                  fetchData();
                  toast.success('Backfill started');
                } catch {
                  toast.error('Backfill failed');
                }
              }}
              className="w-full bg-brand-gray-200 hover:bg-brand-gray-300 text-brand-gray-700 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Backfill 6 Months</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Spending Alert Settings" widthClass="max-w-4xl">
        <div className="space-y-8">
          {/* Threshold Settings */}
          {settings && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-brand-gray-900 mb-4">Detection Thresholds</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-gray-700 mb-2">Large Transaction Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.largeMultiplier}
                      onChange={e => setSettings({...settings, largeMultiplier: parseFloat(e.target.value)})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-gray-700 mb-2">Large Transaction Min Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.largeMinAmount}
                      onChange={e => setSettings({...settings, largeMinAmount: parseFloat(e.target.value)})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-gray-700 mb-2">Frequency Window (Hours)</label>
                    <input
                      type="number"
                      value={settings.freqWindowHours}
                      onChange={e => setSettings({...settings, freqWindowHours: parseInt(e.target.value)})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-gray-700 mb-2">Max Transactions in Window</label>
                    <input
                      type="number"
                      value={settings.freqMaxTxn}
                      onChange={e => setSettings({...settings, freqMaxTxn: parseInt(e.target.value)})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-gray-700 mb-2">Frequency Min Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.freqMinAmount}
                      onChange={e => setSettings({...settings, freqMinAmount: parseFloat(e.target.value)})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-gray-700 mb-2">Category Spike Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.catSpikeMultiplier}
                      onChange={e => setSettings({...settings, catSpikeMultiplier: parseFloat(e.target.value)})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-gray-700 mb-2">Category Spike Lookback (Months)</label>
                    <input
                      type="number"
                      value={settings.catSpikeLookbackMonths}
                      onChange={e => setSettings({...settings, catSpikeLookbackMonths: parseInt(e.target.value)})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-gray-700 mb-2">Category Spike Min Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.catSpikeMinAmount}
                      onChange={e => setSettings({...settings, catSpikeMinAmount: parseFloat(e.target.value)})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-gray-700 mb-2">New Merchant Min Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.newMerchantMinAmount}
                      onChange={e => setSettings({...settings, newMerchantMinAmount: parseFloat(e.target.value)})}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Critical Overrides */}
              <div>
                <h4 className="text-lg font-semibold text-brand-gray-900 mb-4">Critical Alert Overrides</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-gray-700 mb-2">Critical Large Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.criticalLargeAbsolute ?? ''}
                      onChange={e => setSettings({...settings, criticalLargeAbsolute: e.target.value ? parseFloat(e.target.value) : undefined})}
                      className="input-field"
                      placeholder="Leave empty for default"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-gray-700 mb-2">Critical Frequency Count</label>
                    <input
                      type="number"
                      value={settings.criticalFrequencyCount ?? ''}
                      onChange={e => setSettings({...settings, criticalFrequencyCount: e.target.value ? parseInt(e.target.value) : undefined})}
                      className="input-field"
                      placeholder="Leave empty for default"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-gray-700 mb-2">Critical Category Spike Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.criticalCategorySpikeMultiplier ?? ''}
                      onChange={e => setSettings({...settings, criticalCategorySpikeMultiplier: e.target.value ? parseFloat(e.target.value) : undefined})}
                      className="input-field"
                      placeholder="Leave empty for default"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-gray-700 mb-2">Critical New Merchant Absolute</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.criticalNewMerchantAbsolute ?? ''}
                      onChange={e => setSettings({...settings, criticalNewMerchantAbsolute: e.target.value ? parseFloat(e.target.value) : undefined})}
                      className="input-field"
                      placeholder="Leave empty for default"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={saveSettings} className="btn-primary">
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {/* Whitelist Management */}
          <div>
            <h4 className="text-lg font-semibold text-brand-gray-900 mb-4">Merchant Whitelist</h4>
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMerchant}
                  onChange={e => setNewMerchant(e.target.value)}
                  placeholder="Enter merchant name"
                  className="input-field flex-1"
                />
                <button onClick={addToWhitelist} className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {whitelist.map(merchant => (
                  <span key={merchant} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-gray-100 text-brand-gray-800">
                    {merchant}
                    <button
                      onClick={() => removeFromWhitelist(merchant)}
                      className="ml-2 text-brand-gray-500 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Muted Categories */}
          <div>
            <h4 className="text-lg font-semibold text-brand-gray-900 mb-4">Muted Categories</h4>
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={muteCategoryInput}
                  onChange={e => setMuteCategoryInput(e.target.value)}
                  placeholder="Category name"
                  className="input-field flex-1"
                />
                <input
                  type="date"
                  value={muteUntilInput}
                  onChange={e => setMuteUntilInput(e.target.value)}
                  className="input-field"
                />
                <button onClick={muteCategory} className="btn-primary">
                  Mute
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {mutedCats.map(m => (
                  <span key={m.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    {m.category}
                    {m.muteUntil && <span className="ml-1 text-xs">(until {m.muteUntil})</span>}
                    <button
                      onClick={() => unmuteCategory(m.category)}
                      className="ml-2 text-yellow-600 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Audit Modal */}
      {auditAlert && (
        <Modal open={!!auditAlert} onClose={() => setAuditAlert(null)} title={`Audit Trail: ${auditAlert.title}`}>
          <div className="space-y-4">
            <div className="bg-brand-gray-50 rounded-2xl p-4">
              <h5 className="font-semibold text-brand-gray-900 mb-2">Alert Details</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-brand-gray-500">Type:</span>
                  <span className="ml-2 font-medium">{auditAlert.type}</span>
                </div>
                <div>
                  <span className="text-brand-gray-500">Severity:</span>
                  <span className="ml-2 font-medium">{auditAlert.severity}</span>
                </div>
                <div>
                  <span className="text-brand-gray-500">Amount:</span>
                  <span className="ml-2 font-medium">{formatCurrency(auditAlert.amount || 0, undefined, preferences)}</span>
                </div>
                <div>
                  <span className="text-brand-gray-500">Created:</span>
                  <span className="ml-2 font-medium">{formatDate(auditAlert.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-semibold text-brand-gray-900 mb-3">Action History</h5>
              <div className="space-y-2">
                {auditEntries.map((entry, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-white rounded-xl border border-brand-gray-100">
                    <span className="text-sm font-medium text-brand-gray-900 capitalize">{entry.action}</span>
                    <span className="text-sm text-brand-gray-500">{formatDate(entry.at)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};