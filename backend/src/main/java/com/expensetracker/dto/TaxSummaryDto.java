package com.expensetracker.dto;

import java.math.BigDecimal;
import java.util.List;

public record TaxSummaryDto(Integer year,
                             BigDecimal totalDeductible,
                             BigDecimal estimatedTaxSavings,
                             int missingReceipts,
                             List<TaxCategoryUsageDto> categories) {}
