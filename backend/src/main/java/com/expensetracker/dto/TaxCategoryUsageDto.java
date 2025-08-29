package com.expensetracker.dto;

import java.math.BigDecimal;

public record TaxCategoryUsageDto(String code,
                                  String description,
                                  BigDecimal annualLimit,
                                  BigDecimal used,
                                  BigDecimal remaining,
                                  double percentUsed,
                                  boolean overLimit,
                                  boolean nearLimit) {}
