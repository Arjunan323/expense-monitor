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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import com.expensetracker.security.AuthenticationFacade;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.expensetracker.service.events.DomainEventPublisher;

@Service
public class PaymentService {
    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    private final SubscriptionRepository subscriptionRepository;
    private final PlanRepository planRepository;
    private final AuthenticationFacade authenticationFacade;
    private final DomainEventPublisher domainEventPublisher;
    @Value("${payment.razorpay.key}")
    private String razorpayKey;
    @Value("${payment.razorpay.secret}")
    private String razorpaySecret;

    @Autowired
    public PaymentService(UserRepository userRepository, SubscriptionRepository subscriptionRepository, PlanRepository planRepository, AuthenticationFacade authenticationFacade, DomainEventPublisher domainEventPublisher) {
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
        this.authenticationFacade = authenticationFacade;
        this.domainEventPublisher = domainEventPublisher;
    }

    public ResponseEntity<RazorpayOrderResponseDto> createOrder(RazorpayOrderRequestDto req, String authHeader) {
        String planType = req.getPlanType();
        if (planType == null) {
            return ResponseEntity.badRequest().build();
        }
        String billingPeriod = req.getBillingPeriod() != null ? req.getBillingPeriod().toUpperCase() : "MONTHLY";
        if (!billingPeriod.equals("MONTHLY") && !billingPeriod.equals("YEARLY")) {
            return ResponseEntity.badRequest().build();
        }
        User user = authenticationFacade.currentUser();
        Plan plan = planRepository.findByPlanTypeAndCurrencyAndBillingPeriod(planType, user.getCurrency(), billingPeriod).orElse(null);
        if (plan == null) {
            return ResponseEntity.badRequest().build();
        }
        int amount = plan.getAmount();
        String currency = plan.getCurrency();
        String orderId = null;
        try {
            RazorpayClient razorpay = new RazorpayClient(razorpayKey, razorpaySecret);
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
    sub.setBillingPeriod(billingPeriod);
        subscriptionRepository.save(sub);
    RazorpayOrderResponseDto resp = new RazorpayOrderResponseDto(orderId, razorpayKey, amount, currency, planType, billingPeriod);
        return ResponseEntity.ok(resp);
    }

    public ResponseEntity<String> handleWebhook(RazorpayWebhookDto webhook) {
        if (webhook == null || webhook.getEvent() == null) return ResponseEntity.badRequest().body("Invalid webhook");
        String orderId = null;
        String paymentId = null;
        if (webhook.getPayload() != null && webhook.getPayload().payment != null) {
            var payment = webhook.getPayload().payment;
            if (payment.order_id != null) orderId = payment.order_id;
            if (payment.id != null) paymentId = payment.id;
            if (payment.entity != null) {
                // Prefer nested entity values if present (authoritative)
                if (payment.entity.order_id != null) orderId = payment.entity.order_id;
                if (payment.entity.id != null) paymentId = payment.entity.id;
            }
        }
        if (orderId == null) {
            return ResponseEntity.badRequest().body("No order_id");
        }
        final String finalOrderId = orderId;
        final String finalPaymentId = paymentId;
    Subscription sub = subscriptionRepository.findByRazorpayOrderId(finalOrderId).orElse(null);

        if (AppConstants.EVENT_PAYMENT_CAPTURED.equals(webhook.getEvent()) || AppConstants.EVENT_ORDER_PAID.equals(webhook.getEvent())) {
            if (sub != null) {
                // Idempotency: if already active with payment id set, ignore duplicate webhook
                if (AppConstants.STATUS_ACTIVE.equals(sub.getStatus()) && sub.getRazorpayPaymentId() != null) {
                    log.info("Duplicate activation webhook ignored for order {}", finalOrderId);
                    return ResponseEntity.ok("Already active");
                }
                sub.setStatus(AppConstants.STATUS_ACTIVE);
                sub.setRazorpayPaymentId(finalPaymentId);
                sub.setStartDate(LocalDateTime.now());
                // Determine duration based on billingPeriod (default monthly)
                if ("YEARLY".equalsIgnoreCase(sub.getBillingPeriod())) {
                    sub.setEndDate(LocalDateTime.now().plusYears(1));
                } else {
                    sub.setEndDate(LocalDateTime.now().plusMonths(1));
                }
                subscriptionRepository.save(sub);
                try {
                    String payload = new org.json.JSONObject()
                        .put("userId", sub.getUser().getId())
                        .put("planType", sub.getPlanType().name())
                        .put("startDate", sub.getStartDate())
                        .put("endDate", sub.getEndDate())
                        .toString();
                    domainEventPublisher.publish("SUBSCRIPTION", String.valueOf(sub.getUser().getId()), "SUBSCRIPTION_ACTIVATED", payload);
                } catch (Exception ignored) {}
                return ResponseEntity.ok("Subscription activated");
            }
        } else if (AppConstants.EVENT_PAYMENT_FAILED.equals(webhook.getEvent())) {
            if (sub != null) {
                sub.setStatus(AppConstants.STATUS_FAILED);
                subscriptionRepository.save(sub);
                try {
                    String payload = new org.json.JSONObject()
                        .put("userId", sub.getUser().getId())
                        .put("planType", sub.getPlanType().name())
                        .put("status", "FAILED")
                        .toString();
                    domainEventPublisher.publish("SUBSCRIPTION", String.valueOf(sub.getUser().getId()), "SUBSCRIPTION_PAYMENT_FAILED", payload);
                } catch (Exception ignored) {}
                return ResponseEntity.ok("Payment failed recorded");
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body("Event ignored");
    }
}
