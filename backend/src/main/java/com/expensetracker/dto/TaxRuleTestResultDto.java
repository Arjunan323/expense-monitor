package com.expensetracker.dto;

/**
 * Result of testing a prospective tax deduction rule against sample transaction inputs.
 * This is intentionally separate from TaxDeductionRuleDto because we need a 'matched' flag
 * and we do NOT persist anything for this operation.
 */
public record TaxRuleTestResultDto(
        boolean matched,
        String taxCategoryCode,
        Boolean autoMarkDeductible,
        String error
) {}
