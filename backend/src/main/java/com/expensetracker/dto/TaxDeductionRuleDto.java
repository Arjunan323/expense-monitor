package com.expensetracker.dto;

public record TaxDeductionRuleDto(Long id,
                                  String matchType,
                                  String matchValue,
                                  String taxCategoryCode,
                                  Integer priority,
                                  Boolean autoMarkDeductible,
                                  Boolean active,
                                  Boolean globalRule) {}
