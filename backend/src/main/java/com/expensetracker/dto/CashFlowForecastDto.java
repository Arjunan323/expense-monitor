package com.expensetracker.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Represents a forward-looking cash flow forecast broken down by month.
 */
public class CashFlowForecastDto {
    public static class MonthCashFlow {
        private String month; // yyyy-MM
        private BigDecimal projectedInflow;
        private BigDecimal projectedOutflow; // negative value not required; store absolute outflow
        private BigDecimal projectedNet; // inflow - outflow
        public MonthCashFlow(){}
        public MonthCashFlow(String month, BigDecimal inflow, BigDecimal outflow){
            this.month = month;
            this.projectedInflow = inflow;
            this.projectedOutflow = outflow;
            this.projectedNet = (inflow==null||outflow==null)? null : inflow.subtract(outflow);
        }
        public String getMonth(){return month;}
        public void setMonth(String month){this.month=month;}
        public BigDecimal getProjectedInflow(){return projectedInflow;}
        public void setProjectedInflow(BigDecimal projectedInflow){this.projectedInflow=projectedInflow; recompute();}
        public BigDecimal getProjectedOutflow(){return projectedOutflow;}
        public void setProjectedOutflow(BigDecimal projectedOutflow){this.projectedOutflow=projectedOutflow; recompute();}
        public BigDecimal getProjectedNet(){return projectedNet;}
        private void recompute(){ if(projectedInflow!=null && projectedOutflow!=null) projectedNet = projectedInflow.subtract(projectedOutflow); }
    }

    private List<MonthCashFlow> months;
    private String method; // e.g. SIMPLE_AVERAGE, LINEAR_REGRESSION, MOVING_AVERAGE
    private String currency;
    private String assumptionSummary; // short textual notes on method assumptions

    public CashFlowForecastDto(){}
    public CashFlowForecastDto(List<MonthCashFlow> months, String method, String currency, String assumptionSummary){
        this.months=months; this.method=method; this.currency=currency; this.assumptionSummary=assumptionSummary;
    }

    public List<MonthCashFlow> getMonths(){return months;}
    public void setMonths(List<MonthCashFlow> months){this.months=months;}
    public String getMethod(){return method;}
    public void setMethod(String method){this.method=method;}
    public String getCurrency(){return currency;}
    public void setCurrency(String currency){this.currency=currency;}
    public String getAssumptionSummary(){return assumptionSummary;}
    public void setAssumptionSummary(String assumptionSummary){this.assumptionSummary=assumptionSummary;}
}