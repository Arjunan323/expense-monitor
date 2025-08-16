package com.expensetracker.controller;

import com.expensetracker.model.StatementJob;
import com.expensetracker.repository.StatementJobRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/internal/jobs")
public class InternalJobController {
    private final StatementJobRepository repository;

    public InternalJobController(StatementJobRepository repository) {
        this.repository = repository;
    }

    @PostMapping("/{id}/chunk-complete")
    @Transactional
    public ResponseEntity<?> chunkComplete(@PathVariable String id, @RequestBody ChunkCompleteRequest req) {
        StatementJob job = repository.findById(id).orElse(null);
        if (job == null) return ResponseEntity.notFound().build();
        int totalChunks = job.getTotalChunks() != null ? job.getTotalChunks() : req.totalChunks;
        if (job.getTotalChunks() == null && req.totalChunks != null) {
            job.setTotalChunks(req.totalChunks);
        }
        int pages = req.pages != null ? req.pages : 0;
        int processed = job.getProcessedChunks() != null ? job.getProcessedChunks() : 0;
        int newProcessed = processed + 1;
        job.setProcessedChunks(newProcessed);
        job.setProcessedPages((job.getProcessedPages() == null ? 0 : job.getProcessedPages()) + pages);
        if (totalChunks > 0) {
            int progress = Math.min(99, (int) Math.floor((newProcessed * 100.0) / totalChunks));
            job.setProgressPercent(progress);
        }
        if (totalChunks > 0 && newProcessed >= totalChunks) {
            job.setStatus(StatementJob.Status.COMPLETED);
            job.setProgressPercent(100);
            job.setFinishedAt(LocalDateTime.now());
        } else if (job.getStatus() == StatementJob.Status.PENDING) {
            job.setStatus(StatementJob.Status.RUNNING);
            job.setStartedAt(LocalDateTime.now());
        }
        repository.save(job);
        return ResponseEntity.ok(Map.of("status", job.getStatus(), "progress", job.getProgressPercent()));
    }

    @PostMapping("/{id}/fail")
    public ResponseEntity<?> markFailed(@PathVariable String id, @RequestBody Map<String,String> body) {
        StatementJob job = repository.findById(id).orElse(null);
        if (job == null) return ResponseEntity.notFound().build();
        job.setStatus(StatementJob.Status.FAILED);
        job.setErrorMessage(body.getOrDefault("error","unknown"));
        job.setFinishedAt(LocalDateTime.now());
        repository.save(job);
        return ResponseEntity.ok().build();
    }

    public static class ChunkCompleteRequest {
        public Integer pages;
        public Integer totalChunks; // provided on first call
    }
}
