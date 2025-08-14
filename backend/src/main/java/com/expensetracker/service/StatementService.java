package com.expensetracker.service;

import com.expensetracker.repository.RawStatementRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.BankRepository;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.model.Bank;
import com.expensetracker.model.Category;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.model.RawStatement;
import com.expensetracker.model.Transaction;
import com.expensetracker.model.User;
import com.expensetracker.dto.StatementUploadResponseDto;
import com.expensetracker.dto.RawStatementDto;
import com.expensetracker.util.AppConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class StatementService {
    private final RawStatementRepository rawStatementRepository;
    private final TransactionRepository transactionRepository;
    private final BankRepository bankRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Autowired
    public StatementService(RawStatementRepository rawStatementRepository, TransactionRepository transactionRepository, UserRepository userRepository, BankRepository bankRepository, CategoryRepository categoryRepository) {
        this.rawStatementRepository = rawStatementRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.bankRepository = bankRepository;
        this.categoryRepository = categoryRepository;
    }

    // Backwards compatible existing signature – delegates with no password
    public StatementUploadResponseDto uploadStatement(MultipartFile file, String authHeader) {
    return uploadStatement(file, authHeader, null);
    }

    // New method supporting optional password for password-protected PDFs
    public StatementUploadResponseDto uploadStatement(MultipartFile file, String authHeader, String pdfPassword) {
    try {
            User user = getUserFromAuth(authHeader);
            int statementLimit = AppConstants.FREE_STATEMENT_LIMIT, pageLimit = AppConstants.FREE_PAGE_LIMIT;
            String planType = AppConstants.PLAN_FREE;
            if (user.getSubscription() != null) {
                planType = user.getSubscription().getPlanType().name();
                switch (planType) {
                    case AppConstants.PLAN_PRO:
                        statementLimit = AppConstants.PRO_STATEMENT_LIMIT;
                        pageLimit = AppConstants.PRO_PAGE_LIMIT;
                        break;
                    case AppConstants.PLAN_PREMIUM:
                        statementLimit = AppConstants.PREMIUM_STATEMENT_LIMIT;
                        pageLimit = AppConstants.PREMIUM_PAGE_LIMIT;
                        break;
                }
            }
            LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
            long statementsThisMonth = rawStatementRepository.findAll().stream()
                .filter(s -> s.getUser() != null && s.getUser().getId().equals(user.getId()))
                .filter(s -> s.getUploadDate() != null && s.getUploadDate().isAfter(monthStart))
                .count();
            if (statementLimit != Integer.MAX_VALUE && statementsThisMonth >= statementLimit) {
                return new StatementUploadResponseDto(false, AppConstants.ERROR_STATEMENT_LIMIT);
            }
            int numPages = getPdfPageCount(file, pdfPassword);
            if (pageLimit != Integer.MAX_VALUE && numPages > pageLimit) {
                return new StatementUploadResponseDto(false, String.format(AppConstants.ERROR_PAGE_LIMIT, numPages, pageLimit));
            }
            File tempFile = saveTempPdf(file);
            if (!tempFile.exists() || tempFile.length() == 0) {
                return new StatementUploadResponseDto(false, AppConstants.ERROR_PDF_SAVE);
            }
            String output = runExtractionScript(tempFile, pdfPassword);
            if (output == null) {
                return new StatementUploadResponseDto(false, AppConstants.ERROR_EXTRACTION_FAILED);
            }
            RawStatement rawStatement = storeRawStatement(user, file.getOriginalFilename(), output, numPages);
            List<Transaction> transactions = parseTransactions(output, user, rawStatement.getBankName());
            transactionRepository.saveAll(transactions);
            // Aggregate and upsert banks & categories counts
            upsertBanksAndCategories(user, transactions);
            tempFile.delete();
            return new StatementUploadResponseDto(true, AppConstants.MSG_STATEMENT_SUCCESS);
        } catch (IOException | InterruptedException e) {
            String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            if (msg.contains("password")) {
                return new StatementUploadResponseDto(false, "PDF password required or incorrect", true);
            }
            return new StatementUploadResponseDto(false, AppConstants.ERROR_PROCESSING_STATEMENT, false);
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            if (msg.contains("password")) {
                return new StatementUploadResponseDto(false, "PDF password required or incorrect", true);
            }
            return new StatementUploadResponseDto(false, AppConstants.ERROR_PARSING_TRANSACTIONS, false);
        }
    }

    public List<RawStatementDto> getStatements(String authHeader) {
        User user = getUserFromAuth(authHeader);
        List<RawStatement> statements = rawStatementRepository.findAll();
        List<RawStatementDto> dtos = new ArrayList<>();
        for (RawStatement s : statements) {
            if (s.getUser() == null || !s.getUser().getId().equals(user.getId())) continue;
            String status = AppConstants.STATUS_COMPLETED;
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
                status = AppConstants.STATUS_FAILED;
            }
            dtos.add(new RawStatementDto(
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

    private User getUserFromAuth(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String username = new com.expensetracker.config.JwtUtil().extractUsername(token);
        return userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException(username));
    }

    private int getPdfPageCount(MultipartFile file, String password) throws IOException {
        org.apache.pdfbox.pdmodel.PDDocument pdfDoc = null;
        try {
            if (password != null && !password.isEmpty()) {
                pdfDoc = org.apache.pdfbox.pdmodel.PDDocument.load(file.getBytes(), password);
            } else {
                pdfDoc = org.apache.pdfbox.pdmodel.PDDocument.load(file.getBytes());
            }
        } catch (org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException e) {
            // Signal to caller that password is required
            throw new IOException("PDF password required or incorrect", e);
        }
        int numPages = pdfDoc.getNumberOfPages();
        pdfDoc.close();
        return numPages;
    }

    private File saveTempPdf(MultipartFile file) throws IOException {
        File tempFile = File.createTempFile(AppConstants.TEMP_FILE_PREFIX, AppConstants.TEMP_FILE_SUFFIX);
        try (FileOutputStream fos = new FileOutputStream(tempFile)) {
            fos.write(file.getBytes());
        }
        return tempFile;
    }

    private String runExtractionScript(File tempFile, String password) throws IOException, InterruptedException {
        List<String> cmd = new ArrayList<>();
        cmd.add("python");
        cmd.add(AppConstants.EXTRACTION_SCRIPT_PATH);
        cmd.add(tempFile.getAbsolutePath());
        if (password != null && !password.isEmpty()) {
            cmd.add(password);
        }
        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.redirectErrorStream(true);
        // Pass through sensitive env vars (do NOT log values)
        try {
            String openAiKey = System.getenv("OPENAI_API_KEY");
            if (openAiKey != null && !openAiKey.isEmpty()) {
                pb.environment().put("OPENAI_API_KEY", openAiKey);
            }
        } catch (Exception ignored) {
            // Silently ignore; Python script will raise a clear error if missing
        }
        Process process = pb.start();
        StringBuilder output = new StringBuilder();
        try (Scanner scanner = new Scanner(process.getInputStream())) {
            while (scanner.hasNextLine()) {
                output.append(scanner.nextLine());
            }
        }
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            return null;
        }
        return output.toString();
    }

private RawStatement storeRawStatement(User user, String filename, String rawJson, int pageCount) {
    RawStatement rawStatement = new RawStatement();
    rawStatement.setUploadDate(LocalDateTime.now());
    rawStatement.setFilename(filename);
    rawStatement.setRawJson(rawJson);
    rawStatement.setUser(user);
    rawStatement.setPageCount(pageCount);
    String bankName = null;
    try {
        org.json.JSONArray arr = new org.json.JSONArray(rawJson);
        if (arr.length() > 0) {
            org.json.JSONObject first = arr.getJSONObject(0);
            bankName = first.optString("bankName", null);
        }
    } catch (Exception e) {
        bankName = null;
    }
    rawStatement.setBankName(bankName);
    rawStatementRepository.save(rawStatement);
    return rawStatement;
}

    private List<Transaction> parseTransactions(String rawJson, User user, String bankName) {
        List<Transaction> transactions = new ArrayList<>();
        org.json.JSONArray arr = new org.json.JSONArray(rawJson);
        for (int i = 0; i < arr.length(); i++) {
            org.json.JSONObject obj = arr.getJSONObject(i);
            Transaction txn = new Transaction();
            txn.setDate(LocalDate.parse(obj.getString("date")));
            txn.setDescription(obj.getString("description"));
            txn.setAmount(obj.getDouble("amount"));
            txn.setBalance(obj.optDouble("balance", 0.0));
            txn.setCategory(obj.optString("category", AppConstants.UNKNOWN));
            txn.setUser(user);
            txn.setBankName(obj.optString("bankName", bankName != null ? bankName : AppConstants.UNKNOWN));
            transactions.add(txn);
        }
        return transactions;
    }

    private void upsertBanksAndCategories(User user, List<Transaction> transactions) {
        Map<String, Long> bankCounts = new HashMap<>();
        Map<String, Long> categoryCounts = new HashMap<>();
        for (Transaction t : transactions) {
            String bank = t.getBankName() != null ? t.getBankName().trim() : AppConstants.UNKNOWN;
            String cat = t.getCategory() != null ? t.getCategory().trim() : AppConstants.UNKNOWN;
            if (bank.isEmpty()) bank = AppConstants.UNKNOWN;
            if (cat.isEmpty()) cat = AppConstants.UNKNOWN;
            bankCounts.put(bank, bankCounts.getOrDefault(bank, 0L) + 1);
            categoryCounts.put(cat, categoryCounts.getOrDefault(cat, 0L) + 1);
        }
        // Upsert banks
        for (var entry : bankCounts.entrySet()) {
            String name = entry.getKey();
            Long count = entry.getValue();
            Bank bank = bankRepository.findByUserAndNameIgnoreCase(user, name).orElse(null);
            if (bank == null) {
                bank = new Bank();
                bank.setName(name);
                bank.setUser(user);
                bank.setTransactionCount(count);
            } else {
                bank.increment(count);
            }
            bankRepository.save(bank);
        }
        // Upsert categories
        for (var entry : categoryCounts.entrySet()) {
            String name = entry.getKey();
            Long count = entry.getValue();
            Category cat = categoryRepository.findByUserAndNameIgnoreCase(user, name).orElse(null);
            if (cat == null) {
                cat = new Category();
                cat.setName(name);
                cat.setUser(user);
                cat.setTransactionCount(count);
            } else {
                cat.increment(count);
            }
            categoryRepository.save(cat);
        }
    }
}
