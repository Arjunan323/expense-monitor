package com.expensetracker.repository;

import com.expensetracker.model.StatementJob;
import com.expensetracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StatementJobRepository extends JpaRepository<StatementJob, String> {
    List<StatementJob> findByUserOrderByCreatedAtDesc(User user);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("update StatementJob j set j.processedChunks = coalesce(j.processedChunks,0) + 1, j.processedPages = coalesce(j.processedPages,0) + :pages, j.progressPercent = :progress where j.id = :id")
    int incrementProgress(@org.springframework.data.repository.query.Param("id") String id,
                          @org.springframework.data.repository.query.Param("pages") int pages,
                          @org.springframework.data.repository.query.Param("progress") int progress);
}
