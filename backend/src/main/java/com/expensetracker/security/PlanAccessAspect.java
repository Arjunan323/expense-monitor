package com.expensetracker.security;

import com.expensetracker.exception.FeatureLockedException;
import com.expensetracker.model.User;
import com.expensetracker.util.AppConstants;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

/**
 * Simple AOP enforcement for @RequiresPaidPlan.
 * Keeps logic centralized so we don't duplicate plan checks in every controller.
 */
@Aspect
@Component
public class PlanAccessAspect {

    private final AuthenticationFacade authenticationFacade;

    public PlanAccessAspect(AuthenticationFacade authenticationFacade) {
        this.authenticationFacade = authenticationFacade;
    }

    @Before("@within(com.expensetracker.security.RequiresPaidPlan) || @annotation(com.expensetracker.security.RequiresPaidPlan) || @within(com.expensetracker.security.RequiresPlan) || @annotation(com.expensetracker.security.RequiresPlan)")
    public void ensurePlan(JoinPoint jp) {
        User u = authenticationFacade.currentUser();
        String plan = AppConstants.PLAN_FREE;
        if (u.getSubscription() != null && AppConstants.STATUS_ACTIVE.equalsIgnoreCase(u.getSubscription().getStatus())) {
            plan = u.getSubscription().getPlanType().name();
        }
        PlanTier userTier = switch (plan) { case "PREMIUM" -> PlanTier.PREMIUM; case "PRO" -> PlanTier.PRO; default -> PlanTier.FREE; };

        // Determine required tier
        PlanTier required = null;
        MethodSignature ms = (MethodSignature) jp.getSignature();
        if (ms.getMethod().isAnnotationPresent(RequiresPlan.class)) {
            required = ms.getMethod().getAnnotation(RequiresPlan.class).level();
        } else if (jp.getTarget().getClass().isAnnotationPresent(RequiresPlan.class)) {
            required = jp.getTarget().getClass().getAnnotation(RequiresPlan.class).level();
        } else if (ms.getMethod().isAnnotationPresent(RequiresPaidPlan.class) || jp.getTarget().getClass().isAnnotationPresent(RequiresPaidPlan.class)) {
            required = PlanTier.PRO; // legacy annotation means at least PRO
        }
        if (required != null && userTier.ordinal() < required.ordinal()) {
            String msg = switch (required) {
                case PRO -> "Upgrade to Pro or Premium to access this feature.";
                case PREMIUM -> "Upgrade to Premium to access this feature.";
                default -> AppConstants.UPGRADE_PROMPT;
            };
            throw new FeatureLockedException(msg);
        }
    }
}
