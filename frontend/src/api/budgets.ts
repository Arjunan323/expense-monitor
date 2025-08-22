import api, { apiCall } from '../utils/api';

export interface BudgetCategoryUsageDto {
  id: number;
  name: string;
  monthlyBudget: number;
  spent: number;
  icon: string;
  color: string;
  progressPercent: number;
  over: boolean;
  near: boolean;
  remaining: number;
}

export interface BudgetSummaryResponse {
  month: string;
  categories: BudgetCategoryUsageDto[];
  totals: { totalBudget: number; totalSpent: number; overBudgetCount: number; overallProgressPercent: number };
  history: { thisMonthAdherence: number; lastMonthAdherence: number; avg6MonthsAdherence: number };
}

export interface CreateBudgetPayload { name: string; monthlyBudget: number; icon?: string; color?: string }

export const budgetsApi = {
  summary: (month?: string) => api.get<BudgetSummaryResponse>(`/analytics/budgets/summary`, { params: month? { month } : {} }).then(r=>r.data),
  listRaw: () => api.get(`/analytics/budgets`).then(r=>r.data),
  create: (payload: CreateBudgetPayload) => api.post(`/analytics/budgets`, { ...payload, spent: 0 }).then(r=>r.data),
  update: (id:number, payload: Partial<CreateBudgetPayload>) => api.put(`/analytics/budgets/${id}`, payload).then(r=>r.data),
  updateLimit: (id:number, monthlyBudget:number) => api.patch(`/analytics/budgets/${id}/limit`, { monthlyBudget }).then(r=>r.data),
  delete: (id:number) => api.delete(`/analytics/budgets/${id}`)
};
