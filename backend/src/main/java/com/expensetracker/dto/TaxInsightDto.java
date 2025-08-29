package com.expensetracker.dto;

public record TaxInsightDto(String id,
                             String type, // TIP | WARNING | ACTION
                             String severity, // INFO | WARN | ERROR
                             String message,
                             String categoryCode) {}
