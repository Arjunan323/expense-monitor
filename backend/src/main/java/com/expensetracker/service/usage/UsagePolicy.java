package com.expensetracker.service.usage;

import java.time.LocalDateTime;

public interface UsagePolicy {
    String plan();
    int statementLimit(); // -1 for unlimited
    int pagesPerStatement();
    int combinedBankLimit();
    default boolean unlimitedStatements() { return statementLimit() < 0; }
    // Optional subscription window (null for FREE or non time-bound)
    default LocalDateTime startDate() { return null; }
    default LocalDateTime endDate() { return null; }
}
