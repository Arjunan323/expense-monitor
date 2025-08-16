package com.expensetracker.controller;

import com.expensetracker.dto.CategoryDto;
import com.expensetracker.model.User;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.config.JwtUtil;
import com.expensetracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/categories")
public class CategoryController {
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public CategoryController(JwtUtil jwtUtil) { this.jwtUtil = jwtUtil; }

    @GetMapping
    public ResponseEntity<List<CategoryDto>> listCategories(@RequestHeader("Authorization") String authHeader) {
        User user = getUser(authHeader);
        List<CategoryDto> dto = categoryRepository.findByUser(user).stream()
                .map(c -> new CategoryDto(c.getId(), c.getName(), c.getTransactionCount()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dto);
    }

    private User getUser(String authHeader) {
    String token = authHeader.replace("Bearer ", "");
    String username = jwtUtil.extractUsername(token);
        return userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException(username));
    }
}
