package com.expensetracker.dto;

import java.math.BigDecimal;

public record TaxCategoryDto(Long id, String code, String description, BigDecimal annualLimit) {}