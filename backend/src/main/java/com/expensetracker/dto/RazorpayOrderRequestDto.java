package com.expensetracker.dto;

// Incoming request to create a Razorpay order.
// billingPeriod optional; defaults to MONTHLY if omitted.
public class RazorpayOrderRequestDto {
    private String planType; // PRO, PREMIUM
    private String billingPeriod; // MONTHLY | YEARLY

    public String getPlanType() { return planType; }
    public void setPlanType(String planType) { this.planType = planType; }
    public String getBillingPeriod() { return billingPeriod; }
    public void setBillingPeriod(String billingPeriod) { this.billingPeriod = billingPeriod; }
}
