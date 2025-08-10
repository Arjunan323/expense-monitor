package com.expensetracker.controller;

import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import com.expensetracker.dto.TransactionDto;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.model.User;
import com.expensetracker.repository.TransactionRepository;

@RestController
@RequestMapping("/transactions")
public class TransactionController {
    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getTransactions(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "50") int size,
            @RequestParam(value = "banks", required = false) String banks,
            @RequestParam(value = "categories", required = false) String categories,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "amountMin", required = false) Double amountMin,
            @RequestParam(value = "amountMax", required = false) Double amountMax,
            @RequestParam(value = "transactionType", required = false) String transactionType,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "sortBy", defaultValue = "date") String sortBy,
            @RequestParam(value = "sortOrder", defaultValue = "desc") String sortOrder
    ) {
        String token = authHeader.replace("Bearer ", "");
        String username = new com.expensetracker.config.JwtUtil().extractUsername(token);
        User user = userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException(username));

        // Build Pageable
        Sort.Direction direction = sortOrder.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        // Parse filters
        List<String> bankList = banks != null && !banks.isEmpty() ? Arrays.asList(banks.split(",")) : null;
        List<String> categoryList = categories != null && !categories.isEmpty() ? Arrays.asList(categories.split(",")) : null;
        LocalDate start = (startDate != null && !startDate.isEmpty()) ? LocalDate.parse(startDate) : null;
        LocalDate end = (endDate != null && !endDate.isEmpty()) ? LocalDate.parse(endDate) : null;

        // Use Specification for dynamic filtering
        var spec = com.expensetracker.repository.TransactionSpecifications.filter(
            user,
            bankList,
            categoryList,
            start,
            end,
            amountMin,
            amountMax,
            transactionType,
            description
        );
        Page<TransactionDto> pageResult = transactionRepository.findAll(spec, pageable)
            .map(com.expensetracker.dto.TransactionDto::fromEntity);
        return ResponseEntity.ok(pageResult);
    }


    // Additional endpoints (add, update, delete) can be added here
    @GetMapping("/category-counts")
    public ResponseEntity<?> getCategoryCounts(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(value = "banks", required = false) String banks,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "amountMin", required = false) Double amountMin,
            @RequestParam(value = "amountMax", required = false) Double amountMax,
            @RequestParam(value = "transactionType", required = false) String transactionType,
            @RequestParam(value = "description", required = false) String description
    ) {
        String token = authHeader.replace("Bearer ", "");
        String username = new com.expensetracker.config.JwtUtil().extractUsername(token);
        User user = userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException(username));

        List<String> bankList = banks != null && !banks.isEmpty() ? Arrays.asList(banks.split(",")) : null;
        LocalDate start = (startDate != null && !startDate.isEmpty()) ? LocalDate.parse(startDate) : null;
        LocalDate end = (endDate != null && !endDate.isEmpty()) ? LocalDate.parse(endDate) : null;

        // Use Specification for dynamic filtering (exclude categories filter)
        var spec = com.expensetracker.repository.TransactionSpecifications.filter(
            user,
            bankList,
            null, // categories intentionally omitted
            start,
            end,
            amountMin,
            amountMax,
            transactionType,
            description
        );

        // Query all matching transactions and count by category
        List<com.expensetracker.model.Transaction> txns = transactionRepository.findAll(spec);
        java.util.Map<String, Long> counts = txns.stream()
            .collect(Collectors.groupingBy(
                t -> t.getCategory() != null ? t.getCategory() : "Uncategorized",
                Collectors.counting()
            ));
        // Convert to list of { category, count }
        List<java.util.Map<String, Object>> result = new ArrayList<>();
        for (var entry : counts.entrySet()) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("category", entry.getKey());
            map.put("count", entry.getValue());
            result.add(map);
        }
        // Sort by count desc
        result.sort((a, b) -> Long.compare((Long)b.get("count"), (Long)a.get("count")));
        return ResponseEntity.ok(result);
    }
}
