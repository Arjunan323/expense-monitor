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
import org.apache.pdfbox.pdmodel.PDDocument;
import com.expensetracker.dto.StatementUploadResponseDto;

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
            // Subscription plan enforcement
            int statementLimit = 3, pageLimit = 10;
            String planType = "FREE";
            if (user.getSubscription() != null) {
                planType = user.getSubscription().getPlanType().name();
                if (user.getSubscription().getPlanType() == com.expensetracker.model.Subscription.PlanType.PRO) {
                    statementLimit = 5; pageLimit = 50;
                } else if (user.getSubscription().getPlanType() == com.expensetracker.model.Subscription.PlanType.PREMIUM) {
                    statementLimit = Integer.MAX_VALUE; pageLimit = 100; // or Integer.MAX_VALUE for unlimited
                }
            }
            // Count statements uploaded this month
            java.time.LocalDateTime monthStart = java.time.LocalDate.now().withDayOfMonth(1).atStartOfDay();
            long statementsThisMonth = rawStatementRepository.findAll().stream()
                .filter(s -> s.getUser() != null && s.getUser().getId().equals(user.getId()))
                .filter(s -> s.getUploadDate() != null && s.getUploadDate().isAfter(monthStart))
                .count();
            if (statementLimit != Integer.MAX_VALUE && statementsThisMonth >= statementLimit) {
                return new StatementUploadResponseDto(false, "You have reached your plan's statement upload limit. Upgrade for more.");
            }
            // Enforce page-per-statement limit
            try {
                // Use PDFBox to count pages
                org.apache.pdfbox.pdmodel.PDDocument pdfDoc = org.apache.pdfbox.pdmodel.PDDocument.load(file.getBytes());
                int numPages = pdfDoc.getNumberOfPages();
                pdfDoc.close();
                if (pageLimit != Integer.MAX_VALUE && numPages > pageLimit) {
                    return new StatementUploadResponseDto(false, "This statement has " + numPages + " pages. Your plan allows up to " + pageLimit + " pages per statement. Upgrade for more.");
                }
            } catch (Exception e) {
                return new StatementUploadResponseDto(false, "Failed to read PDF for page count: " + e.getMessage());
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
            ProcessBuilder pb = new ProcessBuilder("python", "d:/product/expense-monitor/extraction_lambda/extraction_lambda.py", tempFile.getAbsolutePath());
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
            // Extract bankName from first transaction if available
            String bankName = null;
            try {
                org.json.JSONArray arr = new org.json.JSONArray(output.toString());
                if (arr.length() > 0) {
                    org.json.JSONObject first = arr.getJSONObject(0);
                    bankName = first.optString("bankName", null);
                }
            } catch (Exception e) {
                bankName = null;
            }
            rawStatement.setBankName(bankName);
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
                    txn.setBankName(obj.optString("bankName", bankName != null ? bankName : "Unknown"));
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
    public List<com.expensetracker.dto.RawStatementDto> getStatements(@RequestHeader("Authorization") String authHeader) {
        // Extract username from JWT token
        String token = authHeader.replace("Bearer ", "");
        String username = new com.expensetracker.config.JwtUtil().extractUsername(token);
        User user = userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException(username));
        List<RawStatement> statements = rawStatementRepository.findAll();
        List<com.expensetracker.dto.RawStatementDto> dtos = new ArrayList<>();
        for (RawStatement s : statements) {
            if (s.getUser() == null || !s.getUser().getId().equals(user.getId())) continue;
            String status = "COMPLETED";
            String bankName = null;
            Integer transactionCount = null;
            List<String> parseWarnings = null;
            try {
                org.json.JSONArray arr = new org.json.JSONArray(s.getRawJson());
                transactionCount = arr.length();
                if (arr.length() > 0) {
                    org.json.JSONObject first = arr.getJSONObject(0);
                    bankName = first.optString("bankName", null);
                }
                // Collect warnings if present
                parseWarnings = new ArrayList<>();
                for (int i = 0; i < arr.length(); i++) {
                    org.json.JSONObject obj = arr.getJSONObject(i);
                    if (obj.has("warnings")) {
                        org.json.JSONArray warns = obj.getJSONArray("warnings");
                        for (int j = 0; j < warns.length(); j++) {
                            parseWarnings.add(warns.getString(j));
                        }
                    }
                }
                if (parseWarnings.isEmpty()) parseWarnings = null;
            } catch (Exception e) {
                status = "FAILED";
            }
            dtos.add(new com.expensetracker.dto.RawStatementDto(
                s.getId(),
                s.getFilename(),
                s.getUploadDate(),
                status,
                bankName,
                transactionCount,
                parseWarnings
            ));
        }
        return dtos;
    }
}
