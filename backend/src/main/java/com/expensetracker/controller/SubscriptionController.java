package com.expensetracker.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.repository.RawStatementRepository;
import com.expensetracker.model.User;
import com.expensetracker.model.Subscription;
import com.expensetracker.dto.SubscriptionStatusDto;
import java.time.LocalDateTime;


@RestController
@RequestMapping("/subscription")

public class SubscriptionController {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RawStatementRepository rawStatementRepository;

    @GetMapping("/status")
    public SubscriptionStatusDto getStatus(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String username = new com.expensetracker.config.JwtUtil().extractUsername(token);
        User user = userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException(username));
        Subscription sub = user.getSubscription();
        String planType = "FREE";
        String status = "ACTIVE";
        LocalDateTime startDate = null;
        LocalDateTime endDate = null;
        int statementLimit = 3, pageLimit = 30;
        if (sub != null) {
            planType = sub.getPlanType().name();
            status = sub.getStatus();
            startDate = sub.getStartDate();
            endDate = sub.getEndDate();
            if (sub.getPlanType() == Subscription.PlanType.PRO) {
                statementLimit = 5; pageLimit = 50;
            } else if (sub.getPlanType() == Subscription.PlanType.PREMIUM) {
                statementLimit = Integer.MAX_VALUE; pageLimit = 100; // or Integer.MAX_VALUE for unlimited
            }
        }
        // Calculate statementsUsed/pagesUsed for current month
        java.time.LocalDateTime monthStart = java.time.LocalDate.now().withDayOfMonth(1).atStartOfDay();
        java.time.LocalDateTime monthEnd = java.time.LocalDate.now().plusMonths(1).withDayOfMonth(1).atStartOfDay().minusSeconds(1);
        int statementsUsed = (int) rawStatementRepository.countByUserAndUploadDateBetween(user, monthStart, monthEnd);
        int pagesUsed = 0;
        try {
            pagesUsed = rawStatementRepository.sumPagesByUserAndUploadDateBetween(user, monthStart, monthEnd);
        } catch (Exception e) {
            pagesUsed = 0;
        }
        boolean canUpload = (statementLimit == Integer.MAX_VALUE || statementsUsed < statementLimit);
        String upgradeUrl = "/subscription/upgrade";
        return new SubscriptionStatusDto(planType, startDate, endDate, status, statementsUsed, statementLimit, pagesUsed, pageLimit, canUpload, upgradeUrl);
    }
}
