package com.expensetracker.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TaxTransactionDto(Long id,
								Integer taxYear,
								String category,
								BigDecimal amount,
								LocalDate paidDate,
								String note,
								Boolean deductible,
								Boolean hasReceipt,
								String classificationStatus,
								Long sourceTransactionId,
								String sourceDescription,
								String sourceCategory,
								BigDecimal sourceAmount,
								String sourceBank) {}