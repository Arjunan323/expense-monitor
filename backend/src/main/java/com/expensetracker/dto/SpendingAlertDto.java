package com.expensetracker.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record SpendingAlertDto(
        Long id,
        String type,
        String severity,
        String title,
        String description,
        BigDecimal amount,
        String merchant,
        String category,
        LocalDate date,
        String reason,
        boolean acknowledged,
        LocalDateTime acknowledgedAt,
        boolean dismissed,
        LocalDateTime dismissedAt,
        LocalDateTime createdAt,
        Long txnId,
        String metadata,
        java.util.Map<String,Object> parsedMetadata
) {}
