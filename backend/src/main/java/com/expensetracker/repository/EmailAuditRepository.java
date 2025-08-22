package com.expensetracker.repository;

import com.expensetracker.model.EmailAudit;
import com.expensetracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface EmailAuditRepository extends JpaRepository<EmailAudit, Long> {
    List<EmailAudit> findByUserAndSentAtAfter(User user, Instant since);
    List<EmailAudit> findByUserAndTypeAndSentAtAfter(User user, String type, Instant since);
}
