package com.expensetracker.repository;

import com.expensetracker.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findByUserId(Long userId);
    Optional<Subscription> findByRazorpayOrderId(String razorpayOrderId);
}
