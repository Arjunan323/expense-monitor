package com.expensetracker.dto;

public record SpendingAlertSettingsDto(
        double largeMultiplier,
        double largeMinAmount,
        int freqWindowHours,
        int freqMaxTxn,
        double freqMinAmount,
        double catSpikeMultiplier,
        int catSpikeLookbackMonths,
        double catSpikeMinAmount,
        double newMerchantMinAmount,
        Double criticalLargeAbsolute,
        Double criticalCategorySpikeMultiplier,
        Integer criticalFrequencyCount,
        Double criticalNewMerchantAbsolute
) {}
