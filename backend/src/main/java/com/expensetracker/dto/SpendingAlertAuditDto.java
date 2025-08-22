package com.expensetracker.dto;

import java.time.LocalDateTime;

public record SpendingAlertAuditDto(String action, LocalDateTime at) {}
