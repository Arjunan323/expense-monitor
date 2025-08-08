package com.expensetracker.services;

import com.expensetracker.model.Subscription;
import com.expensetracker.repository.SubscriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SubscriptionExpiryJobService {
    @Autowired
    private SubscriptionRepository subscriptionRepository;

    // Runs every day at 2:00 AM
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void expireSubscriptions() {
        LocalDateTime now = LocalDateTime.now();
        List<Subscription> activeSubs = subscriptionRepository.findAll()
                .stream()
                .filter(sub -> "ACTIVE".equals(sub.getStatus()) && sub.getEndDate() != null && sub.getEndDate().isBefore(now))
                .toList();
        for (Subscription sub : activeSubs) {
            // Downgrade to FREE plan and mark as EXPIRED
            sub.setPlanType(Subscription.PlanType.FREE);
            sub.setStatus("EXPIRED");
            sub.setStartDate(null);
            sub.setEndDate(null);
            sub.setRazorpayOrderId(null);
            sub.setRazorpayPaymentId(null);
            subscriptionRepository.save(sub);
        }
    }
}
