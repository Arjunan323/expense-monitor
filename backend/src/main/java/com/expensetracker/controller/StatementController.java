package com.expensetracker.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.expensetracker.repository.RawStatementRepository;
import com.expensetracker.model.RawStatement;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.model.Transaction;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.model.User;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.Scanner;
import java.util.List;
import java.util.ArrayList;
import com.expensetracker.dto.StatementUploadResponseDto;
import com.expensetracker.dto.ErrorDto;

@RestController
@RequestMapping("/statements")
public class StatementController {
    @Autowired
    private RawStatementRepository rawStatementRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public StatementUploadResponseDto uploadStatement(@RequestParam("file") MultipartFile file, @RequestHeader("Authorization") String authHeader) {
        try {
            // Extract username from JWT token
            String token = authHeader.replace("Bearer ", "");
            String username = new com.expensetracker.config.JwtUtil().extractUsername(token);
            User user = userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException(username));
            // Pricing gate: allow max 3 uploads per user unless subscribed
            if (user != null && !user.isSubscribed()) {
                long statementCount = rawStatementRepository.findAll().stream()
                    .filter(s -> s.getUser() != null && s.getUser().getId().equals(user.getId()))
                    .count();
                if (statementCount >= 3) {
                    return new StatementUploadResponseDto(false, "Free limit reached. Please subscribe to continue.");
                }
            }
            // Save PDF temporarily
            File tempFile = File.createTempFile("statement", ".pdf");
            System.out.println("Temp PDF path: " + tempFile.getAbsolutePath());
            try (FileOutputStream fos = new FileOutputStream(tempFile)) {
                fos.write(file.getBytes());
            }
            if (!tempFile.exists() || tempFile.length() == 0) {
                System.err.println("Temp file missing or empty: " + tempFile.getAbsolutePath());
                return new StatementUploadResponseDto(false, "Error: PDF file not saved correctly");
            }
            // Call extraction Lambda (Python script)
          ProcessBuilder pb = new ProcessBuilder("python", "d:/product/expense/extraction_lambda/extraction_lambda.py", tempFile.getAbsolutePath());
            pb.redirectErrorStream(true);
            Process process = pb.start();
            StringBuilder output = new StringBuilder();
            try (Scanner scanner = new Scanner(process.getInputStream())) {
                while (scanner.hasNextLine()) {
                    output.append(scanner.nextLine());
                }
            }
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                System.err.println("Python extraction failed. Exit code: " + exitCode);
                System.err.println("Python output: " + output);
                return new StatementUploadResponseDto(false, "Extraction failed: " + output);
            }
            // Store RawStatement
            RawStatement rawStatement = new RawStatement();
            rawStatement.setUploadDate(LocalDateTime.now());
            rawStatement.setFilename(file.getOriginalFilename());
            rawStatement.setRawJson(output.toString());
            rawStatement.setUser(user);
            rawStatementRepository.save(rawStatement);
            // Parse transactions from output JSON
            List<Transaction> transactions = new ArrayList<>();
            try {
                org.json.JSONArray arr = new org.json.JSONArray(output.toString());
                for (int i = 0; i < arr.length(); i++) {
                    org.json.JSONObject obj = arr.getJSONObject(i);
                    Transaction txn = new Transaction();
                    txn.setDate(LocalDate.parse(obj.getString("date")));
                    txn.setDescription(obj.getString("description"));
                    txn.setAmount(obj.getDouble("amount"));
                    txn.setBalance(obj.optDouble("balance", 0.0));
                    txn.setCategory(obj.optString("category", "Unknown"));
                    txn.setUser(user);
                    transactions.add(txn);
                }
                transactionRepository.saveAll(transactions);
            } catch (Exception e) {
                e.printStackTrace();
                return new StatementUploadResponseDto(false, "Error parsing transactions");
            }
            tempFile.delete();
            return new StatementUploadResponseDto(true, "Statement uploaded and transactions saved");
        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
            return new StatementUploadResponseDto(false, "Error processing statement");
        }
    }

    @GetMapping
    public ErrorDto getStatements() {
        // TODO: Replace with actual list of statements DTO
        return new ErrorDto("Not implemented");
    }
}
