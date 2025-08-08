package com.expensetracker.dto;

public class RazorpayOrderResponseDto {
    private String orderId;
    private String key;
    private int amount;
    private String currency;
    private String planType;

    public RazorpayOrderResponseDto(String orderId, String key, int amount, String currency, String planType) {
        this.orderId = orderId;
        this.key = key;
        this.amount = amount;
        this.currency = currency;
        this.planType = planType;
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getPlanType() { return planType; }
    public void setPlanType(String planType) { this.planType = planType; }
}
