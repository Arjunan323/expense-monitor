package com.expensetracker.repository;

import com.expensetracker.model.RawStatement;
import com.expensetracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RawStatementRepository extends JpaRepository<RawStatement, Long> {
    long countByUserAndUploadDateBetween(User user, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(rs.pageCount), 0) FROM RawStatement rs WHERE rs.user = :user AND rs.uploadDate BETWEEN :start AND :end")
    int sumPagesByUserAndUploadDateBetween(@Param("user") User user, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
