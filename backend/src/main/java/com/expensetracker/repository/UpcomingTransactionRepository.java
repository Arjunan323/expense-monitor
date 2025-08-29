package com.expensetracker.repository;

import com.expensetracker.model.UpcomingTransaction;
import com.expensetracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface UpcomingTransactionRepository extends JpaRepository<UpcomingTransaction, Long> {
    List<UpcomingTransaction> findByUserAndDueDateBetweenOrderByDueDateAsc(User user, LocalDate start, LocalDate end);
    List<UpcomingTransaction> findByUserOrderByDueDateAsc(User user);
}