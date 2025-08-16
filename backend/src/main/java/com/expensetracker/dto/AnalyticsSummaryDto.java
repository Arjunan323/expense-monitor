package com.expensetracker.dto;

import java.util.List;
import java.util.Map;
import java.math.BigDecimal;

public class AnalyticsSummaryDto {
    private List<CategorySpend> topCategories; // sorted desc by absolute spend
    private BigDecimal totalInflow; // raw precise values
    private BigDecimal totalOutflow;
    private BigDecimal netCashFlow; // inflow + outflow (outflow negative)
    private Map<String, BigDecimal> monthlyTrend; // yyyy-MM -> net
    private BigDecimal averageDailySpend;

    // Pre-formatted strings (currency aware) - optional convenience for front-end
    private String totalInflowFormatted;
    private String totalOutflowFormatted;
    private String netCashFlowFormatted;
    private String averageDailySpendFormatted;

    public AnalyticsSummaryDto() {}

    public AnalyticsSummaryDto(List<CategorySpend> topCategories, BigDecimal totalInflow, BigDecimal totalOutflow, BigDecimal netCashFlow, Map<String, BigDecimal> monthlyTrend, BigDecimal averageDailySpend) {
        this.topCategories = topCategories;
        this.totalInflow = totalInflow;
        this.totalOutflow = totalOutflow;
        this.netCashFlow = netCashFlow;
        this.monthlyTrend = monthlyTrend;
        this.averageDailySpend = averageDailySpend;
    }

    public List<CategorySpend> getTopCategories() { return topCategories; }
    public void setTopCategories(List<CategorySpend> topCategories) { this.topCategories = topCategories; }
    public BigDecimal getTotalInflow() { return totalInflow; }
    public void setTotalInflow(BigDecimal totalInflow) { this.totalInflow = totalInflow; }
    public BigDecimal getTotalOutflow() { return totalOutflow; }
    public void setTotalOutflow(BigDecimal totalOutflow) { this.totalOutflow = totalOutflow; }
    public BigDecimal getNetCashFlow() { return netCashFlow; }
    public void setNetCashFlow(BigDecimal netCashFlow) { this.netCashFlow = netCashFlow; }
    public Map<String, BigDecimal> getMonthlyTrend() { return monthlyTrend; }
    public void setMonthlyTrend(Map<String, BigDecimal> monthlyTrend) { this.monthlyTrend = monthlyTrend; }
    public BigDecimal getAverageDailySpend() { return averageDailySpend; }
    public void setAverageDailySpend(BigDecimal averageDailySpend) { this.averageDailySpend = averageDailySpend; }

    public String getTotalInflowFormatted() { return totalInflowFormatted; }
    public void setTotalInflowFormatted(String totalInflowFormatted) { this.totalInflowFormatted = totalInflowFormatted; }
    public String getTotalOutflowFormatted() { return totalOutflowFormatted; }
    public void setTotalOutflowFormatted(String totalOutflowFormatted) { this.totalOutflowFormatted = totalOutflowFormatted; }
    public String getNetCashFlowFormatted() { return netCashFlowFormatted; }
    public void setNetCashFlowFormatted(String netCashFlowFormatted) { this.netCashFlowFormatted = netCashFlowFormatted; }
    public String getAverageDailySpendFormatted() { return averageDailySpendFormatted; }
    public void setAverageDailySpendFormatted(String averageDailySpendFormatted) { this.averageDailySpendFormatted = averageDailySpendFormatted; }

    public static class CategorySpend {
        private String category;
    private BigDecimal amount; // negative for spend, positive for income
    private String amountFormatted;
        private long transactions;

        public CategorySpend() {}
    public CategorySpend(String category, BigDecimal amount, long transactions) { this.category = category; this.amount = amount; this.transactions = transactions; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
        public long getTransactions() { return transactions; }
        public void setTransactions(long transactions) { this.transactions = transactions; }
    public String getAmountFormatted() { return amountFormatted; }
    public void setAmountFormatted(String amountFormatted) { this.amountFormatted = amountFormatted; }
    }
}
