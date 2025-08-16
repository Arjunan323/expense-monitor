package com.expensetracker.service.usage;

import com.expensetracker.model.Plan;
import com.expensetracker.model.Subscription;
import com.expensetracker.model.User;
import com.expensetracker.repository.PlanRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;


@Component
public class UsagePolicyFactory {

    private final PlanRepository planRepository;
    private final DefaultPolicies defaults;

    public UsagePolicyFactory(PlanRepository planRepository, DefaultPolicies defaults) {
        this.planRepository = planRepository;
        this.defaults = defaults;
    }

    public UsagePolicy forUser(User user) {
        Subscription sub = user.getSubscription();
        String planKey = (sub != null && sub.getPlanType() != null && "ACTIVE".equalsIgnoreCase(sub.getStatus()))
                ? sub.getPlanType().name()
                : "FREE";
        String currency = user.getCurrency() != null ? user.getCurrency() : "USD";
        Plan plan = findCached(planKey, currency);
        if (plan == null) {
            return defaults.map().getOrDefault(planKey, defaults.free());
        }
        return fromPlan(plan, sub);
    }

    @Cacheable(cacheNames = "plans:byTypeCurrency", key = "#planType + ':' + #currency", unless = "#result == null")
    public Plan findCached(String planType, String currency) {
        return planRepository.findByPlanTypeAndCurrency(planType, currency).orElse(null);
    }

    private UsagePolicy fromPlan(Plan plan, Subscription sub) {
        return new UsagePolicy() {
            @Override public String plan() { return plan.getPlanType(); }
            @Override public int statementLimit() { return plan.getStatementsPerMonth(); }
            @Override public int pagesPerStatement() { return plan.getPagesPerStatement(); }
            @Override public int combinedBankLimit() { return plan.getCombinedBank() != null ? plan.getCombinedBank() : defaults.map().get(plan.getPlanType()).combinedBankLimit(); }
            @Override public java.time.LocalDateTime startDate() {
                if (sub != null && "ACTIVE".equalsIgnoreCase(sub.getStatus())) {
                    return sub.getStartDate();
                }
                return null;
            }
            @Override public java.time.LocalDateTime endDate() {
                if (sub != null && "ACTIVE".equalsIgnoreCase(sub.getStatus())) {
                    return sub.getEndDate();
                }
                return null;
            }
        };
    }
}
