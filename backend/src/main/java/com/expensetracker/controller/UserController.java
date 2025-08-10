
package com.expensetracker.controller;
import com.expensetracker.dto.UsageStatsDto;
import com.expensetracker.repository.RawStatementRepository;
import com.expensetracker.model.Subscription;
import com.expensetracker.repository.PlanRepository;
import com.expensetracker.model.Plan;
import java.time.YearMonth;
import java.time.LocalDateTime;


import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import com.expensetracker.dto.UserStatusDto;
import com.expensetracker.dto.PreferencesDto;
import com.expensetracker.dto.UserProfileDto;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.model.User;
import com.expensetracker.config.JwtUtil;

@RestController
@RequestMapping("/user")
public class UserController {
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final RawStatementRepository rawStatementRepository;
    private final PlanRepository planRepository;

    public UserController(UserRepository userRepository, JwtUtil jwtUtil, RawStatementRepository rawStatementRepository, PlanRepository planRepository) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.rawStatementRepository = rawStatementRepository;
        this.planRepository = planRepository;
    }

    @GetMapping("/usage")
    public UsageStatsDto getUsage(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String username = jwtUtil.extractUsername(token);
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return new UsageStatsDto(0, 3, "FREE", 0, 30, true);
        }

        Subscription sub = user.getSubscription();
        String planType = "FREE";
        int statementLimit = 3;
        int pageLimit = 10;
        if (sub != null && sub.getPlanType() != null && "ACTIVE".equals(sub.getStatus())) {
            planType = sub.getPlanType().name();
            // Lookup plan limits from Plan entity
            String region = user.getLocale() != null && user.getLocale().contains("IN") ? "IN" : "IN"; // Default to IN, adjust as needed
            Plan plan = planRepository.findByPlanTypeAndRegion(planType, region).orElse(null);
            if (plan != null) {
                statementLimit = plan.getStatementsPerMonth();
                pageLimit = plan.getPagesPerStatement();
            }
        }

        // Count statements/pages for current month
        YearMonth now = YearMonth.now();
        LocalDateTime start = now.atDay(1).atStartOfDay();
        LocalDateTime end = now.atEndOfMonth().atTime(23,59,59);
        int statementsThisMonth = (int) rawStatementRepository.countByUserAndUploadDateBetween(user, start, end);
        int pagesThisMonth = 0;
        try {
            pagesThisMonth = rawStatementRepository.sumPagesByUserAndUploadDateBetween(user, start, end);
        } catch (Exception e) {
            pagesThisMonth = 0;
        }

        boolean canUpload = statementLimit == -1 || statementsThisMonth < statementLimit;
        return new UsageStatsDto(statementsThisMonth, statementLimit, planType, pagesThisMonth, pageLimit, canUpload);
    }

    @GetMapping("/status")
    public UserStatusDto getStatus(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String username = jwtUtil.extractUsername(token);
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            boolean isSubscribed = false;
            String planType = "FREE";
            String status = "INACTIVE";
            if (user.getSubscription() != null && user.getSubscription().getStatus() != null && user.getSubscription().getStatus().equals("ACTIVE")) {
                isSubscribed = true;
                planType = user.getSubscription().getPlanType().name();
                status = user.getSubscription().getStatus();
            }
            return new UserStatusDto(isSubscribed, planType, status);
        }
        return new UserStatusDto("User not found");
    }

    @GetMapping("/preferences")
    public PreferencesDto getPreferences(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String username = jwtUtil.extractUsername(token);
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            return new PreferencesDto(user.getCurrency(), user.getLocale());
        }
        return new PreferencesDto("USD", "en-US");
    }

    @PostMapping("/preferences")
    public UserStatusDto updatePreferences(@RequestHeader("Authorization") String authHeader, @RequestBody PreferencesDto prefs) {
        String token = authHeader.replace("Bearer ", "");
        String username = jwtUtil.extractUsername(token);
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            user.setCurrency(prefs.getCurrency());
            user.setLocale(prefs.getLocale());
            userRepository.save(user);
            return new UserStatusDto(true);
        }
        return new UserStatusDto("User not found");
    }

     @GetMapping("/profile")
    public UserProfileDto getProfile(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String username = jwtUtil.extractUsername(token);
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            return new UserProfileDto(user.getFirstName(), user.getLastName(), user.getEmail());
        }
        throw new UsernameNotFoundException("User not found");
    }

    @PutMapping("/profile")
    public UserProfileDto updateProfile(@RequestHeader("Authorization") String authHeader, @RequestBody UserProfileDto profile) {
        String token = authHeader.replace("Bearer ", "");
        String username = jwtUtil.extractUsername(token);
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            user.setFirstName(profile.getFirstName());
            user.setLastName(profile.getLastName());
            user.setEmail(profile.getEmail());
            userRepository.save(user);
            return new UserProfileDto(user.getFirstName(), user.getLastName(), user.getEmail());
        }
        throw new UsernameNotFoundException("User not found");
    }
}
