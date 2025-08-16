package com.expensetracker.service.usage;

import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class DefaultPolicies {
    // Basic defaults when DB plan row missing combinedBank etc. (no fixed subscription window; counts evaluated per calendar month)
    public UsagePolicy free() { return simple("FREE",3,10,2); }
    public UsagePolicy pro() { return simple("PRO",10,25,3); }
    public UsagePolicy premium() { return simple("PREMIUM",-1,50,5); }

    private UsagePolicy simple(String plan, int statements, int pages, int combined) {
        return new UsagePolicy() {
            public String plan() { return plan; }
            public int statementLimit() { return statements; }
            public int pagesPerStatement() { return pages; }
            public int combinedBankLimit() { return combined; }
            // Free/pro/premium defaults have rolling monthly limits; no fixed subscription window here
        };
    }

    public Map<String, UsagePolicy> map() {
        return Map.of(
                "FREE", free(),
                "PRO", pro(),
                "PREMIUM", premium()
        );
    }
}
