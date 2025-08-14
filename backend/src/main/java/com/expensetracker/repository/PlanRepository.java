package com.expensetracker.repository;

import com.expensetracker.model.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PlanRepository extends JpaRepository<Plan, Long> {
    Optional<Plan> findByPlanType(String planType);
    Optional<Plan> findByPlanTypeAndCurrency(String planType, String currency);
    java.util.List<Plan> findByRegion(String region);
}
