package com.expensetracker.controller;

import org.springframework.web.bind.annotation.*;
import com.expensetracker.dto.WebhookResponseDto;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.expensetracker.repository.UserRepository;
import com.expensetracker.model.User;
import org.json.JSONObject;
import java.util.Map;

@RestController
@RequestMapping("/stripe/webhook")
public class StripeWebhookController {
    private final UserRepository userRepository;

    public StripeWebhookController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping
    public WebhookResponseDto handleWebhook(@RequestBody Map<String, Object> payload) {
        try {
            JSONObject event = new JSONObject(payload);
            String type = event.optString("type");
            if ("checkout.session.completed".equals(type)) {
                JSONObject session = event.getJSONObject("data").getJSONObject("object");
                String email = session.optString("customer_email");
                User user = userRepository.findByUsername(email).orElse(null);
                if (user != null) {
                    user.setSubscribed(true);
                    userRepository.save(user);
                }
            }
            return new WebhookResponseDto(true, "Webhook processed");
        } catch (Exception e) {
            return new WebhookResponseDto(false, "Error: " + e.getMessage());
        }
    }
}
