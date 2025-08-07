package com.expensetracker.dto;

public class CategorySummaryDto {
    private String category;
    private double amount;
    private int count;
    private double percentage;

    public CategorySummaryDto(String category, double amount, int count, double percentage) {
        this.category = category;
        this.amount = amount;
        this.count = count;
        this.percentage = percentage;
    }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }
    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }
}
