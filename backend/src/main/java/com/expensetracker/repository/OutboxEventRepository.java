package com.expensetracker.repository;

import com.expensetracker.model.OutboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from OutboxEvent e where e.status = 'PENDING' and (e.lastAttemptAt is null or e.lastAttemptAt < :cutoff) order by e.createdAt asc")
    List<OutboxEvent> findBatchForDispatch(@Param("cutoff") LocalDateTime cutoff);
}
