package com.expensetracker.service.events;

import com.expensetracker.model.OutboxEvent;
import com.expensetracker.repository.OutboxEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DomainEventPublisher {
    private final OutboxEventRepository outboxEventRepository;

    public DomainEventPublisher(OutboxEventRepository outboxEventRepository) {
        this.outboxEventRepository = outboxEventRepository;
    }

    @Transactional
    public void publish(String aggregateType, String aggregateId, String eventType, String payloadJson) {
        OutboxEvent evt = new OutboxEvent();
        evt.setAggregateType(aggregateType);
        evt.setAggregateId(aggregateId);
        evt.setEventType(eventType);
        evt.setPayload(payloadJson);
        outboxEventRepository.save(evt);
    }
}
