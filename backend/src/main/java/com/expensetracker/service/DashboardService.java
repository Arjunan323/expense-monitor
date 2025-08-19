package com.expensetracker.service;

import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.AuthenticationFacade;
import com.expensetracker.model.Transaction;
import com.expensetracker.model.User;
import com.expensetracker.dto.DashboardStatsDto;
import com.expensetracker.dto.CategorySummaryDto;
import com.expensetracker.dto.TransactionDto;
import com.expensetracker.util.AppConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@Service
public class DashboardService {
    private final TransactionRepository transactionRepository;
    private final AuthenticationFacade authenticationFacade;

    public DashboardService(TransactionRepository transactionRepository, UserRepository userRepository, AuthenticationFacade authenticationFacade) {
        this.transactionRepository = transactionRepository;
        this.authenticationFacade = authenticationFacade;
    }

    // =====================================================================
    // Public API
    // =====================================================================
    public DashboardStatsDto getSummary(String token, String startDateStr, String endDateStr, String banksCsv) {
        User user = authenticationFacade.currentUser();

        java.time.LocalDate startDate = parseDate(startDateStr);
        java.time.LocalDate endDate   = parseDate(endDateStr);
        List<String> banksFilter      = parseBanksCsv(banksCsv);

        List<Transaction> txns = fetchFilteredTransactions(user, banksFilter, startDate, endDate);

        String planType = resolvePlanType(user);

        BankMetrics bankMetrics = computeBankMetrics(txns);

        double totalBalance = computeTotalBalance(bankMetrics);
        String lastUpdateTime = txns.stream()
            .map(Transaction::getDate)
            .max(java.util.Comparator.naturalOrder())
            .map(java.time.LocalDate::toString)
            .orElse("");

        List<CategorySummaryDto> topCategories = computeGlobalTopCategories(txns);
        List<TransactionDto> recentTransactions = computeRecentTransactions(txns, 5);

        boolean hasBalanceDiscrepancy = bankMetrics.multiBank; // simplified heuristic
        boolean advancedAnalyticsLocked = false;
        String upgradePrompt = null;
        if (AppConstants.PLAN_FREE.equals(planType)) {
            hasBalanceDiscrepancy = false; // hide for free plan
            advancedAnalyticsLocked = true;
            upgradePrompt = AppConstants.UPGRADE_PROMPT;
        }

        return new DashboardStatsDto(
            totalBalance,
            computeMonthlyIncome(txns),
            computeMonthlyExpenses(txns),
            txns.size(),
            topCategories,
            recentTransactions,
            bankMetrics.bankSources,
            bankMetrics.multiBank,
            hasBalanceDiscrepancy,
            lastUpdateTime,
            advancedAnalyticsLocked,
            upgradePrompt,
            bankMetrics.transactionCountByBank,
            bankMetrics.balanceByBank,
            bankMetrics.incomeByBank,
            bankMetrics.expensesByBank,
            bankMetrics.topCategoriesByBank
        );
    }

    // =====================================================================
    // Parsing Helpers
    // =====================================================================
    private java.time.LocalDate parseDate(String raw) {
        if (raw == null || raw.isBlank()) return null;
        return java.time.LocalDate.parse(raw.trim());
    }

    private List<String> parseBanksCsv(String csv) {
        if (csv == null || csv.isBlank()) return null;
        return Arrays.stream(csv.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .distinct()
            .toList();
    }

    // =====================================================================
    // Data Fetching
    // =====================================================================
    private List<Transaction> fetchFilteredTransactions(User user, List<String> banks, java.time.LocalDate startDate, java.time.LocalDate endDate) {
        return transactionRepository.findAll(
            com.expensetracker.repository.TransactionSpecifications.filter(
                user,
                banks,
                null,
                startDate,
                endDate,
                null,
                null,
                null,
                null
            )
        );
    }

    // =====================================================================
    // Plan Resolution
    // =====================================================================
    private String resolvePlanType(User user) {
        if (user.getSubscription() != null && AppConstants.STATUS_ACTIVE.equals(user.getSubscription().getStatus())) {
            return user.getSubscription().getPlanType().name();
        }
        return AppConstants.PLAN_FREE;
    }

    // =====================================================================
    // Bank Metrics Computation
    // =====================================================================
    private record BankMetrics(
        List<String> bankSources,
        Map<String,Integer> transactionCountByBank,
        Map<String,Double> balanceByBank,
        Map<String,Double> incomeByBank,
        Map<String,Double> expensesByBank,
        Map<String,List<CategorySummaryDto>> topCategoriesByBank,
        boolean multiBank
    ) {}

    private BankMetrics computeBankMetrics(List<Transaction> txns) {
        Map<String, List<Transaction>> bankGroups = txns.stream()
            .collect(Collectors.groupingBy(t -> t.getBankName() != null ? t.getBankName() : AppConstants.UNKNOWN));
        List<String> bankSources = new ArrayList<>(bankGroups.keySet());
        boolean isMultiBank = bankSources.size() > 1;

        Map<String,Integer> transactionCountByBank = new HashMap<>();
        Map<String,Double> balanceByBank = new HashMap<>();
        Map<String,Double> incomeByBank = new HashMap<>();
        Map<String,Double> expensesByBank = new HashMap<>();
        Map<String,List<CategorySummaryDto>> topCategoriesByBank = new HashMap<>();

        for (Map.Entry<String,List<Transaction>> e : bankGroups.entrySet()) {
            String bank = e.getKey();
            List<Transaction> list = e.getValue();
            transactionCountByBank.put(bank, list.size());

            double bankBalance = inferLatestBalance(list);
            balanceByBank.put(bank, bankBalance);

            double inc = list.stream()
                .filter(t -> t.getAmount() != null && t.getAmount().compareTo(BigDecimal.ZERO) > 0)
                .map(Transaction::getAmount)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();
            double exp = list.stream()
                .filter(t -> t.getAmount() != null && t.getAmount().compareTo(BigDecimal.ZERO) < 0)
                .map(Transaction::getAmount)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();
            incomeByBank.put(bank, inc);
            expensesByBank.put(bank, exp);

            topCategoriesByBank.put(bank, computeTopCategoriesForList(list, 6));
        }

        return new BankMetrics(bankSources, transactionCountByBank, balanceByBank, incomeByBank, expensesByBank, topCategoriesByBank, isMultiBank);
    }

    private double inferLatestBalance(List<Transaction> list) {
        if (list == null || list.isEmpty()) return 0.0;
        // Initial chronological last non-null balance baseline
        double baseline = list.stream()
            .sorted(Comparator.comparing(Transaction::getDate).thenComparing(Transaction::getId))
            .map(Transaction::getBalance)
            .filter(Objects::nonNull)
            .reduce((a,b)-> b)
            .map(BigDecimal::doubleValue)
            .orElse(0.0);

        java.time.LocalDate latestDate = list.stream().map(Transaction::getDate).max(java.util.Comparator.naturalOrder()).orElse(null);
        if (latestDate == null) return baseline;
        List<Transaction> latestDay = list.stream()
            .filter(t -> latestDate.equals(t.getDate()) && t.getBalance() != null)
            .collect(Collectors.toList());
        if (latestDay.size() <= 1) return baseline; // nothing to infer

        Map<Long, Boolean> hasSuccessor = new HashMap<>();
        for (Transaction t : latestDay) if (t.getId() != null) hasSuccessor.put(t.getId(), false);

        for (Transaction a : latestDay) {
            if (a.getBalance() == null) continue;
            for (Transaction b : latestDay) {
                if (a == b) continue;
                if (b.getBalance() == null || b.getAmount() == null) continue;
                try {
                    BigDecimal expected = a.getBalance().add(b.getAmount());
                    if (expected.compareTo(b.getBalance()) == 0) {
                        if (a.getId() != null) hasSuccessor.put(a.getId(), true);
                    }
                } catch (Exception ignore) {}
            }
        }
        List<Transaction> candidates = latestDay.stream()
            .filter(t -> t.getId() != null && !Boolean.TRUE.equals(hasSuccessor.get(t.getId())))
            .collect(Collectors.toList());
        if (candidates.isEmpty()) return baseline; // fallback

        Transaction chosen = candidates.stream()
            .sorted((x,y) -> {
                int cmp = x.getBalance().compareTo(y.getBalance());
                if (cmp != 0) return cmp; // higher balance later typical
                if (x.getId() != null && y.getId() != null) return Long.compare(y.getId(), x.getId());
                return 0;
            })
            .reduce((first, second) -> second)
            .orElse(candidates.get(0));

        return chosen.getBalance() != null ? chosen.getBalance().doubleValue() : baseline;
    }

    // =====================================================================
    // Category & Recent Computations
    // =====================================================================
    private List<CategorySummaryDto> computeTopCategoriesForList(List<Transaction> list, int limit) {
        Map<String, List<Transaction>> catGroups = list.stream()
            .collect(Collectors.groupingBy(Transaction::getCategory));
        double totalAbs = list.stream()
            .mapToDouble(t -> t.getAmount() != null ? Math.abs(t.getAmount().doubleValue()) : 0.0)
            .sum();
        return catGroups.entrySet().stream()
            .map(e -> {
                double amount = e.getValue().stream().map(Transaction::getAmount).filter(Objects::nonNull).mapToDouble(BigDecimal::doubleValue).sum();
                int count = e.getValue().size();
                double sumAbs = e.getValue().stream().map(Transaction::getAmount).filter(Objects::nonNull).mapToDouble(a -> Math.abs(a.doubleValue())).sum();
                double percentage = totalAbs > 0 ? (sumAbs / totalAbs) * 100 : 0.0;
                return new CategorySummaryDto(e.getKey(), amount, count, percentage);
            })
            .sorted((a,b) -> Double.compare(Math.abs(b.getAmount()), Math.abs(a.getAmount())))
            .limit(limit)
            .collect(Collectors.toList());
    }

    private List<CategorySummaryDto> computeGlobalTopCategories(List<Transaction> txns) {
        return computeTopCategoriesForList(txns, 6);
    }

    private List<TransactionDto> computeRecentTransactions(List<Transaction> txns, int limit) {
        return txns.stream()
            .sorted((a,b) -> b.getDate().compareTo(a.getDate()))
            .limit(limit)
            .map(TransactionDto::fromEntity)
            .collect(Collectors.toList());
    }

    // =====================================================================
    // Monthly Aggregates
    // =====================================================================
    private double computeMonthlyIncome(List<Transaction> txns) {
        return txns.stream()
            .filter(t -> t.getAmount() != null && t.getAmount().compareTo(BigDecimal.ZERO) > 0)
            .map(Transaction::getAmount)
            .mapToDouble(BigDecimal::doubleValue)
            .sum();
    }

    private double computeMonthlyExpenses(List<Transaction> txns) {
        return txns.stream()
            .filter(t -> t.getAmount() != null && t.getAmount().compareTo(BigDecimal.ZERO) < 0)
            .map(Transaction::getAmount)
            .mapToDouble(BigDecimal::doubleValue)
            .sum();
    }

    // =====================================================================
    // Total Balance Logic
    // =====================================================================
    private double computeTotalBalance(BankMetrics metrics) {
        if (metrics.bankSources.isEmpty()) return 0.0;
        if (!metrics.multiBank) {
            // Single bank: take the balance map's only value
            return metrics.balanceByBank.values().stream().findFirst().orElse(0.0);
        }
        return metrics.balanceByBank.values().stream().mapToDouble(Double::doubleValue).sum();
    }

    // =====================================================================
    // CSV Export (unchanged)
    // =====================================================================
    public String exportCsv(String token) {
        User user = authenticationFacade.currentUser();
        List<Transaction> txns = transactionRepository.findByUserAndDateRange(user, null, null);
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
