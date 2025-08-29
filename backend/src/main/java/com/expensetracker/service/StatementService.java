package com.expensetracker.service;

import com.expensetracker.repository.RawStatementRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.service.statement.PdfPageCounter;
import com.expensetracker.service.statement.TempFileService;
import com.expensetracker.service.statement.ExtractionRunner;
import com.expensetracker.service.statement.RawStatementPersister;
import com.expensetracker.service.statement.TransactionParser;
import com.expensetracker.service.statement.BankCategoryUpserter;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.AuthenticationFacade;
import com.expensetracker.service.usage.UsagePolicyFactory;
import com.expensetracker.service.usage.UsagePolicy;
import com.expensetracker.model.RawStatement;
import com.expensetracker.model.Transaction;
import com.expensetracker.model.User;
import com.expensetracker.model.StatementJob;
import com.expensetracker.exception.PdfPasswordRequiredException;
import com.expensetracker.repository.StatementJobRepository;
import com.expensetracker.dto.StatementUploadResponseDto;
import com.expensetracker.dto.RawStatementDto;
import com.expensetracker.util.AppConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;
import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class StatementService {
    private final RawStatementRepository rawStatementRepository;
    private final TransactionRepository transactionRepository;
    private final PdfPageCounter pdfPageCounter;
    private final TempFileService tempFileService;
    private final ExtractionRunner extractionRunner;
    private final RawStatementPersister rawStatementPersister;
    private final TransactionParser transactionParser;
    private final BankCategoryUpserter bankCategoryUpserter;
    private final com.expensetracker.service.statement.AsyncStatementProcessor asyncProcessor;
    private final StatementJobRepository statementJobRepository;
    private final com.expensetracker.service.statement.AwsPipelineLauncher awsPipelineLauncher;
    private final com.expensetracker.storage.OciObjectStorageService ociStorageService;
    @Value("${app.statements.async.enabled:false}")
    private boolean asyncEnabled;
    @Value("${extraction.mode:local_python}")
    private String extractionMode;
    private final AuthenticationFacade authenticationFacade;
    private final UsagePolicyFactory usagePolicyFactory;

    @Autowired
    public StatementService(RawStatementRepository rawStatementRepository, TransactionRepository transactionRepository, UserRepository userRepository, com.expensetracker.repository.BankRepository bankRepository, com.expensetracker.repository.CategoryRepository categoryRepository, AuthenticationFacade authenticationFacade, UsagePolicyFactory usagePolicyFactory, PdfPageCounter pdfPageCounter, TempFileService tempFileService, ExtractionRunner extractionRunner, RawStatementPersister rawStatementPersister, TransactionParser transactionParser, BankCategoryUpserter bankCategoryUpserter, com.expensetracker.service.statement.AsyncStatementProcessor asyncProcessor, StatementJobRepository statementJobRepository, com.expensetracker.service.statement.AwsPipelineLauncher awsPipelineLauncher, com.expensetracker.storage.OciObjectStorageService ociStorageService) {
        this.rawStatementRepository = rawStatementRepository;
        this.transactionRepository = transactionRepository;
        this.authenticationFacade = authenticationFacade;
        this.usagePolicyFactory = usagePolicyFactory;
        this.pdfPageCounter = pdfPageCounter;
        this.tempFileService = tempFileService;
        this.extractionRunner = extractionRunner;
        this.rawStatementPersister = rawStatementPersister;
        this.transactionParser = transactionParser;
        this.bankCategoryUpserter = bankCategoryUpserter;
        this.asyncProcessor = asyncProcessor;
        this.statementJobRepository = statementJobRepository;
    this.awsPipelineLauncher = awsPipelineLauncher;
    this.ociStorageService = ociStorageService;
    }

    // Backwards compatible existing signature – delegates with no password
    public StatementUploadResponseDto uploadStatement(MultipartFile file, String authHeader) {
        return uploadStatement(file, authHeader, null);
    }

    // New method supporting optional password for password-protected PDFs
    @Transactional
    public StatementUploadResponseDto uploadStatement(MultipartFile file, String authHeader, String pdfPassword) {
    try {
            User user = authenticationFacade.currentUser();
            UsagePolicy policy = usagePolicyFactory.forUser(user);
            int statementLimit = policy.unlimitedStatements() ? Integer.MAX_VALUE : policy.statementLimit();
            int pageLimit = policy.pagesPerStatement();
            // Determine counting window: subscription start/end if present else current month
            LocalDateTime windowStart = policy.startDate() != null ? policy.startDate() : LocalDate.now().withDayOfMonth(1).atStartOfDay();
            LocalDateTime windowEnd = policy.endDate() != null ? policy.endDate() : LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth()).atTime(23,59,59);
            // NOTE: When a renewal occurs (new subscription row or updated endDate), counters naturally reset because windowStart shifts.
            long statementsInWindow = rawStatementRepository.countByUserAndUploadDateBetween(user, windowStart, windowEnd);
            if (statementLimit != Integer.MAX_VALUE && statementsInWindow >= statementLimit) {
                // User-facing limit breach -> BAD_REQUEST via GlobalExceptionHandler (IllegalArgumentException)
                throw new IllegalArgumentException(AppConstants.ERROR_STATEMENT_LIMIT);
            }
                int numPages = pdfPageCounter.countPages(file, pdfPassword);
            if (pageLimit != Integer.MAX_VALUE && numPages > pageLimit) {
                throw new IllegalArgumentException(String.format(AppConstants.ERROR_PAGE_LIMIT, numPages, pageLimit));
            }
            if ("aws_pipeline".equalsIgnoreCase(extractionMode)) {
                // Create job with initial AWS pipeline progress snapshot
                StatementJob job = new StatementJob();
                job.setUser(user);
                job.setOriginalFilename(file.getOriginalFilename());
                job.setStatus(StatementJob.Status.PENDING); // explicit for clarity
                job.setTotalPages(numPages);      // known now
                job.setPageCount(numPages);       // legacy field for parity
                job.setProcessedPages(0);
                job.setTotalChunks(null);         // unknown until splitter runs
                job.setProcessedChunks(0);
                job.setErrorCount(0);
                job.setProgressPercent(0);
                statementJobRepository.save(job);
                try {
                    awsPipelineLauncher.launch(job, file);
                } catch (IOException ioe) {
                    job.setStatus(StatementJob.Status.FAILED);
                    job.setErrorMessage("S3 upload failed: " + ioe.getMessage());
                    statementJobRepository.save(job);
                    throw new IllegalStateException("Failed to initiate AWS pipeline", ioe);
                }
                return new StatementUploadResponseDto(true, "Statement accepted for AWS pipeline processing", job.getId());
            } else if (asyncEnabled) {
                StatementJob job = new StatementJob();
                job.setUser(user);
                job.setOriginalFilename(file.getOriginalFilename());
                statementJobRepository.save(job); // id assigned via @PrePersist
                String jobId = job.getId();
                // Persist upload to a stable temp file now; async thread cannot rely on original MultipartFile later
                java.io.File persisted = tempFileService.saveTempPdf(file);
                // Defer async start until after surrounding transaction commits so job row is visible
                if (TransactionSynchronizationManager.isSynchronizationActive()) {
                    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                        @Override public void afterCommit() {
                            asyncProcessor.process(persisted.getAbsolutePath(), pdfPassword, user.getId(), jobId, file.getOriginalFilename());
                        }
                    });
                } else {
                    // Fallback (shouldn't normally happen) – start immediately
                    asyncProcessor.process(persisted.getAbsolutePath(), pdfPassword, user.getId(), jobId, file.getOriginalFilename());
                }
                return new StatementUploadResponseDto(true, "Statement accepted for async processing", jobId);
            }
            File tempFile = tempFileService.saveTempPdf(file);
            if (!tempFile.exists() || tempFile.length() == 0) {
                    throw new IllegalStateException(AppConstants.ERROR_PDF_SAVE);
            }
            String output = extractionRunner.run(tempFile, pdfPassword);
            if (output == null) {
                    throw new IllegalStateException(AppConstants.ERROR_EXTRACTION_FAILED);
            }
            String storageKey = null;
            if(ociStorageService != null && ociStorageService.isEnabled()) {
                try {
                    String key = "statements/" + user.getId() + "/" + java.util.UUID.randomUUID() + ".pdf";
                    storageKey = ociStorageService.putBytes(key, file.getBytes(), file.getContentType());
                    storageKey = "oci:" + storageKey; // prefix to indicate OCI storage
                } catch(Exception ex) {
                    // Non-fatal: continue without stored original PDF
                }
            }
            RawStatement rawStatement = rawStatementPersister.persist(user, file.getOriginalFilename(), output, numPages, storageKey);
            List<Transaction> transactions = transactionParser.parse(output, user, rawStatement.getBankName());
            transactionRepository.saveAll(transactions);
            bankCategoryUpserter.upsert(user, transactions);
            tempFile.delete();
            return new StatementUploadResponseDto(true, AppConstants.MSG_STATEMENT_SUCCESS);
        } catch (IOException | InterruptedException e) {
            String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            if (msg.contains("password")) {
                    throw new PdfPasswordRequiredException("PDF password required or incorrect");
            }
            throw new IllegalStateException(AppConstants.ERROR_PROCESSING_STATEMENT, e);
        } catch (PdfPasswordRequiredException | IllegalArgumentException | IllegalStateException e) {
            // Preserve original message & type for handler
            throw e;
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            if (msg.contains("password")) {
                    throw new PdfPasswordRequiredException("PDF password required or incorrect");
            }
            throw new IllegalStateException(AppConstants.ERROR_PARSING_TRANSACTIONS, e);
        }
    }

    public List<RawStatementDto> getStatements(String authHeader) {
        User user = authenticationFacade.currentUser();
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

    /**
     * Download (redirect) original statement PDF if stored in OCI. Returns 404 if not present or not stored.
     */
    public org.springframework.http.ResponseEntity<Void> downloadOriginal(Long statementId) {
        User user = authenticationFacade.currentUser();
        RawStatement rs = rawStatementRepository.findById(statementId).orElse(null);
        if (rs == null || rs.getUser() == null || !rs.getUser().getId().equals(user.getId())) {
            return org.springframework.http.ResponseEntity.notFound().build();
        }
        String storageKey = rs.getStorageKey();
        if (storageKey == null || !storageKey.startsWith("oci:")) {
            return org.springframework.http.ResponseEntity.notFound().build();
        }
        if (ociStorageService == null || !ociStorageService.isEnabled()) {
            return org.springframework.http.ResponseEntity.status(410).build(); // Gone – key recorded but service disabled
        }
        String key = storageKey.substring(4); // remove oci:
        String url = ociStorageService.generateReadUrl(key, 5);
        return org.springframework.http.ResponseEntity.status(302).header("Location", url).build();
    }

    // getUserFromAuth removed; AuthenticationFacade handles user resolution

    // Collaborator methods removed from this service; logic now in dedicated components
}
