package com.expensetracker.controller;

import com.expensetracker.model.StatementJob;
import com.expensetracker.repository.StatementJobRepository;
import com.expensetracker.security.AuthenticationFacade;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

@RestController
@RequestMapping("/statement-jobs")
@io.swagger.v3.oas.annotations.tags.Tag(name = "Statement Job Stream", description = "Server-Sent Events stream for a single statement job")
public class StatementJobStreamController {
    private final StatementJobRepository repository;
    private final AuthenticationFacade authenticationFacade;

    public StatementJobStreamController(StatementJobRepository repository, AuthenticationFacade authenticationFacade) {
        this.repository = repository;
        this.authenticationFacade = authenticationFacade;
    }

    @GetMapping(path = "/{id}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@PathVariable String id) {
        var user = authenticationFacade.currentUser();
        StatementJob job = repository.findById(id).orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND));
        if (!job.getUser().getId().equals(user.getId())) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN);
        }
        SseEmitter emitter = new SseEmitter(Duration.ofMinutes(5).toMillis());
        var scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "stmt-job-sse-" + id);
            t.setDaemon(true); // don't block shutdown
            return t;
        });
        AtomicBoolean closed = new AtomicBoolean(false);
        Runnable closeAndShutdown = () -> {
            if (closed.compareAndSet(false, true)) {
                scheduler.shutdown();
            }
        };
        emitter.onTimeout(() -> { emitter.complete(); closeAndShutdown.run(); });
        emitter.onCompletion(closeAndShutdown);
        emitter.onError(ex -> closeAndShutdown.run());
        final int[] lastProgress = { -1 };
        final StatementJob.Status[] lastStatus = { null };
    scheduler.scheduleAtFixedRate(() -> {
            try {
                StatementJob fresh = repository.findById(id).orElse(null);
                if (fresh == null) {
                    emitter.completeWithError(new IllegalStateException("Job disappeared"));
            closeAndShutdown.run();
                    return;
                }
                int progress = fresh.getProgressPercent() != null ? fresh.getProgressPercent() : 0;
                StatementJob.Status status = fresh.getStatus();
                boolean changed = progress != lastProgress[0] || status != lastStatus[0];
                if (changed) {
                    lastProgress[0] = progress;
                    lastStatus[0] = status;
                    emitter.send(SseEmitter.event()
                        .name("job-update")
                        .data(new JobUpdate(fresh.getId(), status.name(), progress, fresh.getErrorMessage())));
                }
                if (status == StatementJob.Status.COMPLETED || status == StatementJob.Status.FAILED) {
                    emitter.complete();
            closeAndShutdown.run();
                }
            } catch (IOException e) {
                emitter.completeWithError(e);
        closeAndShutdown.run();
            } catch (Exception e) {
                emitter.completeWithError(e);
        closeAndShutdown.run();
            }
    }, 0, 3, TimeUnit.SECONDS); // 3s cadence to reduce DB load
        return emitter;
    }

    static class JobUpdate {
        public String id;
        public String status;
        public int progress;
        public String error;
        public JobUpdate(String id, String status, int progress, String error) {
            this.id = id; this.status = status; this.progress = progress; this.error = error;
        }
    }
}
