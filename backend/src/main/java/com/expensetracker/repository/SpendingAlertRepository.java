package com.expensetracker.repository;

import com.expensetracker.model.SpendingAlert;
import com.expensetracker.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface SpendingAlertRepository extends JpaRepository<SpendingAlert, Long> {
    @Query("select a from SpendingAlert a where a.user = :user and (:type is null or a.type = :type) and (:severity is null or a.severity = :severity) and (:ack is null or a.acknowledged = :ack) and (:start is null or a.txnDate >= :start) and (:end is null or a.txnDate <= :end) and a.dismissed = false order by a.createdAt desc")
    Page<SpendingAlert> search(@Param("user") User user,
                               @Param("type") String type,
                               @Param("severity") String severity,
                               @Param("ack") Boolean acknowledged,
                               @Param("start") LocalDate start,
                               @Param("end") LocalDate end,
                               Pageable pageable);

    long countByUserAndSeverityAndAcknowledgedFalseAndDismissedFalse(User user, String severity);
    long countByUserAndAcknowledgedTrueAndDismissedFalse(User user);
}
