package com.expensetracker.dto;

import java.math.BigDecimal;

public record TrendPointDto(String month, BigDecimal net) {}