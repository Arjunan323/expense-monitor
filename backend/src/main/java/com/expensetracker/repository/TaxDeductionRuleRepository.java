package com.expensetracker.repository;

import com.expensetracker.model.TaxDeductionRule;
import com.expensetracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TaxDeductionRuleRepository extends JpaRepository<TaxDeductionRule, Long> {
    @Query("select r from TaxDeductionRule r where (r.user is null or r.user = :user) and r.active = true order by r.priority desc, r.id desc")
    List<TaxDeductionRule> findActiveRules(@Param("user") User user);
    List<TaxDeductionRule> findByUser(User user);
}
