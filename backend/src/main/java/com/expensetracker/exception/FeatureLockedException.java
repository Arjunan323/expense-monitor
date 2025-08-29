package com.expensetracker.exception;

/**
 * Thrown when a user attempts to access a feature that is locked for their current plan.
 */
public class FeatureLockedException extends RuntimeException {
    public FeatureLockedException(String message){ super(message); }
}
