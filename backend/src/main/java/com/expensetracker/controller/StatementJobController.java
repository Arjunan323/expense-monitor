package com.expensetracker.controller;

import com.expensetracker.model.StatementJob;
import com.expensetracker.model.User;
import com.expensetracker.repository.StatementJobRepository;
import com.expensetracker.security.AuthenticationFacade;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/statement-jobs")
@io.swagger.v3.oas.annotations.tags.Tag(name = "Statement Jobs", description = "Query async statement processing jobs")
public class StatementJobController {
    private final StatementJobRepository repository;
    private final AuthenticationFacade authenticationFacade;

    public StatementJobController(StatementJobRepository repository, AuthenticationFacade authenticationFacade) {
        this.repository = repository;
        this.authenticationFacade = authenticationFacade;
    }

    @GetMapping
    @io.swagger.v3.oas.annotations.Operation(summary = "List the current user's statement processing jobs (latest first)")
    public List<StatementJobDto> list() {
        User user = authenticationFacade.currentUser();
        return repository.findByUserOrderByCreatedAtDesc(user).stream().map(StatementJobDto::from).toList();
    }

    @GetMapping("/{id}")
    @io.swagger.v3.oas.annotations.Operation(summary = "Get a single statement job by id")
    public StatementJobDto get(@PathVariable String id) {
        User user = authenticationFacade.currentUser();
        StatementJob job = repository.findById(id).orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND));
        if (!job.getUser().getId().equals(user.getId())) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN);
        }
        return StatementJobDto.from(job);
    }

    public static class StatementJobDto {
        public String id;
        public String originalFilename;
        public String status;
        public String errorMessage;
        public java.time.LocalDateTime createdAt;
        public java.time.LocalDateTime startedAt;
        public java.time.LocalDateTime finishedAt;
        public Integer pageCount;
        public Integer progressPercent;
    public Integer totalPages;
    public Integer processedPages;
    public Integer totalChunks;
    public Integer processedChunks;
    public Integer errorCount;
        public static StatementJobDto from(StatementJob j) {
            StatementJobDto d = new StatementJobDto();
            d.id = j.getId();
            d.originalFilename = j.getOriginalFilename();
            d.status = j.getStatus() != null ? j.getStatus().name() : null;
            d.errorMessage = j.getErrorMessage();
            d.createdAt = j.getCreatedAt();
            d.startedAt = j.getStartedAt();
            d.finishedAt = j.getFinishedAt();
            d.pageCount = j.getPageCount();
            d.progressPercent = j.getProgressPercent();
            d.totalPages = j.getTotalPages();
            d.processedPages = j.getProcessedPages();
            d.totalChunks = j.getTotalChunks();
            d.processedChunks = j.getProcessedChunks();
            d.errorCount = j.getErrorCount();
            return d;
        }
    }
}
