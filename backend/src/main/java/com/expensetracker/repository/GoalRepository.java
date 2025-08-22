package com.expensetracker.repository;

import com.expensetracker.model.Goal;
import com.expensetracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface GoalRepository extends JpaRepository<Goal, Long> {
	List<Goal> findByUser(User user);
	Optional<Goal> findByIdAndUser(Long id, User user);

	@Query("select coalesce(sum(g.currentAmount),0) from Goal g where g.user=:user")
	BigDecimal totalProgress(@Param("user") User user);

	@Query("select g from Goal g where g.user=:user and g.targetDate between :start and :end")
	List<Goal> findGoalsInRange(@Param("user") User user, @Param("start") LocalDate start, @Param("end") LocalDate end);
}

