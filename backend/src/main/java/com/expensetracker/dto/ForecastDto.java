package com.expensetracker.dto;

import java.util.List;
import java.math.BigDecimal;

/**
 * Forecast response containing historical actuals, future projections and a lightweight summary.
 */
public class ForecastDto {
    public static class MonthProjection {
        private String month; // yyyy-MM
        private BigDecimal projectedNet; // net amount (actual if month in history)
        public MonthProjection(){}
        public MonthProjection(String month, BigDecimal projectedNet){this.month=month;this.projectedNet=projectedNet;}
        public String getMonth(){return month;}
        public void setMonth(String month){this.month=month;}
        public BigDecimal getProjectedNet(){return projectedNet;}
        public void setProjectedNet(BigDecimal projectedNet){this.projectedNet=projectedNet;}
    }

    public static class Summary {
        private BigDecimal averageNet; // average of historical actuals
        private BigDecimal lastMonthNet; // most recent actual
        private BigDecimal projectedNextMonth; // first future projection
        private BigDecimal projectedPeriodTotal; // sum of all future projections
        private int historyMonths; // number of months of history used
        private int futureMonths; // number of months projected
        public Summary(){}
        public Summary(BigDecimal averageNet, BigDecimal lastMonthNet, BigDecimal projectedNextMonth, BigDecimal projectedPeriodTotal, int historyMonths, int futureMonths){
            this.averageNet=averageNet;this.lastMonthNet=lastMonthNet;this.projectedNextMonth=projectedNextMonth;this.projectedPeriodTotal=projectedPeriodTotal;this.historyMonths=historyMonths;this.futureMonths=futureMonths;
        }
        public BigDecimal getAverageNet(){return averageNet;}
        public void setAverageNet(BigDecimal averageNet){this.averageNet=averageNet;}
        public BigDecimal getLastMonthNet(){return lastMonthNet;}
        public void setLastMonthNet(BigDecimal lastMonthNet){this.lastMonthNet=lastMonthNet;}
        public BigDecimal getProjectedNextMonth(){return projectedNextMonth;}
        public void setProjectedNextMonth(BigDecimal projectedNextMonth){this.projectedNextMonth=projectedNextMonth;}
        public BigDecimal getProjectedPeriodTotal(){return projectedPeriodTotal;}
        public void setProjectedPeriodTotal(BigDecimal projectedPeriodTotal){this.projectedPeriodTotal=projectedPeriodTotal;}
        public int getHistoryMonths(){return historyMonths;}
        public void setHistoryMonths(int historyMonths){this.historyMonths=historyMonths;}
        public int getFutureMonths(){return futureMonths;}
        public void setFutureMonths(int futureMonths){this.futureMonths=futureMonths;}
    }

    private List<MonthProjection> actuals; // historical months
    private List<MonthProjection> projections; // future months
    private String method; // e.g. SIMPLE_AVERAGE
    private Summary summary; // derived stats
    public ForecastDto(){}
    public ForecastDto(List<MonthProjection> actuals, List<MonthProjection> projections, String method, Summary summary){
        this.actuals=actuals;this.projections=projections;this.method=method;this.summary=summary;
    }
    public List<MonthProjection> getActuals(){return actuals;}
    public void setActuals(List<MonthProjection> actuals){this.actuals=actuals;}
    public List<MonthProjection> getProjections(){return projections;}
    public void setProjections(List<MonthProjection> projections){this.projections=projections;}
    public String getMethod(){return method;}
    public void setMethod(String method){this.method=method;}
    public Summary getSummary(){return summary;}
    public void setSummary(Summary summary){this.summary=summary;}
}