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

public class PaymentController {
    private final PaymentService paymentService;

    @Autowired
    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/order")
    public ResponseEntity<RazorpayOrderResponseDto> createOrder(@RequestBody RazorpayOrderRequestDto req, @RequestHeader("Authorization") String authHeader) {
        return paymentService.createOrder(req, authHeader);
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(@RequestBody RazorpayWebhookDto webhook) {
        return paymentService.handleWebhook(webhook);
    }
}
