package com.expensetracker.dto;

public record NotificationPreferenceDto(Long id, String type, boolean emailEnabled) {}
