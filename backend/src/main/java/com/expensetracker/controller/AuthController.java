package com.expensetracker.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import java.util.Map;
import com.expensetracker.dto.RegisterRequestDto;
import com.expensetracker.dto.RegisterResponseDto;
import com.expensetracker.dto.AuthResponseDto;
import com.expensetracker.service.AuthService;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponseDto> register(@RequestBody RegisterRequestDto body) {
    RegisterResponseDto response = authService.register(body);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        AuthResponseDto response = authService.login(username, password);
        if (response.getToken() != null) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }
}
