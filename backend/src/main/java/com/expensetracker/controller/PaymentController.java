package com.expensetracker.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import com.expensetracker.dto.RazorpayOrderRequestDto;
import com.expensetracker.dto.RazorpayOrderResponseDto;
import com.expensetracker.dto.RazorpayWebhookDto;
import com.expensetracker.service.PaymentService;

@RestController
@RequestMapping("/payment")
@io.swagger.v3.oas.annotations.tags.Tag(name = "Payment", description = "Payment and subscription order handling")

public class PaymentController {
    private final PaymentService paymentService;

    @Autowired
    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/order")
    @io.swagger.v3.oas.annotations.Operation(summary = "Create a payment order")
    public ResponseEntity<RazorpayOrderResponseDto> createOrder(@RequestBody RazorpayOrderRequestDto req, @RequestHeader("Authorization") String authHeader) {
        return paymentService.createOrder(req, authHeader);
    }

    @PostMapping("/webhook")
    @io.swagger.v3.oas.annotations.Operation(summary = "Handle Razorpay webhook callback")
    public ResponseEntity<String> handleWebhook(@RequestBody RazorpayWebhookDto webhook) {
        return paymentService.handleWebhook(webhook);
    }
}
