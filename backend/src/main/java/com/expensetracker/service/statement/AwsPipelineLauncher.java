package com.expensetracker.service.statement;

import com.expensetracker.model.StatementJob;
import com.expensetracker.repository.StatementJobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.sfn.SfnClient;
import software.amazon.awssdk.services.sfn.model.StartExecutionRequest;
import software.amazon.awssdk.services.sfn.model.StartExecutionResponse;
import java.io.IOException;
import java.time.Instant;

/**
 * Minimal launcher for AWS extraction pipeline (S3 + Step Functions).
 * Safe no-op if required properties not configured; returns job unchanged.
 */
@Service
public class AwsPipelineLauncher {
    private static final Logger log = LoggerFactory.getLogger(AwsPipelineLauncher.class);

    @Value("${aws.extraction.bucket:}")
    String bucket;
    @Value("${aws.extraction.stateMachineArn:}")
    String stateMachineArn;
    @Value("${aws.extraction.prefix:uploads}")
    String uploadPrefix;
    @Value("${aws.region:us-east-1}")
    String region;

    private final StatementJobRepository statementJobRepository;

    public AwsPipelineLauncher(StatementJobRepository statementJobRepository) {
        this.statementJobRepository = statementJobRepository;
    }

    public void launch(StatementJob job, MultipartFile file) throws IOException {
        if (isBlank(bucket) || isBlank(stateMachineArn)) {
            log.warn("AWS extraction pipeline not configured (bucket/stateMachineArn missing). Skipping.");
            return;
        }
        Region awsRegion = Region.of(region == null || region.isBlank() ? "us-east-1" : region.trim());
        String key = String.format("%s/%s/%s/original.pdf", uploadPrefix, job.getUser().getId(), job.getId());
        // Upload to S3
    try (S3Client s3 = S3Client.builder()
        .region(awsRegion)
        .credentialsProvider(DefaultCredentialsProvider.builder().build())
        .build()) {
            s3.putObject(b -> b.bucket(bucket).key(key).contentType(file.getContentType()),
                    RequestBody.fromBytes(file.getBytes()));
        }
        log.info("Uploaded jobId={} to s3://{}/{} ({} bytes)", job.getId(), bucket, key, file.getSize());

        // Start Step Function execution
        String execName = "stmt-" + job.getId() + '-' + Instant.now().toEpochMilli();
        String inputJson = String.format("{\"jobId\":\"%s\",\"bucket\":\"%s\",\"key\":\"%s\"}", job.getId(), bucket, key);
        String executionArn;
    try (SfnClient sfn = SfnClient.builder()
        .region(awsRegion)
        .credentialsProvider(DefaultCredentialsProvider.builder().build())
        .build()) {
            StartExecutionResponse resp = sfn.startExecution(StartExecutionRequest.builder()
                    .stateMachineArn(stateMachineArn)
                    .name(execName)
                    .input(inputJson)
                    .build());
            executionArn = resp.executionArn();
        }
        job.setExecutionArn(executionArn);
    job.setStatus(StatementJob.Status.RUNNING);
    if (job.getStartedAt() == null) {
        job.setStartedAt(java.time.LocalDateTime.now());
    }
        statementJobRepository.save(job);
        log.info("Started Step Functions executionArn={} for jobId={}", executionArn, job.getId());
    }

    private boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }
}
