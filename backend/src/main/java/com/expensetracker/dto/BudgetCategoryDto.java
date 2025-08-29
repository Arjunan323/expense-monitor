package com.expensetracker.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * DTO for budget categories used in BudgetTracking screen.
 */
public record BudgetCategoryDto(
	Long id,
	@NotBlank String name,
	@Positive BigDecimal monthlyBudget,
	@PositiveOrZero BigDecimal spent,
	String icon,
	String color
) {}

