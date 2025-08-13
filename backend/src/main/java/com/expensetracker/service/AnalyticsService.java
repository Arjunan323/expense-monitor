package com.expensetracker.service;

import com.expensetracker.config.JwtUtil;
import com.expensetracker.dto.AnalyticsSummaryDto;
import com.expensetracker.model.Transaction;
import com.expensetracker.model.User;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.TransactionSpecifications;
import com.expensetracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;

    public AnalyticsSummaryDto getSummary(String token, String startDate, String endDate) {
        String username = jwtUtil.extractUsername(token);
        User user = userRepository.findByUsername(username).orElseThrow();
        LocalDate start = (startDate != null && !startDate.isBlank()) ? LocalDate.parse(startDate) : LocalDate.now().minusMonths(3).withDayOfMonth(1);
        LocalDate end = (endDate != null && !endDate.isBlank()) ? LocalDate.parse(endDate) : LocalDate.now();

        Specification<Transaction> spec = TransactionSpecifications.filter(user, null, null, start, end, null, null, null, null);
        List<Transaction> txns = transactionRepository.findAll(spec);

        double totalInflow = txns.stream().filter(t -> t.getAmount() != null && t.getAmount() > 0).mapToDouble(Transaction::getAmount).sum();
        double totalOutflow = txns.stream().filter(t -> t.getAmount() != null && t.getAmount() < 0).mapToDouble(Transaction::getAmount).sum();
        double net = totalInflow + totalOutflow; // outflow negative

        Map<String, Double> monthly = new TreeMap<>();
        for (Transaction t : txns) {
            if (t.getDate() == null || t.getAmount() == null) continue;
            YearMonth ym = YearMonth.from(t.getDate());
            monthly.merge(ym.toString(), t.getAmount(), Double::sum);
        }

        Map<String, CategoryAgg> catAgg = new HashMap<>();
        for (Transaction t : txns) {
            if (t.getAmount() == null) continue;
            String cat = t.getCategory() != null ? t.getCategory() : "Uncategorized";
            CategoryAgg agg = catAgg.computeIfAbsent(cat, c -> new CategoryAgg());
            agg.amount += t.getAmount();
            agg.count++;
        }
        List<AnalyticsSummaryDto.CategorySpend> topCategories = catAgg.entrySet().stream()
                .map(e -> new AnalyticsSummaryDto.CategorySpend(e.getKey(), e.getValue().amount, e.getValue().count))
                .sorted((a,b) -> Double.compare(Math.abs(b.getAmount()), Math.abs(a.getAmount())))
                .limit(8).collect(Collectors.toList());

        long distinctDays = txns.stream().filter(t -> t.getDate() != null).map(Transaction::getDate).distinct().count();
        double avgDailySpend = distinctDays > 0 ? Math.abs(totalOutflow) / distinctDays : 0.0;

        return new AnalyticsSummaryDto(topCategories, totalInflow, totalOutflow, net, monthly, avgDailySpend);
    }

    private static class CategoryAgg { double amount = 0; long count = 0; }
}
