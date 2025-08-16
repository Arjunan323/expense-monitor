package com.expensetracker.service.events;

import com.expensetracker.model.OutboxEvent;
import com.expensetracker.repository.OutboxEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@EnableScheduling
public class OutboxDispatcher {
    private static final Logger log = LoggerFactory.getLogger(OutboxDispatcher.class);
    private final OutboxEventRepository repository;

    public OutboxDispatcher(OutboxEventRepository repository) {
        this.repository = repository;
    }

    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void dispatch() {
        List<OutboxEvent> batch = repository.findBatchForDispatch(LocalDateTime.now().minusSeconds(10));
        for (OutboxEvent evt : batch) {
            try {
                // TODO: send to external bus / webhook. For now just log.
                log.info("Dispatching event {} type={} aggregateType={} aggregateId={}", evt.getId(), evt.getEventType(), evt.getAggregateType(), evt.getAggregateId());
                evt.setStatus(OutboxEvent.Status.SENT);
                evt.setLastAttemptAt(LocalDateTime.now());
            } catch (Exception ex) {
                evt.setAttemptCount(evt.getAttemptCount() + 1);
                evt.setLastAttemptAt(LocalDateTime.now());
                if (evt.getAttemptCount() > 10) {
                    evt.setStatus(OutboxEvent.Status.FAILED);
                }
                log.error("Failed dispatching outbox event {}: {}", evt.getId(), ex.getMessage());
            }
        }
    }
}
