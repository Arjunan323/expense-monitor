import api, { API_BASE_URL } from '../utils/api';

export interface SpendingAlertDto {
  id: number;
  type: 'large_transaction' | 'new_merchant' | 'frequency' | 'category_spike' | string;
  severity: 'moderate' | 'critical' | string;
  title: string;
  description?: string;
  amount?: number;
  merchant?: string;
  category?: string;
  date?: string; // txn date
  reason?: string;
  acknowledged: boolean;
  acknowledgedAt?: string | null;
  dismissed: boolean;
  dismissedAt?: string | null;
  createdAt: string;
  txnId?: number | null;
  metadata?: string | null;
}

export interface SpendingAlertSummaryDto {
  criticalOpen: number;
  moderateOpen: number;
  acknowledged: number;
  total: number;
  generated?: number | null;
  lastGeneratedAt?: string | null;
}

export interface SpendingAlertSettingsDto {
  largeMultiplier: number;
  largeMinAmount: number;
  freqWindowHours: number;
  freqMaxTxn: number;
  freqMinAmount: number;
  catSpikeMultiplier: number;
  catSpikeLookbackMonths: number;
  catSpikeMinAmount: number;
  newMerchantMinAmount: number;
  criticalLargeAbsolute?: number | null;
  criticalCategorySpikeMultiplier?: number | null;
  criticalFrequencyCount?: number | null;
  criticalNewMerchantAbsolute?: number | null;
}

export interface RecommendationDto {
  id: number; type: string; priority: number; title: string; message: string; icon?: string; category?: string; currentMonthlyAvg?: number; suggestedCap?: number; rationale?: string;
}

export interface AuditEntryDto { action: string; at: string; }

export interface SpendingAlertListParams {
  month?: string;
  type?: string;
  severity?: string;
  acknowledged?: 'true' | 'false' | 'all';
  page?: number;
  size?: number;
}

export interface SpendingAlertListResponse {
  content: SpendingAlertDto[];
  summary: SpendingAlertSummaryDto;
  page: { number: number; size: number; totalElements: number; totalPages: number; first: boolean; last: boolean; };
}

export interface RecommendationsGrouped {
  tips: RecommendationDto[];
  suggestedLimits: Array<{ id:number; title:string; message:string; icon?:string; priority:number; category?:string; currentMonthlyAvg?:number; suggestedCap?:number; rationale?:string }>;
}

export interface SpendingAlertsMeta {
  types: { key:string; label:string; defaultSeverity:string }[];
  severities: string[];
  streamEvents?: string[];
}

export const spendingAlertsApi = {
  list: async (params: SpendingAlertListParams): Promise<SpendingAlertListResponse> => {
    const res = await api.get<SpendingAlertListResponse>('/analytics/spending-alerts', { params });
    return res.data;
  },
  summary: async (month?: string): Promise<SpendingAlertSummaryDto> => {
    const res = await api.get<SpendingAlertSummaryDto>('/analytics/spending-alerts/summary', { params: month ? { month } : {} });
    return res.data;
  },
  acknowledge: async (id: number): Promise<SpendingAlertDto> => {
    const res = await api.post<SpendingAlertDto>(`/analytics/spending-alerts/${id}/acknowledge`, {});
    return res.data;
  },
  dismiss: async (id: number): Promise<void> => {
    await api.delete(`/analytics/spending-alerts/${id}`);
  },
  bulkAcknowledge: async (ids: number[]): Promise<SpendingAlertDto[]> => {
    const res = await api.post<SpendingAlertDto[]>(`/analytics/spending-alerts/acknowledge`, { ids });
    return res.data;
  },
  bulkDismiss: async (ids: number[]): Promise<void> => {
    await api.post(`/analytics/spending-alerts/dismiss`, { ids });
  },
  settings: async (): Promise<SpendingAlertSettingsDto> => {
    const res = await api.get<SpendingAlertSettingsDto>('/analytics/spending-alerts/settings'); return res.data;
  },
  updateSettings: async (dto: SpendingAlertSettingsDto): Promise<SpendingAlertSettingsDto> => {
    const res = await api.put<SpendingAlertSettingsDto>('/analytics/spending-alerts/settings', dto); return res.data;
  },
  whitelist: async (): Promise<string[]> => { const res = await api.get<string[]>('/analytics/spending-alerts/whitelist'); return res.data; },
  addWhitelist: async (merchant: string): Promise<void> => { await api.post('/analytics/spending-alerts/whitelist', { merchant }); },
  deleteWhitelist: async (merchant: string): Promise<void> => { await api.delete(`/analytics/spending-alerts/whitelist/${encodeURIComponent(merchant)}`); },
  muted: async (): Promise<{ id:number; category:string; muteUntil?:string|null }[]> => { const res = await api.get('/analytics/spending-alerts/mute-category'); return res.data; },
  mute: async (category: string, until?: string): Promise<void> => { await api.post('/analytics/spending-alerts/mute-category', { category, until }); },
  unmute: async (category: string): Promise<void> => { await api.delete(`/analytics/spending-alerts/mute-category/${encodeURIComponent(category)}`); },
  recommendations: async (month?: string): Promise<RecommendationsGrouped> => { const res = await api.get('/analytics/spending-alerts/recommendations', { params: month? { month }: {} }); return res.data; },
  audit: async (id: number): Promise<AuditEntryDto[]> => { const res = await api.get(`/analytics/spending-alerts/${id}/audit`); return res.data; },
  recompute: async (month?: string): Promise<{ generated:number; replaced:number; durationMs:number }> => { const res = await api.post('/analytics/spending-alerts/recompute', null, { params: month? { month }: {} }); return res.data; },
  backfill: async (months: number): Promise<{ generated:number; replaced:number; durationMs:number }[]> => { const res = await api.post('/analytics/spending-alerts/backfill', null, { params: { months } }); return res.data; },
  stream: (onEvent: (e: MessageEvent) => void, onError?: (ev: Event) => void): EventSource => {
    const url = `${API_BASE_URL}/analytics/spending-alerts/stream`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    // If we need to pass Authorization header, native EventSource won't work. Use fetch + ReadableStream.
    if(token && window.ReadableStream){
      let isClosed = false;
      const controller = new AbortController();
      const sseLike: any = { close: () => { isClosed = true; controller.abort(); } };
      (async () => {
        try {
          const resp = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'text/event-stream', 'Cache-Control': 'no-cache', 'Authorization': `Bearer ${token}` },
            signal: controller.signal,
            credentials: 'include'
          });
          if(!resp.ok){
            if(onError) onError(new Event('error'));
            return;
          }
            const reader = resp.body!.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            while(!isClosed){
              const { done, value } = await reader.read();
              if(done) break;
              buffer += decoder.decode(value, { stream: true });
              let idx;
              while((idx = buffer.indexOf('\n\n')) !== -1){
                const raw = buffer.slice(0, idx).trim();
                buffer = buffer.slice(idx+2);
                if(!raw) continue;
                // Basic SSE: lines starting with data:
                const dataLine = raw.split('\n').find(l=> l.startsWith('data:'));
                if(dataLine){
                  const json = dataLine.substring(5).trim();
                  try { onEvent(new MessageEvent('message', { data: json })); } catch{ /* ignore parse */ }
                }
              }
            }
        } catch(err){
          if(onError) onError(new Event('error'));
        }
      })();
      return sseLike as EventSource;
    }
    // Fallback: no token or streaming unsupported
    const es = new EventSource(url, { withCredentials: true });
    es.onmessage = onEvent;
    es.onerror = (ev) => { if(onError) onError(ev); };
    return es;
  },
  meta: async (): Promise<SpendingAlertsMeta> => { const res = await api.get('/analytics/spending-alerts/meta'); return res.data; }
};
