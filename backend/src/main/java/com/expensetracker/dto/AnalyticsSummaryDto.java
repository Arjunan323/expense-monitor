package com.expensetracker.dto;

import java.util.List;
import java.util.Map;

public class AnalyticsSummaryDto {
    private List<CategorySpend> topCategories; // sorted desc by absolute spend
    private double totalInflow;
    private double totalOutflow;
    private double netCashFlow; // inflow + outflow (outflow negative)
    private Map<String, Double> monthlyTrend; // yyyy-MM -> net
    private double averageDailySpend;

    public AnalyticsSummaryDto() {}

    public AnalyticsSummaryDto(List<CategorySpend> topCategories, double totalInflow, double totalOutflow, double netCashFlow, Map<String, Double> monthlyTrend, double averageDailySpend) {
        this.topCategories = topCategories;
        this.totalInflow = totalInflow;
        this.totalOutflow = totalOutflow;
        this.netCashFlow = netCashFlow;
        this.monthlyTrend = monthlyTrend;
        this.averageDailySpend = averageDailySpend;
    }

    public List<CategorySpend> getTopCategories() { return topCategories; }
    public void setTopCategories(List<CategorySpend> topCategories) { this.topCategories = topCategories; }
    public double getTotalInflow() { return totalInflow; }
    public void setTotalInflow(double totalInflow) { this.totalInflow = totalInflow; }
    public double getTotalOutflow() { return totalOutflow; }
    public void setTotalOutflow(double totalOutflow) { this.totalOutflow = totalOutflow; }
    public double getNetCashFlow() { return netCashFlow; }
    public void setNetCashFlow(double netCashFlow) { this.netCashFlow = netCashFlow; }
    public Map<String, Double> getMonthlyTrend() { return monthlyTrend; }
    public void setMonthlyTrend(Map<String, Double> monthlyTrend) { this.monthlyTrend = monthlyTrend; }
    public double getAverageDailySpend() { return averageDailySpend; }
    public void setAverageDailySpend(double averageDailySpend) { this.averageDailySpend = averageDailySpend; }

    public static class CategorySpend {
        private String category;
        private double amount; // negative for spend, positive for income
        private long transactions;

        public CategorySpend() {}
        public CategorySpend(String category, double amount, long transactions) { this.category = category; this.amount = amount; this.transactions = transactions; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public double getAmount() { return amount; }
        public void setAmount(double amount) { this.amount = amount; }
        public long getTransactions() { return transactions; }
        public void setTransactions(long transactions) { this.transactions = transactions; }
    }
}
