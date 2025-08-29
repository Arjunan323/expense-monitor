package com.expensetracker.security;

import java.lang.annotation.*;

/**
 * Generic plan requirement annotation. Use level() to specify the minimum required tier.
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequiresPlan {
    PlanTier level() default PlanTier.PRO; // default paid (PRO) unless overridden
}
