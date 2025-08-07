package com.expensetracker.dto;

import java.util.List;

public class DashboardStatsDto {
    private double totalBalance;
    private double monthlyIncome;
    private double monthlyExpenses;
    private int transactionCount;
    private List<CategorySummaryDto> topCategories;
    private List<TransactionDto> recentTransactions;

    public DashboardStatsDto(double totalBalance, double monthlyIncome, double monthlyExpenses, int transactionCount, List<CategorySummaryDto> topCategories, List<TransactionDto> recentTransactions) {
        this.totalBalance = totalBalance;
        this.monthlyIncome = monthlyIncome;
        this.monthlyExpenses = monthlyExpenses;
        this.transactionCount = transactionCount;
        this.topCategories = topCategories;
        this.recentTransactions = recentTransactions;
    }

    public double getTotalBalance() { return totalBalance; }
    public void setTotalBalance(double totalBalance) { this.totalBalance = totalBalance; }
    public double getMonthlyIncome() { return monthlyIncome; }
    public void setMonthlyIncome(double monthlyIncome) { this.monthlyIncome = monthlyIncome; }
    public double getMonthlyExpenses() { return monthlyExpenses; }
    public void setMonthlyExpenses(double monthlyExpenses) { this.monthlyExpenses = monthlyExpenses; }
    public int getTransactionCount() { return transactionCount; }
    public void setTransactionCount(int transactionCount) { this.transactionCount = transactionCount; }
    public List<CategorySummaryDto> getTopCategories() { return topCategories; }
    public void setTopCategories(List<CategorySummaryDto> topCategories) { this.topCategories = topCategories; }
    public List<TransactionDto> getRecentTransactions() { return recentTransactions; }
    public void setRecentTransactions(List<TransactionDto> recentTransactions) { this.recentTransactions = recentTransactions; }
}
