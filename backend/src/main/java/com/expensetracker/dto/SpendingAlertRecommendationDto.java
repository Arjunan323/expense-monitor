package com.expensetracker.dto;

public record SpendingAlertRecommendationDto(
        Long id,
        String type,
        int priority,
        String title,
        String message,
        String icon,
        String category,
        Double currentMonthlyAvg,
        Double suggestedCap,
        String rationale
) {}
