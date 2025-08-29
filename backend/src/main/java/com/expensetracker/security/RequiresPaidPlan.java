package com.expensetracker.security;

import java.lang.annotation.*;

/**
 * Marks a controller (class or method) as requiring a paid subscription (non-FREE plan).
 * Applied via {@link PlanAccessAspect}.
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequiresPaidPlan {
}
