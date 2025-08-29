package com.expensetracker.controller;

import com.expensetracker.service.PasswordResetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth/password")
public class PasswordResetController {
    private final PasswordResetService service;
    public PasswordResetController(PasswordResetService service){ this.service=service; }

    @PostMapping("/request")
    public ResponseEntity<?> request(@RequestBody Map<String,String> body){
        service.request(body.getOrDefault("email", ""));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset")
    public ResponseEntity<?> reset(@RequestBody Map<String,String> body){
        boolean ok = service.reset(body.getOrDefault("token",""), body.getOrDefault("password",""));
        return ok? ResponseEntity.ok().build(): ResponseEntity.badRequest().body("Invalid or expired token");
    }
}
