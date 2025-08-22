package com.expensetracker.controller;

import com.expensetracker.service.VerificationService;
import org.springframework.http.ResponseEntity;
import com.expensetracker.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth/verify")
public class VerificationController {
    private final VerificationService verificationService; private final UserRepository userRepository;
    public VerificationController(VerificationService verificationService, UserRepository userRepository){ this.verificationService=verificationService; this.userRepository=userRepository; }

    @PostMapping("/resend")
    public ResponseEntity<?> resend(@RequestParam String email){
        if(email==null || email.isBlank()) return ResponseEntity.ok().build();
        userRepository.findByEmail(email.trim()).ifPresent(u -> { try { verificationService.sendVerification(u);} catch(Exception ignored){} });
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<?> verify(@RequestParam String token){
        boolean ok = verificationService.verify(token);
        return ok? ResponseEntity.ok().build(): ResponseEntity.badRequest().body("Invalid or expired token");
    }
}
