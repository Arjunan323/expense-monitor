package com.expensetracker.dto;

import java.time.LocalDateTime;
public record SpendingAlertSummaryDto(long criticalOpen, long moderateOpen, long acknowledged, long total, Long generated, LocalDateTime lastGeneratedAt) {}
