export interface TaxDeductionChecklistItem {
  id: number;
  item: string;
  category?: string;
  checked?: boolean;
  amount?: string;
}

export interface TaxSavingTip {
  id: number;
  title: string;
  message: string;
  icon?: string;
}
// Tax tracker API wrapper using central authenticated axios instance (api.ts)
// Regeneration command placeholder: npm run generate:api
import api from '../utils/api';

export interface TaxTransactionDto {
  id: number;
  taxYear: number | null;
  category: string | null;
  amount: number | null;
  paidDate: string | null;
  note: string | null;
  deductible: boolean | null;
  hasReceipt: boolean | null;
  classificationStatus?: string | null;
  sourceTransactionId?: number | null;
  sourceDescription?: string | null;
  sourceCategory?: string | null;
  sourceAmount?: number | null;
  sourceBank?: string | null;
}

export interface TaxCategoryUsageDto {
  code: string;
  description: string;
  annualLimit: number | null;
  used: number;
  remaining: number;
  percentUsed: number;
  overLimit: boolean;
  nearLimit: boolean;
}

export interface TaxSummaryDto {
  year: number | null;
  totalDeductible: number;
  estimatedTaxSavings: number;
  missingReceipts: number;
  categories: TaxCategoryUsageDto[];
}

export interface TaxInsightDto { id: string; type: string; severity: string; message: string; categoryCode?: string | null }

// Goals
export interface GoalDto {
  id: number;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // ISO date
  category: string;
  icon?: string;
  color?: string;
  monthlyContribution?: number;
}

export interface GoalStatsDto {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  totalSaved: number;
  monthlyTarget: number;
  averageProgressPercent: number;
}

// In‑memory cache (simple TTL) for summary & insights
const cache: { summary?: { ts:number; year:number|undefined; data:TaxSummaryDto }; insights?: { ts:number; year:number|undefined; data:TaxInsightDto[] } } = {};
const TTL_MS = 60_000; // 1 min

export const taxApi = {
  getChecklist: () => api.get<TaxDeductionChecklistItem[]>(`/analytics/taxes/checklist`).then(r=>r.data),
  getTips: () => api.get<TaxSavingTip[]>(`/analytics/taxes/tips`).then(r=>r.data),
  list: (year?: number) => api.get<TaxTransactionDto[]>(`/analytics/taxes`, { params: year? { year } : {} }).then(r=>r.data),
  get: (id:number) => api.get<TaxTransactionDto>(`/analytics/taxes/${id}`).then(r=>r.data),
  create: (payload: Partial<TaxTransactionDto>) => api.post<TaxTransactionDto>(`/analytics/taxes`, payload).then(r=>r.data),
  update: (id:number, payload: Partial<TaxTransactionDto>) => api.put<TaxTransactionDto>(`/analytics/taxes/${id}`, payload).then(r=>r.data),
  delete: (id:number) => api.delete(`/analytics/taxes/${id}`),
  summary: async (year?: number) => {
    const now = Date.now();
    if(cache.summary && cache.summary.year===year && (now-cache.summary.ts)<TTL_MS) return cache.summary.data;
    const data = (await api.get<TaxSummaryDto>(`/analytics/taxes/summary`, { params: year? { year } : {} })).data;
    cache.summary = { ts: now, year, data }; return data;
  },
  insights: async (year?: number) => {
    const now = Date.now();
    if(cache.insights && cache.insights.year===year && (now-cache.insights.ts)<TTL_MS) return cache.insights.data;
    const data = (await api.get<TaxInsightDto[]>(`/analytics/taxes/insights`, { params: year? { year } : {} })).data;
    cache.insights = { ts: now, year, data }; return data;
  },
  toggleDeductible: (id:number) => api.post<TaxTransactionDto>(`/analytics/taxes/${id}/toggle-deductible`, {}).then(r=>r.data),
  markReceipt: (id:number) => api.post<TaxTransactionDto>(`/analytics/taxes/${id}/mark-receipt`, {}).then(r=>r.data),
  uploadReceipt: (id:number, file:File, onProgress?: (pct:number)=>void) => {
    const form = new FormData(); form.append('file', file);
    return api.post<TaxTransactionDto>(`/analytics/taxes/${id}/upload-receipt`, form, {
      headers: { 'Content-Type':'multipart/form-data' },
      onUploadProgress: ev => { if(onProgress && ev.total){ onProgress(Math.round((ev.loaded/ev.total)*100)); } }
    }).then(r=>r.data);
  },
  downloadReceipt: (id:number) => api.get(`/analytics/taxes/${id}/receipt`, { responseType: 'blob' }).then(r=>r.data),
  // Suggestions & classification
  suggestionsPage: (page:number, size:number) => api.get(`/analytics/taxes/suggestions`, { params: { page, size } }).then(r=>r.data),
  suggestions: () => api.get<TaxTransactionDto[]>(`/analytics/taxes/suggestions`).then(r=>r.data),
  approveSuggestions: (ids:number[]) => api.post(`/analytics/taxes/suggestions/approve`, ids).then(r=>r.data),
  rejectSuggestions: (ids:number[]) => api.post(`/analytics/taxes/suggestions/reject`, ids).then(r=>r.data),
  classifyRange: (start:string, end:string) => api.post<{key:string; value:number} | {created:number}>(`/analytics/taxes/classify`, null, { params: { start, end } }).then(r=>r.data),
  // Rules
  listRules: () => api.get<any[]>(`/analytics/taxes/rules`).then(r=>r.data),
  createRule: (rule:any) => api.post(`/analytics/taxes/rules`, rule).then(r=>r.data),
  updateRule: (id:number, rule:any) => api.put(`/analytics/taxes/rules/${id}`, rule).then(r=>r.data),
  deleteRule: (id:number) => api.delete(`/analytics/taxes/rules/${id}`),
  testRule: (params:{matchType:string; matchValue:string; description?:string; amount?:number; category?:string; merchant?:string}) => api.post(`/analytics/taxes/rules/test`, null, { params }).then(r=>r.data),
  invalidateCache: () => { cache.summary=undefined; cache.insights=undefined; }
};

// Goals API with simple in-memory stats cache + invalidation
let goalStatsCache: { ts:number; data: GoalStatsDto } | null = null;
const GOAL_STATS_TTL = 30_000; // 30s
export const goalsApi = {
  list: () => api.get<GoalDto[]>(`/analytics/goals`).then(r=>r.data),
  create: (payload: Partial<GoalDto>) => api.post<GoalDto>(`/analytics/goals`, payload).then(r=>r.data),
  update: (id:number, payload: Partial<GoalDto>) => api.put<GoalDto>(`/analytics/goals/${id}`, payload).then(r=>r.data),
  delete: (id:number) => api.delete(`/analytics/goals/${id}`),
  contribute: (id:number, amount:number, monthlyContribution?:number) => api.patch<GoalDto>(`/analytics/goals/${id}/contribution`, { amount, monthlyContribution }).then(r=>r.data),
  stats: async () => {
    const now = Date.now();
    if(goalStatsCache && (now - goalStatsCache.ts) < GOAL_STATS_TTL) return goalStatsCache.data;
    const data = (await api.get<GoalStatsDto>(`/analytics/goals/stats`)).data;
    goalStatsCache = { ts: now, data }; return data;
  },
  invalidateStats: () => { goalStatsCache = null; }
};
// Forecast & upcoming transactions
export interface ForecastMonthProjection { month: string; projectedNet: number }
export interface ForecastSummary { averageNet: number; lastMonthNet: number; projectedNextMonth: number; projectedPeriodTotal: number; historyMonths: number; futureMonths: number }
export interface ForecastResponse { actuals: ForecastMonthProjection[]; projections: ForecastMonthProjection[]; method: string; summary: ForecastSummary }
export interface UpcomingApiDto { id: number; dueDate: string; description: string; amount: number; category?: string; status: string; recurring?: boolean; flowType?: 'INCOME' | 'EXPENSE' }

export const forecastApi = {
  get: (months=3) => api.get<ForecastResponse>(`/analytics/forecast`, { params: { months }}).then(r=>r.data),
  upcoming: {
    list: (start?:string,end?:string) => api.get<UpcomingApiDto[]>(`/analytics/forecast/upcoming`, { params: (start && end)? { start,end } : {} }).then(r=>r.data),
    create: (dto: Partial<UpcomingApiDto>) => api.post<UpcomingApiDto>(`/analytics/forecast/upcoming`, dto).then(r=>r.data),
    update: (id:number, dto: Partial<UpcomingApiDto>) => api.put<UpcomingApiDto>(`/analytics/forecast/upcoming/${id}`, dto).then(r=>r.data),
    delete: (id:number) => api.delete(`/analytics/forecast/upcoming/${id}`)
  }
};
// Backwards compatibility export (if any old code expects httpClient)
export const httpClient = api;
// After generation we can re-export useful pieces here.
