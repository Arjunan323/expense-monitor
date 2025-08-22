package com.expensetracker.service;

import com.expensetracker.model.NewsletterSubscription;
import com.expensetracker.repository.NewsletterSubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NewsletterSubscriptionService {
    private final NewsletterSubscriptionRepository repository;

    public NewsletterSubscriptionService(NewsletterSubscriptionRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public NewsletterSubscription subscribe(String email, String source) {
        return repository.findByEmailIgnoreCase(email)
                .map(existing -> {
                    if(!existing.isActive()) existing.setActive(true);
                    if(source != null && (existing.getSource()==null || !existing.getSource().equals(source))) existing.setSource(source);
                    return existing;
                })
                .orElseGet(() -> repository.save(new NewsletterSubscription(email, source)));
    }

    @Transactional
    public void unsubscribe(String email) {
        repository.findByEmailIgnoreCase(email).ifPresent(sub -> sub.setActive(false));
    }
}
