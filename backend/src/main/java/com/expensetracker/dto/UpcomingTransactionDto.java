package com.expensetracker.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import com.expensetracker.model.UpcomingTransaction.Status;
import com.expensetracker.model.UpcomingTransaction.FlowType;

public record UpcomingTransactionDto(Long id, LocalDate dueDate, String description, BigDecimal amount, String category, Status status, Boolean recurring, FlowType flowType) {}