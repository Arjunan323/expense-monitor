package com.expensetracker.service;

import java.util.Map;

public interface EmailTemplateService {
    /** Render a raw template (no wrapping). Template path relative to templates/email */
    String render(String templateName, Map<String,Object> model);

    /** Render inside base fragment wrapper providing subject + optional tag (badge). */
    String renderThemed(String templateName, String subject, String tag, Map<String,Object> model);

    /** Convenience methods for common emails */
    String renderVerification(String firstName, String verificationLink, int ttlMinutes);
    String renderPasswordReset(String resetLink, int ttlMinutes);
    String renderGoalProgress(String goalName, int progressPercent);

    String renderSpendingAlert(String title, String description, String category, String merchant, String amount, String date, String severity);
    String renderWelcome(String firstName);
    String renderGoalMilestone(String goalName, int milestonePercent, String currentAmount, String targetAmount);
    String renderGoalInactivity(String goalName, int days);
    String renderLowBalance(String month, String projectedNet, String threshold);
}
