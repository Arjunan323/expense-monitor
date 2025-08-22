import { api } from '../utils/api';

export interface MonthlyCategoryAmount { category: string; outflow: number; inflow?: number; yoyChangePct?: number|null; momChangePct?: number|null; }
export interface MonthlyBankAmount { bank: string; outflow: number; }
export interface MonthlyPoint { month: string; totalOutflow: number; inflow: number; net: number; categories: MonthlyCategoryAmount[]; banks: MonthlyBankAmount[]; prevYearOutflow?: number|null; yoyChangePct?: number|null; }
export interface SummaryStat { month: string|null; amount: number; }
export interface SeriesSummary { highest: SummaryStat; lowest: SummaryStat; averageOutflow: number; momChangePct?: number|null; }
export interface MonthlySeriesResponse { from: string; to: string; summary: SeriesSummary; monthly: MonthlyPoint[]; currency: string; }
export interface MonthBreakdownResponse { month: string; totalOutflow: number; inflow: number; net: number; categories: MonthlyCategoryAmount[]; banks: MonthlyBankAmount[]; currency: string; }

export async function fetchMonthlySpendingSeries(params: { from: string; to: string; includeBanks?: boolean; includePrevYear?: boolean; topCategories?: number; banks?: string[] }): Promise<MonthlySeriesResponse> {
  let { from, to, includeBanks=false, includePrevYear=false, topCategories=5, banks } = params;
  if(from.length>7) from = from.substring(0,7);
  if(to.length>7) to = to.substring(0,7);
  const qp = new URLSearchParams();
  qp.set('from', from);
  qp.set('to', to);
  qp.set('includeBanks', String(includeBanks));
  qp.set('includePrevYear', String(includePrevYear));
  qp.set('topCategories', String(topCategories));
  if(banks && banks.length){
    for(const b of banks){
      qp.append('banks', b); // repeated param: banks=HSBC&banks=ICICI
    }
  }
  const res = await api.get<MonthlySeriesResponse>(`/analytics/trends/spending/monthly-series?${qp.toString()}`);
  return res.data;
}

export async function fetchMonthlyBreakdown(params: { ym: string; includeBanks?: boolean }): Promise<MonthBreakdownResponse> {
  const { ym, includeBanks=false } = params;
  const res = await api.get<MonthBreakdownResponse>(`/analytics/trends/spending/monthly/${ym}`, { params: { includeBanks }});
  return res.data;
}
