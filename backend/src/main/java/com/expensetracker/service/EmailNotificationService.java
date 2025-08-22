package com.expensetracker.service;

import com.expensetracker.model.SpendingAlert;
import com.expensetracker.model.User;
import com.expensetracker.model.UserNotificationPreference;
import com.expensetracker.repository.UserNotificationPreferenceRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.math.BigDecimal;
import java.time.YearMonth;

@Service
@Transactional
public class EmailNotificationService {
    private final UserNotificationPreferenceRepository prefRepo;
    private final EmailService emailService;
    private final EmailTemplateService templateService;
    private final EmailAuditService auditService;
    @Value("${app.mail.rate.spending-alerts-per-hour:5}") private int spendingAlertsPerHour;

    public EmailNotificationService(UserNotificationPreferenceRepository prefRepo,
                                    EmailService emailService,
                                    EmailTemplateService templateService,
                                    EmailAuditService auditService) {
        this.prefRepo = prefRepo; this.emailService = emailService; this.templateService = templateService; this.auditService = auditService;
    }

    @Value("${app.mail.low-balance.threshold:-200}") private BigDecimal defaultLowBalanceThreshold; // default negative threshold
    @Value("${app.mail.rate.low-balance-per-day:1}") private int lowBalancePerDay;

    public void maybeSendLowBalance(User user, YearMonth month, BigDecimal projectedNet, BigDecimal userThreshold){
        if(!isEnabled(user, "LOW_BALANCE")) return;
        BigDecimal threshold = userThreshold!=null? userThreshold: defaultLowBalanceThreshold;
        if(projectedNet.compareTo(threshold) >= 0) return; // not below threshold
        long recent = auditService.recent(user, Instant.now().minus(java.time.Duration.ofHours(24))).stream().filter(a->"LOW_BALANCE".equals(a.getType())).count();
        if(recent >= lowBalancePerDay) return;
        String html = templateService.renderLowBalance(month.toString(), projectedNet.toPlainString(), threshold.toPlainString());
    emailService.sendHtml(user.getEmail(), "Low balance warning: "+month, html, "LOW_BALANCE");
    }

    public void maybeSendSpendingAlert(SpendingAlert alert){
        User u = alert.getUser();
        if(!isEnabled(u, "SPENDING_ALERT")) return;
        // Rate limit by audit count past hour
        long countLastHour = auditService.recentCount(u, "SPENDING_ALERT", Instant.now().minus(1, ChronoUnit.HOURS));
        if(countLastHour >= spendingAlertsPerHour) return;
        String amount = alert.getAmount()!=null? alert.getAmount().toPlainString(): "";
        String date = alert.getTxnDate()!=null? alert.getTxnDate().toString(): "";
        String html = templateService.renderSpendingAlert(
                alert.getTitle()!=null? alert.getTitle(): "Spending Alert",
                alert.getDescription()!=null? alert.getDescription(): "",
                alert.getCategory(),
                alert.getMerchant(),
                amount,
                date,
                alert.getSeverity()
        );
    emailService.sendHtml(u.getEmail(), alert.getTitle()!=null? alert.getTitle(): "Spending Alert", html, "SPENDING_ALERT");
    }

    private boolean isEnabled(User u, String type){
        return prefRepo.findByUserAndType(u, type).map(UserNotificationPreference::isEmailEnabled).orElse(true);
    }
}
