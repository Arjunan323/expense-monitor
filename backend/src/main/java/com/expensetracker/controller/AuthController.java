package com.expensetracker.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.model.User;
import com.expensetracker.config.JwtUtil;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.Map;
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
    public String register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        if (userRepository.findByUsername(username) != null) {
            return "User already exists";
        }
        String password = passwordEncoder.encode(body.get("password"));
        String email = body.get("email");
        User user = new User();
        user.setUsername(username);
        user.setPassword(password);
        user.setEmail(email);
        userRepository.save(user);
        return "User registered";
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
