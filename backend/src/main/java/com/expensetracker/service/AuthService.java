package com.expensetracker.service;

import com.expensetracker.dto.RegisterRequestDto;
import com.expensetracker.dto.RegisterResponseDto;
import com.expensetracker.dto.AuthResponseDto;
import com.expensetracker.dto.UserDto;
import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.config.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;

    @Autowired
    public AuthService(UserRepository userRepository, JwtUtil jwtUtil, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    public RegisterResponseDto register(RegisterRequestDto body) {
        String username = body.getEmail();
        if (userRepository.findByUsername(username).isPresent()) {
            return new RegisterResponseDto(false, "User already exists");
        }
        User user = new User();
    user.setUsername(username);
    user.setPassword(passwordEncoder.encode(body.getPassword()));
    user.setEmail(body.getEmail());
    user.setFirstName(body.getFirstName() != null ? body.getFirstName() : "");
    user.setLastName(body.getLastName() != null ? body.getLastName() : "");
    user.setCurrency(body.getCurrency() != null ? body.getCurrency() : "USD");
    user.setLocale(body.getLocale() != null ? body.getLocale() : "en-US");
    user.setSubscribed(false);
    userRepository.save(user);
        return new RegisterResponseDto(true, "User registered successfully");
    }

    public AuthResponseDto login(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            throw new UsernameNotFoundException("User not found: " + username);
        }
        User user = userOpt.get();
        if (passwordEncoder.matches(password, user.getPassword())) {
            String token = jwtUtil.generateToken(username);
            UserDto userDto = new UserDto(user.getId(), user.getUsername(), user.getEmail(), user.getLocale(), user.getCurrency());
            return new AuthResponseDto(token, userDto);
        }
        return new AuthResponseDto(null, null, "Invalid credentials");
    }
}
