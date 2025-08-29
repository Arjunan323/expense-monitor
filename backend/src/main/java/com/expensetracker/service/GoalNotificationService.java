package com.expensetracker.service;

import com.expensetracker.model.Goal;
import com.expensetracker.model.User;
import com.expensetracker.repository.GoalRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.repository.UserNotificationPreferenceRepository;
import com.expensetracker.model.UserNotificationPreference;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class GoalNotificationService {
    private final GoalRepository goalRepository;
    private final UserRepository userRepository;
    private final EmailTemplateService templateService;
    private final EmailService emailService;
    private final EmailAuditService auditService;
    private final UserNotificationPreferenceRepository prefRepo;
    @Value("${app.mail.rate.goal-milestones-per-day:3}") private int milestonesPerDay;
    @Value("${app.mail.goal.inactivity-days:14}") private int inactivityDays;

    public GoalNotificationService(GoalRepository goalRepository, UserRepository userRepository, EmailTemplateService templateService, EmailService emailService, EmailAuditService auditService, UserNotificationPreferenceRepository prefRepo) {
        this.goalRepository = goalRepository; this.userRepository = userRepository; this.templateService = templateService; this.emailService = emailService; this.auditService = auditService; this.prefRepo = prefRepo;
    }

    @Scheduled(cron = "0 15 6 * * *") // daily 06:15
    public void dailyGoalChecks(){
        userRepository.findAll().forEach(u -> { try { processUser(u); } catch(Exception ignored){} });
    }

    private void processUser(User u){
        if(!prefEnabled(u, "GOAL_MILESTONE") && !prefEnabled(u, "GOAL_NUDGE")) return;
        List<Goal> goals = goalRepository.findByUser(u);
        goals.forEach(g-> maybeMilestone(u, g));
        goals.forEach(g-> maybeInactivity(u, g));
    }

    private void maybeMilestone(User u, Goal g){
        if(!prefEnabled(u, "GOAL_MILESTONE")) return;
        if(g.getTargetAmount()==null || g.getTargetAmount().compareTo(BigDecimal.ZERO)<=0) return;
        BigDecimal current = g.getCurrentAmount()==null? BigDecimal.ZERO: g.getCurrentAmount();
        int pct = current.multiply(BigDecimal.valueOf(100)).divide(g.getTargetAmount(), 0, java.math.RoundingMode.DOWN).intValue();
        int milestoneBucket = switch (pct){
            case 25,26,27,28,29 -> 25;
            case 50,51,52,53,54 -> 50;
            case 75,76,77,78,79 -> 75;
            case 100 -> 100;
            default -> -1;
        };
        if(milestoneBucket==-1) return;
        // rate limit: ensure not more than milestonesPerDay for user today
        long todayCount = auditService.recent(u, java.time.Instant.now().minus(java.time.Duration.ofHours(24))).stream().filter(a-> "GOAL_MILESTONE".equals(a.getType())).count();
        if(todayCount >= milestonesPerDay) return;
        // idempotency: include milestone in metadata signature (not implemented fully - would store hash in separate table). Basic suppression by checking recent emails containing goal title.
        boolean alreadySent = auditService.recent(u, java.time.Instant.now().minus(java.time.Duration.ofDays(30))).stream().anyMatch(a-> "GOAL_MILESTONE".equals(a.getType()) && a.getSubject()!=null && a.getSubject().contains(g.getTitle()));
        if(alreadySent) return;
        String html = templateService.renderGoalMilestone(g.getTitle(), milestoneBucket, current.toPlainString(), g.getTargetAmount().toPlainString());
    emailService.sendHtml(u.getEmail(), "Goal milestone: "+ g.getTitle() + " reached " + milestoneBucket + "%", html, "GOAL_MILESTONE");
    }

    private void maybeInactivity(User u, Goal g){
        if(!prefEnabled(u, "GOAL_NUDGE")) return;
        // Heuristic: updatedAt ~ last contribution
        LocalDateTime last = g.getUpdatedAt()!=null? g.getUpdatedAt(): g.getCreatedAt();
        if(last==null) return;
        if(last.isAfter(LocalDateTime.now().minusDays(inactivityDays))) return;
        boolean alreadyRecent = auditService.recent(u, java.time.Instant.now().minus(java.time.Duration.ofDays(inactivityDays))).stream().anyMatch(a-> "GOAL_NUDGE".equals(a.getType()) && a.getSubject()!=null && a.getSubject().contains(g.getTitle()));
        if(alreadyRecent) return;
        String html = templateService.renderGoalInactivity(g.getTitle(), inactivityDays);
    emailService.sendHtml(u.getEmail(), "Goal inactivity: "+g.getTitle(), html, "GOAL_NUDGE");
    }

    private boolean prefEnabled(User u, String type){
        return prefRepo.findByUserAndType(u, type).map(UserNotificationPreference::isEmailEnabled).orElse(true);
    }
}
