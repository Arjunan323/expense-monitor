package com.expensetracker.repository;

import com.expensetracker.model.RawStatement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RawStatementRepository extends JpaRepository<RawStatement, Long> {
    // ...custom queries if needed...
}
