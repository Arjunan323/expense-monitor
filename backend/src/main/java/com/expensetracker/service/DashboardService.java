package com.expensetracker.service;

import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.model.Transaction;
import com.expensetracker.model.User;
import com.expensetracker.dto.DashboardStatsDto;
import com.expensetracker.dto.CategorySummaryDto;
import com.expensetracker.dto.TransactionDto;
import com.expensetracker.util.AppConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Autowired
    public DashboardService(TransactionRepository transactionRepository, UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }


    public DashboardStatsDto getSummary(String token, String startDateStr, String endDateStr) {
        String username = new com.expensetracker.config.JwtUtil().extractUsername(token);
        User user = userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException(username));

    java.time.LocalDate startDate = (startDateStr != null && !startDateStr.isEmpty()) ? java.time.LocalDate.parse(startDateStr) : null;
    java.time.LocalDate endDate = (endDateStr != null && !endDateStr.isEmpty()) ? java.time.LocalDate.parse(endDateStr) : null;
    // Use Specification for date range filtering
    List<Transaction> txns = transactionRepository.findAll(
        com.expensetracker.repository.TransactionSpecifications.filter(
            user,
            null, // banks
            null, // categories
            startDate,
            endDate,
            null, // amountMin
            null, // amountMax
            null, // transactionType
            null  // description
        )
    );

        String planType = AppConstants.PLAN_FREE;
        if (user.getSubscription() != null && AppConstants.STATUS_ACTIVE.equals(user.getSubscription().getStatus())) {
            planType = user.getSubscription().getPlanType().name();
        }

        Map<String, List<Transaction>> bankGroups = txns.stream().collect(Collectors.groupingBy(t -> t.getBankName() != null ? t.getBankName() : AppConstants.UNKNOWN));
        List<String> bankSources = new ArrayList<>(bankGroups.keySet());
        boolean isMultiBank = bankSources.size() > 1;
        boolean hasBalanceDiscrepancy = isMultiBank;
        String lastUpdateTime = txns.stream().map(Transaction::getDate).max(java.util.Comparator.naturalOrder()).map(java.time.LocalDate::toString).orElse("");

        double totalBalance = txns.stream()
            .sorted((a, b) -> {
                int cmp = b.getDate().compareTo(a.getDate());
                if (cmp == 0) return Long.compare(b.getId(), a.getId());
                return cmp;
            })
            .map(Transaction::getBalance)
            .findFirst()
            .orElse(0.0);
        double monthlyIncome = txns.stream().filter(t -> t.getAmount() > 0).mapToDouble(Transaction::getAmount).sum();
        double monthlyExpenses = txns.stream().filter(t -> t.getAmount() < 0).mapToDouble(Transaction::getAmount).sum();
        int transactionCount = txns.size();

        Map<String, List<Transaction>> categoryGroups = txns.stream().collect(Collectors.groupingBy(Transaction::getCategory));
        double totalAbs = txns.stream().mapToDouble(t -> Math.abs(t.getAmount())).sum();
        List<CategorySummaryDto> topCategories = categoryGroups.entrySet().stream()
            .map(e -> {
                double amount = e.getValue().stream().mapToDouble(Transaction::getAmount).sum();
                int count = e.getValue().size();
                double percentage = totalAbs > 0 ? (e.getValue().stream().mapToDouble(t -> Math.abs(t.getAmount())).sum() / totalAbs) * 100 : 0.0;
                return new CategorySummaryDto(e.getKey(), amount, count, percentage);
            })
            .sorted((a, b) -> Double.compare(Math.abs(b.getAmount()), Math.abs(a.getAmount())))
            .limit(6)
            .collect(Collectors.toList());

        List<TransactionDto> recentTransactions = txns.stream()
            .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
            .limit(5)
            .map(t -> new TransactionDto(
                t.getId(),
                t.getDate(),
                t.getDescription(),
                t.getAmount(),
                t.getBalance(),
                t.getCategory(),
                t.getBankName()
            ))
            .collect(Collectors.toList());

        boolean advancedAnalyticsLocked = false;
        String upgradePrompt = null;
        // if (AppConstants.PLAN_FREE.equals(planType)) {
        //     topCategories = null;
        //     isMultiBank = false;
        //     hasBalanceDiscrepancy = false;
        //     advancedAnalyticsLocked = true;
        //     upgradePrompt = AppConstants.UPGRADE_PROMPT;
        // }

        return new DashboardStatsDto(
            totalBalance,
            monthlyIncome,
            monthlyExpenses,
            transactionCount,
            topCategories,
            recentTransactions,
            bankSources,
            isMultiBank,
            hasBalanceDiscrepancy,
            lastUpdateTime,
            advancedAnalyticsLocked,
            upgradePrompt
        );
    }

    public String exportCsv(String token) {
        String username = new com.expensetracker.config.JwtUtil().extractUsername(token);
        User user = userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException(username));
        List<Transaction> txns = transactionRepository.findAll().stream()
            .filter(t -> t.getUser() != null && t.getUser().getId().equals(user.getId()))
            .toList();
        StringBuilder csv = new StringBuilder(AppConstants.CSV_HEADER);
        for (Transaction t : txns) {
            csv.append(t.getDate()).append(",")
               .append(t.getDescription()).append(",")
               .append(t.getAmount()).append(",")
               .append(t.getBalance()).append(",")
               .append(t.getCategory()).append("\n");
        }
        return csv.toString();
    }
}
