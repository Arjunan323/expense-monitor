package com.expensetracker.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "newsletter_subscription", indexes = {
        @Index(name = "ux_newsletter_subscription_email", columnList = "email", unique = true)
})
public class NewsletterSubscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 320)
    private String email;

    @Column(nullable = false)
    private Instant subscribedAt = Instant.now();

    @Column(nullable = false)
    private boolean active = true;

    @Column(length = 40)
    private String source; // e.g., landing_page, referral, import

    public NewsletterSubscription() {}

    public NewsletterSubscription(String email, String source) {
        this.email = email;
        this.source = source;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Instant getSubscribedAt() { return subscribedAt; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
