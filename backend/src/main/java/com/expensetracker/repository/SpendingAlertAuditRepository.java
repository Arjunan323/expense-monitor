package com.expensetracker.repository;

import com.expensetracker.model.SpendingAlertAudit;
import com.expensetracker.model.SpendingAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SpendingAlertAuditRepository extends JpaRepository<SpendingAlertAudit, Long> {
    List<SpendingAlertAudit> findByAlertOrderByAtAsc(SpendingAlert alert);
}
