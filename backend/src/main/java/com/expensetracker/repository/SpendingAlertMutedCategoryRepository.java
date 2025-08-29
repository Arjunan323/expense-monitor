package com.expensetracker.repository;

import com.expensetracker.model.SpendingAlertMutedCategory;
import com.expensetracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SpendingAlertMutedCategoryRepository extends JpaRepository<SpendingAlertMutedCategory, Long> {
    List<SpendingAlertMutedCategory> findByUser(User user);
    void deleteByUserAndCategory(User user, String category);
}
