package com.expensetracker.controller;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.model.User;
import com.expensetracker.config.JwtUtil;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.http.ResponseEntity;
import com.expensetracker.dto.RegisterRequestDto;
import com.expensetracker.dto.RegisterResponseDto;
import com.expensetracker.dto.UserDto;
import com.expensetracker.dto.AuthResponseDto;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JwtUtil jwtUtil;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/register")
    public ResponseEntity<RegisterResponseDto> register(@RequestBody RegisterRequestDto body) {
        String username = body.getEmail();
        if (userRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body(new RegisterResponseDto(false, "User already exists"));
        }
        String password = passwordEncoder.encode(body.getPassword());
        User user = new User();
        user.setUsername(username);
        user.setPassword(password);
        user.setEmail(body.getEmail());
        user.setFirstName(body.getFirstName() != null ? body.getFirstName() : "");
        user.setLastName(body.getLastName() != null ? body.getLastName() : "");
        user.setCurrency(body.getCurrency() != null ? body.getCurrency() : "INR");
        user.setLocale(body.getLocale() != null ? body.getLocale() : "en-US");
        userRepository.save(user);
        return ResponseEntity.ok(new RegisterResponseDto(true, "User registered"));
    }

    @PostMapping("/login")
    public AuthResponseDto login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        User user = userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException(username));
        if (user != null && passwordEncoder.matches(password, user.getPassword())) {
            String token = jwtUtil.generateToken(username);
            UserDto userDto = new UserDto(user.getId(), user.getUsername(), user.getEmail());
            return new AuthResponseDto(token, userDto);
        }
        return new AuthResponseDto(null, null, "Invalid credentials");
    }
}
