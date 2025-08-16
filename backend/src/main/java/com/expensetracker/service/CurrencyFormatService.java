package com.expensetracker.service;

import com.expensetracker.dto.AnalyticsSummaryDto;
import com.expensetracker.model.User;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Currency;
import java.util.Locale;

/**
 * Simple currency-aware formatter. In a more advanced setup, currency could be stored per user and
 * locale resolved from Accept-Language or user profile settings. Here we default to USD & US locale
 * if not specified. Provides convenience decoration of AnalyticsSummaryDto with formatted strings.
 */
@Service
public class CurrencyFormatService {

    public void formatAnalytics(User user, AnalyticsSummaryDto dto) {
        if (dto == null) return;
        Currency currency = resolveCurrency(user);
        Locale locale = resolveLocale(user);
        NumberFormat fmt = NumberFormat.getCurrencyInstance(locale);
        fmt.setCurrency(currency);

        dto.setTotalInflowFormatted(format(fmt, dto.getTotalInflow()));
        dto.setTotalOutflowFormatted(format(fmt, dto.getTotalOutflow()));
        dto.setNetCashFlowFormatted(format(fmt, dto.getNetCashFlow()));
        dto.setAverageDailySpendFormatted(format(fmt, dto.getAverageDailySpend()));
        if (dto.getTopCategories() != null) {
            dto.getTopCategories().forEach(c -> c.setAmountFormatted(format(fmt, c.getAmount())));
        }
    }

    private String format(NumberFormat fmt, BigDecimal value) {
        if (value == null) return null;
        return fmt.format(value);
    }

    private Currency resolveCurrency(User user) {
        // TODO: extend with user preference field, fallback to USD
        return Currency.getInstance("USD");
    }

    private Locale resolveLocale(User user) {
        // TODO: extend with user preference; fallback to US
        return Locale.US;
    }
}
