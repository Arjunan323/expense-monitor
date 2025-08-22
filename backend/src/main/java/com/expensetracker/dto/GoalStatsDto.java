package com.expensetracker.dto;

import java.math.BigDecimal;

public class GoalStatsDto {
    private int totalGoals;
    private int activeGoals;
    private int completedGoals;
    private BigDecimal totalSaved;
    private BigDecimal monthlyTarget;
    // Average progress across all goals in percent (0-100)
    private BigDecimal averageProgressPercent;

    public int getTotalGoals() { return totalGoals; }
    public void setTotalGoals(int totalGoals) { this.totalGoals = totalGoals; }
    public int getActiveGoals() { return activeGoals; }
    public void setActiveGoals(int activeGoals) { this.activeGoals = activeGoals; }
    public int getCompletedGoals() { return completedGoals; }
    public void setCompletedGoals(int completedGoals) { this.completedGoals = completedGoals; }
    public BigDecimal getTotalSaved() { return totalSaved; }
    public void setTotalSaved(BigDecimal totalSaved) { this.totalSaved = totalSaved; }
    public BigDecimal getMonthlyTarget() { return monthlyTarget; }
    public void setMonthlyTarget(BigDecimal monthlyTarget) { this.monthlyTarget = monthlyTarget; }
    public BigDecimal getAverageProgressPercent() { return averageProgressPercent; }
    public void setAverageProgressPercent(BigDecimal averageProgressPercent) { this.averageProgressPercent = averageProgressPercent; }
}
