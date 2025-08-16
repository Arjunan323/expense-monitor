package com.expensetracker.controller;

import com.expensetracker.dto.BankDto;
import com.expensetracker.model.User;
import com.expensetracker.repository.BankRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.config.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/banks")
public class BankController {

    private final BankRepository bankRepository;
    private final UserRepository userRepository;

    public BankController(BankRepository bankRepository, UserRepository userRepository, JwtUtil jwtUtil) {
        this.bankRepository = bankRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    @Operation(summary = "List user's banks", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<BankDto>> listBanks() {
        User user = currentUser();
        List<BankDto> dto = bankRepository.findByUser(user).stream()
                .map(b -> new BankDto(b.getId(), b.getName(), b.getTransactionCount()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dto);
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
            return userRepository.findByUsername(auth.getName())
                    .orElseThrow(() -> new UsernameNotFoundException(auth.getName()));
        }
        // Fallback (should normally not happen if security is configured): attempt to parse token from context if available
        throw new UsernameNotFoundException("Authenticated user not found in context");
    }
}
