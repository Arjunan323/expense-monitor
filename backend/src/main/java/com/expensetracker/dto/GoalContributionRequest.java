package com.expensetracker.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class GoalContributionRequest {
    @NotNull
    @DecimalMin(value = "0.01", message = "Contribution must be positive")
    private BigDecimal amount; // amount to add to currentAmount

    @DecimalMin(value = "0.0")
    private BigDecimal monthlyContribution; // optional update to monthlyContribution

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public BigDecimal getMonthlyContribution() { return monthlyContribution; }
    public void setMonthlyContribution(BigDecimal monthlyContribution) { this.monthlyContribution = monthlyContribution; }
}
