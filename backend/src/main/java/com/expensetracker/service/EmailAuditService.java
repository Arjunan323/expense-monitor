package com.expensetracker.service;

import com.expensetracker.model.EmailAudit;
import com.expensetracker.model.User;
import com.expensetracker.repository.EmailAuditRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class EmailAuditService {
    private final EmailAuditRepository repo;
    public EmailAuditService(EmailAuditRepository repo){ this.repo = repo; }
    public EmailAudit save(EmailAudit a){ return repo.save(a); }
    public List<EmailAudit> recent(User u, Instant since){ return repo.findByUserAndSentAtAfter(u, since); }
    public long recentCount(User u, String type, Instant since){ return repo.findByUserAndTypeAndSentAtAfter(u, type, since).size(); }
}
