package com.expensetracker.controller;

import org.springframework.web.bind.annotation.*;
import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import com.expensetracker.dto.PaymentResponseDto;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import jakarta.annotation.PostConstruct;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.model.User;

@RestController
@RequestMapping("/payments")
public class PaymentController {
    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    private final UserRepository userRepository;

    public PaymentController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    @PostMapping("/subscribe")
    public PaymentResponseDto subscribe(@RequestBody String userEmail) {
        SessionCreateParams params = SessionCreateParams.builder()
            .setMode(SessionCreateParams.Mode.PAYMENT)
            .setSuccessUrl("http://localhost:3000?success=true")
            .setCancelUrl("http://localhost:3000?canceled=true")
            .addLineItem(
                SessionCreateParams.LineItem.builder()
                    .setQuantity(1L)
                    .setPriceData(
                        SessionCreateParams.LineItem.PriceData.builder()
                            .setCurrency("inr")
                            .setUnitAmount(29900L) // ₹299.00
                            .setProductData(
                                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                    .setName("Expense Tracker Subscription")
                                    .build()
                            )
                            .build()
                    )
                    .build()
            )
            .setCustomerEmail(userEmail)
            .build();
        try {
            Session session = Session.create(params);
            // Mark user as subscribed (mocked, should be done via webhook in production)
            User user = userRepository.findByUsername(userEmail.replaceAll("\"", "")).orElse(null);
            if (user != null) {
                user.setSubscribed(true);
                userRepository.save(user);
            }
            return new PaymentResponseDto(true, session.getUrl());
        } catch (Exception e) {
            return new PaymentResponseDto(false, null, "Stripe error: " + e.getMessage());
        }
    }
}
