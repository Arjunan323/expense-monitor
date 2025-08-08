package com.expensetracker.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.repository.SubscriptionRepository;
import com.expensetracker.model.User;
import com.expensetracker.model.Subscription;
import com.expensetracker.dto.RazorpayOrderRequestDto;
import com.expensetracker.dto.RazorpayOrderResponseDto;
import com.expensetracker.dto.RazorpayWebhookDto;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payment")
public class PaymentController {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SubscriptionRepository subscriptionRepository;

    // Replace with your Razorpay key/secret
    private static final String RAZORPAY_KEY = "rzp_test_xxxxxxxx";
    private static final String RAZORPAY_SECRET = "xxxxxxxx";

    // Plan prices in paise (INR)
    private static final Map<String, Integer> PLAN_PRICES = new HashMap<>() {{
        put("PRO", 12900); // ₹129.00
        put("PREMIUM", 29900); // ₹299.00
    }};

    @PostMapping("/order")
    public ResponseEntity<RazorpayOrderResponseDto> createOrder(@RequestBody RazorpayOrderRequestDto req, @RequestHeader("Authorization") String authHeader) {
        String planType = req.getPlanType();
        if (!PLAN_PRICES.containsKey(planType)) {
            return ResponseEntity.badRequest().build();
        }
        int amount = PLAN_PRICES.get(planType);
        String currency = "INR";
        // --- Razorpay order creation (pseudo, replace with SDK call) ---
        // In production, use RazorpayClient and create order with receipt/user info
        String orderId = "order_" + System.currentTimeMillis(); // Replace with real orderId
        // Save a pending subscription for this user/order
        String token = authHeader.replace("Bearer ", "");
        String username = new com.expensetracker.config.JwtUtil().extractUsername(token);
        User user = userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException(username));
        Subscription sub = new Subscription();
        sub.setPlanType(Subscription.PlanType.valueOf(planType));
        sub.setStatus("PENDING");
        sub.setRazorpayOrderId(orderId);
        sub.setUser(user);
        subscriptionRepository.save(sub);
        RazorpayOrderResponseDto resp = new RazorpayOrderResponseDto(orderId, RAZORPAY_KEY, amount, currency, planType);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(@RequestBody RazorpayWebhookDto webhook) {
        if (webhook == null || webhook.getEvent() == null) return ResponseEntity.badRequest().body("Invalid webhook");
        if ("payment.captured".equals(webhook.getEvent()) && webhook.getPayload() != null && webhook.getPayload().payment != null) {
            String orderId = webhook.getPayload().payment.order_id;
            String paymentId = webhook.getPayload().payment.id;
            // Find subscription by orderId
            Subscription sub = subscriptionRepository.findAll().stream()
                .filter(s -> orderId.equals(s.getRazorpayOrderId()))
                .findFirst().orElse(null);
            if (sub != null) {
                sub.setStatus("ACTIVE");
                sub.setRazorpayPaymentId(paymentId);
                sub.setStartDate(LocalDateTime.now());
                if (sub.getPlanType() == Subscription.PlanType.PRO) {
                    sub.setEndDate(LocalDateTime.now().plusMonths(1));
                } else if (sub.getPlanType() == Subscription.PlanType.PREMIUM) {
                    sub.setEndDate(LocalDateTime.now().plusMonths(1));
                }
                subscriptionRepository.save(sub);
                return ResponseEntity.ok("Subscription activated");
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body("Event ignored");
    }
}
