package com.expensetracker.repository;

import com.expensetracker.model.StatementJob;
import com.expensetracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StatementJobRepository extends JpaRepository<StatementJob, String> {
    List<StatementJob> findByUserOrderByCreatedAtDesc(User user);
}
