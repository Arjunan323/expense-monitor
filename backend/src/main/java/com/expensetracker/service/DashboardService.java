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

    @Autowired
    private final AuthenticationFacade authenticationFacade;

    public DashboardService(TransactionRepository transactionRepository, UserRepository userRepository, AuthenticationFacade authenticationFacade) {
        this.transactionRepository = transactionRepository;
        this.authenticationFacade = authenticationFacade;
    }


    public DashboardStatsDto getSummary(String token, String startDateStr, String endDateStr, String banksCsv) {
    User user = authenticationFacade.currentUser();

    java.time.LocalDate startDate = (startDateStr != null && !startDateStr.isEmpty()) ? java.time.LocalDate.parse(startDateStr) : null;
    java.time.LocalDate endDate = (endDateStr != null && !endDateStr.isEmpty()) ? java.time.LocalDate.parse(endDateStr) : null;
    List<String> banks = null;
    if (banksCsv != null && !banksCsv.isBlank()) {
        banks = Arrays.stream(banksCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .toList();
    }
    // Specification with banks + date filtering
    List<Transaction> txnsRaw = transactionRepository.findAll(
        com.expensetracker.repository.TransactionSpecifications.filter(
            user,
            banks, // banks filter
            null, // categories
            startDate,
            endDate,
            null, // amountMin
            null, // amountMax
            null, // transactionType
            null  // description
        )
    );
    // Deduplicate transactions in-memory in case multiple overlapping statements were uploaded.
    // Primary key: txnHash (if populated). Fallback composite (date|amount|balance|description|bankName).
    List<Transaction> txns = dedupe(txnsRaw);

        String planType = AppConstants.PLAN_FREE;
        if (user.getSubscription() != null && AppConstants.STATUS_ACTIVE.equals(user.getSubscription().getStatus())) {
            planType = user.getSubscription().getPlanType().name();
        }

        Map<String, List<Transaction>> bankGroups = txns.stream()
            .collect(Collectors.groupingBy(t -> t.getBankName() != null ? t.getBankName() : AppConstants.UNKNOWN));
        List<String> bankSources = new ArrayList<>(bankGroups.keySet());
        boolean isMultiBank = bankSources.size() > 1; // keep semantic for client UI toggles
        boolean hasBalanceDiscrepancy = isMultiBank;
        String lastUpdateTime = txns.stream().map(Transaction::getDate).max(java.util.Comparator.naturalOrder()).map(java.time.LocalDate::toString).orElse("");

    // We'll compute totalBalance after per-bank balances are derived; init here
    double totalBalance = 0.0;
        // Monthly income/expenses: use the already filtered txns (date range provided by caller)
        BigDecimal monthlyIncomeBD = txns.stream()
            .filter(t -> t.getAmount() != null && t.getAmount().compareTo(BigDecimal.ZERO) > 0)
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal monthlyExpensesBD = txns.stream()
            .filter(t -> t.getAmount() != null && t.getAmount().compareTo(BigDecimal.ZERO) < 0)
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        double monthlyIncome = monthlyIncomeBD.doubleValue();
        double monthlyExpenses = monthlyExpensesBD.doubleValue();
        int transactionCount = txns.size();

        // Per-bank aggregates
        Map<String, Integer> transactionCountByBank = new HashMap<>();
    Map<String, Double> balanceByBank = new HashMap<>();
    Map<String, Double> incomeByBank = new HashMap<>();
    Map<String, Double> expensesByBank = new HashMap<>();
        Map<String, List<CategorySummaryDto>> topCategoriesByBank = new HashMap<>();
        for (Map.Entry<String, List<Transaction>> entry : bankGroups.entrySet()) {
            String bank = entry.getKey();
            // Deduplicate again per-bank (cheap) to ensure any bank-specific duplicates are removed
            List<Transaction> list = dedupe(entry.getValue());
            transactionCountByBank.put(bank, list.size());
            // Latest balance for that bank (same logic as total) – assume sorted by date desc
            double bankBalance = list.stream()
                .sorted((a,b)-> {
                    int cmp = b.getDate().compareTo(a.getDate());
                    if (cmp == 0) return Long.compare(b.getId(), a.getId());
                    return cmp;
                })
                .map(t -> t.getBalance() != null ? t.getBalance().doubleValue() : 0.0)
                .findFirst().orElse(0.0);
            balanceByBank.put(bank, bankBalance);
            double inc = list.stream().filter(t -> t.getAmount() != null && t.getAmount().compareTo(BigDecimal.ZERO) > 0)
                .map(Transaction::getAmount).mapToDouble(BigDecimal::doubleValue).sum();
            double exp = list.stream().filter(t -> t.getAmount() != null && t.getAmount().compareTo(BigDecimal.ZERO) < 0)
                .map(Transaction::getAmount).mapToDouble(BigDecimal::doubleValue).sum();
            incomeByBank.put(bank, inc);
            expensesByBank.put(bank, exp);
            // Top categories per bank
            Map<String, List<Transaction>> catGroups = list.stream().collect(Collectors.groupingBy(Transaction::getCategory));
            double bankTotalAbs = list.stream().mapToDouble(t -> t.getAmount() != null ? Math.abs(t.getAmount().doubleValue()) : 0.0).sum();
            List<CategorySummaryDto> perBankCats = catGroups.entrySet().stream()
                .map(e -> {
                    double amount = e.getValue().stream().map(Transaction::getAmount).filter(Objects::nonNull).mapToDouble(BigDecimal::doubleValue).sum();
                    int count = e.getValue().size();
                    double sumAbs = e.getValue().stream().map(Transaction::getAmount).filter(Objects::nonNull).mapToDouble(a -> Math.abs(a.doubleValue())).sum();
                    double percentage = bankTotalAbs > 0 ? (sumAbs / bankTotalAbs) * 100 : 0.0;
                    return new CategorySummaryDto(e.getKey(), amount, count, percentage);
                })
                .sorted((a,b)-> Double.compare(Math.abs(b.getAmount()), Math.abs(a.getAmount())))
                .limit(6)
                .collect(Collectors.toList());
            topCategoriesByBank.put(bank, perBankCats);
        }

        // Total balance logic:
        // If only one bank, preserve legacy behavior: latest balance transaction overall.
        // If multiple banks, sum latest balance per bank to reflect combined holdings.
        if (!bankGroups.isEmpty()) {
        if (bankGroups.size() == 1) {
        // Single bank scenario (may include multiple uploaded statements for the SAME bank).
        // We don't sum balances (would double count). We pick the most recent transaction's balance
        // across all that bank's transactions (latest date, then highest id as tie‑breaker) so
        // overlapping / older statements do not distort the current balance.
        List<Transaction> onlyBankTxns = bankGroups.values().iterator().next();
        java.util.Comparator<Transaction> latestComparator = java.util.Comparator
            .comparing(Transaction::getDate)
            .thenComparing(Transaction::getId);
        totalBalance = onlyBankTxns.stream()
            .filter(t -> t.getBalance() != null)
            .max(latestComparator)
            .map(t -> t.getBalance().doubleValue())
            .orElse(0.0);
            } else {
                totalBalance = balanceByBank.values().stream().mapToDouble(Double::doubleValue).sum();
            }
        }

        Map<String, List<Transaction>> categoryGroups = txns.stream().collect(Collectors.groupingBy(Transaction::getCategory));
    double totalAbs = txns.stream().mapToDouble(t -> t.getAmount() != null ? Math.abs(t.getAmount().doubleValue()) : 0.0).sum();
    List<CategorySummaryDto> topCategories = categoryGroups.entrySet().stream()
            .map(e -> {
                double amount = e.getValue().stream().map(Transaction::getAmount).filter(Objects::nonNull).mapToDouble(BigDecimal::doubleValue).sum();
                int count = e.getValue().size();
                double sumAbs = e.getValue().stream().map(Transaction::getAmount).filter(Objects::nonNull).mapToDouble(a -> Math.abs(a.doubleValue())).sum();
                double percentage = totalAbs > 0 ? (sumAbs / totalAbs) * 100 : 0.0;
                return new CategorySummaryDto(e.getKey(), amount, count, percentage);
            })
            .sorted((a, b) -> Double.compare(Math.abs(b.getAmount()), Math.abs(a.getAmount())))
            .limit(6)
            .collect(Collectors.toList());

    List<TransactionDto> recentTransactions = txns.stream()
            .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
            .limit(5)
            .map(TransactionDto::fromEntity)
            .collect(Collectors.toList());

        boolean advancedAnalyticsLocked = false;
        String upgradePrompt = null;
        if (AppConstants.PLAN_FREE.equals(planType)) {
            hasBalanceDiscrepancy = false;
            advancedAnalyticsLocked = true;
            upgradePrompt = AppConstants.UPGRADE_PROMPT;
        }

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
            upgradePrompt,
            transactionCountByBank,
            balanceByBank,
            incomeByBank,
            expensesByBank,
            topCategoriesByBank
        );
    }

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

    /**
     * Deduplicate transactions (handles overlapping statement uploads). Prefers txnHash uniqueness when present.
     */
    private List<Transaction> dedupe(List<Transaction> input) {
        if (input == null || input.size() < 2) return input == null ? java.util.Collections.emptyList() : input;
        Map<String, Transaction> seen = new LinkedHashMap<>();
        for (Transaction t : input) {
            if (t == null) continue;
            String key = null;
            try {
                java.lang.reflect.Field f = t.getClass().getDeclaredField("txnHash");
                f.setAccessible(true);
                Object hv = f.get(t);
                if (hv instanceof String s && !s.isBlank()) {
                    key = "H|" + s;
                }
            } catch (Exception ignored) { /* field absent */ }
            if (key == null) {
                key = "C|" + (t.getDate() != null ? t.getDate().toString() : "") + "|" +
                        (t.getAmount() != null ? t.getAmount().toPlainString() : "") + "|" +
                        (t.getBalance() != null ? t.getBalance().toPlainString() : "") + "|" +
                        (t.getDescription() != null ? t.getDescription() : "") + "|" +
                        (t.getBankName() != null ? t.getBankName() : "");
            }
            // Keep the first occurrence (earliest in current ordering) – assumes repository order roughly insertion / id asc.
            seen.putIfAbsent(key, t);
        }
        return new ArrayList<>(seen.values());
    }
}
