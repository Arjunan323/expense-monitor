package com.expensetracker.dto;

import java.util.List;
import java.util.Map;

public class DashboardStatsDto {
    private double totalBalance;
    private double monthlyIncome;
    private double monthlyExpenses;
    private int transactionCount;
    private List<CategorySummaryDto> topCategories;
    private List<TransactionDto> recentTransactions;
    private List<String> bankSources;
    private boolean isMultiBank;
    private boolean hasBalanceDiscrepancy;
    private String lastUpdateTime;
    // Feature gating fields
    private boolean advancedAnalyticsLocked;
    private String upgradePrompt;
    // Added per-bank granular data for mobile/web dashboard
    private Map<String, Integer> transactionCountByBank;
    private Map<String, Double> balanceByBank;
    private Map<String, Double> incomeByBank;
    private Map<String, Double> expensesByBank;
    private Map<String, List<CategorySummaryDto>> topCategoriesByBank;

    public DashboardStatsDto(double totalBalance,
                             double monthlyIncome,
                             double monthlyExpenses,
                             int transactionCount,
                             List<CategorySummaryDto> topCategories,
                             List<TransactionDto> recentTransactions,
                             List<String> bankSources,
                             boolean isMultiBank,
                             boolean hasBalanceDiscrepancy,
                             String lastUpdateTime,
                             boolean advancedAnalyticsLocked,
                             String upgradePrompt,
                             Map<String, Integer> transactionCountByBank,
                             Map<String, Double> balanceByBank,
                             Map<String, Double> incomeByBank,
                             Map<String, Double> expensesByBank,
                             Map<String, List<CategorySummaryDto>> topCategoriesByBank) {
        this.totalBalance = totalBalance;
        this.monthlyIncome = monthlyIncome;
        this.monthlyExpenses = monthlyExpenses;
        this.transactionCount = transactionCount;
        this.topCategories = topCategories;
        this.recentTransactions = recentTransactions;
        this.bankSources = bankSources;
        this.isMultiBank = isMultiBank;
        this.hasBalanceDiscrepancy = hasBalanceDiscrepancy;
        this.lastUpdateTime = lastUpdateTime;
        this.advancedAnalyticsLocked = advancedAnalyticsLocked;
        this.upgradePrompt = upgradePrompt;
        this.transactionCountByBank = transactionCountByBank;
        this.balanceByBank = balanceByBank;
        this.incomeByBank = incomeByBank;
        this.expensesByBank = expensesByBank;
        this.topCategoriesByBank = topCategoriesByBank;
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
    public List<String> getBankSources() { return bankSources; }
    public void setBankSources(List<String> bankSources) { this.bankSources = bankSources; }
    public boolean isMultiBank() { return isMultiBank; }
    public void setMultiBank(boolean multiBank) { isMultiBank = multiBank; }
    public boolean isHasBalanceDiscrepancy() { return hasBalanceDiscrepancy; }
    public void setHasBalanceDiscrepancy(boolean hasBalanceDiscrepancy) { this.hasBalanceDiscrepancy = hasBalanceDiscrepancy; }
    public String getLastUpdateTime() { return lastUpdateTime; }
    public void setLastUpdateTime(String lastUpdateTime) { this.lastUpdateTime = lastUpdateTime; }
    public boolean isAdvancedAnalyticsLocked() { return advancedAnalyticsLocked; }
    public void setAdvancedAnalyticsLocked(boolean advancedAnalyticsLocked) { this.advancedAnalyticsLocked = advancedAnalyticsLocked; }
    public String getUpgradePrompt() { return upgradePrompt; }
    public void setUpgradePrompt(String upgradePrompt) { this.upgradePrompt = upgradePrompt; }
    public Map<String, Integer> getTransactionCountByBank() { return transactionCountByBank; }
    public void setTransactionCountByBank(Map<String, Integer> transactionCountByBank) { this.transactionCountByBank = transactionCountByBank; }
    public Map<String, Double> getBalanceByBank() { return balanceByBank; }
    public void setBalanceByBank(Map<String, Double> balanceByBank) { this.balanceByBank = balanceByBank; }
    public Map<String, Double> getIncomeByBank() { return incomeByBank; }
    public void setIncomeByBank(Map<String, Double> incomeByBank) { this.incomeByBank = incomeByBank; }
    public Map<String, Double> getExpensesByBank() { return expensesByBank; }
    public void setExpensesByBank(Map<String, Double> expensesByBank) { this.expensesByBank = expensesByBank; }
    public Map<String, List<CategorySummaryDto>> getTopCategoriesByBank() { return topCategoriesByBank; }
    public void setTopCategoriesByBank(Map<String, List<CategorySummaryDto>> topCategoriesByBank) { this.topCategoriesByBank = topCategoriesByBank; }
}
