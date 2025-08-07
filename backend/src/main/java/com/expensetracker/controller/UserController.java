package com.expensetracker.controller;


import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import com.expensetracker.dto.UserStatusDto;
import com.expensetracker.dto.PreferencesDto;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.model.User;
import com.expensetracker.config.JwtUtil;

@RestController
@RequestMapping("/user")
public class UserController {
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public UserController(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/status")
    public UserStatusDto getStatus(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String username = jwtUtil.extractUsername(token);
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            return new UserStatusDto(user.isSubscribed());
        }
        return new UserStatusDto("User not found");
    }

    @GetMapping("/preferences")
    public PreferencesDto getPreferences(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String username = jwtUtil.extractUsername(token);
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            return new PreferencesDto(user.getCurrency(), user.getLocale());
        }
        return new PreferencesDto("USD", "en-US");
    }

    @PostMapping("/preferences")
    public UserStatusDto updatePreferences(@RequestHeader("Authorization") String authHeader, @RequestBody PreferencesDto prefs) {
        String token = authHeader.replace("Bearer ", "");
        String username = jwtUtil.extractUsername(token);
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            user.setCurrency(prefs.getCurrency());
            user.setLocale(prefs.getLocale());
            userRepository.save(user);
            return new UserStatusDto(true);
        }
        return new UserStatusDto("User not found");
    }
}
