package com.expensetracker.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Composite response for Budget Tracking screen: categories + totals + history KPIs.
 */
public record BudgetSummaryResponse(
        String month,
        List<BudgetCategoryUsageDto> categories,
        Totals totals,
        History history
) {
    public record Totals(BigDecimal totalBudget, BigDecimal totalSpent, int overBudgetCount, double overallProgressPercent) {}
    public record History(double thisMonthAdherence, double lastMonthAdherence, double avg6MonthsAdherence) {}
}
