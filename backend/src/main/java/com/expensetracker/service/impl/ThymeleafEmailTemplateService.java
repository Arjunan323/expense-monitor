package com.expensetracker.service.impl;

import com.expensetracker.service.EmailTemplateService;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.HashMap;
import java.util.Map;

@Service
public class ThymeleafEmailTemplateService implements EmailTemplateService {
    private final TemplateEngine templateEngine;
    public ThymeleafEmailTemplateService(TemplateEngine templateEngine){ this.templateEngine = templateEngine; }
    @Override
    public String render(String templateName, Map<String, Object> model) {
        Context ctx = new Context();
        if(model!=null) model.forEach(ctx::setVariable);
        return templateEngine.process("email/"+templateName, ctx);
    }

    @Override
    public String renderThemed(String templateName, String subject, String tag, Map<String, Object> model) {
        String body = render(templateName, model);
        Map<String,Object> wrapper = new HashMap<>();
        wrapper.put("subject", subject);
        wrapper.put("body", body);
        if(tag!=null) wrapper.put("tag", tag);
        return render("fragments/base", wrapper); // base html wrapper
    }

    @Override
    public String renderVerification(String firstName, String verificationLink, int ttlMinutes) {
        Map<String,Object> vars = Map.of(
                "firstName", firstName,
                "verificationLink", verificationLink,
                "ttlMinutes", ttlMinutes
        );
        return renderThemed("verification", "Verify your email", "ACTION", vars);
    }

    @Override
    public String renderPasswordReset(String resetLink, int ttlMinutes) {
        Map<String,Object> vars = Map.of(
                "resetLink", resetLink,
                "ttlMinutes", ttlMinutes
        );
        return renderThemed("password-reset", "Password reset request", "SECURITY", vars);
    }

    @Override
    public String renderGoalProgress(String goalName, int progressPercent) {
        Map<String,Object> vars = Map.of(
                "goalName", goalName,
                "progressPercent", progressPercent
        );
        return renderThemed("goal-progress", "Goal progress update", "GOAL", vars);
    }

    @Override
    public String renderSpendingAlert(String title, String description, String category, String merchant, String amount, String date, String severity) {
        Map<String,Object> vars = new HashMap<>();
        vars.put("title", title);
        vars.put("description", description);
        vars.put("category", category);
        vars.put("merchant", merchant);
        vars.put("amount", amount);
        vars.put("date", date);
        vars.put("severity", severity);
        return renderThemed("spending-alert", title, severity!=null? severity.toUpperCase(): "ALERT", vars);
    }

    @Override
    public String renderWelcome(String firstName) {
        Map<String,Object> vars = Map.of("firstName", firstName);
        return renderThemed("welcome", "Welcome to CutTheSpend", "WELCOME", vars);
    }

    @Override
    public String renderGoalMilestone(String goalName, int milestonePercent, String currentAmount, String targetAmount) {
        Map<String,Object> vars = new HashMap<>();
        vars.put("goalName", goalName);
        vars.put("milestonePercent", milestonePercent);
        vars.put("currentAmount", currentAmount);
        vars.put("targetAmount", targetAmount);
        return renderThemed("goal-milestone", "Goal milestone reached", "GOAL", vars);
    }

    @Override
    public String renderGoalInactivity(String goalName, int days) {
        Map<String,Object> vars = Map.of("goalName", goalName, "days", days);
        return renderThemed("goal-inactivity", "Goal inactivity nudge", "NUDGE", vars);
    }

    @Override
    public String renderLowBalance(String month, String projectedNet, String threshold) {
        Map<String,Object> vars = new HashMap<>();
        vars.put("month", month);
        vars.put("projectedNet", projectedNet);
        vars.put("threshold", threshold);
        return renderThemed("low-balance", "Low balance warning", "BALANCE", vars);
    }
}
