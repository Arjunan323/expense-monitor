package com.expensetracker.controller;

import com.expensetracker.service.NewsletterSubscriptionService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/public/newsletter-subscriptions")
@Validated
public class PublicNewsletterSubscriptionController {

    private final NewsletterSubscriptionService service;

    public PublicNewsletterSubscriptionController(NewsletterSubscriptionService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<?> subscribe(@RequestBody SubscriptionRequest req) {
        var saved = service.subscribe(req.email().trim().toLowerCase(), req.source());
        return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "email", saved.getEmail(),
                "active", saved.isActive(),
                "source", saved.getSource()
        ));
    }

    @PostMapping("/unsubscribe")
    public ResponseEntity<?> unsubscribe(@RequestBody UnsubscribeRequest req) {
        service.unsubscribe(req.email().trim().toLowerCase());
        return ResponseEntity.ok(Map.of("status", "unsubscribed"));
    }

    public record SubscriptionRequest(@NotBlank @Email String email, String source) {}
    public record UnsubscribeRequest(@NotBlank @Email String email) {}
}
