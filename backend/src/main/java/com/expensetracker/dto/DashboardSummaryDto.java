package com.expensetracker.dto;

import java.util.List;

public class DashboardSummaryDto {
    private double totalIncome;
    private double totalSpend;
    private List<TopCategoryDto> topCategories;

    public DashboardSummaryDto(double totalIncome, double totalSpend, List<TopCategoryDto> topCategories) {
        this.totalIncome = totalIncome;
        this.totalSpend = totalSpend;
        this.topCategories = topCategories;
    }

    public double getTotalIncome() { return totalIncome; }
    public void setTotalIncome(double totalIncome) { this.totalIncome = totalIncome; }
    public double getTotalSpend() { return totalSpend; }
    public void setTotalSpend(double totalSpend) { this.totalSpend = totalSpend; }
    public List<TopCategoryDto> getTopCategories() { return topCategories; }
    public void setTopCategories(List<TopCategoryDto> topCategories) { this.topCategories = topCategories; }
}
