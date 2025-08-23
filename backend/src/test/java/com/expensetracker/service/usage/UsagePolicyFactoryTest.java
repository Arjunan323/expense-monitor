package com.expensetracker.service.usage;

import com.expensetracker.model.Plan;
import com.expensetracker.model.Subscription;
import com.expensetracker.model.User;
import com.expensetracker.repository.PlanRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

public class UsagePolicyFactoryTest {

    @Test
    void freeUserFallsBackToDefaults() {
        PlanRepository planRepository = Mockito.mock(PlanRepository.class);
        DefaultPolicies defaults = new DefaultPolicies();
        UsagePolicyFactory factory = new UsagePolicyFactory(planRepository, defaults);
        User user = new User();
        UsagePolicy policy = factory.forUser(user);
        assertEquals("FREE", policy.plan());
        assertEquals(3, policy.statementLimit());
    }

    @Test
    void activeSubscriptionUsesPlanRepository() {
        PlanRepository planRepository = Mockito.mock(PlanRepository.class);
        DefaultPolicies defaults = new DefaultPolicies();
        UsagePolicyFactory factory = new UsagePolicyFactory(planRepository, defaults);

        User user = new User();
        Subscription sub = new Subscription();
        sub.setPlanType(Subscription.PlanType.PRO);
        sub.setStatus("ACTIVE");
        user.setSubscription(sub);
        user.setCurrency("USD");

        Plan plan = new Plan();
        plan.setPlanType("PRO");
        plan.setPagesPerStatement(99);
        plan.setStatementsPerMonth(77);
        plan.setCombinedBank(9);

        // Factory will query with billingPeriod based on inferred duration; with no dates set it defaults to MONTHLY
        Mockito.when(planRepository.findByPlanTypeAndCurrencyAndBillingPeriod("PRO", "USD", "MONTHLY")).thenReturn(Optional.of(plan));

        UsagePolicy policy = factory.forUser(user);
        assertEquals("PRO", policy.plan());
        assertEquals(77, policy.statementLimit());
        assertEquals(99, policy.pagesPerStatement());
        assertEquals(9, policy.combinedBankLimit());
    }
}
