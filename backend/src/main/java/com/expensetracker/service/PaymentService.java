package com.expensetracker.service;

import com.expensetracker.repository.UserRepository;
import com.expensetracker.repository.SubscriptionRepository;
import com.expensetracker.repository.PlanRepository;
import com.expensetracker.model.User;
import com.expensetracker.model.Subscription;
import com.expensetracker.model.Plan;
import com.expensetracker.dto.RazorpayOrderRequestDto;
import com.expensetracker.dto.RazorpayOrderResponseDto;
import com.expensetracker.dto.RazorpayWebhookDto;
import com.expensetracker.util.AppConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class PaymentService {
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PlanRepository planRepository;

    @Autowired
    public PaymentService(UserRepository userRepository, SubscriptionRepository subscriptionRepository, PlanRepository planRepository) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
    }

    public ResponseEntity<RazorpayOrderResponseDto> createOrder(RazorpayOrderRequestDto req, String authHeader) {
        String planType = req.getPlanType();
        String region = AppConstants.REGION_DEFAULT;
        String token = authHeader.replace("Bearer ", "");
        String username = new com.expensetracker.config.JwtUtil().extractUsername(token);
        User user = userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException(username));
        Plan plan = planRepository.findByPlanTypeAndRegion(planType, region).orElse(null);
        if (plan == null) {
            return ResponseEntity.badRequest().build();
        }
        int amount = plan.getAmount();
        String currency = plan.getCurrency();
        String orderId = null;
        try {
            RazorpayClient razorpay = new RazorpayClient(AppConstants.RAZORPAY_KEY, AppConstants.RAZORPAY_SECRET);
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amount);
            orderRequest.put("currency", currency);
            orderRequest.put("receipt", "rcptid_" + System.currentTimeMillis());
            orderRequest.put("payment_capture", 1);
            com.razorpay.Order order = razorpay.orders.create(orderRequest);
            orderId = order.get("id");
        } catch (RazorpayException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
        Subscription sub = subscriptionRepository.findByUserId(user.getId()).orElse(null);
        if (sub == null) {
            sub = new Subscription();
            sub.setUser(user);
        }
        sub.setPlanType(Subscription.PlanType.valueOf(planType));
        sub.setStatus(AppConstants.STATUS_PENDING);
        sub.setRazorpayOrderId(orderId);
        sub.setRazorpayPaymentId(null);
        sub.setStartDate(null);
        sub.setEndDate(null);
        subscriptionRepository.save(sub);
        RazorpayOrderResponseDto resp = new RazorpayOrderResponseDto(orderId, AppConstants.RAZORPAY_KEY, amount, currency, planType);
        return ResponseEntity.ok(resp);
    }

    public ResponseEntity<String> handleWebhook(RazorpayWebhookDto webhook) {
        if (webhook == null || webhook.getEvent() == null) return ResponseEntity.badRequest().body("Invalid webhook");
        final String[] ids = new String[2];
        if (webhook.getPayload() != null && webhook.getPayload().payment != null) {
            if (webhook.getPayload().payment.order_id != null) {
                ids[0] = webhook.getPayload().payment.order_id;
            }
            if (webhook.getPayload().payment.id != null) {
                ids[1] = webhook.getPayload().payment.id;
            }
            try {
                java.lang.reflect.Field entityField = webhook.getPayload().payment.getClass().getDeclaredField("entity");
                entityField.setAccessible(true);
                Object entity = entityField.get(webhook.getPayload().payment);
                if (entity != null) {
                    java.lang.reflect.Field orderIdField = entity.getClass().getDeclaredField("order_id");
                    orderIdField.setAccessible(true);
                    Object nestedOrderId = orderIdField.get(entity);
                    if (nestedOrderId != null) ids[0] = nestedOrderId.toString();
                    java.lang.reflect.Field idField = entity.getClass().getDeclaredField("id");
                    idField.setAccessible(true);
                    Object nestedPaymentId = idField.get(entity);
                    if (nestedPaymentId != null) ids[1] = nestedPaymentId.toString();
                }
            } catch (Exception ignored) {}
            if (ids[0] == null) {
                return ResponseEntity.badRequest().body("No order_id");
            }
        } else {
            return ResponseEntity.badRequest().body("No order_id");
        }
        final String orderId = ids[0];
        final String paymentId = ids[1];
        Subscription sub = subscriptionRepository.findAll().stream()
            .filter(s -> orderId.equals(s.getRazorpayOrderId()))
            .findFirst().orElse(null);

        if (AppConstants.EVENT_PAYMENT_CAPTURED.equals(webhook.getEvent()) || AppConstants.EVENT_ORDER_PAID.equals(webhook.getEvent())) {
            if (sub != null) {
                sub.setStatus(AppConstants.STATUS_ACTIVE);
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
        } else if (AppConstants.EVENT_PAYMENT_FAILED.equals(webhook.getEvent())) {
            if (sub != null) {
                sub.setStatus(AppConstants.STATUS_FAILED);
                subscriptionRepository.save(sub);
                return ResponseEntity.ok("Payment failed recorded");
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body("Event ignored");
    }
}
