package com.expensetracker.dto;

public record SpendingAlertRecomputeResponse(long generated, long replaced, long durationMs) {}
