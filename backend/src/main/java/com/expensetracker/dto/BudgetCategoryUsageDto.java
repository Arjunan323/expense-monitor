package com.expensetracker.dto;

import java.math.BigDecimal;

/**
 * Enriched per-category view with computed progress & flags.
 */
public record BudgetCategoryUsageDto(
        Long id,
        String name,
        BigDecimal monthlyBudget,
        BigDecimal spent,
        String icon,
        String color,
        double progressPercent,
        boolean over,
        boolean near,
        BigDecimal remaining
) {}
