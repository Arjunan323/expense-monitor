package com.expensetracker.repository;

import com.expensetracker.model.SpendingAlertRecommendation;
import com.expensetracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SpendingAlertRecommendationRepository extends JpaRepository<SpendingAlertRecommendation, Long> {
    List<SpendingAlertRecommendation> findByUserAndMonthOrderByPriorityDesc(User user, String month);
}
