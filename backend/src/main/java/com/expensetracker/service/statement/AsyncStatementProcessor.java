package com.expensetracker.service.statement;

import com.expensetracker.model.StatementJob;
import com.expensetracker.model.User;
import com.expensetracker.repository.StatementJobRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.UserRepository;
import org.springframework.cache.CacheManager;
import org.slf4j.Logger; 
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Service;
import java.io.File;
import com.expensetracker.exception.ResourceNotFoundException;

@Service
@EnableAsync
public class AsyncStatementProcessor {
    private static final Logger log = LoggerFactory.getLogger(AsyncStatementProcessor.class);
    private final PdfPageCounter pdfPageCounter;
    private final ExtractionRunner extractionRunner;
    private final RawStatementPersister rawStatementPersister;
    private final TransactionParser transactionParser;
    private final BankCategoryUpserter bankCategoryUpserter;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final StatementJobRepository statementJobRepository;
    private final CacheManager cacheManager;

    public AsyncStatementProcessor(PdfPageCounter pdfPageCounter,
                                   ExtractionRunner extractionRunner,
                                   RawStatementPersister rawStatementPersister,
                                   TransactionParser transactionParser,
                                   BankCategoryUpserter bankCategoryUpserter,
                                   TransactionRepository transactionRepository,
                                   UserRepository userRepository,
                                   StatementJobRepository statementJobRepository,
                                   CacheManager cacheManager) {
        this.pdfPageCounter = pdfPageCounter;
        this.extractionRunner = extractionRunner;
        this.rawStatementPersister = rawStatementPersister;
        this.transactionParser = transactionParser;
        this.bankCategoryUpserter = bankCategoryUpserter;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.statementJobRepository = statementJobRepository;
        this.cacheManager = cacheManager;
    }

    @Async
    public void process(String filePath, String pdfPassword, Long userId, String jobId, String originalFilename) {
        // Retry loop to handle race with outer transaction commit
        StatementJob job = null;
        int attempts = 0;
        while (attempts < 20) { // up to ~2s with 100ms sleep
            job = statementJobRepository.findById(jobId).orElse(null);
            if (job != null) break;
            attempts++;
            try { Thread.sleep(100); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
        }
        if (job == null) {
            log.error("Statement job not found after retries jobId={}", jobId);
            throw new ResourceNotFoundException("Statement job not found: " + jobId);
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            job.setStatus(StatementJob.Status.FAILED);
            job.setErrorMessage("User not found: id=" + userId);
            job.setFinishedAt(java.time.LocalDateTime.now());
            statementJobRepository.save(job);
            log.warn("User not found for async statement processing userId={} jobId={}", userId, jobId);
            return;
        }
        job.setStatus(StatementJob.Status.RUNNING);
        job.setStartedAt(java.time.LocalDateTime.now());
        statementJobRepository.save(job);
        try {
            File file = new File(filePath);
            if (!file.exists()) {
                throw new IllegalStateException("Temp file missing for async processing");
            }
            int numPages = pdfPageCounter.countPages(file, pdfPassword);
            job.setPageCount(numPages);
            job.setProgressPercent(10);
            statementJobRepository.save(job);
            // Reuse existing file (already persisted) instead of saving again
            String output = extractionRunner.run(file, pdfPassword);
            if (output == null) {
                throw new IllegalStateException("Extraction failed");
            }
            job.setProgressPercent(55); // after extraction
            statementJobRepository.save(job);
            var rawStatement = rawStatementPersister.persist(user, originalFilename, output, numPages);
            var transactions = transactionParser.parse(output, user, rawStatement.getBankName());
            if (!transactions.isEmpty()) {
                transactionRepository.saveAll(transactions);
            }
            bankCategoryUpserter.upsert(user, transactions);
            file.delete();
            job.setProgressPercent(95); // before finalization
            job.setStatus(StatementJob.Status.COMPLETED);
            job.setFinishedAt(java.time.LocalDateTime.now());
            job.setProgressPercent(100);
            statementJobRepository.save(job);
            // Invalidate analytics cache entries (simple broad eviction)
            var cache = cacheManager.getCache("analytics:summary");
            if (cache != null) { cache.clear(); }
        } catch (Exception ex) {
            job.setStatus(StatementJob.Status.FAILED);
            job.setErrorMessage(ex.getMessage());
            job.setFinishedAt(java.time.LocalDateTime.now());
            statementJobRepository.save(job);
            log.error("Async statement processing failed jobId={} userId={} : {}", jobId, userId, ex.getMessage(), ex);
        }
    }
}
