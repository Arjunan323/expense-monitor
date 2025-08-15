package com.expensetracker.controller;

import com.expensetracker.dto.BankDto;
import com.expensetracker.model.User;
import com.expensetracker.repository.BankRepository;
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
@RequestMapping("/banks")
public class BankController {
    @Autowired
    private BankRepository bankRepository;
    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<BankDto>> listBanks(@RequestHeader("Authorization") String authHeader) {
        User user = getUser(authHeader);
        List<BankDto> dto = bankRepository.findByUser(user).stream()
                .map(b -> new BankDto(b.getId(), b.getName(), b.getTransactionCount()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dto);
    }

    private User getUser(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String username = new com.expensetracker.config.JwtUtil().extractUsername(token);
        return userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException(username));
    }
}
