package com.expensetracker.service;

import com.expensetracker.dto.UsageStatsDto;
import com.expensetracker.model.User;
import com.expensetracker.repository.RawStatementRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.usage.UsagePolicy;
import com.expensetracker.service.usage.UsagePolicyFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Optional;
import java.util.function.Supplier;

@Service
public class UserUsageService {

    private final UserRepository userRepository;
    private final RawStatementRepository rawStatementRepository;
    private final UsagePolicyFactory usagePolicyFactory;

    public UserUsageService(UserRepository userRepository, RawStatementRepository rawStatementRepository, UsagePolicyFactory usagePolicyFactory) {
        this.userRepository = userRepository;
        this.rawStatementRepository = rawStatementRepository;
        this.usagePolicyFactory = usagePolicyFactory;
    }

    public UsageStatsDto computeUsage(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return new UsageStatsDto(0, 3, "FREE", 0, 30, true, 2);
        }
        UsagePolicy policy = usagePolicyFactory.forUser(user);
        YearMonth now = YearMonth.now();
        LocalDateTime start = now.atDay(1).atStartOfDay();
        LocalDateTime end = now.atEndOfMonth().atTime(23,59,59);
        int statementsThisMonth = (int) rawStatementRepository.countByUserAndUploadDateBetween(user, start, end);
        int pagesThisMonth = safeInt(() -> rawStatementRepository.sumPagesByUserAndUploadDateBetween(user, start, end));
        boolean canUpload = policy.unlimitedStatements() || statementsThisMonth < policy.statementLimit();
        return new UsageStatsDto(statementsThisMonth, policy.statementLimit(), policy.plan(), pagesThisMonth, policy.pagesPerStatement(), canUpload, policy.combinedBankLimit());
    }

    private int safeInt(Supplier<Integer> supplier) {
        try { return Optional.ofNullable(supplier.get()).orElse(0); } catch (Exception e) { return 0; }
    }
}
