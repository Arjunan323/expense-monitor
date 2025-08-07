package com.expensetracker.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.model.Transaction;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import com.expensetracker.dto.DashboardStatsDto;
import com.expensetracker.dto.CategorySummaryDto;
import com.expensetracker.dto.TransactionDto;
import java.util.stream.Collectors;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.model.User;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {
    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/summary")
    public DashboardStatsDto getSummary(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String username = new com.expensetracker.config.JwtUtil().extractUsername(token);
        User user = userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException(username));
        List<Transaction> txns = transactionRepository.findAll().stream()
            .filter(t -> t.getUser() != null && t.getUser().getId().equals(user.getId()))
            .toList();

        double totalBalance = txns.stream().mapToDouble(Transaction::getBalance).reduce((first, second) -> second).orElse(0.0);
        double monthlyIncome = txns.stream().filter(t -> t.getAmount() > 0 && t.getDate().getMonthValue() == java.time.LocalDate.now().getMonthValue()).mapToDouble(Transaction::getAmount).sum();
        double monthlyExpenses = txns.stream().filter(t -> t.getAmount() < 0 && t.getDate().getMonthValue() == java.time.LocalDate.now().getMonthValue()).mapToDouble(Transaction::getAmount).sum();
        int transactionCount = txns.size();

        // Top categories with count and percentage
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

        // Recent transactions (latest 5)
        List<TransactionDto> recentTransactions = txns.stream()
            .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
            .limit(5)
            .map(t -> new TransactionDto(
                t.getId(),
                t.getDate(),
                t.getDescription(),
                t.getAmount(),
                t.getBalance(),
                t.getCategory()
            ))
            .collect(Collectors.toList());

        return new DashboardStatsDto(
            totalBalance,
            monthlyIncome,
            monthlyExpenses,
            transactionCount,
            topCategories,
            recentTransactions
        );
    }

    @GetMapping("/export")
    public String exportCsv(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String username = new com.expensetracker.config.JwtUtil().extractUsername(token);
        User user = userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException(username));
        List<Transaction> txns = transactionRepository.findAll().stream()
            .filter(t -> t.getUser() != null && t.getUser().getId().equals(user.getId()))
            .toList();
        StringBuilder csv = new StringBuilder("date,description,amount,balance,category\n");
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
