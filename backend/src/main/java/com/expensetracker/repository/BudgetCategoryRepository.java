package com.expensetracker.repository;

import com.expensetracker.model.BudgetCategory;
import com.expensetracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BudgetCategoryRepository extends JpaRepository<BudgetCategory, Long> {
	List<BudgetCategory> findByUser(User user);
	Optional<BudgetCategory> findByIdAndUser(Long id, User user);
}

