package com.expensetracker.service;

import com.expensetracker.dto.AnalyticsSummaryDto;
import com.expensetracker.model.User;
import com.expensetracker.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class AnalyticsService {
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private com.expensetracker.security.AuthenticationFacade authenticationFacade;

    public AnalyticsSummaryDto getSummary(String token, String startDate, String endDate) {
        // token retained for backward compatibility; preferred resolution via SecurityContext
        User user = authenticationFacade.currentUser();
        LocalDate start = (startDate != null && !startDate.isBlank()) ? LocalDate.parse(startDate) : LocalDate.now().minusMonths(3).withDayOfMonth(1);
        LocalDate end = (endDate != null && !endDate.isBlank()) ? LocalDate.parse(endDate) : LocalDate.now();

        // Aggregated queries instead of loading all entities
    BigDecimal totalInflow = Optional.ofNullable(transactionRepository.sumInflow(user, start, end)).orElse(BigDecimal.ZERO);
    BigDecimal totalOutflow = Optional.ofNullable(transactionRepository.sumOutflow(user, start, end)).orElse(BigDecimal.ZERO);
    BigDecimal net = totalInflow.add(totalOutflow); // outflow stored negative

    Map<String, BigDecimal> monthly = new TreeMap<>();
    transactionRepository.aggregateMonthly(user, start, end).forEach(p -> monthly.put(p.getYm(), p.getNet() == null ? BigDecimal.ZERO : p.getNet()));

    List<AnalyticsSummaryDto.CategorySpend> topCategories = transactionRepository.aggregateCategory(user, start, end).stream()
        .sorted((a,b)-> b.getTotalAmount().abs().compareTo(a.getTotalAmount().abs()))
        .limit(8)
        .map(p -> new AnalyticsSummaryDto.CategorySpend(p.getCategory() != null ? p.getCategory() : "Uncategorized", p.getTotalAmount(), p.getTxnCount()))
        .collect(Collectors.toList());

    long months = ChronoUnit.MONTHS.between(YearMonth.from(start), YearMonth.from(end)) + 1;
    BigDecimal avgDailySpend = months > 0 ? totalOutflow.abs().divide(BigDecimal.valueOf(months * 30L), 4, RoundingMode.HALF_UP) : BigDecimal.ZERO;

    AnalyticsSummaryDto dto = new AnalyticsSummaryDto(topCategories, totalInflow, totalOutflow, net, monthly, avgDailySpend);
    // Currency formatting will be applied by CurrencyFormatService decorator elsewhere if needed.
    return dto;
    }

    @Cacheable(cacheNames = "analytics:summary", key = "#root.methodName + ':' + #token + ':' + #startDate + ':' + #endDate")
    public AnalyticsSummaryDto cachedSummary(String token, String startDate, String endDate) {
        return getSummary(token, startDate, endDate);
    }
}
