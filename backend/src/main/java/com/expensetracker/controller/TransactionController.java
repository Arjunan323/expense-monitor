package com.expensetracker.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import com.expensetracker.repository.TransactionRepository;
import java.util.List;
import java.util.stream.Collectors;
import com.expensetracker.dto.TransactionDto;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.expensetracker.repository.UserRepository;
import com.expensetracker.model.User;

@RestController
@RequestMapping("/transactions")
public class TransactionController {
    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<TransactionDto> getAllTransactions(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String username = new com.expensetracker.config.JwtUtil().extractUsername(token);
        User user = userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException(username));
        return transactionRepository.findAll().stream()
            .filter(t -> t.getUser() != null && t.getUser().getId().equals(user.getId()))
            .map(t -> new TransactionDto(
                t.getId(),
                t.getDate(),
                t.getDescription(),
                t.getAmount(),
                t.getBalance(),
                t.getCategory(),
                t.getBankName()
            ))
            .collect(Collectors.toList());
    }

    // Additional endpoints (add, update, delete) can be added here
}
